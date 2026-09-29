from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.models.campaign import Campaign
from app.models.lead import Lead
from app.models.lead_score import LeadScore
from app.models.outreach import OutreachRecord
from app.models.lead_note import LeadNote, LeadTag
from app.models.lead_contact import LeadContact
from app.models.campaign_recipient import CampaignRecipient
from app.models.email_message import EmailMessage
from app.models.search import SearchHistory
from app.models.google_connection import SheetDestination
from app.models.audit_log import AuditLog
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
        """
        Completely purges the campaign and all its associated data from the database:
        - All leads attached directly, through searches, or as campaign recipients
        - All lead scores, outreach records, notes, tags, and contacts
        - All campaign recipients and email messages
        - All Google Sheet destinations linked to this campaign
        - All search history records associated with this campaign
        - The campaign record itself
        """
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if not campaign:
            return False

        try:
            # 1. Identify all search IDs directly associated with this campaign
            search_ids = [
                row[0] for row in db.query(SearchHistory.id)
                .filter(SearchHistory.campaign_id == campaign_id)
                .all()
            ]

            # 2. Identify all lead IDs associated with this campaign:
            lead_ids_set = set()

            for row in db.query(Lead.id).filter(Lead.campaign_id == campaign_id).all():
                lead_ids_set.add(row[0])

            if search_ids:
                for row in db.query(Lead.id).filter(Lead.search_id.in_(search_ids)).all():
                    lead_ids_set.add(row[0])

            for row in db.query(CampaignRecipient.lead_id).filter(
                CampaignRecipient.campaign_id == campaign_id,
                CampaignRecipient.lead_id.isnot(None)
            ).all():
                lead_ids_set.add(row[0])

            for row in db.query(EmailMessage.lead_id).filter(
                EmailMessage.campaign_id == campaign_id,
                EmailMessage.lead_id.isnot(None)
            ).all():
                lead_ids_set.add(row[0])

            lead_ids = list(lead_ids_set)

            def _chunked_delete(model_cls, column, id_list, chunk_size=400):
                for i in range(0, len(id_list), chunk_size):
                    chunk = id_list[i : i + chunk_size]
                    db.query(model_cls).filter(column.in_(chunk)).delete(synchronize_session=False)

            # 3. Clean up EmailMessage records FIRST (foreign keys point to CampaignRecipient, Lead, Campaign)
            db.query(EmailMessage).filter(EmailMessage.campaign_id == campaign_id).delete(synchronize_session=False)
            if lead_ids:
                _chunked_delete(EmailMessage, EmailMessage.lead_id, lead_ids)

            # 4. Clean up CampaignRecipient records
            db.query(CampaignRecipient).filter(CampaignRecipient.campaign_id == campaign_id).delete(synchronize_session=False)
            if lead_ids:
                _chunked_delete(CampaignRecipient, CampaignRecipient.lead_id, lead_ids)

            # 5. Clean up child records for leads
            if lead_ids:
                _chunked_delete(LeadNote, LeadNote.lead_id, lead_ids)
                _chunked_delete(LeadTag, LeadTag.lead_id, lead_ids)
                _chunked_delete(LeadContact, LeadContact.lead_id, lead_ids)
                _chunked_delete(LeadScore, LeadScore.lead_id, lead_ids)
                _chunked_delete(OutreachRecord, OutreachRecord.lead_id, lead_ids)

                # 6. Delete the leads themselves
                _chunked_delete(Lead, Lead.id, lead_ids)

            # 7. Clean up SheetDestinations tied to this campaign
            db.query(SheetDestination).filter(SheetDestination.campaign_id == campaign_id).delete(synchronize_session=False)

            # 8. Clean up SearchHistory records tied to this campaign
            if search_ids:
                _chunked_delete(SearchHistory, SearchHistory.id, search_ids)
            db.query(SearchHistory).filter(SearchHistory.campaign_id == campaign_id).delete(synchronize_session=False)

            # 9. Delete the campaign itself
            campaign_name = campaign.name
            sender_email = campaign.sender_email
            db.delete(campaign)

            db.add(AuditLog(
                action="CAMPAIGN_DELETED",
                details=f"Permanently deleted campaign '{campaign_name}' (ID: {campaign_id}) and all associated leads ({len(lead_ids)}), searches ({len(search_ids)}), recipients, and email messages from the database.",
                user_email=sender_email or "contact.devworks7@gmail.com"
            ))

            db.commit()
            return True
        except Exception:
            db.rollback()
            raise

campaign_service = CampaignService()
