import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.services.gmail.gmail_service import gmail_service

logger = logging.getLogger("duo_systems.gmail_routes")

router = APIRouter(prefix="/integrations/gmail", tags=["Gmail Integration"])

@router.get("/status")
def get_gmail_status(db: Session = Depends(get_db)):
    """Returns the current Gmail OAuth connection status and metadata."""
    try:
        status_info = gmail_service.validate_connection(db)
        return status_info
    except Exception as e:
        logger.error(f"Error checking Gmail status: {e}")
        return {
            "is_connected": False,
            "account_email": None,
            "scope": None,
            "credentials_file_found": False,
            "message": f"Error checking Gmail status: {str(e)}"
        }

@router.get("/connect")
def connect_gmail(
    redirect_uri: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Initiates Google OAuth 2.0 flow for Gmail sending scope:
    https://www.googleapis.com/auth/gmail.send
    Returns authorization URL for the user to grant consent.
    """
    try:
        auth_data = gmail_service.get_authorization_url(redirect_uri=redirect_uri)
        return auth_data
    except Exception as e:
        logger.error(f"Failed to generate Gmail OAuth URL: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to start Google OAuth: {str(e)}"
        )

@router.get("/callback")
def gmail_oauth_callback(
    code: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    redirect_uri: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Receives authorization code from Google OAuth and exchanges it for tokens.
    Persists tokens securely in the database.
    """
    if error:
        logger.warning(f"Google OAuth returned error: {error}")
        # Redirect to frontend with error query parameter
        frontend_url = settings.FRONTEND_URL or "http://localhost:5173"
        return RedirectResponse(url=f"{frontend_url}/settings?gmail_error={error}")

    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code from Google OAuth callback.")

    try:
        result = gmail_service.handle_oauth_callback(
            code=code,
            state=state,
            redirect_uri=redirect_uri,
            db=db
        )
        frontend_url = settings.FRONTEND_URL or "http://localhost:5173"
        return RedirectResponse(url=f"{frontend_url}/settings?gmail_connected=true")
    except Exception as e:
        logger.error(f"Error handling Gmail OAuth callback: {e}")
        frontend_url = settings.FRONTEND_URL or "http://localhost:5173"
        return RedirectResponse(url=f"{frontend_url}/settings?gmail_error=Google+authorization+was+not+completed")

@router.post("/disconnect")
def disconnect_gmail(db: Session = Depends(get_db)):
    """Disconnects Gmail integration and revokes local tokens."""
    try:
        gmail_service.disconnect_gmail(db)
        return {"status": "disconnected", "message": "Gmail account disconnected successfully."}
    except Exception as e:
        logger.error(f"Error disconnecting Gmail: {e}")
        raise HTTPException(status_code=500, detail="Failed to disconnect Gmail account.")

@router.post("/simulate-connect")
def simulate_connect_gmail(db: Session = Depends(get_db)):
    """
    Convenience endpoint for local testing / demo when offline.
    Connects contact.devworks7@gmail.com with send scope.
    """
    conn = gmail_service.connect_gmail(db)
    return {
        "status": "connected",
        "account_email": conn.user_email,
        "scope": "https://www.googleapis.com/auth/gmail.send",
        "message": "Gmail connected successfully for contact.devworks7@gmail.com"
    }
