from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from app.database import Base

class GoogleConnection(Base):
    __tablename__ = "google_connections"

    id = Column(Integer, primary_key=True, index=True)
    is_connected = Column(Boolean, default=False)
    # Server-side only token storage - never exposed to frontend
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    token_uri = Column(String(255), default="https://oauth2.googleapis.com/token")
    client_id = Column(String(255), nullable=True)
    expiry = Column(DateTime, nullable=True)
    user_email = Column(String(255), nullable=True)
    scopes = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SheetDestination(Base):
    __tablename__ = "sheet_destinations"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, nullable=True)
    spreadsheet_id = Column(String(255), nullable=False)
    spreadsheet_title = Column(String(255), nullable=False)
    worksheet_title = Column(String(255), nullable=False)
    spreadsheet_url = Column(String(500), nullable=True)
    leads_synced_count = Column(Integer, default=0)
    last_synced_at = Column(DateTime, default=datetime.utcnow)
