import re
from typing import Optional

def sanitize_string(value: Optional[str]) -> str:
    if not value:
        return ""
    return re.sub(r'[\x00-\x1f\x7f-\x9f]', '', str(value)).strip()

def validate_rating(rating: Optional[float]) -> float:
    if rating is None:
        return 0.0
    return max(0.0, min(5.0, float(rating)))
