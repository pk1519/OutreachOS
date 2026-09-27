from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class DashboardKpiStats(BaseModel):
    total_leads_found: int = 0
    unique_leads: int = 0
    high_priority_leads: int = 0
    medium_priority_leads: int = 0
    low_priority_leads: int = 0
    businesses_with_website: int = 0
    businesses_with_phone: int = 0
    average_rating: float = 0.0
    total_reviews: int = 0
    contacted: int = 0
    replied: int = 0
    interested: int = 0
    demo_scheduled: int = 0
    proposal_sent: int = 0
    won: int = 0
    lost: int = 0
    follow_ups_due: int = 0

class ChartDataPoint(BaseModel):
    name: str
    value: float

class DashboardResponse(BaseModel):
    has_enough_data: bool
    stats: DashboardKpiStats
    current_search_context: Optional[Dict[str, Any]] = None
    leads_by_category: List[ChartDataPoint] = []
    leads_by_location: List[ChartDataPoint] = []
    priority_distribution: List[ChartDataPoint] = []
    outreach_distribution: List[ChartDataPoint] = []
    rating_distribution: List[ChartDataPoint] = []
    website_availability: List[ChartDataPoint] = []
    phone_availability: List[ChartDataPoint] = []
    reviews_distribution: List[ChartDataPoint] = []
    leads_over_time: List[ChartDataPoint] = []

class ApiUsageStatsResponse(BaseModel):
    places_api_requests: int = 0
    total_searches: int = 0
    pages_requested: int = 0
    businesses_returned: int = 0
    duplicates_prevented: int = 0
    errors_count: int = 0
    sheets_api_requests: int = 0
