from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

class SearchRequest(BaseModel):
    business_type: str = Field(..., description="Business category or domain (e.g. Gyms, Schools, Real Estate)")
    location: str = Field(..., description="City or Region (e.g. Bangalore, Lucknow, Dubai)")
    country: Optional[str] = Field(None, description="Country (e.g. India, UAE, UK, USA)")
    areas: Optional[List[str]] = Field(default=[], description="List of sub-areas or neighborhoods")
    custom_query: Optional[str] = Field(None, description="Optional custom search query")
    min_rating: Optional[float] = Field(0.0, ge=0.0, le=5.0)
    min_reviews: Optional[int] = Field(0, ge=0)
    result_limit: Optional[int] = Field(60, ge=1, le=200)
    campaign_name: Optional[str] = Field(None, description="Assign results to a campaign")
    campaign_id: Optional[int] = Field(None)

class SearchResponseStats(BaseModel):
    search_id: int
    raw_results: int
    unique_leads: int
    duplicates_removed: int
    campaign_id: Optional[int] = None
    campaign_name: Optional[str] = None
    query: str
    message: str

class SearchHistoryResponse(BaseModel):
    id: int
    campaign_id: Optional[int]
    business_type: str
    location: str
    country: Optional[str]
    areas: Optional[str]
    query: str
    raw_result_count: int
    unique_count: int
    duplicate_count: int
    status: str
    error_message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
