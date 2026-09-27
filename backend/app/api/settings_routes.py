from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.models.settings_model import AppSetting

router = APIRouter(prefix="/settings", tags=["Settings"])

class SettingsPayload(BaseModel):
    google_places_api_key: Optional[str] = None
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    max_areas_per_search: Optional[int] = None
    max_results_per_search: Optional[int] = None
    enable_demo_simulation: Optional[bool] = None

@router.get("", response_model=dict)
def get_settings(db: Session = Depends(get_db)):
    """
    Returns application configuration. Sensitive keys are safely masked.
    """
    places_key_masked = ""
    if settings.GOOGLE_PLACES_API_KEY:
        k = settings.GOOGLE_PLACES_API_KEY
        places_key_masked = k[:6] + "..." + k[-4:] if len(k) > 10 else "***"

    client_id_masked = ""
    if settings.GOOGLE_CLIENT_ID:
        cid = settings.GOOGLE_CLIENT_ID
        client_id_masked = cid[:8] + "..." + cid[-6:] if len(cid) > 14 else "***"

    return {
        "has_places_api_key": bool(settings.GOOGLE_PLACES_API_KEY and not settings.GOOGLE_PLACES_API_KEY.startswith("your_")),
        "places_api_key_masked": places_key_masked,
        "has_google_client_id": bool(settings.GOOGLE_CLIENT_ID),
        "client_id_masked": client_id_masked,
        "max_areas_per_search": settings.MAX_AREAS_PER_SEARCH,
        "max_results_per_search": settings.MAX_RESULTS_PER_SEARCH,
        "enable_demo_simulation": settings.ENABLE_DEMO_SIMULATION,
        "database_url_type": "PostgreSQL" if "postgres" in settings.DATABASE_URL.lower() else "SQLite (Local Plug & Play)",
        "version": settings.VERSION
    }

@router.post("", response_model=dict)
def update_settings(payload: SettingsPayload, db: Session = Depends(get_db)):
    """Updates runtime settings safely."""
    if payload.google_places_api_key is not None:
        settings.GOOGLE_PLACES_API_KEY = payload.google_places_api_key.strip()
    if payload.google_client_id is not None:
        settings.GOOGLE_CLIENT_ID = payload.google_client_id.strip()
    if payload.google_client_secret is not None:
        settings.GOOGLE_CLIENT_SECRET = payload.google_client_secret.strip()
    if payload.max_areas_per_search is not None:
        settings.MAX_AREAS_PER_SEARCH = payload.max_areas_per_search
    if payload.max_results_per_search is not None:
        settings.MAX_RESULTS_PER_SEARCH = payload.max_results_per_search
    if payload.enable_demo_simulation is not None:
        settings.ENABLE_DEMO_SIMULATION = payload.enable_demo_simulation

    return {"message": "Settings updated successfully", "status": "success"}

@router.post("/reset-data", response_model=dict)
def reset_all_data(db: Session = Depends(get_db)):
    """Deletes all leads, campaigns, searches, and messaging history while preserving credentials."""
    from app.models.campaign_recipient import CampaignRecipient
    from app.models.email_message import EmailMessage
    from app.models.lead_score import LeadScore
    from app.models.outreach import OutreachRecord
    from app.models.lead_contact import LeadContact
    from app.models.lead_note import LeadNote, LeadTag
    from app.models.lead import Lead
    from app.models.search import SearchHistory
    from app.models.campaign import Campaign
    from app.models.export_record import ExportRecord
    from app.models.audit_log import AuditLog

    db.query(EmailMessage).delete()
    db.query(CampaignRecipient).delete()
    db.query(LeadScore).delete()
    db.query(OutreachRecord).delete()
    db.query(LeadContact).delete()
    db.query(LeadNote).delete()
    db.query(LeadTag).delete()
    db.query(Lead).delete()
    db.query(SearchHistory).delete()
    db.query(Campaign).delete()
    db.query(ExportRecord).delete()
    db.query(AuditLog).delete()
    db.commit()

    return {"message": "All campaigns, leads, searches, and queue records have been reset to zero.", "status": "success"}
