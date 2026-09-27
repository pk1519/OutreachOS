import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from app.database import get_db
from app.models.email_message import EmailMessage
from app.models.campaign_recipient import CampaignRecipient
from app.models.campaign import Campaign
from app.models.lead import Lead
from app.models.suppression import SuppressionList
from app.models.audit_log import AuditLog
from app.models.search import SearchHistory

logger = logging.getLogger("duo_systems.outreach_routes")

router = APIRouter(tags=["Outreach Center & Queue"])

class SuppressionCreateRequest(BaseModel):
    email: str
    reason: str = "MANUAL_BLOCK"

@router.get("/email-history", response_model=Dict[str, Any])
def get_email_history(
    campaign_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    Searchable and filterable email history.
    Tracks all sent, failed, and skipped messages with Gmail message IDs.
    """
    query = db.query(EmailMessage)

    if campaign_id:
        query = query.filter(EmailMessage.campaign_id == campaign_id)

    if status:
        query = query.filter(EmailMessage.status.ilike(status))

    if search:
        term = f"%{search}%"
        query = query.filter(or_(
            EmailMessage.recipient_email.ilike(term),
            EmailMessage.subject.ilike(term),
            EmailMessage.gmail_message_id.ilike(term)
        ))

    total = query.count()
    offset = (page - 1) * page_size
    messages = query.order_by(desc(EmailMessage.created_at)).offset(offset).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "messages": [
            {
                "id": m.id,
                "campaign_id": m.campaign_id,
                "campaign_name": m.campaign.name if m.campaign else None,
                "lead_id": m.lead_id,
                "company": m.lead.business_name if m.lead else (m.recipient.company if m.recipient else None),
                "sender_email": m.sender_email,
                "recipient_email": m.recipient_email,
                "subject": m.subject,
                "rendered_body": m.rendered_body,
                "status": m.status,
                "gmail_message_id": m.gmail_message_id,
                "failure_reason": m.failure_reason,
                "sent_at": m.sent_at.isoformat() if m.sent_at else None,
                "created_at": m.created_at.isoformat() if m.created_at else None
            }
            for m in messages
        ]
    }

@router.get("/email-queue", response_model=Dict[str, Any])
def get_email_queue(db: Session = Depends(get_db)):
    """Live snapshot of the email queue across all campaigns."""
    pending_items = db.query(CampaignRecipient).filter(
        CampaignRecipient.status.in_(["PENDING", "PROCESSING"])
    ).order_by(CampaignRecipient.id.asc()).limit(100).all()

    total_pending = db.query(CampaignRecipient).filter(CampaignRecipient.status == "PENDING").count()
    total_processing = db.query(CampaignRecipient).filter(CampaignRecipient.status == "PROCESSING").count()
    total_sent = db.query(CampaignRecipient).filter(CampaignRecipient.status == "SENT").count()
    total_failed = db.query(CampaignRecipient).filter(CampaignRecipient.status == "FAILED").count()
    total_skipped = db.query(CampaignRecipient).filter(CampaignRecipient.status == "SKIPPED").count()

    active_campaigns = db.query(Campaign).filter(
        Campaign.status.in_(["RUNNING", "QUEUED", "PAUSED"])
    ).all()

    return {
        "summary": {
            "pending": total_pending,
            "processing": total_processing,
            "sent": total_sent,
            "failed": total_failed,
            "skipped": total_skipped,
            "active_campaigns_count": len(active_campaigns)
        },
        "active_campaigns": [
            {
                "id": c.id,
                "name": c.name,
                "status": c.status,
                "sent_count": c.sent_count,
                "pending_count": c.pending_count,
                "failed_count": c.failed_count,
                "skipped_count": c.skipped_count,
                "emails_per_minute": c.emails_per_minute
            }
            for c in active_campaigns
        ],
        "queue_preview": [
            {
                "id": r.id,
                "campaign_id": r.campaign_id,
                "campaign_name": r.campaign.name if r.campaign else None,
                "email": r.email,
                "name": r.name,
                "company": r.company,
                "status": r.status,
                "error_message": r.error_message,
                "created_at": r.created_at.isoformat() if r.created_at else None
            }
            for r in pending_items
        ]
    }

@router.get("/suppression", response_model=List[Dict[str, Any]])
def get_suppression_list(db: Session = Depends(get_db)):
    suppressed = db.query(SuppressionList).order_by(desc(SuppressionList.created_at)).all()
    return [
        {
            "id": s.id,
            "email": s.email,
            "reason": s.reason,
            "created_at": s.created_at.isoformat() if s.created_at else None
        }
        for s in suppressed
    ]

@router.post("/suppression", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def add_to_suppression_list(data: SuppressionCreateRequest, db: Session = Depends(get_db)):
    clean_email = data.email.strip().lower()
    existing = db.query(SuppressionList).filter(SuppressionList.email == clean_email).first()
    if existing:
        return {"status": "exists", "id": existing.id, "email": existing.email, "message": "Email already suppressed"}

    item = SuppressionList(
        email=clean_email,
        reason=data.reason
    )
    db.add(item)
    db.add(AuditLog(
        action="SUPPRESSION_ADDED",
        details=f"Added {clean_email} to suppression list: {data.reason}",
        user_email="contact.devworks7@gmail.com"
    ))
    db.commit()
    db.refresh(item)
    return {
        "status": "added",
        "id": item.id,
        "email": item.email,
        "reason": item.reason,
        "created_at": item.created_at.isoformat()
    }

@router.delete("/suppression/{id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_suppression_list(id: int, db: Session = Depends(get_db)):
    item = db.query(SuppressionList).filter(SuppressionList.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Suppression entry not found")
    db.delete(item)
    db.commit()
    return None

@router.get("/dashboard", response_model=Dict[str, Any])
def get_dashboard_metrics(db: Session = Depends(get_db)):
    """
    Returns real, factual database statistics for the Duo Systems dashboard.
    No fabricated or mock numbers.
    """
    total_leads = db.query(Lead).count()
    qualified_leads = db.query(Lead).filter(
        or_(Lead.lead_score >= 70, Lead.lead_status.in_(["QUALIFIED", "CONTACTED", "REPLIED", "CONVERTED"]))
    ).count()
    contacted_leads = db.query(Lead).filter(Lead.lead_status == "CONTACTED").count()
    replied_leads = db.query(Lead).filter(Lead.lead_status == "REPLIED").count()
    converted_leads = db.query(Lead).filter(Lead.lead_status == "CONVERTED").count()

    total_campaigns = db.query(Campaign).count()
    running_campaigns = db.query(Campaign).filter(Campaign.status == "RUNNING").count()
    completed_campaigns = db.query(Campaign).filter(Campaign.status == "COMPLETED").count()

    emails_sent = db.query(EmailMessage).filter(EmailMessage.status == "SENT").count()
    emails_failed = db.query(EmailMessage).filter(EmailMessage.status == "FAILED").count()
    emails_pending = db.query(CampaignRecipient).filter(CampaignRecipient.status == "PENDING").count()

    # Recent searches
    recent_searches = db.query(SearchHistory).order_by(desc(SearchHistory.created_at)).limit(5).all()

    # Leads by category
    category_counts = {}
    for row in db.query(Lead.category, Lead.business_type).all():
        cat = row[0] or row[1] or "General"
        category_counts[cat] = category_counts.get(cat, 0) + 1
    category_chart = [{"name": k, "value": v} for k, v in sorted(category_counts.items(), key=lambda x: x[1], reverse=True)[:6]]

    # Leads by city
    city_counts = {}
    for row in db.query(Lead.city).all():
        city = row[0] or "Unknown"
        city_counts[city] = city_counts.get(city, 0) + 1
    city_chart = [{"city": k, "count": v} for k, v in sorted(city_counts.items(), key=lambda x: x[1], reverse=True)[:6]]

    # Audit logs preview
    recent_audits = db.query(AuditLog).order_by(desc(AuditLog.created_at)).limit(8).all()

    return {
        "overview": {
            "total_leads": total_leads,
            "qualified_leads": qualified_leads,
            "contacted_leads": contacted_leads,
            "replied_leads": replied_leads,
            "converted_leads": converted_leads,
            "total_campaigns": total_campaigns,
            "running_campaigns": running_campaigns,
            "completed_campaigns": completed_campaigns,
            "emails_sent": emails_sent,
            "emails_failed": emails_failed,
            "emails_pending": emails_pending
        },
        "charts": {
            "by_category": category_chart,
            "by_city": city_chart
        },
        "recent_searches": [
            {
                "id": s.id,
                "business_type": s.business_type,
                "location": s.location,
                "raw_result_count": s.raw_result_count,
                "created_at": s.created_at.isoformat() if s.created_at else None
            }
            for s in recent_searches
        ],
        "audit_logs": [
            {
                "id": a.id,
                "action": a.action,
                "details": a.details,
                "created_at": a.created_at.isoformat() if a.created_at else None
            }
            for a in recent_audits
        ]
    }
