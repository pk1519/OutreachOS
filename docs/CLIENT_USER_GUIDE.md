# Duo Systems Lead Finder & Outreach Center — Client User Guide

Welcome to the **Duo Systems Lead Finder & Outreach Center** client user guide. This document explains how to use the platform in clear, straightforward terms.

---

## 1. What Duo Systems Lead Finder Does

**Duo Systems Lead Finder & Outreach Center** is an all-in-one software platform created for technical freelance and automation studios. It helps you:

1. **Find Real Business Clients**: Search for any business type (restaurants, dentists, schools, digital agencies, manufacturing companies, etc.) in any city or neighborhood worldwide.
2. **Qualify and Score Leads**: Instantly see which businesses have active phone numbers, websites, verified reviews, and ratings on a transparent 0–100 scale.
3. **Organize & Import Leads**: Maintain a unified database of business contacts, import your existing lead lists via CSV with automated column mapping, and prevent duplicate contacts using Google Place IDs.
4. **Conduct Safe Email Outreach**: Connect your official Gmail account (`contact.devworks7@gmail.com`) via official Google OAuth, draft personalized email templates using dynamic placeholders, test emails before sending, and dispatch campaigns through a controlled background queue with throttling and suppression rules.
5. **Track Performance**: Monitor email delivery status, review historical campaign metrics, and export data directly to CSV or Google Sheets.

---

## 2. How to Find Leads

1. Click **Lead Finder** in the left sidebar navigation.
2. In the **Business Type** field, type the category of business you are looking for (e.g., `Dentists`, `Restaurants`, `Digital Marketing Agencies`, `Boutique Hotels`, `Schools`). You are not restricted to any fixed list.
3. In the **Location** field, type the target city or region (e.g., `Bangalore`, `Delhi`, `London`, `Dubai`, `Mumbai`).
4. (Optional) In **Target Sub-Areas**, add specific neighborhoods or suburbs (e.g., `Koramangala`, `Indiranagar`) to expand coverage.
5. (Optional) Adjust the maximum number of results to fetch (default: `20`).
6. Click **Search Leads**.
7. The platform queries the official **Google Places API (New)** securely from the backend and returns real, verified business profiles with address, phone number, website URL, ratings, and review counts.

---

## 3. How to Save Leads

- **Bulk Save**: After a search completes, click **Save Selected Leads** to add all or selected results directly into your PostgreSQL database.
- **Individual Save**: Click the bookmark/save icon on any row in the search results table.
- **Duplicate Protection**: If a business is already saved in your database (matched by its unique Google `place_id`), the platform automatically detects it, informs you, and updates existing records rather than creating redundant duplicates.

---

## 4. How to Export Leads

You can export leads at any time for offline analysis or client sharing:

### Export to CSV
1. Navigate to **Leads** in the sidebar.
2. Filter or select the leads you want to export.
3. Click the **Export CSV** button at the top right of the table.
4. Your browser will immediately download a `.csv` file formatted with all standard business and contact fields.

### Export to Google Sheets
1. Navigate to **Exports** or click **Export to Google Sheets** from the Leads page.
2. Confirm your Google account authorization.
3. Click **Create New Spreadsheet**.
4. The system automatically creates a new Google Spreadsheet containing formatted headers (Business Name, Category, Address, City, Phone, Website, Email, Rating, Reviews, Lead Score, Status, Date) and writes the selected leads directly into the sheet.

---

## 5. How to Import a CSV

If you have lead lists from networking events, conferences, or prior marketing efforts, you can upload them seamlessly:

1. Click **Outreach** → **Imported Leads** in the left sidebar.
2. Drag and drop your `.csv` file or click **Browse File** (supported up to 10MB).
3. The platform automatically scans your file headers and maps them to standard fields:
   - `Company / Business Name`
   - `Contact Name / First Name`
   - `Email Address`
   - `Phone Number`
   - `Website URL`
   - `City / Category`
4. Review the auto-detected column mappings on the screen. If needed, change any dropdown to match your custom column headers.
5. Click **Confirm & Import Leads**.
6. The system validates each row, scores each contact, rejects invalid entries, and provides an import summary with exact numbers of imported and skipped rows.

---

## 6. How to Create an Email Campaign

1. In the sidebar, click **Outreach** → **Create Campaign**.
2. **Step 1: Campaign Details**:
   - Enter a descriptive **Campaign Name** (e.g., `Bangalore Dental Clinics Outreach Q3`).
   - Enter your email **Subject Line** (e.g., `AI Automation Solutions for {{company}}`).
3. **Step 2: Compose Email Body**:
   - Write your message in the rich text box.
   - Insert dynamic personalization tags using the chips above the editor:
     - `{{name}}`: Full contact name
     - `{{first_name}}`: First name only
     - `{{company}}`: Business name
     - `{{category}}`: Business domain / category
     - `{{city}}`: City location
     - `{{website}}`: Website URL
     - `{{phone}}`: Phone number
     - `{{email}}`: Contact email address
4. **Step 3: Choose Recipients**:
   - Filter and select leads from your database or imported lists.
   - The platform will verify which leads have valid email addresses.

---

## 7. How to Preview an Email

Before sending, verify how your email looks to actual recipients:

1. On the **Create Campaign** page, click the **Preview** tab or the **Preview Email** button.
2. Select any lead from the recipient list in the preview dropdown.
3. The preview box will render the exact subject line and body with the chosen lead's actual name, company, city, and website filled into the `{{variables}}`.
4. If any variable is missing or cannot be resolved, the system displays a clear warning so you can edit the template or provide the missing lead data.

---

## 8. How to Send a Test Email

Always test your email rendering and delivery before running a campaign:

1. On the **Create Campaign** page, locate the **Test Email** section.
2. The default recipient is set to your connected studio email: `contact.devworks7@gmail.com`. You may also enter another test inbox address.
3. Click **Send Test Email**.
4. The backend sends a real test message through the Gmail API using sample lead data.
5. Check your inbox to verify formatting, signature, and readability on desktop and mobile.

---

## 9. How to Launch a Campaign

1. Once your template and recipients are ready, click **Review & Launch**.
2. The platform displays the **Preflight Campaign Confirmation Modal**:
   - **Total Recipients Selected**
   - **Valid Emails**
   - **Invalid / Missing Emails**
   - **Suppressed / Do-Not-Contact Emails**
   - **Duplicate Emails**
   - **Net Emails to Send**
   - **Sending Account**: `contact.devworks7@gmail.com`
3. Check the mandatory acknowledgement:
   `[✓] I confirm that I want to send this campaign to the verified recipients.`
4. Click **Launch Campaign**.
5. The campaign is queued into the background processing engine.

---

## 10. How to Pause, Resume, or Cancel a Campaign

1. Navigate to **Outreach** → **Email Queue** or **Campaigns**.
2. Click on your active campaign to view real-time metrics (Sent, Pending, Failed, Skipped).
3. Use the control buttons at the top right:
   - **Pause**: Temporarily halts sending immediately after the in-flight email finishes.
   - **Resume**: Continues dispatching pending emails from where it left off.
   - **Cancel**: Permanently stops the campaign and marks remaining pending emails as cancelled.

---

## 11. How to Check Campaign History

1. Navigate to **Outreach** → **Email History**.
2. View the comprehensive audit log of every email dispatched by the system.
3. Filter by:
   - **Campaign**: Select a specific campaign or view all.
   - **Delivery Status**: `SENT`, `FAILED`, `PENDING`, or `SKIPPED`.
   - **Recipient Email / Company Name**: Instant search.
4. Click on any record to view details, including the exact timestamp, Google Gmail Message ID, and error messages (if a delivery failed).

---

## 12. How to Connect Gmail

1. Navigate to **Settings** in the bottom left sidebar.
2. Locate the **Gmail Integration** section.
3. Check that your Google Cloud client credentials (`credentials.json`) are present.
4. Click **Connect Gmail**.
5. You will be redirected to the secure Google OAuth 2.0 authorization screen.
6. Sign in with:
   `contact.devworks7@gmail.com`
7. Review the requested permission:
   - **Send email on your behalf (`https://www.googleapis.com/auth/gmail.send`)**
   - *Note: Duo Systems requests only sending permissions. It does not read, delete, or modify your personal emails.*
8. Grant permission and return to the application.
9. The status indicator will turn green:
   `● Gmail: Connected (contact.devworks7@gmail.com)`
10. To disconnect or change accounts, click **Disconnect Gmail** in Settings at any time.

---

## 13. Security and Privacy Notes

- **Least-Privilege Gmail Access**: Duo Systems only requests `https://www.googleapis.com/auth/gmail.send`. Your inbox, drafts, and read access are completely untouched.
- **Never Ingesting Secret Files in Frontend**: Google API keys, client secrets, and OAuth refresh tokens are stored exclusively on the server and are never exposed in browser requests or JavaScript bundles.
- **Suppression List & Compliance**: The system honors an internal **Suppression List** (`UNSUBSCRIBED`, `BOUNCED`, `DO_NOT_CONTACT`, `MANUAL_BLOCK`). Any recipient on this list is automatically skipped during sending to protect your domain reputation.
- **Throttling & Anti-Spam Safeguards**: The email worker enforces configurable rates (default: 20 emails/minute) with exponential backoff on network errors to maintain compliance with Gmail sending guidelines.
