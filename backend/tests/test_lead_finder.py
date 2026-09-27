import pytest
from app.services.scoring_service import scoring_service
from app.services.deduplication_service import deduplication_service

def test_deduplication_by_place_id():
    raw_places = [
        {"id": "place_1", "displayName": {"text": "Alpha Gym"}, "formattedAddress": "123 Main St"},
        {"id": "place_2", "displayName": {"text": "Beta Gym"}, "formattedAddress": "456 Side St"},
        {"id": "place_1", "displayName": {"text": "Alpha Gym Duplicate"}, "formattedAddress": "123 Main St"},
        {"id": "place_3", "displayName": {"text": "Gamma Gym"}, "formattedAddress": "789 Park Ave"},
    ]
    
    unique, raw_count, unique_count, duplicates = deduplication_service.deduplicate_places(raw_places)
    
    assert raw_count == 4
    assert unique_count == 3
    assert duplicates == 1
    assert [p["id"] for p in unique] == ["place_1", "place_2", "place_3"]

def test_lead_scoring_algorithm():
    lead_data = {
        "business_name": "Apex Schools Hub",
        "business_type": "Schools",
        "national_phone": "+91 98765 43210",
        "website_uri": "https://apexschools.edu",
        "user_rating_count": 150,
        "rating": 4.8,
        "business_status": "OPERATIONAL",
        "formatted_address": "Gomti Nagar, Lucknow, India"
    }
    
    score, priority, reasons = scoring_service.calculate_score(lead_data, "Schools")
    
    assert score >= 70
    assert priority == "HIGH"
    assert any("phone" in r.lower() for r in reasons)
    assert any("website" in r.lower() for r in reasons)
    assert any("rating" in r.lower() for r in reasons)
    assert any("schools" in r.lower() for r in reasons)

def test_lead_scoring_low_priority():
    lead_data = {
        "business_name": "Unverified Shop",
        "business_type": "Other",
        "national_phone": None,
        "website_uri": None,
        "user_rating_count": 0,
        "rating": 0.0,
        "business_status": "CLOSED_TEMPORARILY",
        "formatted_address": None
    }
    
    score, priority, reasons = scoring_service.calculate_score(lead_data, "Gyms")
    
    assert score < 40
    assert priority == "LOW"
