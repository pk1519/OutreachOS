# Security & Compliance Policy - DUO SYSTEMS LEAD FINDER

DUO SYSTEMS enforces enterprise-grade security protocols across all lead generation and CRM operations.

---

## 1. Google Places API (New) Compliance

- **No Scraping**: Duo Systems strictly calls official Google Cloud endpoints (`https://places.googleapis.com/v1/places:searchText`). HTML scraping, headless browser crawling, and DOM parsing of Google Maps are strictly prohibited.
- **Strict FieldMasking**: Requests only specify the fields explicitly required (`places.id`, `places.displayName`, `places.formattedAddress`, `places.nationalPhoneNumber`, etc.). Wildcard masks (`*`) are disallowed to prevent unnecessary billing exposure.
- **Server-Side API Keys**: The `GOOGLE_PLACES_API_KEY` is strictly held on the FastAPI backend and never returned in API responses, headers, or serialized JSON payloads.
- **Rate-Limiting & Quota Management**: Search parameters enforce strict safety ceilings (`MAX_AREAS_PER_SEARCH`, `MAX_RESULTS_PER_SEARCH`) to prevent accidental quota exhaustion.

---

## 2. Google OAuth 2.0 & Token Isolation

- **Token Storage**: OAuth access tokens and refresh tokens for Google Sheets API are securely stored in server-side relational database tables (`google_connections`).
- **No Client Exposure**: Tokens are NEVER sent to the client browser or stored in `localStorage`/`sessionStorage`.
- **Minimal Scopes**: Only `spreadsheets` and `drive.file` scopes are requested.

---

## 3. Human-in-the-Loop CRM & Outreach

- **No Autonomous Messaging**: The platform generates outreach drafts (Value Proposition, Partnership, Friendly Intro) for sales reps to review and customize.
- **Mandatory Human Approval**: No email, SMS, or direct message is ever transmitted automatically without conscious rep signoff.
