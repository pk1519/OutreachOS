from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    # Actions: GMAIL_CONNECTED, GMAIL_DISCONNECTED, LEAD_SEARCHED, LEAD_IMPORTED,
    # LEAD_EXPORTED, CAMPAIGN_CREATED, CAMPAIGN_STARTED, CAMPAIGN_PAUSED,
    # CAMPAIGN_RESUMED, CAMPAIGN_CANCELLED, EMAIL_SENT, EMAIL_FAILED
    details = Column(Text, nullable=True)
    user_email = Column(String(255), default="contact.devworks7@gmail.com")
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
