# Troubleshooting & FAQ - DUO SYSTEMS LEAD FINDER

Common operational issues and their step-by-step resolutions.

---

## 1. Google Places API Errors

### "403 Forbidden: Places API (New) has not been used in project"
- **Cause**: The API is disabled on your Google Cloud Console project.
- **Resolution**:
  1. Visit the [Google Cloud Console](https://console.cloud.google.com/).
  2. Navigate to **APIs & Services** > **Library**.
  3. Search for **Places API (New)**.
  4. Ensure you click **Enable**. (Do NOT select the legacy "Places API").

### "403 Forbidden: Billing account not configured"
- **Cause**: Google Maps Platform requires an active billing account linked to the project to authenticate requests, even with the $200 free monthly credit.
- **Resolution**: Go to **Billing** in GCP Console and link a credit card or payment profile.
- **Testing Alternative**: Enable **Demo Simulation Mode** in the app Settings to test all workflows without needing live billing.

### "429 Too Many Requests / Quota Exceeded"
- **Cause**: Querying too many sub-areas simultaneously or exceeding queries per second (QPS).
- **Resolution**: The backend includes automatic concurrency throttling. Adjust `MAX_AREAS_PER_SEARCH` in Settings if needed.

---

## 2. Google Sheets OAuth Issues

### "redirect_uri_mismatch"
- **Cause**: The redirect URI in GCP Console does not match `http://localhost:8000/api/sheets/oauth-callback`.
- **Resolution**:
  1. Go to GCP Console > **APIs & Services** > **Credentials**.
  2. Click your OAuth 2.0 Web Client.
  3. Under **Authorized redirect URIs**, add `http://localhost:8000/api/sheets/oauth-callback` and save.

### "Access blocked: App has not completed the Google verification process"
- **Cause**: OAuth consent screen is configured as External in Testing mode and your Google account is not added as a test user.
- **Resolution**: Go to **OAuth consent screen** > **Test users** > click **+ Add Users** and enter your Google account email.

---

## 3. Local Development Port Conflicts

- **Backend Port 8000 in use**:
  Change port via: `uvicorn app.main:app --app-dir backend --port 8001` and update Vite proxy target.
- **Frontend Port 5173 in use**:
  Vite automatically increments to 5174 or specify `--port 3000`.
