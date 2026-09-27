from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from app.models.lead import Lead
from app.models.lead_score import LeadScore
from app.models.outreach import OutreachRecord
from app.models.campaign import Campaign
from app.models.search import SearchHistory
from app.models.api_usage import ApiUsage
from app.schemas.analytics_schema import (
    DashboardResponse,
    DashboardKpiStats,
    ChartDataPoint,
    ApiUsageStatsResponse
)

class AnalyticsService:
    @staticmethod
    def get_dashboard_data(
        db: Session,
        campaign_id: Optional[int] = None,
        business_type: Optional[str] = None,
        location: Optional[str] = None,
        country: Optional[str] = None,
        priority: Optional[str] = None,
        outreach_status: Optional[str] = None
    ) -> DashboardResponse:
        # Base query for leads
        query = db.query(Lead)

        if campaign_id:
            query = query.filter(Lead.campaign_id == campaign_id)
        if business_type:
            query = query.filter(Lead.business_type.ilike(f"%{business_type}%"))
        if location:
            query = query.filter(or_(Lead.city.ilike(f"%{location}%"), Lead.formatted_address.ilike(f"%{location}%")))
        if country:
            query = query.filter(Lead.country.ilike(f"%{country}%"))
        if priority:
            query = query.join(Lead.score).filter(LeadScore.priority == priority)
        if outreach_status:
            query = query.join(Lead.outreach).filter(OutreachRecord.status == outreach_status)

        total_unique_leads = query.count()

        if total_unique_leads == 0:
            return DashboardResponse(
                has_enough_data=False,
                stats=DashboardKpiStats(),
                current_search_context=None,
                leads_by_category=[],
                leads_by_location=[],
                priority_distribution=[],
                outreach_distribution=[],
                rating_distribution=[],
                website_availability=[],
                phone_availability=[],
                reviews_distribution=[],
                leads_over_time=[]
            )

        leads = query.all()
        lead_ids = [l.id for l in leads]

        # Raw discovery count across related searches
        raw_found = total_unique_leads
        latest_search = db.query(SearchHistory).order_by(desc(SearchHistory.created_at)).first()
        if latest_search:
            raw_found = max(total_unique_leads, latest_search.raw_result_count)

        # Priority counts
        high_pri = db.query(func.count(LeadScore.id)).filter(LeadScore.lead_id.in_(lead_ids), LeadScore.priority == "HIGH").scalar() or 0
        med_pri = db.query(func.count(LeadScore.id)).filter(LeadScore.lead_id.in_(lead_ids), LeadScore.priority == "MEDIUM").scalar() or 0
        low_pri = db.query(func.count(LeadScore.id)).filter(LeadScore.lead_id.in_(lead_ids), LeadScore.priority == "LOW").scalar() or 0

        # Website & Phone availability
        with_website = sum(1 for l in leads if l.website_uri and len(str(l.website_uri).strip()) > 3)
        with_phone = sum(1 for l in leads if l.national_phone or l.international_phone)

        # Rating & Reviews
        ratings = [l.rating for l in leads if l.rating and l.rating > 0]
        avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else 0.0
        total_reviews = sum(l.user_rating_count or 0 for l in leads)

        # Outreach status counts
        outreach_records = db.query(OutreachRecord).filter(OutreachRecord.lead_id.in_(lead_ids)).all()
        status_map: Dict[str, int] = {}
        for rec in outreach_records:
            status_map[rec.status] = status_map.get(rec.status, 0) + 1

        contacted = status_map.get("Contacted", 0)
        replied = status_map.get("Replied", 0)
        interested = status_map.get("Interested", 0)
        demo_sched = status_map.get("Demo Scheduled", 0)
        prop_sent = status_map.get("Proposal Sent", 0)
        won = status_map.get("Won", 0)
        lost = status_map.get("Lost", 0)
        follow_ups_due = sum(1 for r in outreach_records if r.status == "Follow-up Required" or r.follow_up_date)

        stats = DashboardKpiStats(
            total_businesses_found=raw_found,
            unique_leads=total_unique_leads,
            high_priority_leads=high_pri,
            medium_priority_leads=med_pri,
            low_priority_leads=low_pri,
            businesses_with_website=with_website,
            businesses_with_phone=with_phone,
            average_rating=avg_rating,
            total_reviews=total_reviews,
            contacted=contacted,
            replied=replied,
            interested=interested,
            demo_scheduled=demo_sched,
            proposal_sent=prop_sent,
            won=won,
            lost=lost,
            follow_ups_due=follow_ups_due
        )

        # Dynamic context
        current_context = None
        if campaign_id:
            camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
            if camp:
                areas_list = [a.strip() for a in (camp.areas or "").split(",") if a.strip()]
                current_context = {
                    "business_type": camp.business_type,
                    "location": camp.location,
                    "country": camp.country,
                    "areas": areas_list,
                    "campaign_name": camp.name
                }
        elif latest_search:
            areas_list = [a.strip() for a in (latest_search.areas or "").split(",") if a.strip()]
            current_context = {
                "business_type": latest_search.business_type,
                "location": latest_search.location,
                "country": latest_search.country,
                "areas": areas_list,
                "campaign_name": latest_search.campaign.name if latest_search.campaign else "Ad-hoc Discovery"
            }

        # Visualizations (Real data only)
        # 1. By Category
        cat_counts: Dict[str, int] = {}
        for l in leads:
            c = l.business_type or "General"
            cat_counts[c] = cat_counts.get(c, 0) + 1
        leads_by_category = [ChartDataPoint(name=k, value=v) for k, v in sorted(cat_counts.items(), key=lambda x: x[1], reverse=True)[:8]]

        # 2. By Location
        loc_counts: Dict[str, int] = {}
        for l in leads:
            loc_label = l.area or l.city or l.country or "Other"
            loc_counts[loc_label] = loc_counts.get(loc_label, 0) + 1
        leads_by_location = [ChartDataPoint(name=k, value=v) for k, v in sorted(loc_counts.items(), key=lambda x: x[1], reverse=True)[:8]]

        # 3. Priority Distribution
        priority_dist = [
            ChartDataPoint(name="High Priority", value=high_pri),
            ChartDataPoint(name="Medium Priority", value=med_pri),
            ChartDataPoint(name="Low Priority", value=low_pri),
        ]

        # 4. Outreach Funnel
        outreach_dist = [
            ChartDataPoint(name="Not Contacted", value=status_map.get("Not Contacted", 0)),
            ChartDataPoint(name="Contacted", value=contacted),
            ChartDataPoint(name="Replied", value=replied),
            ChartDataPoint(name="Interested", value=interested),
            ChartDataPoint(name="Demo Scheduled", value=demo_sched),
            ChartDataPoint(name="Proposal Sent", value=prop_sent),
            ChartDataPoint(name="Won", value=won),
            ChartDataPoint(name="Lost", value=lost),
        ]

        # 5. Rating Distribution
        r_tiers = {"4.5 - 5.0": 0, "4.0 - 4.4": 0, "3.5 - 3.9": 0, "< 3.5": 0, "Unrated": 0}
        for l in leads:
            r = l.rating or 0.0
            if r >= 4.5:
                r_tiers["4.5 - 5.0"] += 1
            elif r >= 4.0:
                r_tiers["4.0 - 4.4"] += 1
            elif r >= 3.5:
                r_tiers["3.5 - 3.9"] += 1
            elif r > 0.0:
                r_tiers["< 3.5"] += 1
            else:
                r_tiers["Unrated"] += 1
        rating_dist = [ChartDataPoint(name=k, value=v) for k, v in r_tiers.items()]

        # 6. Website Availability
        website_avail = [
            ChartDataPoint(name="Has Website", value=with_website),
            ChartDataPoint(name="No Website", value=total_unique_leads - with_website)
        ]

        # 7. Phone Availability
        phone_avail = [
            ChartDataPoint(name="Has Direct Phone", value=with_phone),
            ChartDataPoint(name="No Phone Listed", value=total_unique_leads - with_phone)
        ]

        # 8. Reviews Distribution
        rev_tiers = {"500+ Reviews": 0, "100-499": 0, "30-99": 0, "1-29": 0, "0 Reviews": 0}
        for l in leads:
            rc = l.user_rating_count or 0
            if rc >= 500:
                rev_tiers["500+ Reviews"] += 1
            elif rc >= 100:
                rev_tiers["100-499"] += 1
            elif rc >= 30:
                rev_tiers["30-99"] += 1
            elif rc >= 1:
                rev_tiers["1-29"] += 1
            else:
                rev_tiers["0 Reviews"] += 1
        reviews_dist = [ChartDataPoint(name=k, value=v) for k, v in rev_tiers.items()]

        # 9. Leads over time
        date_counts: Dict[str, int] = {}
        for l in leads:
            d_str = l.created_at.strftime("%Y-%m-%d")
            date_counts[d_str] = date_counts.get(d_str, 0) + 1
        leads_time = [ChartDataPoint(name=k, value=v) for k, v in sorted(date_counts.items())]

        return DashboardResponse(
            has_enough_data=total_unique_leads > 0,
            stats=stats,
            current_search_context=current_context,
            leads_by_category=leads_by_category,
            leads_by_location=leads_by_location,
            priority_distribution=priority_dist,
            outreach_distribution=outreach_dist,
            rating_distribution=rating_dist,
            website_availability=website_avail,
            phone_availability=phone_avail,
            reviews_distribution=reviews_dist,
            leads_over_time=leads_time
        )

    @staticmethod
    def get_api_usage_stats(db: Session) -> ApiUsageStatsResponse:
        total_requests = db.query(func.sum(ApiUsage.requests_count)).scalar() or 0
        total_searches = db.query(func.count(SearchHistory.id)).scalar() or 0
        pages_requested = db.query(func.sum(ApiUsage.pages_requested)).scalar() or 0
        businesses_returned = db.query(func.sum(ApiUsage.businesses_returned)).scalar() or 0
        duplicates_prevented = db.query(func.sum(ApiUsage.duplicates_prevented)).scalar() or 0
        errors_count = db.query(func.sum(ApiUsage.error_count)).scalar() or 0
        sheets_api_requests = db.query(func.sum(ApiUsage.requests_count)).filter(ApiUsage.service.ilike("%Sheets%")).scalar() or 0

        return ApiUsageStatsResponse(
            places_api_requests=total_requests,
            total_searches=total_searches,
            pages_requested=pages_requested,
            businesses_returned=businesses_returned,
            duplicates_prevented=duplicates_prevented,
            errors_count=errors_count,
            sheets_api_requests=sheets_api_requests
        )

analytics_service = AnalyticsService()
