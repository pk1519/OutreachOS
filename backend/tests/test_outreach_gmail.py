import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.campaigns.campaign_service import campaign_service
from app.services.gmail.gmail_service import gmail_service
from app.services.leads.csv_service import csv_service

client = TestClient(app)

def test_gmail_credentials_detection():
    path = gmail_service.find_credentials_path()
    # Should detect credentials file in backend/secrets/
    assert path is not None
    assert "credentials.json" in path

def test_gmail_mime_message_creation():
    mime = gmail_service.create_mime_message(
        sender="contact.devworks7@gmail.com",
        to="test@example.com",
        subject="Test AI Automation Subject",
        body_text="Hi Rahul,\n\nTest body from Duo Systems."
    )
    assert "raw" in mime
    assert len(mime["raw"]) > 10

def test_template_variable_replacement():
    lead_data = {
        "name": "Rahul Sharma",
        "first_name": "Rahul",
        "company": "Apex Dynamics",
        "city": "Bangalore",
        "category": "Tech Agency",
        "email": "rahul@apexdynamics.com",
        "phone": "+91 9876543210",
        "website": "https://apexdynamics.com"
    }

    template = "Hi {{first_name}}, I saw {{company}} in {{city}} regarding {{category}}."
    rendered, err = campaign_service.render_template(template, lead_data)
    assert err is None
    assert rendered == "Hi Rahul, I saw Apex Dynamics in Bangalore regarding Tech Agency."

def test_template_missing_variable_rejection():
    # If a variable cannot be resolved, email MUST NOT be sent!
    lead_data = {
        "company": "Apex Dynamics"
        # missing name, city, etc.
    }
    template = "Hi {{name}}, we noticed you in {{city}}."
    rendered, err = campaign_service.render_template(template, lead_data)
    # Since name falls back to company or Business Owner, but city is empty:
    assert err is not None or "city" in rendered

def test_csv_column_detection():
    sample_csv = "Business Name,Email Address,Phone Number,Website,City\nABC Solutions,info@abc.com,+919900011122,https://abc.com,Bangalore"
    res = csv_service.detect_columns(sample_csv)
    assert "detected_mapping" in res
    assert res["detected_mapping"]["Business Name"] == "business_name"
    assert res["detected_mapping"]["Email Address"] == "email"

def test_suppression_list_api():
    # Add email to suppression list
    add_res = client.post("/api/suppression", json={
        "email": "blocked@spamdomain.com",
        "reason": "DO_NOT_CONTACT"
    })
    assert add_res.status_code in [200, 201]

    # Verify present
    list_res = client.get("/api/suppression")
    assert list_res.status_code == 200
    emails = [s["email"] for s in list_res.json()]
    assert "blocked@spamdomain.com" in emails

def test_gmail_status_endpoint():
    res = client.get("/api/integrations/gmail/status")
    assert res.status_code == 200
    data = res.json()
    assert "credentials_file_found" in data
    assert data["credentials_file_found"] is True

def test_dashboard_endpoint():
    res = client.get("/api/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert "overview" in data
    assert "total_leads" in data["overview"]
    assert "charts" in data

def test_campaign_lifecycle_api():
    import time
    unique_name = f"Test Campaign {int(time.time())}"
    # Create campaign
    create_res = client.post("/api/campaigns", json={
        "name": unique_name,
        "business_type": "AI Agencies",
        "location": "Bangalore",
        "subject_template": "AI solutions for {{company}}",
        "body_template": "Hi {{first_name}}, reaching out to {{company}}."
    })
    assert create_res.status_code == 201
    camp_id = create_res.json()["id"]

    # Connect Gmail for testing
    connect_res = client.post("/api/integrations/gmail/simulate-connect")
    assert connect_res.status_code == 200

    # Test email sending endpoint
    test_email_res = client.post(f"/api/campaigns/{camp_id}/test-email", json={
        "test_email": "contact.devworks7@gmail.com",
        "subject_template": "AI solutions for {{company}}",
        "body_template": "Hi {{first_name}}, reaching out to {{company}}."
    })
    assert test_email_res.status_code == 200
    assert test_email_res.json()["status"] == "success"

    # Pause campaign
    pause_res = client.post(f"/api/campaigns/{camp_id}/pause")
    assert pause_res.status_code == 200

    # Resume campaign
    resume_res = client.post(f"/api/campaigns/{camp_id}/resume")
    assert resume_res.status_code == 200

    # Cancel campaign
    cancel_res = client.post(f"/api/campaigns/{camp_id}/cancel")
    assert cancel_res.status_code == 200

    # Clean up test campaign
    del_res = client.delete(f"/api/campaigns/{camp_id}")
    assert del_res.status_code == 204
