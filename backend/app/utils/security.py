import hashlib
import secrets

def generate_random_token(length: int = 32) -> str:
    return secrets.token_urlsafe(length)

def hash_place_id(place_id: str) -> str:
    return hashlib.sha256(place_id.encode("utf-8")).hexdigest()
