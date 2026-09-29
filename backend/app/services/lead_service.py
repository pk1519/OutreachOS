import json
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc

from app.models.lead import Lead
from app.models.lead_score import LeadScore
from app.models.outreach import OutreachRecord
from app.models.campaign import Campaign
from app.models.search import SearchHistory
from app.models.api_usage import ApiUsage
from app.services.scoring_service import scoring_service
from app.services.deduplication_service import deduplication_service
from app.services.email_scraper_service import email_scraper_service
from app.schemas.lead_schema import LeadFilterParams

class LeadService:
    @staticmethod
    def normalize_place(place_raw: Dict[str, Any], business_type: str, source_location: str) -> Dict[str, Any]:
        """
        Normalizes official Google Places API (New) response format into Lead attributes.
        """
        place_id = place_raw.get("id") or place_raw.get("place_id") or ""
        
        display_name_obj = place_raw.get("displayName")
        business_name = (
            display_name_obj.get("text") if isinstance(display_name_obj, dict)
            else (place_raw.get("name") or "Unnamed Business")
        )
        
        formatted_address = place_raw.get("formattedAddress") or ""
        
        # Phone
        national_phone = place_raw.get("nationalPhoneNumber")
        international_phone = place_raw.get("internationalPhoneNumber") or national_phone
        
        website_uri = place_raw.get("websiteUri")
        google_maps_uri = place_raw.get("googleMapsUri")
        
        # Email from scraped payload or domain fallback
        email = place_raw.get("email")
        if not email and website_uri:
            domain = email_scraper_service.extract_domain(website_uri)
            if domain and not email_scraper_service.is_social_or_platform_domain(domain):
                email = f"contact@{domain}"
        if not email and business_name:
            slug = email_scraper_service.clean_slug(business_name)
            email = f"contact@{slug}.com"

        rating = float(place_raw.get("rating") or 0.0)
        user_rating_count = int(place_raw.get("userRatingCount") or 0)
        business_status = place_raw.get("businessStatus") or "OPERATIONAL"
        primary_type = place_raw.get("primaryType") or business_type
        
        types_list = place_raw.get("types", [])
        types_csv = ",".join(types_list) if isinstance(types_list, list) else str(types_list)

        loc = place_raw.get("location") or {}
        latitude = loc.get("latitude")
        longitude = loc.get("longitude")

        # Extract city, area, country from address components or source_location
        area = None
        city = None
        country = None
        state_region = None

        addr_comps = place_raw.get("addressComponents", [])
        for comp in addr_comps:
            types = comp.get("types", [])
            long_name = comp.get("longText") or comp.get("long_name") or ""
            if "country" in types:
                country = long_name
            elif "locality" in types:
                city = long_name
            elif "sublocality" in types or "sublocality_level_1" in types or "neighborhood" in types:
                area = long_name
            elif "administrative_area_level_1" in types:
                state_region = long_name

        if not city and source_location:
            parts = [p.strip() for p in source_location.split(",")]
            city = parts[0]
            if len(parts) > 1:
                country = parts[-1]

        return {
            "place_id": place_id,
            "business_name": business_name,
            "business_type": business_type,
            "formatted_address": formatted_address,
            "country": country,
            "state_region": state_region,
            "city": city,
            "area": area,
            "national_phone": national_phone,
            "international_phone": international_phone,
            "website_uri": website_uri,
            "email": email,
            "google_maps_uri": google_maps_uri,
            "rating": rating,
            "user_rating_count": user_rating_count,
            "business_status": business_status,
            "primary_type": primary_type,
            "types_csv": types_csv,
            "latitude": latitude,
            "longitude": longitude,
            "source_location": source_location,
            "is_google_derived": True
        }

    @staticmethod
    def process_and_save_places(
        db: Session,
        places: List[Dict[str, Any]],
        business_type: str,
        location: str,
        campaign_id: Optional[int] = None,
        search_id: Optional[int] = None
    ) -> Tuple[int, int, int]:
        """
        Deduplicates, scores, and commits leads to the database.
        Returns: (raw_count, unique_saved_count, duplicates_skipped)
        """
        unique_places, raw_count, unique_count, initial_dups = deduplication_service.deduplicate_places(places)
        
        saved_count = 0
        db_duplicates = 0

        for p_raw in unique_places:
            norm = LeadService.normalize_place(p_raw, business_type, location)
            place_id = norm["place_id"]
            if not place_id:
                continue

            existing_lead = db.query(Lead).filter(Lead.place_id == place_id).first()
            if existing_lead:
                db_duplicates += 1
                # If existing lead is missing email or has placeholder, update with scraped email
                if (not existing_lead.email or "@" not in existing_lead.email) and norm.get("email"):
                    existing_lead.email = norm["email"]
                    existing_lead.updated_at = datetime.utcnow()
                # If existing lead is not attached to this campaign, associate it
                if campaign_id and not existing_lead.campaign_id:
                    existing_lead.campaign_id = campaign_id
                continue

            # Create lead
            lead = Lead(
                place_id=norm["place_id"],
                campaign_id=campaign_id,
                search_id=search_id,
                business_name=norm["business_name"],
                business_type=norm["business_type"],
                formatted_address=norm["formatted_address"],
                country=norm["country"],
                state_region=norm["state_region"],
                city=norm["city"],
                area=norm["area"],
                national_phone=norm["national_phone"],
                international_phone=norm["international_phone"],
                website_uri=norm["website_uri"],
                email=norm["email"],
                google_maps_uri=norm["google_maps_uri"],
                rating=norm["rating"],
                user_rating_count=norm["user_rating_count"],
                business_status=norm["business_status"],
                primary_type=norm["primary_type"],
                types_csv=norm["types_csv"],
                latitude=norm["latitude"],
                longitude=norm["longitude"],
                source_location=norm["source_location"],
                is_google_derived=True
            )
            db.add(lead)
            db.flush()

            # Score lead
            score_val, priority, reasons = scoring_service.calculate_score(norm, business_type)
            lead_score = LeadScore(
                lead_id=lead.id,
                total_score=score_val,
                priority=priority,
                reasons=json.dumps(reasons)
            )
            db.add(lead_score)

            # Initialize CRM outreach record
            outreach = OutreachRecord(
                lead_id=lead.id,
                status="Not Contacted",
                priority=priority
            )
            db.add(outreach)
            saved_count += 1

        total_duplicates = initial_dups + db_duplicates
        db.commit()

        # Track API usage metrics
        usage = ApiUsage(
            service="Google Places API (New)",
            endpoint="/places:searchText",
            requests_count=1,
            pages_requested=1,
            businesses_returned=raw_count,
            duplicates_prevented=total_duplicates,
            error_count=0
        )
        db.add(usage)
        db.commit()

        return raw_count, unique_count, initial_dups

    @staticmethod
    def get_leads_filtered(db: Session, filters: LeadFilterParams) -> Tuple[List[Lead], int]:
        """
        Retrieves leads matching dynamic filters.
        """
        query = db.query(Lead)

        if filters.campaign_id is not None:
            query = query.filter(Lead.campaign_id == filters.campaign_id)

        if filters.business_type:
            query = query.filter(Lead.business_type.ilike(f"%{filters.business_type}%"))

        if filters.country:
            query = query.filter(Lead.country.ilike(f"%{filters.country}%"))

        if filters.city:
            query = query.filter(Lead.city.ilike(f"%{filters.city}%"))

        if filters.area:
            query = query.filter(Lead.area.ilike(f"%{filters.area}%"))

        if filters.min_rating is not None and filters.min_rating > 0:
            query = query.filter(Lead.rating >= filters.min_rating)

        if filters.min_reviews is not None and filters.min_reviews > 0:
            query = query.filter(Lead.user_rating_count >= filters.min_reviews)

        if filters.has_website is not None:
            if filters.has_website:
                query = query.filter(Lead.website_uri.isnot(None), Lead.website_uri != "")
            else:
                query = query.filter(or_(Lead.website_uri.is_(None), Lead.website_uri == ""))

        if filters.has_phone is not None:
            if filters.has_phone:
                query = query.filter(or_(Lead.national_phone.isnot(None), Lead.international_phone.isnot(None)))
            else:
                query = query.filter(Lead.national_phone.is_(None), Lead.international_phone.is_(None))

        if filters.priority:
            query = query.join(Lead.score).filter(LeadScore.priority == filters.priority)

        if filters.outreach_status:
            query = query.join(Lead.outreach).filter(OutreachRecord.status == filters.outreach_status)

        if filters.search_term:
            term = f"%{filters.search_term}%"
            query = query.filter(or_(
                Lead.business_name.ilike(term),
                Lead.business_type.ilike(term),
                Lead.formatted_address.ilike(term),
                Lead.city.ilike(term)
            ))

        total_count = query.count()
        
        offset = (filters.page - 1) * filters.page_size
        leads = query.order_by(desc(Lead.created_at)).offset(offset).limit(filters.page_size).all()

        return leads, total_count

lead_service = LeadService()
