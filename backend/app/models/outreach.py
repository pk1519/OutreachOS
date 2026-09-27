from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class OutreachRecord(Base):
    __tablename__ = "outreach_records"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), unique=True, nullable=False)
    status = Column(String(50), default="Not Contacted", index=True)
    # Statuses: Not Contacted, Contacted, Replied, Interested, Demo Scheduled, Proposal Sent, Negotiating, Won, Lost, Not Interested, Follow-up Required
    priority = Column(String(50), default="MEDIUM")
    follow_up_date = Column(DateTime, nullable=True)
    last_contacted_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    draft_message = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    lead = relationship("Lead", back_populates="outreach")
