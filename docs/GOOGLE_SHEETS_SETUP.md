# Google Sheets CRM Setup Guide - DUO SYSTEMS LEAD FINDER

**Google Sheets** is the primary CRM export destination for Duo Systems Lead Finder.

---

## 1. Connecting Your Google Account

1. Open the Duo Systems Lead Finder UI and navigate to **Google Sheets** in the sidebar.
2. Click **Connect Google Account**.
3. Choose your Google account on the consent screen and accept the Sheets read/write permissions.
4. Once authorized, the status indicator turns green: `Connected as: your-name@gmail.com`.
5. *(For local development/testing without GCP OAuth credentials, click **Quick Demo Connect** in the UI to test sheet exports instantly).*

---

## 2. Spreadsheet & Worksheet Architecture

Duo Systems Lead Finder supports two flexible organizational structures:

### Structure A: Dedicated Campaign Worksheets (Recommended)
- **Spreadsheet**: `Duo Systems Lead Database`
- **Worksheets**:
  - `Bangalore Gyms`
  - `Lucknow Schools`
  - `Dubai Real Estate`
  - `Delhi Coaching`
  - `Summary Dashboard`

### Structure B: Master Central CRM Sheet
- Single sheet with a dedicated `Campaign` column, allowing filtering by campaign directly inside Google Sheets.

---

## 3. Place ID Duplicate Protection

Before any lead is added to your Google Sheet:
1. Duo Systems reads existing **Place IDs** (Column N).
2. It cross-checks new candidate leads against existing entries.
3. Only **unique** leads are appended.
4. Duplicate leads are safely skipped, and the export summary reports:
   - `Existing: 12`
   - `New Added: 28`
   - `Duplicates Skipped: 12`
5. If **Update Existing Leads** is checked, existing CRM notes and statuses are refreshed without creating duplicate rows.

---

## 4. Automated Campaign Dashboard Tab

When exporting with `Create Dashboard Tab` checked, Duo Systems generates a dynamic summary tab containing:
- Campaign Title & Scope
- Total Leads, Unique Count, High/Medium/Low Priority breakdown
- Outreach funnel numbers (Contacted, Replied, Interested, Won, Lost)
- Conversion summary formulas
