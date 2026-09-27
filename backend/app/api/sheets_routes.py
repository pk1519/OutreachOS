from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.google_connection import SheetDestination
from app.schemas.sheets_schema import (
    GoogleAuthUrlResponse,
    GoogleConnectionStatusResponse,
    ExportLeadsRequest,
    ExportLeadsResponse
)
from app.services.sheets_service import sheets_service

router = APIRouter(prefix="/sheets", tags=["Google Sheets & CRM Export"])

@router.get("/auth-url", response_model=GoogleAuthUrlResponse)
def get_auth_url():
    """Returns Google OAuth 2.0 consent URL for Google Sheets authorization."""
    res = sheets_service.get_auth_url()
    return GoogleAuthUrlResponse(
        auth_url=res["auth_url"],
        is_configured=res["is_configured"],
        client_id_available=res["client_id_available"]
    )

@router.get("/status", response_model=GoogleConnectionStatusResponse)
def get_connection_status(db: Session = Depends(get_db)):
    """Returns server-side Google OAuth connection state without exposing secrets."""
    status_data = sheets_service.get_connection_status(db)
    return GoogleConnectionStatusResponse(
        is_connected=status_data["is_connected"],
        user_email=status_data["user_email"],
        expiry=status_data["expiry"],
        has_refresh_token=status_data["has_refresh_token"]
    )

@router.post("/connect-demo", response_model=GoogleConnectionStatusResponse)
def connect_demo(email: str = Query("partner@duosystems.com"), db: Session = Depends(get_db)):
    """Enables seamless testing of the Google Sheets workflow in local/demo environment."""
    conn = sheets_service.connect_demo_or_token(db, email)
    return GoogleConnectionStatusResponse(
        is_connected=conn.is_connected,
        user_email=conn.user_email,
        expiry=conn.expiry.isoformat() if conn.expiry else None,
        has_refresh_token=True
    )

@router.post("/disconnect", response_model=dict)
def disconnect_google(db: Session = Depends(get_db)):
    """Safely revokes server-side Google credentials."""
    sheets_service.disconnect(db)
    return {"status": "Disconnected", "message": "Google account disconnected successfully."}

@router.post("/export", response_model=ExportLeadsResponse)
def export_leads(req: ExportLeadsRequest, db: Session = Depends(get_db)):
    """
    Primary Lead Export to Google Sheets.
    - Reads existing Place IDs to guarantee duplicate protection.
    - Writes structured Google-derived and Duo Systems CRM columns.
    - Optionally creates dynamic Campaign Dashboard tab with real metrics.
    """
    try:
        return sheets_service.export_leads_to_sheet(
            db=db,
            spreadsheet_id=req.spreadsheet_id,
            worksheet_title=req.worksheet_title,
            lead_ids=req.lead_ids,
            campaign_id=req.campaign_id,
            create_dashboard_tab=req.create_dashboard_tab,
            update_existing=req.update_existing
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Google Sheets export error: {str(e)}")

@router.get("/destinations", response_model=List[dict])
def get_destinations(db: Session = Depends(get_db)):
    """Returns list of past Google Sheet export destinations."""
    dests = db.query(SheetDestination).order_by(SheetDestination.last_synced_at.desc()).all()
    return [
        {
            "id": d.id,
            "campaign_id": d.campaign_id,
            "spreadsheet_id": d.spreadsheet_id,
            "spreadsheet_title": d.spreadsheet_title,
            "worksheet_title": d.worksheet_title,
            "spreadsheet_url": d.spreadsheet_url,
            "leads_synced_count": d.leads_synced_count,
            "last_synced_at": d.last_synced_at.isoformat() if d.last_synced_at else None
        }
        for d in dests
    ]
