import httpx
import logging
import hashlib
import random
from typing import List, Dict, Any, Optional
from app.config import settings

logger = logging.getLogger("duo_systems.places")

GOOGLE_PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"

# Strict production FieldMask according to Google Places API (New) guidelines
REQUIRED_FIELD_MASK = (
    "places.id,"
    "places.displayName,"
    "places.formattedAddress,"
    "places.nationalPhoneNumber,"
    "places.internationalPhoneNumber,"
    "places.websiteUri,"
    "places.rating,"
    "places.userRatingCount,"
    "places.businessStatus,"
    "places.googleMapsUri,"
    "places.primaryType,"
    "places.types,"
    "places.location,"
    "places.addressComponents"
)

class PlacesService:
    @property
    def api_key(self) -> str:
        return settings.GOOGLE_PLACES_API_KEY

    async def search_places(
        self,
        query: str,
        page_size: int = 20,
        page_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes Google Places API (New) Text Search.
        Strictly follows official specifications:
        - POST to https://places.googleapis.com/v1/places:searchText
        - Headers: X-Goog-Api-Key, X-Goog-FieldMask
        - Body: textQuery, pageSize, pageToken
        """
        # If API key is available, call the official Google Places API (New)
        if self.api_key and self.api_key.strip() and not self.api_key.startswith("your_"):
            return await self._call_google_places_api(query, page_size, page_token)
        
        # If no API key configured, use high-fidelity realistic dynamic generation
        if settings.ENABLE_DEMO_SIMULATION:
            logger.info("No live Google Places API key provided. Using dynamic demo simulation.")
            return self._simulate_places_response(query, page_size)
        
        raise ValueError(
            "Google Places API Key is not configured. Please provide a valid GOOGLE_PLACES_API_KEY in Settings or .env"
        )

    async def _call_google_places_api(
        self,
        query: str,
        page_size: int = 20,
        page_token: Optional[str] = None
    ) -> Dict[str, Any]:
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": self.api_key,
            "X-Goog-FieldMask": REQUIRED_FIELD_MASK
        }
        
        payload: Dict[str, Any] = {
            "textQuery": query,
            "pageSize": min(page_size, 20)  # Max allowed pageSize per call in Places API (New) is 20
        }
        if page_token:
            payload["pageToken"] = page_token

        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.post(
                    GOOGLE_PLACES_SEARCH_URL,
                    headers=headers,
                    json=payload
                )
                
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 400:
                    error_detail = response.json().get("error", {}).get("message", "Invalid request parameters")
                    raise ValueError(f"Google Places API 400 Error: {error_detail}")
                elif response.status_code == 403:
                    error_detail = response.json().get("error", {}).get("message", "Forbidden")
                    raise PermissionError(
                        f"Google Places API Key Error: {error_detail}. Ensure Places API (New) is enabled and Billing is active on your Google Cloud Project."
                    )
                elif response.status_code == 429:
                    raise RuntimeError("Google Places API Quota Exceeded / Rate Limit Reached.")
                else:
                    raise RuntimeError(f"Google Places API returned status {response.status_code}: {response.text}")
                    
            except httpx.RequestError as e:
                logger.error(f"Network error contacting Google Places API: {str(e)}")
                raise ConnectionError(f"Network error contacting Google Places API: {str(e)}")

    def _simulate_places_response(self, query: str, count: int = 20) -> Dict[str, Any]:
        """
        Dynamically generates realistic, consistent Places API (New) response structures
        for ANY query, business domain, and location without hardcoded records.
        """
        places = []
        seed = int(hashlib.md5(query.encode("utf-8")).hexdigest(), 16)
        rng = random.Random(seed)

        # Parse query tokens
        parts = [p.strip() for p in query.replace(" in ", ",").replace(" near ", ",").split(",") if p.strip()]
        domain = parts[0] if parts else "Business"
        location = parts[1] if len(parts) > 1 else (parts[0] if len(parts) == 1 else "Central")

        prefixes = ["Apex", "Prime", "Elite", "Urban", "Vanguard", "Nexus", "Summit", "Sterling", "Horizon", "Pinnacle", "Metro", "Royal", "Global", "Nova", "Starlight"]
        descriptors = ["Center", "Hub", "Group", "Solutions", "Studios", "Associates", "Plaza", "HQ", "Enterprises", "World", "Club"]

        num_results = rng.randint(min(12, count), max(15, count))
        
        for i in range(num_results):
            p_prefix = rng.choice(prefixes)
            p_desc = rng.choice(descriptors)
            b_name = f"{p_prefix} {domain.title()} {p_desc}"
            
            # Deterministic unique Place ID
            place_hash = hashlib.sha256(f"{b_name}_{location}_{i}".encode("utf-8")).hexdigest()[:24]
            place_id = f"ChIJ_{place_hash}"
            
            rating = round(rng.uniform(3.8, 5.0), 1)
            reviews = rng.choice([15, 34, 68, 120, 245, 410, 680, 1150])
            has_website = rng.random() > 0.15
            has_phone = rng.random() > 0.10
            
            clean_name_slug = "".join(c for c in b_name.lower() if c.isalnum())
            website = f"https://www.{clean_name_slug}.com" if has_website else None
            
            # Country-aware phone formatting
            if "dubai" in location.lower() or "uae" in location.lower():
                phone = f"+971 {rng.randint(4, 50)} {rng.randint(100, 999)} {rng.randint(1000, 9999)}"
            elif "uk" in location.lower() or "london" in location.lower():
                phone = f"+44 20 {rng.randint(7000, 7999)} {rng.randint(1000, 9999)}"
            elif "usa" in location.lower() or "san francisco" in location.lower() or "new york" in location.lower():
                phone = f"+1 ({rng.randint(201, 899)}) {rng.randint(200, 899)}-{rng.randint(1000, 9999)}"
            else:
                phone = f"+91 {rng.randint(70, 99)}{rng.randint(10, 99)} {rng.randint(10000, 99999)}"

            address = f"Suite {rng.randint(101, 908)}, Building {rng.randint(1, 45)}, {location}"

            places.append({
                "id": place_id,
                "displayName": {"text": b_name, "languageCode": "en"},
                "formattedAddress": address,
                "nationalPhoneNumber": phone if has_phone else None,
                "internationalPhoneNumber": phone if has_phone else None,
                "websiteUri": website,
                "rating": rating,
                "userRatingCount": reviews,
                "businessStatus": "OPERATIONAL",
                "googleMapsUri": f"https://maps.google.com/?cid={place_id}",
                "primaryType": domain.lower().replace(" ", "_"),
                "types": [domain.lower().replace(" ", "_"), "establishment", "point_of_interest"],
                "location": {
                    "latitude": rng.uniform(12.0, 35.0),
                    "longitude": rng.uniform(70.0, 85.0)
                }
            })

        return {"places": places}

places_service = PlacesService()
