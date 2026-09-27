from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    place_id = Column(String(255), unique=True, nullable=False, index=True)  # Deduplication key
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True, index=True)
    search_id = Column(Integer, ForeignKey("searches.id", ondelete="SET NULL"), nullable=True)

    # Core business identity
    business_name = Column(String(255), nullable=False, index=True)
    business_type = Column(String(255), nullable=True, index=True)
    category = Column(String(255), nullable=True, index=True)
    
    # Location data
    formatted_address = Column(Text, nullable=True)
    address = Column(Text, nullable=True)
    country = Column(String(100), nullable=True, index=True)
    state_region = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True, index=True)
    area = Column(String(100), nullable=True, index=True)
    
    # Contact information
    national_phone = Column(String(100), nullable=True)
    phone = Column(String(100), nullable=True)
    international_phone = Column(String(100), nullable=True)
    website_uri = Column(String(500), nullable=True)
    website = Column(String(500), nullable=True)
    email = Column(String(255), nullable=True, index=True)
    
    # Google listing metadata
    google_maps_uri = Column(String(500), nullable=True)
    rating = Column(Float, nullable=True, default=0.0)
    user_rating_count = Column(Integer, nullable=True, default=0)
    review_count = Column(Integer, nullable=True, default=0)
    business_status = Column(String(50), nullable=True, default="OPERATIONAL")
    primary_type = Column(String(100), nullable=True)
    types_csv = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    source_location = Column(String(255), nullable=True)
    source = Column(String(100), default="Google Places")  # Google Places, CSV Import, Manual
    is_google_derived = Column(Boolean, default=True)

    # CRM qualification & status
    lead_score = Column(Integer, default=0, index=True)
    lead_status = Column(String(50), default="NEW", index=True)
    # Statuses: NEW, QUALIFIED, CONTACTED, REPLIED, CONVERTED, NOT_INTERESTED, INVALID

    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    campaign = relationship("Campaign", back_populates="leads")
    search = relationship("SearchHistory", back_populates="leads")
    score = relationship("LeadScore", back_populates="lead", uselist=False, cascade="all, delete-orphan")
    outreach = relationship("OutreachRecord", back_populates="lead", uselist=False, cascade="all, delete-orphan")
    contacts = relationship("LeadContact", back_populates="lead", cascade="all, delete-orphan")
    notes = relationship("LeadNote", back_populates="lead", cascade="all, delete-orphan")
    tags = relationship("LeadTag", back_populates="lead", cascade="all, delete-orphan")
    campaign_recipients = relationship("CampaignRecipient", back_populates="lead")
    email_messages = relationship("EmailMessage", back_populates="lead")
