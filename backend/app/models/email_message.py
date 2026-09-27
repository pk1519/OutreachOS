from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class EmailMessage(Base):
    __tablename__ = "email_messages"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True, index=True)
    recipient_id = Column(Integer, ForeignKey("campaign_recipients.id", ondelete="SET NULL"), nullable=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="SET NULL"), nullable=True, index=True)
    sender_email = Column(String(255), default="contact.devworks7@gmail.com", nullable=False)
    recipient_email = Column(String(255), nullable=False, index=True)
    subject = Column(String(500), nullable=False)
    rendered_body = Column(Text, nullable=False)
    status = Column(String(50), default="PENDING", index=True)  # PENDING, PROCESSING, SENT, FAILED, SKIPPED
    gmail_message_id = Column(String(255), nullable=True, index=True)
    gmail_thread_id = Column(String(255), nullable=True)
    failure_reason = Column(Text, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    campaign = relationship("Campaign", back_populates="email_messages")
    recipient = relationship("CampaignRecipient", back_populates="email_messages")
    lead = relationship("Lead", back_populates="email_messages")
