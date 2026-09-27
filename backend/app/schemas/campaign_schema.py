from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class CampaignBase(BaseModel):
    name: str
    business_type: str
    location: str
    country: Optional[str] = None
    areas: Optional[str] = None
    search_query: Optional[str] = None
    status: Optional[str] = "Active"

class CampaignCreate(CampaignBase):
    pass

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    business_type: Optional[str] = None
    location: Optional[str] = None
    country: Optional[str] = None
    areas: Optional[str] = None
    search_query: Optional[str] = None
    status: Optional[str] = None

class CampaignResponse(CampaignBase):
    id: int
    created_at: datetime
    updated_at: datetime
    lead_count: Optional[int] = 0

    class Config:
        from_attributes = True
