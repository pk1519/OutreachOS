# Google Cloud Setup Guide - DUO SYSTEMS LEAD FINDER

Follow this step-by-step guide to configure the official **Google Places API (New)** and **Google Sheets API**.

---

## Step 1: Create a Google Cloud Project

1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown in the top bar and select **New Project**.
3. Name your project: `Duo-Systems-Lead-Finder`.
4. Click **Create** and ensure your newly created project is selected.

---

## Step 2: Enable Required APIs

1. In the Cloud Console sidebar, go to **APIs & Services** > **Library**.
2. Search for: **Places API (New)** (Note: Do NOT choose the legacy "Places API").
3. Click **Enable**.
4. In the API Library, search for: **Google Sheets API**.
5. Click **Enable**.
6. (Optional) Search for: **Google Drive API** and click **Enable** (allows automatic file creation and folder organization).

---

## Step 3: Link a Billing Account

1. Google Places API (New) requires an active Billing Account to issue live responses.
2. Go to **Billing** in the Google Cloud Console.
3. Link a valid billing account to your project.
   > **Note**: Google Cloud grants **$200 free monthly credit** for Maps & Places usage, which covers thousands of discovery requests.

---

## Step 4: Create and Restrict Places API Key

1. Go to **APIs & Services** > **Credentials**.
2. Click **+ Create Credentials** > **API Key**.
3. Once generated, click **Edit API Key**:
   - **Name**: `Duo-Systems-Places-Key`
   - **API restrictions**: Select **Restrict key**.
   - Check only: **Places API (New)**.
   - Click **Save**.
4. Copy this key into your `.env` file:
   ```env
   GOOGLE_PLACES_API_KEY=AIzaSy...your_actual_key_here...
   ```
   *Never commit this key to version control or expose it to frontend code.*

---

## Step 5: Configure OAuth 2.0 for Google Sheets Integration

1. Go to **APIs & Services** > **OAuth consent screen**:
   - User Type: **External** (or Internal for Google Workspace).
   - App Name: `Duo Systems Lead Finder`.
   - User Support Email: your team's email.
   - Developer Contact Info: your email.
   - Click **Save and Continue**.
2. **Scopes**:
   - Click **Add or Remove Scopes**.
   - Select `https://www.googleapis.com/auth/spreadsheets`.
   - Select `https://www.googleapis.com/auth/drive.file`.
   - Click **Update** > **Save and Continue**.
3. **Test Users**:
   - Add your Google account email as a Test User.
   - Click **Save and Continue**.
4. Go to **APIs & Services** > **Credentials**:
   - Click **+ Create Credentials** > **OAuth client ID**.
   - Application Type: **Web application**.
   - Name: `Duo Systems Web Client`.
   - **Authorized redirect URIs**:
     - `http://localhost:8000/api/sheets/oauth-callback`
     - `http://127.0.0.1:8000/api/sheets/oauth-callback`
   - Click **Create**.
5. Copy your **Client ID** and **Client Secret** into your `.env`:
   ```env
   GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-your_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:8000/api/sheets/oauth-callback
   ```
