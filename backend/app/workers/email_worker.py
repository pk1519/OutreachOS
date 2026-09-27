import asyncio
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.campaign import Campaign
from app.models.campaign_recipient import CampaignRecipient
from app.models.email_message import EmailMessage
from app.models.lead import Lead
from app.models.suppression import SuppressionList
from app.models.audit_log import AuditLog
from app.services.campaigns.campaign_service import campaign_service
from app.services.gmail.gmail_service import gmail_service

logger = logging.getLogger("duo_systems.email_worker")

class EmailQueueManager:
    def __init__(self):
        self._running_tasks: Dict[int, asyncio.Task] = {}
        self._pause_flags: Dict[int, bool] = {}
        self._cancel_flags: Dict[int, bool] = {}

    def is_campaign_active(self, campaign_id: int) -> bool:
        task = self._running_tasks.get(campaign_id)
        return task is not None and not task.done()

    async def start_campaign(self, campaign_id: int):
        """Starts asynchronous background worker for campaign sending."""
        if self.is_campaign_active(campaign_id):
            logger.warning(f"Campaign {campaign_id} is already running.")
            return

        self._pause_flags[campaign_id] = False
        self._cancel_flags[campaign_id] = False

        task = asyncio.create_task(self._process_campaign_queue(campaign_id))
        self._running_tasks[campaign_id] = task

    async def pause_campaign(self, campaign_id: int):
        """Pauses a running campaign."""
        self._pause_flags[campaign_id] = True
        with SessionLocal() as db:
            camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
            if camp:
                camp.status = "PAUSED"
                camp.updated_at = datetime.utcnow()
                db.add(AuditLog(
                    action="CAMPAIGN_PAUSED",
                    details=f"Paused campaign '{camp.name}'",
                    user_email=camp.sender_email
                ))
                db.commit()

    async def resume_campaign(self, campaign_id: int):
        """Resumes a paused campaign."""
        self._pause_flags[campaign_id] = False
        with SessionLocal() as db:
            camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
            if camp:
                camp.status = "RUNNING"
                camp.updated_at = datetime.utcnow()
                db.add(AuditLog(
                    action="CAMPAIGN_RESUMED",
                    details=f"Resumed campaign '{camp.name}'",
                    user_email=camp.sender_email
                ))
                db.commit()

        if not self.is_campaign_active(campaign_id):
            task = asyncio.create_task(self._process_campaign_queue(campaign_id))
            self._running_tasks[campaign_id] = task

    async def cancel_campaign(self, campaign_id: int):
        """Cancels a campaign and stops worker."""
        self._cancel_flags[campaign_id] = True
        with SessionLocal() as db:
            camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
            if camp:
                camp.status = "CANCELLED"
                camp.updated_at = datetime.utcnow()
                db.add(AuditLog(
                    action="CAMPAIGN_CANCELLED",
                    details=f"Cancelled campaign '{camp.name}'",
                    user_email=camp.sender_email
                ))
                db.commit()

        task = self._running_tasks.get(campaign_id)
        if task and not task.done():
            task.cancel()

    async def _process_campaign_queue(self, campaign_id: int):
        """Core queue loop with throttling, rate limiting, and failure handling."""
        logger.info(f"Starting email worker for Campaign {campaign_id}")
        
        with SessionLocal() as db:
            campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
            if not campaign:
                logger.error(f"Campaign {campaign_id} not found.")
                return

            campaign.status = "RUNNING"
            campaign.updated_at = datetime.utcnow()
            db.add(AuditLog(
                action="CAMPAIGN_STARTED",
                details=f"Started sending campaign '{campaign.name}' with rate {campaign.emails_per_minute}/min",
                user_email=campaign.sender_email
            ))
            db.commit()

            emails_per_min = campaign.emails_per_minute or 10
            delay_seconds = max(1.0, 60.0 / float(emails_per_min))
            sender_email = campaign.sender_email or "contact.devworks7@gmail.com"
            subject_tpl = campaign.subject_template or "Important update for {{company}}"
            body_tpl = campaign.body_template or "Hi {{name}},\n\nReaching out regarding AI solutions."

        while True:
            # Check cancel flag
            if self._cancel_flags.get(campaign_id, False):
                logger.info(f"Campaign {campaign_id} was cancelled.")
                break

            # Check pause flag
            if self._pause_flags.get(campaign_id, False):
                await asyncio.sleep(2.0)
                continue

            with SessionLocal() as db:
                # Fetch next pending recipient
                recipient = db.query(CampaignRecipient).filter(
                    CampaignRecipient.campaign_id == campaign_id,
                    CampaignRecipient.status == "PENDING"
                ).first()

                if not recipient:
                    # All recipients processed!
                    camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
                    if camp and camp.status == "RUNNING":
                        camp.status = "COMPLETED"
                        camp.updated_at = datetime.utcnow()
                        db.add(AuditLog(
                            action="CAMPAIGN_COMPLETED",
                            details=f"Completed campaign '{camp.name}'. Sent: {camp.sent_count}, Failed: {camp.failed_count}, Skipped: {camp.skipped_count}",
                            user_email=sender_email
                        ))
                        db.commit()
                    logger.info(f"Campaign {campaign_id} completed successfully.")
                    break

                # Mark PROCESSING
                recipient.status = "PROCESSING"
                db.commit()

                # Check suppression list
                is_suppressed = db.query(SuppressionList).filter(
                    SuppressionList.email == recipient.email.lower().strip()
                ).first()

                if is_suppressed:
                    recipient.status = "SKIPPED"
                    recipient.error_message = f"Suppressed: {is_suppressed.reason}"
                    camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
                    if camp:
                        camp.skipped_count += 1
                        camp.pending_count = max(0, camp.pending_count - 1)
                    db.commit()
                    continue

                # Prepare lead replacement tokens
                lead_data = {
                    "name": recipient.name or "Business Owner",
                    "first_name": (recipient.name or "Partner").split()[0],
                    "company": recipient.company or "Business",
                    "email": recipient.email,
                    "phone": "Not available",
                    "website": "Not available",
                    "city": "Bangalore",
                    "category": "Business"
                }

                if recipient.lead_id:
                    lead = db.query(Lead).filter(Lead.id == recipient.lead_id).first()
                    if lead:
                        contact_person = None
                        if lead.contacts and len(lead.contacts) > 0 and lead.contacts[0].name:
                            contact_person = lead.contacts[0].name
                        
                        person_name = contact_person or recipient.name or lead.business_name or "Business Owner"
                        first_name = (person_name or "Partner").split()[0]

                        lead_data.update({
                            "name": person_name,
                            "first_name": first_name,
                            "company": lead.business_name,
                            "business_name": lead.business_name,
                            "phone": lead.phone or lead.national_phone or "Not available",
                            "website": lead.website or lead.website_uri or "Not available",
                            "city": lead.city or "Bangalore",
                            "category": lead.category or lead.business_type or "Business"
                        })

                # Render subject & body
                rendered_sub, sub_err = campaign_service.render_template(subject_tpl, lead_data)
                rendered_body, body_err = campaign_service.render_template(body_tpl, lead_data)

                if sub_err or body_err:
                    recipient.status = "SKIPPED"
                    recipient.error_message = f"Validation Error: {sub_err or body_err}"
                    camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
                    if camp:
                        camp.skipped_count += 1
                        camp.pending_count = max(0, camp.pending_count - 1)
                    db.commit()
                    continue

                # Send with retry (exponential backoff)
                send_success = False
                gmail_msg_id = None
                error_msg = None

                for attempt in range(1, 4):
                    try:
                        result = gmail_service.send_email(
                            to_email=recipient.email,
                            subject=rendered_sub,
                            body=rendered_body,
                            db=db,
                            sender=sender_email
                        )
                        send_success = True
                        gmail_msg_id = result.get("id")
                        break
                    except Exception as exc:
                        error_msg = str(exc)
                        logger.warning(f"Attempt {attempt} failed sending to {recipient.email}: {error_msg}")
                        if attempt < 3:
                            await asyncio.sleep(2.0 ** attempt)

                camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
                if send_success:
                    recipient.status = "SENT"
                    recipient.sent_at = datetime.utcnow()
                    if camp:
                        camp.sent_count += 1
                        camp.pending_count = max(0, camp.pending_count - 1)

                    # Update lead status
                    if recipient.lead_id:
                        lead = db.query(Lead).filter(Lead.id == recipient.lead_id).first()
                        if lead and lead.lead_status in ["NEW", "QUALIFIED"]:
                            lead.lead_status = "CONTACTED"
                            lead.updated_at = datetime.utcnow()

                    # Record email message
                    msg = EmailMessage(
                        campaign_id=campaign_id,
                        recipient_id=recipient.id,
                        lead_id=recipient.lead_id,
                        sender_email=sender_email,
                        recipient_email=recipient.email,
                        subject=rendered_sub,
                        rendered_body=rendered_body,
                        status="SENT",
                        gmail_message_id=gmail_msg_id,
                        sent_at=datetime.utcnow()
                    )
                    db.add(msg)
                else:
                    recipient.status = "FAILED"
                    recipient.error_message = error_msg or "Failed to deliver email after retries"
                    if camp:
                        camp.failed_count += 1
                        camp.pending_count = max(0, camp.pending_count - 1)

                    msg = EmailMessage(
                        campaign_id=campaign_id,
                        recipient_id=recipient.id,
                        lead_id=recipient.lead_id,
                        sender_email=sender_email,
                        recipient_email=recipient.email,
                        subject=rendered_sub,
                        rendered_body=rendered_body,
                        status="FAILED",
                        failure_reason=error_msg or "Delivery failure",
                        sent_at=datetime.utcnow()
                    )
                    db.add(msg)

                db.commit()

            # Throttling rate limit delay
            await asyncio.sleep(delay_seconds)

        self._running_tasks.pop(campaign_id, None)

email_queue_manager = EmailQueueManager()
