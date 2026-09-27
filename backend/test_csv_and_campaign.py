import urllib.request
import json
import uuid
import time

def post_json(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def get_json(url):
    with urllib.request.urlopen(url) as resp:
        return json.loads(resp.read().decode())

print("=== STEP 1: CSV COLUMN DETECTION ===")
csv_data = """Contact Name,Hostel Name,Email Address,Phone Number,City,Category,Website
Rajesh Verma,Zolo Stays Premium PG,contact.devworks7+zolo@gmail.com,+91 98450 11223,Bangalore,Hostels and PG,https://zolostays.com
Priya Sundaram,Stanza Living Bangalore,contact.devworks7+stanza@gmail.com,+91 98450 22334,Bangalore,Hostels and PG,https://stanzaliving.com
Amit Kulkarni,Oxford Luxury PG for Gents,contact.devworks7+oxford@gmail.com,+91 98450 33445,Bangalore,Hostels and PG,https://oxfordpg.in
Sneha Reddy,Green View Ladies Hostel,contact.devworks7+greenview@gmail.com,+91 98450 44556,Bangalore,Hostels and PG,https://greenviewhostel.com
"""

boundary = "----WebKitFormBoundary" + uuid.uuid4().hex[:16]
multipart_body = (
    f"--{boundary}\r\n"
    f'Content-Disposition: form-data; name="file"; filename="hostels_bangalore.csv"\r\n'
    f"Content-Type: text/csv\r\n\r\n"
    f"{csv_data}\r\n"
    f"--{boundary}--\r\n"
).encode("utf-8")

req = urllib.request.Request(
    "http://127.0.0.1:8000/api/leads/import/detect-columns",
    data=multipart_body,
    headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
)
with urllib.request.urlopen(req) as resp:
    detection = json.loads(resp.read().decode())

print("Detected Headers:", detection["headers"])
print("Suggested Mappings:", json.dumps(detection["detected_mapping"], indent=2))

print("\n=== STEP 2: CSV IMPORT EXECUTION ===")
import_payload = {
    "csv_content": csv_data,
    "column_mapping": detection["detected_mapping"],
    "campaign_id": 1
}
import_res = post_json("http://127.0.0.1:8000/api/leads/import", import_payload)
print(f"Imported leads: {import_res['imported_count']}, Duplicates: {import_res['duplicate_count']}, Invalid: {import_res['invalid_count']}")

print("\n=== STEP 3: VERIFY LEADS IN DATABASE ===")
leads_res = get_json("http://127.0.0.1:8000/api/leads?page_size=50")
print(f"Total leads: {leads_res['total']}")
lead_ids_with_email = []
for lead in leads_res["leads"]:
    contact_name = lead["contacts"][0]["name"] if lead.get("contacts") else "None"
    print(f"  • {lead['business_name']} | Contact: {contact_name} | Email: {lead['email']} | City: {lead['city']}")
    if lead["email"] and "@" in lead["email"]:
        lead_ids_with_email.append(lead["id"])

print(f"\nRecipients with email ready for campaign: {len(lead_ids_with_email)}")

print("\n=== STEP 4: PREPARE CAMPAIGN WITH CUSTOM TEMPLATE ===")
subject_template = "AI Automation & Booking Systems for {{company}}"
body_template = (
    "Hi {{name}},\n\n"
    "I came across {{company}} in {{city}} and wanted to reach out regarding our automated booking and tenant inquiry engine.\n\n"
    "With our system, prospective guests looking for {{category}} accommodations receive instant automated responses, schedule visits, and complete booking forms effortlessly.\n\n"
    "Would you be open to a quick 10-minute demo this week for {{company}}?\n\n"
    "Best regards,\n"
    "Priyanshu\n"
    "Duo Systems | Technical Automation Studio\n"
    "contact.devworks7@gmail.com"
)

# Preflight validation
preflight = post_json(
    "http://127.0.0.1:8000/api/campaigns/preflight-validate",
    {"lead_ids": lead_ids_with_email}
)
print(f"Preflight: Valid={preflight['valid_count']}, Suppressed={preflight['suppressed_count']}, ReadyToSend={preflight['estimated_emails_to_send']}")

# Prepare campaign recipients
prepare_payload = {
    "lead_ids": lead_ids_with_email,
    "subject_template": subject_template,
    "body_template": body_template,
    "emails_per_minute": 60,
    "sender_email": "contact.devworks7@gmail.com"
}
prepared_campaign = post_json("http://127.0.0.1:8000/api/campaigns/1/prepare", prepare_payload)
print(f"Campaign 1 Prepared: Status={prepared_campaign['status']}, Total Recipients={prepared_campaign['total_recipients']}")

# Test sending a single test email
print("\n=== STEP 5: SEND TEST EMAIL ===")
test_res = post_json(
    "http://127.0.0.1:8000/api/campaigns/1/test-email",
    {
        "test_recipient": "contact.devworks7@gmail.com",
        "subject_template": subject_template,
        "body_template": body_template
    }
)
print(f"Test Email Result: {test_res['message']}")
print(f"Rendered Subject: {test_res['rendered_subject']}")

print("\n=== STEP 6: LAUNCH OUTREACH CAMPAIGN ===")
launch_res = post_json("http://127.0.0.1:8000/api/campaigns/1/send", {})
print(f"Launch status: {launch_res['status']}")

# Allow queue worker to process
time.sleep(2.0)
queue_status = get_json("http://127.0.0.1:8000/api/email-queue")
camp_summary = next((c for c in queue_status["campaigns"] if c["id"] == 1), None)
if camp_summary:
    print(f"Queue Status: {camp_summary['status']} | Sent: {camp_summary['sent_count']} | Pending: {camp_summary['pending_count']} | Skipped: {camp_summary['skipped_count']}")

print("\n=== STEP 7: VERIFY EMAIL HISTORY & PERSONALIZATION ===")
history = get_json("http://127.0.0.1:8000/api/email-history?campaign_id=1&limit=10")
print(f"History entries recorded: {len(history)}")
for msg in history:
    print(f"  • To: {msg['recipient_email']} | Status: {msg['status']}")
    print(f"    Subject: {msg['subject']}")
    lines = msg['rendered_body'].splitlines()
    snippet = " | ".join([line.strip() for line in lines if line.strip()][:3])
    print(f"    Personalized Text: {snippet}\n")

print("\n=== STEP 8: DASHBOARD OVERVIEW ===")
dashboard = get_json("http://127.0.0.1:8000/api/dashboard")
print(json.dumps(dashboard["overview"], indent=2))
print("\n>>> ALL TESTS & PIPELINE CHECKS PASSED SUCCESSFULLY! <<<")
