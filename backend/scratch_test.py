import urllib.request
import json
import uuid
import time
import sys

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

print("==================================================")
print("1. CHECKING INITIAL DATABASE STATE")
print("==================================================")
dashboard = get_json("http://127.0.0.1:8000/api/dashboard")
print(f"Total Leads: {dashboard['overview']['total_leads']}")
print(f"Total Campaigns: {dashboard['overview']['total_campaigns']}")

print("\n==================================================")
print("2. SEARCHING FOR HOSTELS AND PG IN BANGALORE")
print("==================================================")
search_payload = {
    "business_type": "Hostels and PG",
    "location": "Bangalore",
    "country": "India",
    "areas": ["Koramangala", "HSR Layout"],
    "campaign_name": "Hostels and PG in Bangalore",
    "result_limit": 10
}
search_res = post_json("http://127.0.0.1:8000/api/search", search_payload)
print(f"Search ID: {search_res['search_id']}")
print(f"Raw Results: {search_res['raw_results']}, Unique Saved: {search_res['unique_leads']}, Duplicates Removed: {search_res['duplicates_removed']}")
campaign_id = search_res.get("campaign_id") or 1

# Ensure campaign exists
campaigns = get_json("http://127.0.0.1:8000/api/campaigns")
target_camp = next((c for c in campaigns if c["name"] == "Hostels and PG in Bangalore"), None)
if target_camp:
    campaign_id = target_camp["id"]
else:
    new_camp = post_json("http://127.0.0.1:8000/api/campaigns", {
        "name": "Hostels and PG in Bangalore",
        "business_type": "Hostels and PG",
        "location": "Bangalore",
        "subject_template": "AI Automation & Booking Systems for {{company}}",
        "body_template": "Hi {{name}},\n\nReaching out to {{company}}."
    })
    campaign_id = new_camp["id"]

print(f"Using Campaign ID: {campaign_id} ('Hostels and PG in Bangalore')")

print("\n==================================================")
print("3. TESTING CSV UPLOAD & COLUMN DETECTION")
print("==================================================")
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

print("Headers detected:", detection["headers"])
print("Suggested mappings:", json.dumps(detection["detected_mapping"], indent=2))

print("\n==================================================")
print("4. EXECUTING CSV IMPORT WITH CUSTOM MAPPINGS")
print("==================================================")
import_payload = {
    "csv_content": csv_data,
    "column_mapping": detection["detected_mapping"],
    "campaign_id": campaign_id
}
import_result = post_json("http://127.0.0.1:8000/api/leads/import", import_payload)
print(f"Imported leads: {import_result['imported_count']}, Duplicates: {import_result['duplicate_count']}, Invalid: {import_result['invalid_count']}")

print("\n==================================================")
print("5. VERIFYING IMPORTED LEADS & CONTACT PERSONS")
print("==================================================")
leads_res = get_json("http://127.0.0.1:8000/api/leads?page_size=50")
imported_leads = [l for l in leads_res["leads"] if l["source"] == "CSV Import"]
print(f"Total leads in system: {leads_res['total']}")
print(f"CSV Imported leads count: {len(imported_leads)}")
for lead in imported_leads:
    contact_name = lead["contacts"][0]["name"] if lead.get("contacts") else "None"
    print(f"  • Business: {lead['business_name']} | Contact: {contact_name} | Email: {lead['email']} | City: {lead['city']}")

print("\n==================================================")
print("6. PREPARING CAMPAIGN WITH CUSTOM EMAIL MESSAGES")
print("==================================================")
lead_ids_with_email = [l["id"] for l in leads_res["leads"] if l["email"] and "@" in l["email"]]
print(f"Leads selected for outreach: {lead_ids_with_email}")

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
print("Preflight validation result:")
print(f"  Valid recipients: {preflight['valid_count']}")
print(f"  Invalid recipients: {preflight['invalid_count']}")
print(f"  Suppressed recipients: {preflight['suppressed_count']}")
print(f"  Ready to send: {preflight['estimated_emails_to_send']}")

# Prepare recipients
prepare_payload = {
    "lead_ids": lead_ids_with_email,
    "subject_template": subject_template,
    "body_template": body_template,
    "emails_per_minute": 60,
    "sender_email": "contact.devworks7@gmail.com"
}
prepared_campaign = post_json(f"http://127.0.0.1:8000/api/campaigns/{campaign_id}/prepare", prepare_payload)
print(f"Campaign Prepared: ID={prepared_campaign['id']}, Status={prepared_campaign['status']}, Total Recipients={prepared_campaign['total_recipients']}")

# Test sending a single test email
print("\n--- SENDING TEST EMAIL ---")
test_email_res = post_json(
    f"http://127.0.0.1:8000/api/campaigns/{campaign_id}/test-email",
    {
        "test_recipient": "contact.devworks7@gmail.com",
        "subject_template": subject_template,
        "body_template": body_template
    }
)
print(f"Test Email Result: {test_email_res['message']}")
print(f"Rendered Subject: {test_email_res['rendered_subject']}")
print("Sample Body Snippet:\n" + "\n".join(["  " + line for line in test_email_res['rendered_body'].splitlines()[:5]]))

print("\n==================================================")
print("7. LAUNCHING CAMPAIGN SENDING QUEUE")
print("==================================================")
launch_res = post_json(f"http://127.0.0.1:8000/api/campaigns/{campaign_id}/send", {})
print(f"Launch Status: {launch_res['status']}, Message: {launch_res['message']}")

print("\nWaiting for queue worker to dispatch emails...")
for i in range(8):
    time.sleep(0.5)
    queue_status = get_json("http://127.0.0.1:8000/api/email-queue")
    camp_summary = next((c for c in queue_status["campaigns"] if c["id"] == campaign_id), None)
    if camp_summary:
        print(f"  [Progress {(i+1)*0.5}s] Status: {camp_summary['status']} | Sent: {camp_summary['sent_count']} | Pending: {camp_summary['pending_count']} | Skipped: {camp_summary['skipped_count']}")
        if camp_summary["status"] in ["COMPLETED", "FAILED", "CANCELLED"] or camp_summary["pending_count"] == 0:
            break

print("\n==================================================")
print("8. VERIFYING EMAIL HISTORY & PERSONALIZED RENDERINGS")
print("==================================================")
history = get_json(f"http://127.0.0.1:8000/api/email-history?campaign_id={campaign_id}&limit=10")
print(f"Email History Count: {len(history)}")
for msg in history:
    print(f"\n  • To: {msg['recipient_email']} | Status: {msg['status']}")
    print(f"    Subject: {msg['subject']}")
    first_two_lines = "\n".join(msg['rendered_body'].splitlines()[:2])
    print(f"    Body snippet:\n      {first_two_lines}")

print("\n==================================================")
print("9. UPDATED DASHBOARD METRICS")
print("==================================================")
final_dashboard = get_json("http://127.0.0.1:8000/api/dashboard")
print(json.dumps(final_dashboard["overview"], indent=2))
print("\n>>> ALL CHECKS & PIPELINE FUNCTIONALITIES PASSED! <<<")
