from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class LeadScoreResponse(BaseModel):
    total_score: int
    priority: str
    reasons: List[str] = []

    class Config:
        from_attributes = True

class OutreachResponse(BaseModel):
    status: str
    priority: str
    follow_up_date: Optional[datetime] = None
    last_contacted_date: Optional[datetime] = None
    notes: Optional[str] = None
    draft_message: Optional[str] = None

    class Config:
        from_attributes = True

class LeadResponse(BaseModel):
    id: int
    place_id: str
    campaign_id: Optional[int] = None
    campaign_name: Optional[str] = None
    search_id: Optional[int] = None
    
    # Google-derived information
    business_name: str
    business_type: Optional[str] = None
    formatted_address: Optional[str] = None
    country: Optional[str] = None
    state_region: Optional[str] = None
    city: Optional[str] = None
    area: Optional[str] = None
    national_phone: Optional[str] = None
    international_phone: Optional[str] = None
    website_uri: Optional[str] = None
    email: Optional[str] = None
    google_maps_uri: Optional[str] = None
    rating: Optional[float] = 0.0
    user_rating_count: Optional[int] = 0
    business_status: Optional[str] = "OPERATIONAL"
    primary_type: Optional[str] = None
    source_location: Optional[str] = None

    # Duo Systems CRM data
    score: Optional[LeadScoreResponse] = None
    outreach: Optional[OutreachResponse] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LeadUpdateCRM(BaseModel):
    outreach_status: Optional[str] = None
    priority: Optional[str] = None
    email: Optional[str] = None
    follow_up_date: Optional[datetime] = None
    notes: Optional[str] = None
    draft_message: Optional[str] = None
    campaign_id: Optional[int] = None

class LeadFilterParams(BaseModel):
    campaign_id: Optional[int] = None
    business_type: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    area: Optional[str] = None
    min_rating: Optional[float] = None
    min_reviews: Optional[int] = None
    has_website: Optional[bool] = None
    has_phone: Optional[bool] = None
    priority: Optional[str] = None
    outreach_status: Optional[str] = None
    search_term: Optional[str] = None
    page: int = 1
    page_size: int = 50
