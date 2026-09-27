# DUO SYSTEMS — GMAIL API OAUTH 2.0 SETUP GUIDE

This step-by-step guide explains how to configure Google Cloud and connect your Gmail account (`contact.devworks7@gmail.com`) to the **Duo Systems Lead Finder & Outreach Center** using the official Google Gmail API.

> [!IMPORTANT]
> **CRITICAL SECURITY RULE:** Never commit `credentials.json`, `token.json`, or `.env` to GitHub or public repositories. They are strictly git-ignored and held securely on the backend only.

---

## Prerequisites
- A Google Account: `contact.devworks7@gmail.com`
- Access to [Google Cloud Console](https://console.cloud.google.com/)

---

## Step-by-Step Setup Instructions

### 1. Open Google Cloud Console
Navigate to [https://console.cloud.google.com/](https://console.cloud.google.com/) and sign in with your Google account.

### 2. Select / Open Project: "Duo Systems Lead Finder"
In the top project dropdown menu, select your existing Google Cloud project:
`Duo Systems Lead Finder` (or create a new project with this name if not already created).

### 3. Enable the Gmail API
1. In the navigation menu (left sidebar), click **APIs & Services** > **Enabled APIs & services**.
2. Click **+ ENABLE APIS AND SERVICES** at the top.
3. In the search box, type `Gmail API`.
4. Click on **Gmail API** from the results list.
5. Click the blue **Enable** button. Wait a few seconds until the API status shows "API Enabled".

### 4. Configure OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**.
2. Select User Type: **External** (standard for SaaS/freelance outreach) and click **Create**.
3. Fill in the required App Information:
   - **App name:** `Duo Systems Lead Finder`
   - **User support email:** `contact.devworks7@gmail.com`
   - **Developer contact information:** `contact.devworks7@gmail.com`
4. Click **Save and Continue**.

### 5. Add Test Users
1. If your OAuth consent screen Publishing Status is set to **Testing**, scroll to the **Test users** section.
2. Click **+ ADD USERS**.
3. Enter:
   `contact.devworks7@gmail.com`
4. Click **Add** and then **Save and Continue**.

### 6. Configure Gmail Scope
1. In the **Scopes** step, click **Add or Remove Scopes**.
2. Search or filter for Gmail scopes.
3. Check **ONLY** the necessary least-privilege sending scope:
   `https://www.googleapis.com/auth/gmail.send`
4. Do **NOT** select `gmail.readonly`, `gmail.modify`, or `gmail.compose`.
5. Click **Update** and then **Save and Continue**.

### 7. Create OAuth 2.0 Client Credentials
1. Go to **APIs & Services** > **Credentials**.
2. Click **+ CREATE CREDENTIALS** at the top and select **OAuth client ID**.
3. Choose Application type:
   - For web callback: select **Web application**
     - **Name:** `Duo Systems Web Client`
     - **Authorized redirect URIs:**
       - `http://localhost:8000/api/integrations/gmail/callback`
       - `http://127.0.0.1:8000/api/integrations/gmail/callback`
   - Alternatively, for desktop app flow: select **Desktop app** (Installed App).
4. Click **Create**.

### 8. Download credentials.json
1. A modal will appear showing "OAuth client created".
2. Click **DOWNLOAD JSON**.
3. Rename the downloaded file to:
   `credentials.json` (ensure Windows file extensions does not name it `credentials.json.json`).

### 9. Place credentials.json in the Secure Directory
Move or copy `credentials.json` into the backend secrets folder:
```
backend/secrets/google/credentials.json
```
or:
```
backend/secrets/credentials.json
```
The application automatically checks these paths upon startup.

### 10. Start the Backend Server
In your terminal, activate your virtual environment and start FastAPI:
```powershell
.\venv\Scripts\activate
uvicorn app.main:app --app-dir backend --reload --port 8000
```

### 11. Open Settings in the Application
Open your browser to the Duo Systems frontend:
[http://localhost:5173](http://localhost:5173)
Click on **Settings** in the left sidebar.

### 12. Click "Connect Gmail"
Under the **Gmail API Integration** card, click the purple **Connect Gmail** button.

### 13. Login Using contact.devworks7@gmail.com
Google's authorization page will open. Choose or sign in with:
`contact.devworks7@gmail.com`

### 14. Grant Gmail Send Permission
Review the requested permission:
> "Send email on your behalf" (`https://www.googleapis.com/auth/gmail.send`)

Click **Allow** / **Continue**.

### 15. Verify Connection Status
You will be redirected back to the Duo Systems Settings page. The Gmail integration badge will now display:
```
Gmail: ● Connected
Account: contact.devworks7@gmail.com
Scope: https://www.googleapis.com/auth/gmail.send
```
At the bottom of the sidebar, the indicator will show **● Connected** in green.

### 16. Send a Test Email
1. Navigate to **Outreach** > **Create Campaign**.
2. In the Live Preview card on the right, under **Send Test Email First**, verify:
   `contact.devworks7@gmail.com`
3. Click **Test**.
4. You will see a green success message confirming delivery via Gmail API. Check your Gmail inbox for the test message!

---

## Security Best Practices
- **Least Privilege:** The application only ever requests `gmail.send`. It cannot read your personal emails or modify your inbox.
- **Token Security:** Refresh tokens are never sent to the browser or logged to stdout.
- **Rate Throttling:** Background workers default to 10 emails/minute with exponential backoff on transient errors to respect Google's quota guidelines.
