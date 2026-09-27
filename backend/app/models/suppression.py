from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base

class SuppressionList(Base):
    __tablename__ = "suppression_list"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    # Reasons: UNSUBSCRIBED, BOUNCED, DO_NOT_CONTACT, MANUAL_BLOCK
    reason = Column(String(50), default="MANUAL_BLOCK", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
