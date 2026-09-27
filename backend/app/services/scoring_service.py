from typing import Dict, Any, List, Tuple

class ScoringService:
    @staticmethod
    def calculate_score(
        lead_data: Dict[str, Any],
        target_business_type: str = ""
    ) -> Tuple[int, str, List[str]]:
        """
        Duo Systems Lead Scoring Algorithm (0-100).
        Evaluates internal lead qualification based strictly on available factual attributes.
        Returns: (total_score, priority, reasons_list)
        """
        score = 0
        reasons = []

        # 1. Email availability (+20)
        email = lead_data.get("email")
        if email and str(email).strip() and str(email).lower() != "not available":
            score += 20
            reasons.append("✓ Verified business email available (+20)")
        else:
            reasons.append("✗ No direct email address available (0)")

        # 2. Website availability (+15)
        website = lead_data.get("website_uri") or lead_data.get("website")
        if website and len(str(website).strip()) > 5:
            score += 15
            reasons.append("✓ Active business website listed (+15)")
        else:
            reasons.append("✗ No business website found (0)")

        # 3. Phone availability (+10)
        phone = lead_data.get("phone") or lead_data.get("national_phone") or lead_data.get("international_phone")
        if phone:
            score += 10
            reasons.append("✓ Direct phone number available (+10)")
        else:
            reasons.append("✗ No direct phone number listed (0)")

        # 4. Review count & social proof (+10 max)
        user_ratings_total = lead_data.get("user_rating_count") or lead_data.get("review_count") or 0
        if user_ratings_total >= 100:
            score += 10
            reasons.append(f"✓ High review volume: {user_ratings_total} reviews (+10)")
        elif user_ratings_total >= 25:
            score += 7
            reasons.append(f"✓ Established review volume: {user_ratings_total} reviews (+7)")
        elif user_ratings_total >= 5:
            score += 4
            reasons.append(f"✓ Emerging presence: {user_ratings_total} reviews (+4)")
        else:
            reasons.append("✗ Low or unrated review volume (0)")

        # 5. Rating quality (+10 max)
        rating = float(lead_data.get("rating") or 0.0)
        if rating >= 4.5:
            score += 10
            reasons.append(f"✓ High rating: {rating:.1f}/5.0 (+10)")
        elif rating >= 4.0:
            score += 7
            reasons.append(f"✓ Good customer rating: {rating:.1f}/5.0 (+7)")
        elif rating > 0:
            score += 3
            reasons.append(f"✓ Rated {rating:.1f}/5.0 (+3)")

        # 6. Relevant business category (+15 max)
        business_type = str(lead_data.get("business_type") or lead_data.get("category") or lead_data.get("primary_type") or "").lower()
        target_norm = target_business_type.lower().strip()
        if target_norm and (target_norm in business_type or business_type in target_norm or any(w in business_type for w in target_norm.split())):
            score += 15
            reasons.append(f"✓ Relevant business category: '{target_business_type}' (+15)")
        elif business_type:
            score += 8
            reasons.append("✓ General commercial business match (+8)")

        # 7. Potential digital presence / Maps location (+10 max)
        maps_uri = lead_data.get("google_maps_uri")
        if maps_uri and len(str(maps_uri).strip()) > 5:
            score += 10
            reasons.append("✓ Verified Google Maps listing & digital presence (+10)")

        # 8. Location match & physical address (+10 max)
        address = lead_data.get("formatted_address") or lead_data.get("address")
        if address and len(str(address).strip()) > 10:
            score += 10
            reasons.append("✓ Location match & complete physical address (+10)")

        # Cap score between 0 and 100
        score = min(100, max(0, score))

        # Assign priority tier
        if score >= 70:
            priority = "HIGH"
        elif score >= 40:
            priority = "MEDIUM"
        else:
            priority = "LOW"

        return score, priority, reasons

scoring_service = ScoringService()
