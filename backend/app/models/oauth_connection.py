from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from app.database import Base

class OAuthConnection(Base):
    __tablename__ = "oauth_connections"

    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String(50), default="gmail", index=True)  # gmail, google_sheets
    is_connected = Column(Boolean, default=False)
    user_email = Column(String(255), default="contact.devworks7@gmail.com")
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    token_uri = Column(String(255), default="https://oauth2.googleapis.com/token")
    client_id = Column(String(255), nullable=True)
    client_secret = Column(String(255), nullable=True)
    scopes = Column(Text, nullable=True)
    expiry = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
