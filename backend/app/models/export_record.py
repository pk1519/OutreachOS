from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base

class ExportRecord(Base):
    __tablename__ = "export_records"

    id = Column(Integer, primary_key=True, index=True)
    export_type = Column(String(50), nullable=False)  # CSV, GOOGLE_SHEETS
    lead_count = Column(Integer, default=0)
    destination_url = Column(String(500), nullable=True)
    file_name = Column(String(255), nullable=True)
    status = Column(String(50), default="COMPLETED")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
