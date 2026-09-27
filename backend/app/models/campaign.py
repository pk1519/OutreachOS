from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    business_type = Column(String(255), nullable=False, index=True)
    country = Column(String(255), nullable=True)
    location = Column(String(255), nullable=False)
    areas = Column(Text, nullable=True)  # JSON or comma-separated areas
    search_query = Column(String(500), nullable=True)
    
    # Email Outreach Templates & Settings
    subject_template = Column(String(500), nullable=True)
    body_template = Column(Text, nullable=True)
    sender_email = Column(String(255), default="contact.devworks7@gmail.com")
    emails_per_minute = Column(Integer, default=10)
    max_emails = Column(Integer, default=200)

    # Queue Metrics
    total_recipients = Column(Integer, default=0)
    sent_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    pending_count = Column(Integer, default=0)
    skipped_count = Column(Integer, default=0)

    # Status: DRAFT, READY, QUEUED, RUNNING, PAUSED, COMPLETED, FAILED, CANCELLED
    status = Column(String(50), default="DRAFT", index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    leads = relationship("Lead", back_populates="campaign", cascade="all, delete-orphan")
    searches = relationship("SearchHistory", back_populates="campaign")
    recipients = relationship("CampaignRecipient", back_populates="campaign", cascade="all, delete-orphan")
    email_messages = relationship("EmailMessage", back_populates="campaign")
