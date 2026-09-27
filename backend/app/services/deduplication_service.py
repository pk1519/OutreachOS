from typing import List, Dict, Any, Tuple

class DeduplicationService:
    @staticmethod
    def deduplicate_places(
        places_list: List[Dict[str, Any]]
    ) -> Tuple[List[Dict[str, Any]], int, int, int]:
        """
        Deduplicates raw Google Places results by Place ID.
        Returns:
            (unique_places, raw_count, unique_count, duplicate_count)
        """
        raw_count = len(places_list)
        seen_place_ids = set()
        unique_places = []
        duplicate_count = 0

        for place in places_list:
            place_id = place.get("id") or place.get("place_id")
            if not place_id:
                # If no place ID, can't guarantee identity
                continue
                
            if place_id in seen_place_ids:
                duplicate_count += 1
            else:
                seen_place_ids.add(place_id)
                unique_places.append(place)

        unique_count = len(unique_places)
        return unique_places, raw_count, unique_count, duplicate_count

deduplication_service = DeduplicationService()
