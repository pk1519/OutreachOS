from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base

class ApiUsage(Base):
    __tablename__ = "api_usage"

    id = Column(Integer, primary_key=True, index=True)
    service = Column(String(100), default="Google Places API (New)")
    endpoint = Column(String(255), default="/places:searchText")
    requests_count = Column(Integer, default=1)
    pages_requested = Column(Integer, default=1)
    businesses_returned = Column(Integer, default=0)
    duplicates_prevented = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
