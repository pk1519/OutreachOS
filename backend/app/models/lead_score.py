from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class LeadScore(Base):
    __tablename__ = "lead_scores"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), unique=True, nullable=False)
    total_score = Column(Integer, nullable=False, default=0, index=True)
    priority = Column(String(50), nullable=False, default="LOW", index=True)  # HIGH, MEDIUM, LOW
    reasons = Column(Text, nullable=True)  # JSON-encoded array of reason strings
    scoring_version = Column(String(50), default="v1.0")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    lead = relationship("Lead", back_populates="score")
