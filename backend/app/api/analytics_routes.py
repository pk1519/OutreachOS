from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.analytics_schema import DashboardResponse, ApiUsageStatsResponse
from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics & Usage"])

@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard_analytics(
    campaign_id: Optional[int] = Query(None),
    business_type: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    outreach_status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Returns dynamic dashboard KPIs and visualizations computed from active leads and filters.
    If insufficient data exists, returns has_enough_data: False instead of fabricated metrics.
    """
    return analytics_service.get_dashboard_data(
        db=db,
        campaign_id=campaign_id,
        business_type=business_type,
        location=location,
        country=country,
        priority=priority,
        outreach_status=outreach_status
    )

@router.get("/api-usage", response_model=ApiUsageStatsResponse)
def get_api_usage(db: Session = Depends(get_db)):
    """Returns actual recorded API usage counts, pages requested, duplicates prevented, and errors."""
    return analytics_service.get_api_usage_stats(db)
