from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class SearchHistory(Base):
    __tablename__ = "searches"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True)
    business_type = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    country = Column(String(255), nullable=True)
    areas = Column(Text, nullable=True)
    query = Column(String(500), nullable=False)
    raw_result_count = Column(Integer, default=0)
    unique_count = Column(Integer, default=0)
    duplicate_count = Column(Integer, default=0)
    status = Column(String(50), default="Completed")  # Completed, Failed, In Progress
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    campaign = relationship("Campaign", back_populates="searches")
    leads = relationship("Lead", back_populates="search")
