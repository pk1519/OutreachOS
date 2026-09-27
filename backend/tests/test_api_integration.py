from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_acceptance_searches_workflow():
    # TEST 1: Gyms in Bangalore with areas
    payload_1 = {
        "business_type": "Gyms",
        "location": "Bangalore",
        "country": "India",
        "areas": ["Koramangala", "Indiranagar", "HSR Layout"],
        "campaign_name": "Bangalore Gyms",
        "result_limit": 30
    }
    res_1 = client.post("/api/search", json=payload_1)
    assert res_1.status_code == 200
    data_1 = res_1.json()
    assert data_1["unique_leads"] > 0
    assert data_1["campaign_name"] == "Bangalore Gyms"
    assert "duplicates_removed" in data_1

    # TEST 2: Schools in Lucknow
    payload_2 = {
        "business_type": "Schools",
        "location": "Lucknow",
        "country": "India",
        "campaign_name": "Lucknow Schools",
        "result_limit": 20
    }
    res_2 = client.post("/api/search", json=payload_2)
    assert res_2.status_code == 200
    data_2 = res_2.json()
    assert data_2["unique_leads"] > 0
    assert data_2["campaign_name"] == "Lucknow Schools"

    # TEST 3: Restaurants in Dubai
    payload_3 = {
        "business_type": "Restaurants",
        "location": "Dubai",
        "country": "UAE",
        "campaign_name": "Dubai Restaurants",
        "result_limit": 20
    }
    res_3 = client.post("/api/search", json=payload_3)
    assert res_3.status_code == 200
    data_3 = res_3.json()
    assert data_3["unique_leads"] > 0
    assert data_3["campaign_name"] == "Dubai Restaurants"

    # CUSTOM TEST: Luxury wedding planners in Goa
    payload_custom = {
        "business_type": "Luxury wedding planners",
        "location": "Goa",
        "country": "India",
        "campaign_name": "Goa Luxury Planners",
        "result_limit": 15
    }
    res_custom = client.post("/api/search", json=payload_custom)
    assert res_custom.status_code == 200
    assert res_custom.json()["unique_leads"] > 0

def test_campaigns_list():
    res = client.get("/api/campaigns")
    assert res.status_code == 200
    camps = res.json()
    assert len(camps) >= 3

def test_leads_query_and_crm_update():
    res = client.get("/api/leads?page_size=10")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] > 0
    first_lead = data["leads"][0]
    lead_id = first_lead["id"]

    # Verify transparent Duo Lead Score
    assert first_lead["score"] is not None
    assert first_lead["score"]["total_score"] >= 0
    assert len(first_lead["score"]["reasons"]) > 0

    # Test CRM update
    patch_payload = {
        "outreach_status": "Interested",
        "priority": "HIGH",
        "notes": "Spoke with owner, requested enterprise demo."
    }
    patch_res = client.patch(f"/api/leads/{lead_id}/crm", json=patch_payload)
    assert patch_res.status_code == 200
    updated_lead = patch_res.json()
    assert updated_lead["outreach"]["status"] == "Interested"
    assert updated_lead["outreach"]["notes"] == "Spoke with owner, requested enterprise demo."

def test_sheets_export_with_deduplication():
    # First connect demo Google account
    conn_res = client.post("/api/sheets/connect-demo")
    assert conn_res.status_code == 200
    assert conn_res.json()["is_connected"] is True

    # Export leads
    export_payload = {
        "spreadsheet_id": "1_Test_Duo_Database",
        "worksheet_title": "Bangalore Gyms",
        "create_dashboard_tab": True
    }
    export_res = client.post("/api/sheets/export", json=export_payload)
    assert export_res.status_code == 200
    exp_data = export_res.json()
    assert exp_data["new_added"] > 0
    assert exp_data["dashboard_created"] is True

def test_dynamic_dashboard_analytics():
    dash_res = client.get("/api/analytics/dashboard")
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["has_enough_data"] is True
    assert dash_data["stats"]["unique_leads"] > 0
    assert len(dash_data["priority_distribution"]) > 0
    assert len(dash_data["outreach_distribution"]) > 0
