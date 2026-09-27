import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.campaign import Campaign
from app.models.campaign_recipient import CampaignRecipient
from app.models.lead import Lead
from app.models.audit_log import AuditLog
from app.services.campaigns.campaign_service import campaign_service
from app.workers.email_worker import email_queue_manager
from app.services.gmail.gmail_service import gmail_service

logger = logging.getLogger("duo_systems.campaign_routes")

router = APIRouter(prefix="/campaigns", tags=["Outreach & Campaigns"])

# Pydantic Schemas
class CampaignCreateRequest(BaseModel):
    name: str
    business_type: str = "General"
    location: str = "Bangalore"
    country: Optional[str] = "India"
    areas: Optional[str] = None
    search_query: Optional[str] = None
    subject_template: Optional[str] = "AI Automation Solutions for {{company}}"
    body_template: Optional[str] = (
        "Hi {{name}},\n\n"
        "I came across {{company}} in {{city}} and wanted to reach out regarding "
        "some AI and automation solutions that could help improve your operations "
        "and client engagement.\n\n"
        "Regards,\n"
        "Priyanshu\n"
        "Duo Systems"
    )
    sender_email: Optional[str] = "contact.devworks7@gmail.com"
    emails_per_minute: Optional[int] = 10
    lead_ids: Optional[List[int]] = None

class CampaignUpdateRequest(BaseModel):
    name: Optional[str] = None
    business_type: Optional[str] = None
    location: Optional[str] = None
    subject_template: Optional[str] = None
    body_template: Optional[str] = None
    sender_email: Optional[str] = None
    emails_per_minute: Optional[int] = None
    status: Optional[str] = None

class PreflightValidateRequest(BaseModel):
    lead_ids: List[int]

class CampaignPrepareRequest(BaseModel):
    lead_ids: List[int]
    subject_template: str
    body_template: str
    emails_per_minute: Optional[int] = 10
    sender_email: Optional[str] = "contact.devworks7@gmail.com"

class TestEmailRequest(BaseModel):
    test_email: Optional[str] = None
    test_recipient: Optional[str] = None
    subject_template: str
    body_template: str
    sample_lead_id: Optional[int] = None

class SendCampaignRequest(BaseModel):
    confirmed: Optional[bool] = True
    lead_ids: Optional[List[int]] = None

class AddLeadsRequest(BaseModel):
    lead_ids: List[int]

def _format_campaign(c: Campaign) -> Dict[str, Any]:
    total = c.total_recipients or len(c.recipients) if c.recipients else len(c.leads) if c.leads else 0
    return {
        "id": c.id,
        "name": c.name,
        "business_type": c.business_type,
        "location": c.location,
        "country": c.country,
        "areas": c.areas,
        "search_query": c.search_query,
        "status": c.status,
        "subject_template": c.subject_template,
        "body_template": c.body_template,
        "sender_email": c.sender_email or "contact.devworks7@gmail.com",
        "emails_per_minute": c.emails_per_minute or 10,
        "max_emails": c.max_emails or 200,
        "total_recipients": total,
        "sent_count": c.sent_count or 0,
        "failed_count": c.failed_count or 0,
        "pending_count": c.pending_count or 0,
        "skipped_count": c.skipped_count or 0,
        "progress_percent": round((c.sent_count / total * 100), 1) if total > 0 else 0.0,
        "created_at": c.created_at,
        "updated_at": c.updated_at
    }

@router.get("", response_model=List[Dict[str, Any]])
def get_campaigns(db: Session = Depends(get_db)):
    campaigns = db.query(Campaign).order_by(desc(Campaign.created_at)).all()
    return [_format_campaign(c) for c in campaigns]

@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def create_campaign(data: CampaignCreateRequest, db: Session = Depends(get_db)):
    # Check duplicate name
    existing = db.query(Campaign).filter(Campaign.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Campaign with name '{data.name}' already exists.")

    camp = Campaign(
        name=data.name,
        business_type=data.business_type,
        location=data.location,
        country=data.country,
        areas=data.areas,
        search_query=data.search_query,
        subject_template=data.subject_template,
        body_template=data.body_template,
        sender_email=data.sender_email or "contact.devworks7@gmail.com",
        emails_per_minute=data.emails_per_minute or 10,
        status="DRAFT"
    )
    db.add(camp)
    db.flush()

    if data.lead_ids:
        leads = db.query(Lead).filter(Lead.id.in_(data.lead_ids)).all()
        for l in leads:
            l.campaign_id = camp.id
        camp.total_recipients = len(leads)
        camp.pending_count = len(leads)

    db.add(AuditLog(
        action="CAMPAIGN_CREATED",
        details=f"Created campaign '{camp.name}'",
        user_email=camp.sender_email
    ))
    db.commit()
    db.refresh(camp)
    return _format_campaign(camp)

@router.get("/{campaign_id}", response_model=Dict[str, Any])
def get_campaign(campaign_id: int, db: Session = Depends(get_db)):
    camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return _format_campaign(camp)

@router.patch("/{campaign_id}", response_model=Dict[str, Any])
def update_campaign(campaign_id: int, data: CampaignUpdateRequest, db: Session = Depends(get_db)):
    camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    update_dict = data.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        if v is not None:
            setattr(camp, k, v)

    camp.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(camp)
    return _format_campaign(camp)

@router.post("/preflight-validate", response_model=Dict[str, Any])
def preflight_validate(
    req: PreflightValidateRequest,
    db: Session = Depends(get_db)
):
    """Standalone preflight validation for an arbitrary list of leads."""
    if not req.lead_ids:
        raise HTTPException(status_code=400, detail="No leads provided for preflight validation.")
    return campaign_service.validate_recipients(db, req.lead_ids)

@router.post("/{campaign_id}/validate", response_model=Dict[str, Any])
def validate_campaign(
    campaign_id: int,
    lead_ids: Optional[List[int]] = None,
    db: Session = Depends(get_db)
):
    """Pre-flight validation for campaign recipients."""
    camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    target_leads = lead_ids
    if not target_leads:
        target_leads = [l.id for l in db.query(Lead.id).filter(Lead.campaign_id == camp.id).all()]

    if not target_leads:
        raise HTTPException(status_code=400, detail="No leads selected for this campaign.")

    val_res = campaign_service.validate_recipients(db, target_leads)
    return val_res

@router.post("/{campaign_id}/prepare", response_model=Dict[str, Any])
def prepare_campaign_recipients(
    campaign_id: int,
    req: CampaignPrepareRequest,
    db: Session = Depends(get_db)
):
    """Prepares recipients and templates for an existing campaign."""
    camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    prepared = campaign_service.prepare_campaign(
        db=db,
        campaign_id=camp.id,
        lead_ids=req.lead_ids,
        subject_template=req.subject_template,
        body_template=req.body_template,
        emails_per_minute=req.emails_per_minute or 10,
        sender_email=req.sender_email or "contact.devworks7@gmail.com"
    )
    return _format_campaign(prepared)

@router.post("/{campaign_id}/test-email", response_model=Dict[str, Any])
def send_test_email(
    campaign_id: int,
    data: TestEmailRequest,
    db: Session = Depends(get_db)
):
    """
    Sends a test email strictly to the verified test recipient
    (contact.devworks7@gmail.com or user-entered test address).
    Never sends to actual leads.
    """
    camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    target_recipient = data.test_recipient or data.test_email or "contact.devworks7@gmail.com"

    try:
        res = campaign_service.send_test_email(
            db=db,
            test_recipient=target_recipient,
            subject_template=data.subject_template,
            body_template=data.body_template,
            sample_lead_id=data.sample_lead_id
        )
        return res
    except Exception as e:
        logger.error(f"Test email failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{campaign_id}/send", response_model=Dict[str, Any])
async def send_campaign(
    campaign_id: int,
    req: SendCampaignRequest,
    db: Session = Depends(get_db)
):
    """Explicitly launches the campaign email queue background job."""
    if not req.confirmed:
        raise HTTPException(
            status_code=400,
            detail="You must explicitly confirm that you want to send this campaign."
        )

    camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Verify Gmail connection
    conn_status = gmail_service.validate_connection(db)
    if not conn_status["is_connected"]:
        raise HTTPException(
            status_code=400,
            detail="Gmail is not connected. Connect Gmail from Settings."
        )

    # Determine recipients / leads
    target_leads = req.lead_ids
    existing_recipients = db.query(CampaignRecipient).filter(CampaignRecipient.campaign_id == camp.id).count()

    if target_leads:
        campaign_service.prepare_campaign(
            db=db,
            campaign_id=camp.id,
            lead_ids=target_leads,
            subject_template=camp.subject_template,
            body_template=camp.body_template,
            emails_per_minute=camp.emails_per_minute or 10,
            sender_email=camp.sender_email or "contact.devworks7@gmail.com"
        )
    elif existing_recipients == 0:
        target_leads = [l.id for l in db.query(Lead.id).filter(Lead.campaign_id == camp.id).all()]
        if not target_leads:
            raise HTTPException(status_code=400, detail="Cannot send campaign with 0 leads.")
        campaign_service.prepare_campaign(
            db=db,
            campaign_id=camp.id,
            lead_ids=target_leads,
            subject_template=camp.subject_template,
            body_template=camp.body_template,
            emails_per_minute=camp.emails_per_minute or 10,
            sender_email=camp.sender_email or "contact.devworks7@gmail.com"
        )

    # Start background worker
    await email_queue_manager.start_campaign(camp.id)

    db.refresh(camp)
    return {
        "status": "QUEUED",
        "message": f"Campaign '{camp.name}' is now queued and sending in background.",
        "campaign": _format_campaign(camp)
    }

@router.post("/{campaign_id}/pause", response_model=Dict[str, Any])
async def pause_campaign(campaign_id: int, db: Session = Depends(get_db)):
    camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    await email_queue_manager.pause_campaign(campaign_id)
    db.refresh(camp)
    return {"status": "PAUSED", "message": f"Campaign '{camp.name}' paused."}

@router.post("/{campaign_id}/resume", response_model=Dict[str, Any])
async def resume_campaign(campaign_id: int, db: Session = Depends(get_db)):
    camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    await email_queue_manager.resume_campaign(campaign_id)
    db.refresh(camp)
    return {"status": "RUNNING", "message": f"Campaign '{camp.name}' resumed."}

@router.post("/{campaign_id}/cancel", response_model=Dict[str, Any])
async def cancel_campaign(campaign_id: int, db: Session = Depends(get_db)):
    camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    await email_queue_manager.cancel_campaign(campaign_id)
    db.refresh(camp)
    return {"status": "CANCELLED", "message": f"Campaign '{camp.name}' cancelled."}

@router.get("/{campaign_id}/recipients", response_model=List[Dict[str, Any]])
def get_campaign_recipients(campaign_id: int, db: Session = Depends(get_db)):
    recipients = db.query(CampaignRecipient).filter(
        CampaignRecipient.campaign_id == campaign_id
    ).order_by(CampaignRecipient.id.asc()).all()

    return [
        {
            "id": r.id,
            "campaign_id": r.campaign_id,
            "lead_id": r.lead_id,
            "email": r.email,
            "name": r.name,
            "company": r.company,
            "status": r.status,
            "error_message": r.error_message,
            "sent_at": r.sent_at,
            "created_at": r.created_at
        }
        for r in recipients
    ]

@router.post("/{campaign_id}/add-leads", response_model=Dict[str, Any])
def add_leads_to_campaign(
    campaign_id: int,
    req: AddLeadsRequest,
    db: Session = Depends(get_db)
):
    camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    leads = db.query(Lead).filter(Lead.id.in_(req.lead_ids)).all()
    for l in leads:
        l.campaign_id = camp.id

    camp.total_recipients = (camp.total_recipients or 0) + len(leads)
    camp.pending_count = (camp.pending_count or 0) + len(leads)
    db.commit()
    db.refresh(camp)

    return {
        "status": "success",
        "added_count": len(leads),
        "total_campaign_leads": camp.total_recipients
    }

@router.delete("/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_campaign(campaign_id: int, db: Session = Depends(get_db)):
    camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")
    db.delete(camp)
    db.commit()
    return None
