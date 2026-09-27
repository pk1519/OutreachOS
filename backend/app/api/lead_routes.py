import json
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from app.database import get_db
from app.models.lead import Lead
from app.models.lead_score import LeadScore
from app.models.outreach import OutreachRecord
from app.models.campaign import Campaign
from app.models.lead_note import LeadNote, LeadTag
from app.models.lead_contact import LeadContact
from app.models.email_message import EmailMessage
from app.models.audit_log import AuditLog
from app.schemas.lead_schema import (
    LeadUpdateCRM,
    LeadFilterParams
)
from app.services.lead_service import lead_service
from app.services.leads.csv_service import csv_service, EMAIL_REGEX
from app.services.scoring_service import scoring_service

router = APIRouter(prefix="/leads", tags=["Leads & CRM Management"])

class LeadCreateRequest(BaseModel):
    business_name: str
    contact_name: Optional[str] = None
    business_type: Optional[str] = "General"
    category: Optional[str] = None
    formatted_address: Optional[str] = None
    city: Optional[str] = "Bangalore"
    country: Optional[str] = "India"
    phone: Optional[str] = None
    website: Optional[str] = None
    email: Optional[str] = None
    campaign_id: Optional[int] = None
    lead_status: Optional[str] = "NEW"

class LeadUpdateRequest(BaseModel):
    business_name: Optional[str] = None
    business_type: Optional[str] = None
    category: Optional[str] = None
    formatted_address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    national_phone: Optional[str] = None
    website: Optional[str] = None
    website_uri: Optional[str] = None
    email: Optional[str] = None
    lead_status: Optional[str] = None
    campaign_id: Optional[int] = None

class AddNoteRequest(BaseModel):
    content: str
    author: Optional[str] = "Priyanshu / Duo Systems"

class AddTagRequest(BaseModel):
    tag: str

class AddContactRequest(BaseModel):
    name: str
    first_name: Optional[str] = None
    role: Optional[str] = "Owner"
    email: Optional[str] = None
    phone: Optional[str] = None
    is_primary: Optional[bool] = True

class CsvImportRequest(BaseModel):
    csv_content: str
    column_mapping: Dict[str, str]
    campaign_id: Optional[int] = None

class CsvExportRequest(BaseModel):
    lead_ids: Optional[List[int]] = None
    campaign_id: Optional[int] = None

def _format_lead_response(lead: Lead) -> dict:
    score_resp = None
    if lead.score:
        try:
            reasons_parsed = json.loads(lead.score.reasons) if lead.score.reasons else []
        except Exception:
            reasons_parsed = [lead.score.reasons] if lead.score.reasons else []
        score_resp = {
            "total_score": lead.score.total_score,
            "priority": lead.score.priority,
            "reasons": reasons_parsed
        }

    outreach_resp = None
    if lead.outreach:
        outreach_resp = {
            "status": lead.outreach.status,
            "priority": lead.outreach.priority,
            "follow_up_date": lead.outreach.follow_up_date,
            "last_contacted_date": lead.outreach.last_contacted_date,
            "notes": lead.outreach.notes,
            "draft_message": lead.outreach.draft_message
        }

    notes_list = [
        {"id": n.id, "author": n.author, "content": n.content, "created_at": n.created_at.isoformat()}
        for n in (lead.notes or [])
    ]
    tags_list = [t.tag for t in (lead.tags or [])]
    contacts_list = [
        {"id": c.id, "name": c.name, "first_name": c.first_name, "role": c.role, "email": c.email, "phone": c.phone, "is_primary": c.is_primary}
        for c in (lead.contacts or [])
    ]
    emails_list = [
        {"id": m.id, "subject": m.subject, "status": m.status, "sent_at": m.sent_at.isoformat() if m.sent_at else None}
        for m in (lead.email_messages or [])
    ]

    return {
        "id": lead.id,
        "place_id": lead.place_id,
        "campaign_id": lead.campaign_id,
        "campaign_name": lead.campaign.name if lead.campaign else None,
        "search_id": lead.search_id,
        "business_name": lead.business_name,
        "business_type": lead.business_type,
        "category": lead.category or lead.business_type,
        "formatted_address": lead.formatted_address or lead.address,
        "address": lead.formatted_address or lead.address,
        "country": lead.country,
        "state_region": lead.state_region,
        "city": lead.city,
        "area": lead.area,
        "phone": lead.phone or lead.national_phone or lead.international_phone,
        "national_phone": lead.national_phone,
        "international_phone": lead.international_phone,
        "website": lead.website or lead.website_uri,
        "website_uri": lead.website or lead.website_uri,
        "email": lead.email,
        "google_maps_uri": lead.google_maps_uri,
        "rating": lead.rating,
        "user_rating_count": lead.user_rating_count or lead.review_count or 0,
        "review_count": lead.user_rating_count or lead.review_count or 0,
        "business_status": lead.business_status,
        "primary_type": lead.primary_type,
        "source": lead.source or ("Google Places" if lead.is_google_derived else "Manual"),
        "is_google_derived": lead.is_google_derived,
        "lead_score": lead.lead_score or (lead.score.total_score if lead.score else 0),
        "lead_status": lead.lead_status or "NEW",
        "score": score_resp,
        "outreach": outreach_resp,
        "notes": notes_list,
        "tags": tags_list,
        "contacts": contacts_list,
        "email_history": emails_list,
        "created_at": lead.created_at,
        "updated_at": lead.updated_at
    }

@router.get("", response_model=dict)
def get_leads(
    campaign_id: Optional[int] = Query(None),
    business_type: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    area: Optional[str] = Query(None),
    min_rating: Optional[float] = Query(None),
    min_reviews: Optional[int] = Query(None),
    has_website: Optional[bool] = Query(None),
    has_phone: Optional[bool] = Query(None),
    priority: Optional[str] = Query(None),
    outreach_status: Optional[str] = Query(None),
    lead_status: Optional[str] = Query(None),
    search_term: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    filters = LeadFilterParams(
        campaign_id=campaign_id,
        business_type=business_type,
        country=country,
        city=city,
        area=area,
        min_rating=min_rating,
        min_reviews=min_reviews,
        has_website=has_website,
        has_phone=has_phone,
        priority=priority,
        outreach_status=outreach_status,
        search_term=search_term,
        page=page,
        page_size=page_size
    )

    leads, total_count = lead_service.get_leads_filtered(db, filters)
    return {
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "leads": [_format_lead_response(l) for l in leads]
    }

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_lead(data: LeadCreateRequest, db: Session = Depends(get_db)):
    """Manually creates a new lead with scoring, contact details, campaign linkage, and CRM initialization."""
    import hashlib
    clean_biz = (data.business_name or "").strip()
    if not clean_biz:
        raise HTTPException(status_code=400, detail="Business / Company name is required.")

    clean_email = data.email.strip().lower() if data.email and data.email.strip() else None

    # Validate email regex if email provided
    if clean_email and not EMAIL_REGEX.match(clean_email):
        raise HTTPException(status_code=400, detail=f"Invalid email address '{clean_email}'.")

    # Deterministic place_id
    hash_str = f"{clean_biz}_{data.city or 'Bangalore'}_{clean_email or ''}"
    place_id = f"manual_{hashlib.sha256(hash_str.encode('utf-8')).hexdigest()[:24]}"

    existing = db.query(Lead).filter(Lead.place_id == place_id).first()
    if not existing and clean_email:
        existing = db.query(Lead).filter(Lead.email == clean_email).first()

    if existing:
        raise HTTPException(status_code=400, detail=f"A lead with this name/email already exists (#{existing.id}: {existing.business_name}).")

    lead = Lead(
        place_id=place_id,
        business_name=clean_biz,
        business_type=data.business_type or "General",
        category=data.category or data.business_type or "General",
        formatted_address=data.formatted_address,
        address=data.formatted_address,
        city=data.city or "Bangalore",
        country=data.country or "India",
        phone=data.phone.strip() if data.phone else None,
        national_phone=data.phone.strip() if data.phone else None,
        website=data.website.strip() if data.website else None,
        website_uri=data.website.strip() if data.website else None,
        email=clean_email,
        campaign_id=data.campaign_id,
        source="Manual Entry",
        is_google_derived=False,
        lead_status="QUALIFIED" if clean_email else (data.lead_status or "NEW")
    )
    db.add(lead)
    db.flush()

    # If contact_name provided, store in LeadContact for template personalization
    if data.contact_name and data.contact_name.strip():
        c_name = data.contact_name.strip()
        first_n = c_name.split()[0]
        contact = LeadContact(
            lead_id=lead.id,
            name=c_name,
            first_name=first_n,
            email=lead.email,
            phone=lead.phone,
            role="Owner / Manager",
            is_primary=True
        )
        db.add(contact)

    # Score lead
    score_val, priority, reasons = scoring_service.calculate_score({
        "national_phone": lead.phone,
        "website_uri": lead.website,
        "email": lead.email,
        "formatted_address": lead.address,
        "business_type": lead.business_type
    }, lead.business_type)

    lead.lead_score = score_val
    lead_score = LeadScore(
        lead_id=lead.id,
        total_score=score_val,
        priority=priority,
        reasons=json.dumps(reasons)
    )
    db.add(lead_score)

    outreach = OutreachRecord(lead_id=lead.id, status="Not Contacted", priority=priority)
    db.add(outreach)

    # If campaign assigned, update campaign recipient stats
    if data.campaign_id:
        camp = db.query(Campaign).filter(Campaign.id == data.campaign_id).first()
        if camp:
            camp.total_recipients = (camp.total_recipients or 0) + 1
            camp.pending_count = (camp.pending_count or 0) + 1

    db.add(AuditLog(
        action="LEAD_MANUALLY_CREATED",
        details=f"Manually created lead '{lead.business_name}' assigned to Campaign #{lead.campaign_id or 'None'}",
        user_email="contact.devworks7@gmail.com"
    ))

    db.commit()
    db.refresh(lead)

    return _format_lead_response(lead)

@router.get("/{lead_id}", response_model=dict)
def get_lead_details(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return _format_lead_response(lead)

@router.patch("/{lead_id}", response_model=dict)
def update_lead(lead_id: int, data: LeadUpdateRequest, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    update_dict = data.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        if v is not None:
            setattr(lead, k, v)
            if k == "phone":
                lead.national_phone = v
            elif k == "website":
                lead.website_uri = v
            elif k == "business_type":
                lead.category = v

    # Recalculate score if contact fields changed
    if any(k in update_dict for k in ["phone", "email", "website", "lead_status"]):
        score_val, priority, reasons = scoring_service.calculate_score({
            "national_phone": lead.phone or lead.national_phone,
            "website_uri": lead.website or lead.website_uri,
            "email": lead.email,
            "formatted_address": lead.address or lead.formatted_address,
            "user_rating_count": lead.user_rating_count,
            "rating": lead.rating,
            "business_type": lead.business_type
        }, lead.business_type)
        lead.lead_score = score_val
        if lead.score:
            lead.score.total_score = score_val
            lead.score.priority = priority
            lead.score.reasons = json.dumps(reasons)

    lead.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(lead)
    return _format_lead_response(lead)

@router.patch("/{lead_id}/crm", response_model=dict)
def update_lead_crm(lead_id: int, update_data: LeadUpdateCRM, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    if not lead.outreach:
        lead.outreach = OutreachRecord(lead_id=lead.id)
        db.add(lead.outreach)

    if update_data.outreach_status is not None:
        lead.outreach.status = update_data.outreach_status
        if update_data.outreach_status in ["Contacted", "Proposal Sent", "Demo Scheduled"]:
            lead.outreach.last_contacted_date = datetime.utcnow()
            lead.lead_status = "CONTACTED"
        elif update_data.outreach_status == "Replied":
            lead.lead_status = "REPLIED"
        elif update_data.outreach_status in ["Won", "Converted"]:
            lead.lead_status = "CONVERTED"

    if update_data.priority is not None:
        lead.outreach.priority = update_data.priority
        if lead.score:
            lead.score.priority = update_data.priority

    if update_data.follow_up_date is not None:
        lead.outreach.follow_up_date = update_data.follow_up_date

    if update_data.notes is not None:
        lead.outreach.notes = update_data.notes

    if update_data.draft_message is not None:
        lead.outreach.draft_message = update_data.draft_message

    if update_data.campaign_id is not None:
        lead.campaign_id = update_data.campaign_id

    if update_data.email is not None:
        lead.email = update_data.email

    lead.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(lead)

    return _format_lead_response(lead)

@router.post("/{lead_id}/notes", response_model=dict)
def add_lead_note(lead_id: int, req: AddNoteRequest, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    note = LeadNote(lead_id=lead.id, author=req.author, content=req.content)
    db.add(note)
    db.commit()
    db.refresh(lead)
    return _format_lead_response(lead)

@router.post("/{lead_id}/tags", response_model=dict)
def add_lead_tag(lead_id: int, req: AddTagRequest, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    clean_tag = req.tag.strip().upper()
    existing_tag = db.query(LeadTag).filter(LeadTag.lead_id == lead.id, LeadTag.tag == clean_tag).first()
    if not existing_tag:
        db.add(LeadTag(lead_id=lead.id, tag=clean_tag))
        db.commit()
        db.refresh(lead)

    return _format_lead_response(lead)

@router.post("/{lead_id}/contacts", response_model=dict)
def add_lead_contact(lead_id: int, req: AddContactRequest, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    contact = LeadContact(
        lead_id=lead.id,
        name=req.name,
        first_name=req.first_name or req.name.split()[0],
        role=req.role,
        email=req.email,
        phone=req.phone,
        is_primary=req.is_primary or False
    )
    db.add(contact)
    if req.email and not lead.email:
        lead.email = req.email
    db.commit()
    db.refresh(lead)
    return _format_lead_response(lead)

@router.post("/import/detect-columns", response_model=dict)
async def detect_csv_columns(file: UploadFile = File(...)):
    """Uploads CSV and returns detected column mappings for confirmation."""
    content_bytes = await file.read()
    try:
        csv_str = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        csv_str = content_bytes.decode("latin-1")

    try:
        res = csv_service.detect_columns(csv_str)
        return {**res, "csv_content": csv_str}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/import", response_model=dict)
def import_leads_csv(req: CsvImportRequest, db: Session = Depends(get_db)):
    """Executes CSV import with confirmed column mappings."""
    try:
        result = csv_service.import_leads(
            db=db,
            csv_content=req.csv_content,
            column_mapping=req.column_mapping,
            campaign_id=req.campaign_id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/export/csv")
def export_leads_csv(req: CsvExportRequest, db: Session = Depends(get_db)):
    """Exports selected or campaign leads as CSV file."""
    csv_data = csv_service.export_leads_csv(
        db=db,
        lead_ids=req.lead_ids,
        campaign_id=req.campaign_id
    )
    filename = f"duo_leads_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/{lead_id}/generate-outreach", response_model=dict)
def generate_outreach_draft(
    lead_id: int,
    template_type: str = Query("value_proposition", description="value_proposition | friendly_intro | partnership"),
    db: Session = Depends(get_db)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    biz_name = lead.business_name
    category = lead.category or lead.business_type or "business"
    city = lead.city or lead.area or "your area"

    if template_type == "partnership":
        draft = (
            f"Hi {biz_name} Team,\n\n"
            f"We’ve been following the fantastic work {biz_name} is doing in {city}. "
            f"At Duo Systems, we collaborate with premier {category} providers to help streamline operations and expand B2B client acquisition.\n\n"
            f"Would you be open to a brief 10-minute introductory call next Tuesday or Thursday to explore mutual synergies?\n\n"
            f"Best regards,\nDuo Systems Lead Team"
        )
    elif template_type == "friendly_intro":
        draft = (
            f"Hello {biz_name} Team,\n\n"
            f"Hope your week is going well! I noticed {biz_name} is an active leader in {city} for {category}.\n\n"
            f"I wanted to reach out directly to see how your team currently handles high-intent lead flow and follow-ups. "
            f"We've helped similar businesses scale their customer inquiries with automated systems.\n\n"
            f"Looking forward to connecting!\n\n"
            f"Warmly,\nDuo Systems"
        )
    else:
        draft = (
            f"Subject: Quick question regarding {biz_name}'s client acquisition in {city}\n\n"
            f"Hi {biz_name} Team,\n\n"
            f"I came across {biz_name} while researching top {category} businesses in {city}. "
            f"Given your strong presence ({lead.user_rating_count or 0} Google reviews and a {lead.rating or 'stellar'} rating), "
            f"we identified an opportunity to help you capture and qualify even more commercial leads automatically.\n\n"
            f"Are you available for a brief demo this week to see how Duo Systems works for {category} businesses?\n\n"
            f"Best,\nDuo Systems Enterprise Team"
        )

    if not lead.outreach:
        lead.outreach = OutreachRecord(lead_id=lead.id)
        db.add(lead.outreach)

    lead.outreach.draft_message = draft
    db.commit()
    db.refresh(lead)

    return {
        "lead_id": lead.id,
        "business_name": lead.business_name,
        "draft_message": draft,
        "human_review_required": True,
        "message": "Outreach draft generated successfully. Ready for human review."
    }

@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    db.delete(lead)
    db.commit()
    return None
