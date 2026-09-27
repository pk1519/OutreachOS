import io
import csv
import re
import hashlib
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.lead import Lead
from app.models.lead_score import LeadScore
from app.models.outreach import OutreachRecord
from app.models.audit_log import AuditLog
from app.services.scoring_service import scoring_service

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

# Common column names mapping to system fields
COLUMN_NAME_MAPPINGS = {
    "business_name": ["company", "business", "business_name", "company_name", "firm", "title", "hostel_name", "pg_name", "hostel", "pg", "hotel", "organization", "agency", "establishment", "shop"],
    "contact_name": ["name", "contact_name", "full_name", "person_name", "owner", "manager", "contact_person", "contact", "lead_name", "client_name"],
    "email": ["email", "email_address", "work_email", "contact_email", "mail", "emails", "e_mail", "email_id", "mail_id", "emailaddress"],
    "phone": ["phone", "mobile", "telephone", "phone_number", "contact_number", "cell", "phone_no", "contact_no", "mobile_no"],
    "website": ["website", "site", "web", "url", "domain", "homepage", "link"],
    "city": ["city", "location", "town", "metro", "region", "district"],
    "category": ["category", "business_type", "type", "industry", "domain", "niche", "vertical"],
    "address": ["address", "formatted_address", "street", "full_address", "locality"],
    "country": ["country", "nation"]
}

class CsvService:
    @staticmethod
    def detect_columns(csv_content: str) -> Dict[str, Any]:
        """
        Parses CSV header and automatically proposes mapping to system fields.
        Returns detected headers, preview rows, and suggested mappings.
        """
        reader = csv.reader(io.StringIO(csv_content.strip()))
        rows = list(reader)
        if not rows:
            raise ValueError("The uploaded CSV file is empty.")

        raw_headers = [h.strip() for h in rows[0]]
        preview_rows = rows[1:6]

        detected_mapping = {}
        used_system_fields = set()

        for header in raw_headers:
            clean = header.lower().replace(" ", "_").replace("-", "_")
            matched_field = None
            for system_field, variations in COLUMN_NAME_MAPPINGS.items():
                if system_field not in used_system_fields:
                    if clean in variations or any(v in clean for v in variations):
                        matched_field = system_field
                        used_system_fields.add(system_field)
                        break
            detected_mapping[header] = matched_field or "ignore"

        return {
            "headers": raw_headers,
            "preview_rows": preview_rows,
            "detected_mapping": detected_mapping,
            "total_rows": len(rows) - 1,
            "available_system_fields": [
                {"field": "business_name", "label": "Business / Company Name", "required": True},
                {"field": "contact_name", "label": "Contact Person Name", "required": False},
                {"field": "email", "label": "Email Address", "required": False},
                {"field": "phone", "label": "Phone Number", "required": False},
                {"field": "website", "label": "Website URL", "required": False},
                {"field": "city", "label": "City / Location", "required": False},
                {"field": "category", "label": "Category / Business Type", "required": False},
                {"field": "address", "label": "Address", "required": False},
                {"field": "country", "label": "Country", "required": False},
                {"field": "ignore", "label": "Do Not Import", "required": False}
            ]
        }

    @staticmethod
    def import_leads(
        db: Session,
        csv_content: str,
        column_mapping: Dict[str, str],
        campaign_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Imports leads from CSV with provided column mappings.
        Enforces deduplication, email validation, lead scoring, and auditing.
        """
        reader = csv.DictReader(io.StringIO(csv_content.strip()))
        
        imported_leads = []
        duplicate_count = 0
        invalid_count = 0
        errors = []

        row_idx = 1
        for row in reader:
            row_idx += 1
            # Map columns
            lead_data = {
                "business_name": None,
                "contact_name": None,
                "email": None,
                "phone": None,
                "website": None,
                "city": None,
                "category": None,
                "address": None,
                "country": None
            }

            for csv_col, sys_field in column_mapping.items():
                if sys_field in lead_data and csv_col in row:
                    val = row[csv_col].strip() if row[csv_col] else None
                    if val:
                        lead_data[sys_field] = val

            b_name = lead_data.get("business_name") or lead_data.get("contact_name")
            if not b_name:
                invalid_count += 1
                errors.append(f"Row {row_idx}: Skipped due to missing business/company name.")
                continue

            email = lead_data.get("email")
            if email and not EMAIL_REGEX.match(email):
                errors.append(f"Row {row_idx}: Invalid email '{email}', imported without email.")
                lead_data["email"] = None

            # Generate deterministic place_id for deduplication
            hash_input = f"{b_name}_{lead_data.get('city', '')}_{lead_data.get('email', '')}"
            place_id = f"csv_{hashlib.sha256(hash_input.encode('utf-8')).hexdigest()[:24]}"

            # Check duplicate by place_id or exact business name + city
            existing = db.query(Lead).filter(Lead.place_id == place_id).first()
            if not existing and lead_data.get("email"):
                existing = db.query(Lead).filter(Lead.email == lead_data["email"]).first()

            if existing:
                duplicate_count += 1
                continue

            # Build lead
            lead = Lead(
                place_id=place_id,
                campaign_id=campaign_id,
                business_name=b_name,
                business_type=lead_data.get("category") or "Hostels and PG",
                category=lead_data.get("category") or "Hostels and PG",
                formatted_address=lead_data.get("address"),
                address=lead_data.get("address"),
                city=lead_data.get("city") or "Bangalore",
                country=lead_data.get("country") or "India",
                national_phone=lead_data.get("phone"),
                phone=lead_data.get("phone"),
                website_uri=lead_data.get("website"),
                website=lead_data.get("website"),
                email=lead_data.get("email"),
                rating=4.2,
                user_rating_count=10,
                business_status="OPERATIONAL",
                source="CSV Import",
                is_google_derived=False,
                lead_status="QUALIFIED" if lead_data.get("email") else "NEW"
            )
            db.add(lead)
            db.flush()

            # If contact_name provided, store in LeadContact
            c_name = lead_data.get("contact_name")
            if c_name:
                from app.models.lead_contact import LeadContact
                first_n = c_name.split()[0]
                contact = LeadContact(
                    lead_id=lead.id,
                    name=c_name,
                    first_name=first_n,
                    email=lead.email,
                    phone=lead.phone,
                    role="Owner / Manager",
                    is_primary=True
                )
                db.add(contact)

            # Score lead
            score_data = {
                "national_phone": lead.phone,
                "website_uri": lead.website,
                "email": lead.email,
                "user_rating_count": lead.user_rating_count,
                "rating": lead.rating,
                "business_status": lead.business_status,
                "business_type": lead.business_type,
                "formatted_address": lead.address
            }
            score_val, priority, reasons = scoring_service.calculate_score(score_data, lead.business_type)
            lead.lead_score = score_val

            lead_score = LeadScore(
                lead_id=lead.id,
                total_score=score_val,
                priority=priority,
                reasons=str(reasons)
            )
            db.add(lead_score)

            # CRM record
            outreach = OutreachRecord(
                lead_id=lead.id,
                status="Not Contacted",
                priority=priority
            )
            db.add(outreach)
            imported_leads.append(lead)

        db.commit()

        # Audit log
        db.add(AuditLog(
            action="LEAD_IMPORTED",
            details=f"Imported {len(imported_leads)} leads from CSV ({duplicate_count} duplicates skipped, {invalid_count} invalid).",
            user_email="contact.devworks7@gmail.com"
        ))
        db.commit()

        return {
            "imported_count": len(imported_leads),
            "duplicate_count": duplicate_count,
            "invalid_count": invalid_count,
            "errors": errors[:10]  # First 10 error notices
        }

    @staticmethod
    def export_leads_csv(
        db: Session,
        lead_ids: Optional[List[int]] = None,
        campaign_id: Optional[int] = None
    ) -> str:
        """Exports selected or campaign leads as CSV string."""
        query = db.query(Lead)
        if lead_ids:
            query = query.filter(Lead.id.in_(lead_ids))
        elif campaign_id:
            query = query.filter(Lead.campaign_id == campaign_id)

        leads = query.order_by(Lead.created_at.desc()).all()

        output = io.StringIO()
        writer = csv.writer(output)

        headers = [
            "Business Name",
            "Contact Name",
            "Category",
            "Address",
            "City",
            "Phone",
            "Website",
            "Email",
            "Rating",
            "Review Count",
            "Lead Score",
            "Status",
            "Place ID",
            "Source",
            "Campaign",
            "Created At"
        ]
        writer.writerow(headers)

        for l in leads:
            contact_name = l.contacts[0].name if (l.contacts and len(l.contacts) > 0) else ""
            campaign_name = l.campaign.name if l.campaign else ""
            writer.writerow([
                l.business_name,
                contact_name,
                l.category or l.business_type or "Business",
                l.formatted_address or l.address or "",
                l.city or "",
                l.phone or l.national_phone or "",
                l.website or l.website_uri or "",
                l.email or "Not available",
                l.rating or 0.0,
                l.user_rating_count or l.review_count or 0,
                l.lead_score or 0,
                l.lead_status or "NEW",
                l.place_id,
                l.source or "Google Places",
                campaign_name,
                l.created_at.strftime("%Y-%m-%d %H:%M") if l.created_at else ""
            ])

        # Record audit log
        db.add(AuditLog(
            action="LEAD_EXPORTED",
            details=f"Exported {len(leads)} leads to CSV.",
            user_email="contact.devworks7@gmail.com"
        ))
        db.commit()

        return output.getvalue()

csv_service = CsvService()
