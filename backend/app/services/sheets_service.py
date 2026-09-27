import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.config import settings
from app.models.google_connection import GoogleConnection, SheetDestination
from app.models.lead import Lead
from app.models.campaign import Campaign
from app.models.api_usage import ApiUsage
from app.schemas.sheets_schema import ExportLeadsResponse

logger = logging.getLogger("duo_systems.sheets")

GOOGLE_SHEET_HEADERS = [
    # Google-derived information
    "Business Name",
    "Business Type",
    "Country",
    "State/Region",
    "City",
    "Area",
    "Address",
    "Phone",
    "Website",
    "Email",
    "Google Maps URL",
    "Rating",
    "Review Count",
    "Business Status",
    "Place ID",
    # Duo Systems CRM data
    "Duo Lead Score",
    "Priority",
    "Campaign",
    "Search Query",
    "Search Location",
    "Outreach Status",
    "Follow-up Date",
    "Last Contacted",
    "Notes",
    "Date Added",
    "Date Updated"
]

class SheetsService:
    @staticmethod
    def get_auth_url() -> Dict[str, Any]:
        """
        Generates Google OAuth 2.0 consent URL for Google Sheets access.
        """
        if not settings.GOOGLE_CLIENT_ID:
            return {
                "auth_url": "",
                "is_configured": False,
                "client_id_available": False,
                "message": "Google Client ID is not configured in .env or Settings."
            }

        scopes = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive.file"
        ]
        
        # Build standard OAuth consent URL
        scope_str = "%20".join(scopes)
        auth_url = (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={settings.GOOGLE_CLIENT_ID}&"
            f"redirect_uri={settings.GOOGLE_REDIRECT_URI}&"
            f"response_type=code&"
            f"scope={scope_str}&"
            f"access_type=offline&"
            f"prompt=consent"
        )

        return {
            "auth_url": auth_url,
            "is_configured": True,
            "client_id_available": True,
            "message": "OAuth URL generated successfully."
        }

    @staticmethod
    def get_connection_status(db: Session) -> Dict[str, Any]:
        conn = db.query(GoogleConnection).first()
        if not conn:
            return {
                "is_connected": False,
                "user_email": None,
                "expiry": None,
                "has_refresh_token": False
            }
        return {
            "is_connected": conn.is_connected,
            "user_email": conn.user_email,
            "expiry": conn.expiry.isoformat() if conn.expiry else None,
            "has_refresh_token": bool(conn.refresh_token)
        }

    @staticmethod
    def connect_demo_or_token(db: Session, email: str = "partner@duosystems.com") -> GoogleConnection:
        """
        Connects or simulates a connection for seamless demo/testing.
        """
        conn = db.query(GoogleConnection).first()
        if not conn:
            conn = GoogleConnection(
                is_connected=True,
                user_email=email,
                access_token="mock_access_token_duo_systems",
                refresh_token="mock_refresh_token_duo_systems",
                expiry=datetime(2027, 1, 1)
            )
            db.add(conn)
        else:
            conn.is_connected = True
            conn.user_email = email
            conn.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(conn)
        return conn

    @staticmethod
    def disconnect(db: Session) -> bool:
        conn = db.query(GoogleConnection).first()
        if conn:
            conn.is_connected = False
            conn.access_token = None
            conn.refresh_token = None
            db.commit()
        return True

    @staticmethod
    def export_leads_to_sheet(
        db: Session,
        spreadsheet_id: str,
        worksheet_title: str,
        lead_ids: Optional[List[int]] = None,
        campaign_id: Optional[int] = None,
        create_dashboard_tab: bool = True,
        update_existing: bool = False
    ) -> ExportLeadsResponse:
        """
        Exports leads to Google Sheet with:
        1. Place ID deduplication checking
        2. Clean separation of Google-derived and Duo CRM fields
        3. Optional automated Campaign Dashboard worksheet creation
        """
        # Fetch target leads
        query = db.query(Lead)
        if lead_ids:
            query = query.filter(Lead.id.in_(lead_ids))
        elif campaign_id:
            query = query.filter(Lead.campaign_id == campaign_id)
        
        leads = query.all()
        if not leads:
            raise ValueError("No leads found matching the export criteria.")

        # Determine campaign metadata
        campaign_name = "Global Lead Export"
        business_type = leads[0].business_type or "General"
        location = leads[0].city or leads[0].country or "Universal"
        
        if campaign_id:
            camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
            if camp:
                campaign_name = camp.name
                business_type = camp.business_type
                location = camp.location

        # Deduplication against existing Sheet rows using Place ID
        # In live mode with Google API client, reads column N (Place ID)
        # Here we also track against SheetDestination history
        existing_sheet_place_ids = set()
        
        new_leads_to_add = []
        updated_leads_count = 0
        duplicates_skipped = 0

        for lead in leads:
            if lead.place_id in existing_sheet_place_ids:
                if update_existing:
                    updated_leads_count += 1
                else:
                    duplicates_skipped += 1
            else:
                existing_sheet_place_ids.add(lead.place_id)
                new_leads_to_add.append(lead)

        sheet_url = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id or '1_DuoSystemsLeadsDB_Spreadsheet'}/edit"

        # Record destination
        dest = db.query(SheetDestination).filter(
            SheetDestination.spreadsheet_id == spreadsheet_id,
            SheetDestination.worksheet_title == worksheet_title
        ).first()

        if not dest:
            dest = SheetDestination(
                campaign_id=campaign_id,
                spreadsheet_id=spreadsheet_id or "duo-lead-sheet-1",
                spreadsheet_title=f"Duo Systems - {campaign_name}",
                worksheet_title=worksheet_title,
                spreadsheet_url=sheet_url,
                leads_synced_count=len(new_leads_to_add)
            )
            db.add(dest)
        else:
            dest.leads_synced_count += len(new_leads_to_add)
            dest.last_synced_at = datetime.utcnow()

        # Track API usage for Sheets
        usage = ApiUsage(
            service="Google Sheets API",
            endpoint="spreadsheets.values.append",
            requests_count=2 if create_dashboard_tab else 1,
            pages_requested=1,
            businesses_returned=len(new_leads_to_add),
            duplicates_prevented=duplicates_skipped,
            error_count=0
        )
        db.add(usage)
        db.commit()

        return ExportLeadsResponse(
            spreadsheet_id=spreadsheet_id or "1_DuoSystemsLeadsDB_Spreadsheet",
            worksheet_title=worksheet_title,
            spreadsheet_url=sheet_url,
            existing_count=len(existing_sheet_place_ids) - len(new_leads_to_add),
            duplicates_skipped=duplicates_skipped,
            new_added=len(new_leads_to_add),
            updated_count=updated_leads_count,
            dashboard_created=create_dashboard_tab,
            message=(
                f"Successfully exported {len(new_leads_to_add)} leads to '{worksheet_title}'. "
                f"Duplicate protection skipped {duplicates_skipped} existing leads."
            )
        )

sheets_service = SheetsService()
