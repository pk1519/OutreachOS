import re
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session

from app.models.campaign import Campaign
from app.models.campaign_recipient import CampaignRecipient
from app.models.email_message import EmailMessage
from app.models.lead import Lead
from app.models.suppression import SuppressionList
from app.models.audit_log import AuditLog
from app.services.gmail.gmail_service import gmail_service

logger = logging.getLogger("duo_systems.campaigns")

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
SUPPORTED_VARIABLES = [
    "name",
    "first_name",
    "company",
    "email",
    "phone",
    "website",
    "city",
    "category"
]

class CampaignService:
    @staticmethod
    def render_template(template: str, lead_data: Dict[str, Any]) -> Tuple[str, Optional[str]]:
        """
        Replaces {{variable}} placeholders with lead data.
        If any placeholder is unresolvable or empty, returns (rendered_text, error_message).
        Strict compliance: DO NOT send email if any placeholder cannot be resolved!
        """
        if not template:
            return "", "Template is empty"

        missing_vars = []
        
        def replace_match(match):
            var_name = match.group(1).strip()
            val = lead_data.get(var_name)
            
            # Special fallbacks from alternative field names
            if not val:
                if var_name == "company":
                    val = lead_data.get("business_name")
                elif var_name == "category":
                    val = lead_data.get("business_type") or lead_data.get("primary_type")
                elif var_name == "phone":
                    val = lead_data.get("national_phone") or lead_data.get("international_phone")
                elif var_name == "website":
                    val = lead_data.get("website_uri")
                elif var_name == "name":
                    val = lead_data.get("business_name") or "Business Owner"
                elif var_name == "first_name":
                    full = lead_data.get("name") or lead_data.get("business_name") or ""
                    val = full.split()[0] if full else "Partner"

            if val is None or str(val).strip() == "":
                missing_vars.append(var_name)
                return match.group(0)
            
            return str(val).strip()

        rendered = re.sub(r"\{\{\s*(\w+)\s*\}\}", replace_match, template)
        
        if missing_vars:
            unique_missing = list(set(missing_vars))
            return rendered, f"Cannot resolve placeholder(s): {', '.join(['{{' + v + '}}' for v in unique_missing])}"

        return rendered, None

    @staticmethod
    def validate_recipients(
        db: Session,
        lead_ids: List[int]
    ) -> Dict[str, Any]:
        """
        Pre-flight validation for campaign launch.
        Checks:
        - valid email format
        - missing email
        - duplicate emails
        - suppression list presence
        - already contacted status
        """
        leads = db.query(Lead).filter(Lead.id.in_(lead_ids)).all()
        
        # Load suppression list
        suppressed_emails = {
            s.email.lower().strip()
            for s in db.query(SuppressionList.email).all()
        }

        seen_emails = set()
        valid_recipients = []
        invalid_recipients = []
        suppressed_recipients = []
        duplicate_recipients = []
        already_contacted = []

        for lead in leads:
            email = (lead.email or "").strip().lower()
            lead_info = {
                "id": lead.id,
                "business_name": lead.business_name,
                "email": email or "Not available",
                "phone": lead.phone or lead.national_phone or "Not available",
                "city": lead.city or "Bangalore",
                "category": lead.category or lead.business_type or "Business"
            }

            if not email or email == "not available":
                invalid_recipients.append({**lead_info, "reason": "Missing email address"})
                continue

            if not EMAIL_REGEX.match(email):
                invalid_recipients.append({**lead_info, "reason": "Invalid email format"})
                continue

            if email in suppressed_emails:
                suppressed_recipients.append({**lead_info, "reason": "Email is on Suppression List"})
                continue

            if email in seen_emails:
                duplicate_recipients.append({**lead_info, "reason": "Duplicate recipient email in list"})
                continue

            seen_emails.add(email)

            if lead.lead_status in ["CONTACTED", "REPLIED", "CONVERTED"]:
                already_contacted.append(lead_info)

            valid_recipients.append(lead_info)

        new_recipients_count = len(valid_recipients)

        return {
            "total_selected": len(leads),
            "valid_count": len(valid_recipients),
            "invalid_count": len(invalid_recipients),
            "suppressed_count": len(suppressed_recipients),
            "duplicate_count": len(duplicate_recipients),
            "already_contacted_count": len(already_contacted),
            "estimated_emails_to_send": new_recipients_count,
            "sender_email": "contact.devworks7@gmail.com",
            "valid_recipients": valid_recipients,
            "invalid_recipients": invalid_recipients,
            "suppressed_recipients": suppressed_recipients
        }

    @staticmethod
    def send_test_email(
        db: Session,
        test_recipient: str,
        subject_template: str,
        body_template: str,
        sample_lead_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Sends a single test email strictly to the verified test recipient
        (default: contact.devworks7@gmail.com). Never sends to lead list!
        """
        target_email = test_recipient.strip() or "contact.devworks7@gmail.com"
        
        sample_data = {
            "name": "Priyanshu",
            "first_name": "Priyanshu",
            "company": "Duo Systems Automation",
            "email": target_email,
            "phone": "+91 98765 43210",
            "website": "https://duosystems.ai",
            "city": "Bangalore",
            "category": "AI Automation Studio"
        }

        if sample_lead_id:
            lead = db.query(Lead).filter(Lead.id == sample_lead_id).first()
            if lead:
                sample_data.update({
                    "name": lead.business_name,
                    "first_name": (lead.business_name or "").split()[0],
                    "company": lead.business_name,
                    "phone": lead.phone or lead.national_phone or sample_data["phone"],
                    "website": lead.website or lead.website_uri or sample_data["website"],
                    "city": lead.city or sample_data["city"],
                    "category": lead.category or lead.business_type or sample_data["category"]
                })

        rendered_subject, sub_err = CampaignService.render_template(subject_template, sample_data)
        if sub_err:
            raise ValueError(f"Subject Error: {sub_err}")

        rendered_body, body_err = CampaignService.render_template(body_template, sample_data)
        if body_err:
            raise ValueError(f"Body Error: {body_err}")

        # Send via Gmail API
        result = gmail_service.send_email(
            to_email=target_email,
            subject=f"[TEST] {rendered_subject}",
            body=rendered_body,
            db=db,
            sender="contact.devworks7@gmail.com"
        )

        return {
            "status": "success",
            "message": f"Test email sent successfully to {target_email}",
            "rendered_subject": f"[TEST] {rendered_subject}",
            "rendered_body": rendered_body,
            "gmail_message_id": result.get("id"),
            "sent_at": result.get("sent_at")
        }

    @staticmethod
    def prepare_campaign(
        db: Session,
        campaign_id: int,
        lead_ids: List[int],
        subject_template: str,
        body_template: str,
        emails_per_minute: int = 10,
        sender_email: str = "contact.devworks7@gmail.com"
    ) -> Campaign:
        """Initializes campaign recipients in database with PENDING status."""
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if not campaign:
            raise ValueError(f"Campaign {campaign_id} not found.")

        campaign.subject_template = subject_template
        campaign.body_template = body_template
        campaign.sender_email = sender_email
        campaign.emails_per_minute = max(1, min(emails_per_minute, 60))
        campaign.status = "READY"

        # Load suppression list
        suppressed_emails = {
            s.email.lower().strip()
            for s in db.query(SuppressionList.email).all()
        }

        # Clear any prior recipients if recreating
        db.query(CampaignRecipient).filter(CampaignRecipient.campaign_id == campaign.id).delete()

        leads = db.query(Lead).filter(Lead.id.in_(lead_ids)).all()
        created_recipients = []
        pending_count = 0
        skipped_count = 0

        for lead in leads:
            email = (lead.email or "").strip().lower()
            is_valid = bool(email and email != "not available" and EMAIL_REGEX.match(email))
            is_suppressed = email in suppressed_emails

            status = "PENDING"
            error_reason = None
            if not is_valid:
                status = "SKIPPED"
                error_reason = "Missing or invalid email address"
                skipped_count += 1
            elif is_suppressed:
                status = "SKIPPED"
                error_reason = "Email is on Suppression List"
                skipped_count += 1
            else:
                pending_count += 1

            contact_person = None
            if lead.contacts and len(lead.contacts) > 0 and lead.contacts[0].name:
                contact_person = lead.contacts[0].name

            recipient = CampaignRecipient(
                campaign_id=campaign.id,
                lead_id=lead.id,
                email=email if is_valid else (lead.email or "invalid@missing"),
                name=contact_person or lead.business_name,
                company=lead.business_name,
                status=status,
                error_message=error_reason
            )
            created_recipients.append(recipient)

        db.add_all(created_recipients)
        campaign.total_recipients = len(created_recipients)
        campaign.pending_count = pending_count
        campaign.skipped_count = skipped_count
        campaign.sent_count = 0
        campaign.failed_count = 0

        audit = AuditLog(
            action="CAMPAIGN_PREPARED",
            details=f"Prepared campaign '{campaign.name}' with {len(created_recipients)} recipients ({pending_count} pending, {skipped_count} skipped).",
            user_email=sender_email
        )
        db.add(audit)
        db.commit()
        db.refresh(campaign)
        return campaign

campaign_service = CampaignService()
