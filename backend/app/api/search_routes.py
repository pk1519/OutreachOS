import asyncio
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.models.campaign import Campaign
from app.models.search import SearchHistory
from app.schemas.search_schema import SearchRequest, SearchResponseStats, SearchHistoryResponse
from app.services.places_service import places_service
from app.services.lead_service import lead_service
from app.services.campaign_service import campaign_service

router = APIRouter(prefix="/search", tags=["Search & Lead Discovery"])

@router.post("", response_model=SearchResponseStats)
async def discover_leads(req: SearchRequest, db: Session = Depends(get_db)):
    """
    Primary Lead Discovery Workflow:
    1. Normalizes query across any business category and location worldwide.
    2. Performs multi-area searches if areas are provided.
    3. Calls official Google Places API (New) Text Search endpoint.
    4. Deduplicates results strictly using Google Place ID.
    5. Calculates Duo Systems Lead Scores with transparent reasons.
    6. Stores leads, assigns to campaign, and creates CRM outreach records.
    """
    # Campaign association
    campaign = None
    if req.campaign_id:
        campaign = campaign_service.get_campaign_by_id(db, req.campaign_id)
    elif req.campaign_name and req.campaign_name.strip():
        campaign = campaign_service.get_campaign_by_name(db, req.campaign_name.strip())
        if not campaign:
            campaign = Campaign(
                name=req.campaign_name.strip(),
                business_type=req.business_type,
                location=req.location,
                country=req.country,
                areas=",".join(req.areas) if req.areas else None,
                search_query=req.custom_query or f"{req.business_type} in {req.location}"
            )
            db.add(campaign)
            db.commit()
            db.refresh(campaign)

    areas_to_search = req.areas if req.areas and len(req.areas) > 0 else [None]
    
    # Cost & safety check
    if len(areas_to_search) > settings.MAX_AREAS_PER_SEARCH:
        raise HTTPException(
            status_code=400,
            detail=f"Exceeded maximum allowed areas per search ({settings.MAX_AREAS_PER_SEARCH})."
        )

    all_raw_places = []
    
    # Perform searches across specified areas or single location
    for area in areas_to_search:
        if req.custom_query:
            query = f"{req.custom_query} in {area}, {req.location}" if area else f"{req.custom_query} in {req.location}"
        else:
            loc_str = f"{area}, {req.location}" if area else req.location
            if req.country:
                loc_str = f"{loc_str}, {req.country}"
            query = f"{req.business_type} in {loc_str}"

        try:
            res = await places_service.search_places(query=query, page_size=min(req.result_limit, 20))
            places_batch = res.get("places", [])
            for p in places_batch:
                p["_source_location"] = f"{area}, {req.location}" if area else req.location
            all_raw_places.extend(places_batch)
        except Exception as e:
            # Record failed search attempt
            search_record = SearchHistory(
                campaign_id=campaign.id if campaign else None,
                business_type=req.business_type,
                location=req.location,
                country=req.country,
                areas=",".join(req.areas) if req.areas else None,
                query=query,
                raw_result_count=0,
                unique_count=0,
                duplicate_count=0,
                status="Failed",
                error_message=str(e)
            )
            db.add(search_record)
            db.commit()
            raise HTTPException(status_code=500, detail=f"Lead search failed: {str(e)}")

    # Deduplicate and save leads with Place ID
    raw_count, unique_saved, duplicates_removed = lead_service.process_and_save_places(
        db=db,
        places=all_raw_places,
        business_type=req.business_type,
        location=req.location,
        campaign_id=campaign.id if campaign else None
    )

    # Save Search History
    main_query = req.custom_query or f"{req.business_type} in {req.location}"
    search_record = SearchHistory(
        campaign_id=campaign.id if campaign else None,
        business_type=req.business_type,
        location=req.location,
        country=req.country,
        areas=",".join(req.areas) if req.areas else None,
        query=main_query,
        raw_result_count=raw_count,
        unique_count=unique_saved,
        duplicate_count=duplicates_removed,
        status="Completed"
    )
    db.add(search_record)
    db.commit()
    db.refresh(search_record)

    return SearchResponseStats(
        search_id=search_record.id,
        raw_results=raw_count,
        unique_leads=unique_saved,
        duplicates_removed=duplicates_removed,
        campaign_id=campaign.id if campaign else None,
        campaign_name=campaign.name if campaign else None,
        query=main_query,
        message=(
            f"Discovered {raw_count} raw businesses. "
            f"Successfully deduplicated by Place ID into {unique_saved} unique leads "
            f"({duplicates_removed} duplicates removed)."
        )
    )

@router.get("/history", response_model=List[SearchHistoryResponse])
def get_search_history(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    searches = db.query(SearchHistory).order_by(SearchHistory.created_at.desc()).limit(limit).all()
    return searches
