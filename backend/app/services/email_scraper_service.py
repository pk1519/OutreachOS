import re
import html
import asyncio
import logging
import urllib.parse
from typing import List, Dict, Any, Optional, Set
import httpx

logger = logging.getLogger("duo_systems.email_scraper")

# Regex to match valid emails with legitimate TLD
EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,12}")

# File extensions often mistakenly captured by naive regex
INVALID_EXTENSIONS = (
    ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".css", ".js", 
    ".woff", ".woff2", ".ttf", ".eot", ".ico", ".pdf", ".mp4", ".mp3",
    ".zip", ".tar", ".gz", ".json", ".xml", ".avif"
)

# Common tracker, vendor, or platform domains to ignore
IGNORE_DOMAINS = {
    "sentry.io", "example.com", "domain.com", "wixpress.com", "wordpress.org",
    "wordpress.com", "schema.org", "w3.org", "cloudflare.com", "googleapis.com",
    "google.com", "github.com", "gravatar.com", "doubleclick.net", "googletagmanager.com"
}

# Social / directory platforms that shouldn't be used as business email domains
SOCIAL_OR_PLATFORM_DOMAINS = {
    "facebook.com", "instagram.com", "twitter.com", "x.com", "linkedin.com",
    "youtube.com", "wa.me", "whatsapp.com", "google.com", "maps.google.com",
    "goo.gl", "linktr.ee", "bit.ly", "justdial.com", "indiamart.com",
    "sulekha.com", "yelp.com", "tripadvisor.com"
}

# Preferred email prefixes for businesses
PREFERRED_PREFIXES = (
    "contact@", "info@", "hello@", "support@", "sales@", "enquiry@",
    "inquiry@", "bookings@", "booking@", "admin@", "help@", "reservations@",
    "office@", "mail@"
)

# Prefixes to discard or deprioritize
DISCARD_PREFIXES = (
    "noreply@", "no-reply@", "donotreply@", "mailer-daemon@", "postmaster@",
    "yourname@", "user@", "username@", "name@", "test@", "sample@"
)

BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}


class EmailScraperService:
    @staticmethod
    def clean_slug(name: str) -> str:
        """Converts business name into a clean domain-friendly slug."""
        if not name:
            return "business"
        slug = re.sub(r"[^a-zA-Z0-9]", "", name.lower())
        return slug or "business"

    @staticmethod
    def extract_domain(url: str) -> Optional[str]:
        """Extracts cleaned base domain from a URL."""
        if not url:
            return None
        try:
            if not url.startswith(("http://", "https://")):
                url = "https://" + url
            parsed = urllib.parse.urlparse(url)
            host = parsed.netloc.lower()
            if host.startswith("www."):
                host = host[4:]
            if ":" in host:
                host = host.split(":")[0]
            return host if "." in host else None
        except Exception:
            return None

    @classmethod
    def is_social_or_platform_domain(cls, domain: Optional[str]) -> bool:
        """Checks if domain belongs to a social media or third-party directory network."""
        if not domain:
            return True
        d = domain.lower()
        if d in SOCIAL_OR_PLATFORM_DOMAINS or d in IGNORE_DOMAINS:
            return True
        for soc in SOCIAL_OR_PLATFORM_DOMAINS:
            if d == soc or d.endswith("." + soc):
                return True
        return False

    @classmethod
    def is_valid_email(cls, email: str, domain: Optional[str] = None) -> bool:
        """Validates if an email is clean, genuine, and not a tracker or asset."""
        if not email or len(email) < 5 or len(email) > 80:
            return False
        
        email_clean = email.strip().lower()
        if not EMAIL_REGEX.fullmatch(email_clean):
            return False
        
        # Check invalid file extensions
        for ext in INVALID_EXTENSIONS:
            if email_clean.endswith(ext):
                return False
        
        # Check ignored domains
        email_domain = email_clean.split("@")[-1]
        if email_domain in IGNORE_DOMAINS:
            return False
        
        # Filter discard prefixes
        if any(email_clean.startswith(bad) for bad in DISCARD_PREFIXES):
            return False
            
        return True

    @classmethod
    def extract_emails_from_html(cls, html_text: str, domain: Optional[str] = None) -> List[str]:
        """Extracts emails from mailto: links and general text in HTML with entity unescaping."""
        if not html_text:
            return []

        # Decode HTML entities and URL encodings (e.g. &#64;, &commat;, %40)
        try:
            decoded_html = html.unescape(urllib.parse.unquote(html_text))
        except Exception:
            decoded_html = html_text

        # Handle obfuscated text like "info [at] domain.com" or "(at)"
        unobfuscated = re.sub(r'\s*(\[at\]|\(at\)|\{at\})\s*', '@', decoded_html, flags=re.IGNORECASE)
        unobfuscated = re.sub(r'\s*(\[dot\]|\(dot\)|\{dot\})\s*', '.', unobfuscated, flags=re.IGNORECASE)

        found: Set[str] = set()

        # 1. Search mailto: links (highest fidelity)
        mailto_matches = re.findall(r'href=[\'"]mailto:([^\'"?>\s]+)', unobfuscated, re.IGNORECASE)
        for m in mailto_matches:
            clean = m.strip().lower().split('?')[0].strip()
            if cls.is_valid_email(clean, domain):
                found.add(clean)

        # 2. Search regex in entire HTML
        raw_matches = EMAIL_REGEX.findall(unobfuscated)
        for m in raw_matches:
            clean = m.strip().lower()
            if cls.is_valid_email(clean, domain):
                found.add(clean)

        # Sort emails by relevance
        def score_email(e: str) -> int:
            score = 0
            if domain and domain in e:
                score += 60
            for pref in PREFERRED_PREFIXES:
                if e.startswith(pref):
                    score += 40
                    break
            return score

        return sorted(list(found), key=score_email, reverse=True)

    @classmethod
    async def scrape_site(cls, client: httpx.AsyncClient, base_url: str) -> Optional[str]:
        """Visits homepage and contact pages to extract genuine business email."""
        if not base_url:
            return None
        
        domain = cls.extract_domain(base_url)
        if not domain or cls.is_social_or_platform_domain(domain):
            return None

        # Normalize base URL
        if not base_url.startswith(("http://", "https://")):
            base_url = "https://" + base_url

        parsed = urllib.parse.urlparse(base_url)
        root_url = f"{parsed.scheme}://{parsed.netloc}"

        # 1. First fetch base_url / homepage
        homepage_html = ""
        try:
            res = await client.get(
                base_url,
                headers=BROWSER_HEADERS,
                follow_redirects=True,
                timeout=3.5
            )
            if res.status_code == 200 and res.text:
                homepage_html = res.text
                emails = cls.extract_emails_from_html(homepage_html, domain)
                if emails:
                    return emails[0]
        except Exception:
            # If HTTPS failed, try HTTP
            if base_url.startswith("https://"):
                try:
                    http_url = "http://" + base_url[8:]
                    res = await client.get(
                        http_url,
                        headers=BROWSER_HEADERS,
                        follow_redirects=True,
                        timeout=3.0
                    )
                    if res.status_code == 200 and res.text:
                        homepage_html = res.text
                        emails = cls.extract_emails_from_html(homepage_html, domain)
                        if emails:
                            return emails[0]
                except Exception:
                    pass

        # 2. Check for contact links in homepage HTML
        contact_urls: List[str] = []
        if homepage_html:
            href_matches = re.findall(r'href=[\'"]([^\'"#\s]+)[\'"]', homepage_html, re.IGNORECASE)
            for href in href_matches:
                href_lower = href.lower()
                if any(k in href_lower for k in ["contact", "about", "reach", "support", "touch", "help"]):
                    full_link = urllib.parse.urljoin(base_url, href)
                    if domain in full_link and full_link not in contact_urls:
                        contact_urls.append(full_link)
                if len(contact_urls) >= 3:
                    break

        # Fallback standard paths if none found in HTML
        if not contact_urls:
            contact_urls = [
                f"{root_url}/contact",
                f"{root_url}/contact-us",
                f"{root_url}/about",
                f"{root_url}/about-us"
            ]

        # Check unique contact pages
        checked = {base_url}
        for page_url in contact_urls[:4]:
            if page_url in checked:
                continue
            checked.add(page_url)

            try:
                res = await client.get(
                    page_url,
                    headers=BROWSER_HEADERS,
                    follow_redirects=True,
                    timeout=2.5
                )
                if res.status_code == 200 and res.text:
                    emails = cls.extract_emails_from_html(res.text, domain)
                    if emails:
                        return emails[0]
            except Exception:
                continue

        return None

    @classmethod
    async def enrich_lead_email(
        cls,
        website_url: Optional[str],
        business_name: str,
        client: Optional[httpx.AsyncClient] = None
    ) -> str:
        """
        Attempts to scrape genuine email from the business website.
        If website is unavailable or does not yield an email, generates
        a standard high-probability business contact email.
        """
        domain = cls.extract_domain(website_url) if website_url else None
        is_social = cls.is_social_or_platform_domain(domain)
        
        # 1. If valid custom domain and client provided, attempt fast scrape
        if domain and not is_social and client:
            try:
                scraped_email = await cls.scrape_site(client, website_url)
                if scraped_email:
                    return scraped_email
            except Exception as e:
                logger.debug(f"Email scrape failed for {website_url}: {e}")

        # 2. Domain fallback (e.g. contact@domain.com) if not social platform
        if domain and not is_social:
            return f"contact@{domain}"

        # 3. Clean business name slug fallback (e.g. contact@apexfitness.com)
        slug = cls.clean_slug(business_name)
        return f"contact@{slug}.com"

    @classmethod
    async def enrich_places(cls, places: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Concurrently enriches a list of Google Places / raw place dicts with emails.
        """
        if not places:
            return places

        async with httpx.AsyncClient(verify=False, timeout=4.0) as client:
            semaphore = asyncio.Semaphore(15)  # Max 15 parallel requests

            async def process_single(p: Dict[str, Any]):
                # If place already has a valid email, keep it
                existing_email = p.get("email")
                if existing_email and "@" in existing_email:
                    return

                # Get business name and website
                b_name = ""
                display_name = p.get("displayName")
                if isinstance(display_name, dict):
                    b_name = display_name.get("text") or ""
                elif isinstance(display_name, str):
                    b_name = display_name
                if not b_name:
                    b_name = p.get("business_name") or "Business"

                website = p.get("websiteUri") or p.get("website_uri") or p.get("website")

                async with semaphore:
                    email = await cls.enrich_lead_email(website, b_name, client)
                    p["email"] = email

            await asyncio.gather(*[process_single(p) for p in places], return_exceptions=True)

        return places


email_scraper_service = EmailScraperService()

