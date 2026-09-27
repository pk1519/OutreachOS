from typing import Optional, List
from pydantic import BaseModel

class GoogleAuthUrlResponse(BaseModel):
    auth_url: str
    is_configured: bool
    client_id_available: bool

class GoogleConnectionStatusResponse(BaseModel):
    is_connected: bool
    user_email: Optional[str] = None
    expiry: Optional[str] = None
    has_refresh_token: bool = False

class CreateSpreadsheetRequest(BaseModel):
    title: str = "Duo Systems Lead Database"

class CreateWorksheetRequest(BaseModel):
    spreadsheet_id: str
    worksheet_title: str

class ExportLeadsRequest(BaseModel):
    spreadsheet_id: str
    worksheet_title: str
    lead_ids: Optional[List[int]] = None  # Specific leads selected
    campaign_id: Optional[int] = None      # Entire campaign
    create_dashboard_tab: bool = True
    update_existing: bool = False

class ExportLeadsResponse(BaseModel):
    spreadsheet_id: str
    worksheet_title: str
    spreadsheet_url: str
    existing_count: int
    duplicates_skipped: int
    new_added: int
    updated_count: int
    dashboard_created: bool
    message: str
