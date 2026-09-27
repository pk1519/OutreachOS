from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.campaign import Campaign
from app.models.lead import Lead
from app.schemas.campaign_schema import CampaignCreate, CampaignUpdate

class CampaignService:
    @staticmethod
    def get_all_campaigns(db: Session) -> List[dict]:
        campaigns = db.query(Campaign).order_by(Campaign.created_at.desc()).all()
        results = []
        for camp in campaigns:
            lead_count = db.query(func.count(Lead.id)).filter(Lead.campaign_id == camp.id).scalar() or 0
            results.append({
                "id": camp.id,
                "name": camp.name,
                "business_type": camp.business_type,
                "location": camp.location,
                "country": camp.country,
                "areas": camp.areas,
                "search_query": camp.search_query,
                "status": camp.status,
                "created_at": camp.created_at,
                "updated_at": camp.updated_at,
                "lead_count": lead_count
            })
        return results

    @staticmethod
    def get_campaign_by_id(db: Session, campaign_id: int) -> Optional[Campaign]:
        return db.query(Campaign).filter(Campaign.id == campaign_id).first()

    @staticmethod
    def get_campaign_by_name(db: Session, name: str) -> Optional[Campaign]:
        return db.query(Campaign).filter(Campaign.name.ilike(name)).first()

    @staticmethod
    def create_campaign(db: Session, data: CampaignCreate) -> Campaign:
        existing = CampaignService.get_campaign_by_name(db, data.name)
        if existing:
            return existing
        campaign = Campaign(
            name=data.name,
            business_type=data.business_type,
            location=data.location,
            country=data.country,
            areas=data.areas,
            search_query=data.search_query,
            status=data.status or "Active"
        )
        db.add(campaign)
        db.commit()
        db.refresh(campaign)
        return campaign

    @staticmethod
    def update_campaign(db: Session, campaign_id: int, data: CampaignUpdate) -> Optional[Campaign]:
        campaign = CampaignService.get_campaign_by_id(db, campaign_id)
        if not campaign:
            return None
        for key, val in data.dict(exclude_unset=True).items():
            setattr(campaign, key, val)
        db.commit()
        db.refresh(campaign)
        return campaign

    @staticmethod
    def delete_campaign(db: Session, campaign_id: int) -> bool:
        campaign = CampaignService.get_campaign_by_id(db, campaign_id)
        if not campaign:
            return False
        db.delete(campaign)
        db.commit()
        return True

campaign_service = CampaignService()
