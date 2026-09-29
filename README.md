# 🌌 DUO SYSTEMS — Enterprise B2B Lead Finder & Outreach Center

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12-3776AB.svg?style=flat&logo=Python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB.svg?style=flat&logo=React&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6.svg?style=flat&logo=TypeScript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.2-646CFF.svg?style=flat&logo=Vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00.svg?style=flat&logo=SQLAlchemy&logoColor=white)](https://www.sqlalchemy.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat)](https://opensource.org/licenses/MIT)

> **Duo Systems** is a full-stack, enterprise-grade B2B client acquisition platform that automates lead discovery worldwide, calculates transparent qualification scores, manages multi-stage outreach campaigns, synchronizes seamlessly with Google Sheets, and sends personalized Gmail outreach with throttling safeguards.

---

<!-- ======================================================== -->
<!-- 📸 HERO SCREENSHOT PLACEHOLDER                             -->
<!-- Image path: docs/images/hero-dashboard.png               -->
<!-- ======================================================== -->
<p align="center">
  <img src="docs/images/hero-dashboard.png" alt="Duo Systems Dashboard Preview" width="950" style="border-radius: 12px; border: 1px solid #1e293b; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5);" />
</p>

---

## 📑 Table of Contents

- [🌟 Platform Highlights](#-platform-highlights)
- [📸 Visual Tour & Core Features](#-visual-tour--core-features)
  - [1. Universal Lead Discovery](#1-universal-lead-discovery--multi-area-scanning)
  - [2. B2B Campaign Management & Deletion Engine](#2-b2b-campaign-management--complete-database-purge)
  - [3. Lead Qualification & CRM](#3-lead-qualification--crm-pipeline)
  - [4. Automated Gmail Outreach](#4-automated-gmail-outreach-engine)
  - [5. Bi-Directional Google Sheets Sync](#5-bi-directional-google-sheets-sync)
  - [6. CSV Importer & Normalization](#6-smart-csv-importer--normalization)
- [🏗 System Architecture](#-system-architecture)
- [🛠 Tech Stack](#-tech-stack)
- [🚀 Quick Start (Local Setup)](#-quick-start-local-setup)
- [🌐 Zero-Cost 24/7 Production Deployment](#-zero-cost-247-production-deployment)
- [⚙️ Configuration & Environment Variables](#️-configuration--environment-variables)
- [📡 API Reference](#-api-reference)
- [🧪 Automated Test Suite](#-automated-test-suite)
- [🖼️ Screenshot Guide (Where & How to Add Images)](#️-screenshot-guide)
- [📄 License](#-license)

---

## 🌟 Platform Highlights

- 🎯 **Worldwide Commercial Scraping**: Query any business vertical across any city and sub-district using Google Places API (New).
- 🛡️ **Zero Duplicate Guarantee**: Deterministic deduplication by Google Place ID prevents duplicate leads and conserves quota.
- ⚡ **Transparent Duo Scoring (0–100)**: Evaluates prospect readiness based on contact availability, operational status, website presence, and ratings.
- 📁 **Complete Campaign Lifecycles**: Organize leads into dedicated campaigns with instant CSV exports and a cascade deletion engine that cleanly wipes all related leads, scores, outreach logs, and search records.
- ✉️ **Gmail API Outreach Queue**: Safe client outreach with variable templates (`{{company}}`, `{{city}}`), preflight validation, suppression filtering, test-email sandbox, and configurable throttling.
- 📊 **Live Google Sheets Sync**: Push deduplicated leads into automated Google Sheets tabs with formatting and KPI summaries.
- 🔌 **Built-in Mock Simulator**: Operates out of the box in sandbox mode with zero external credentials needed.

---

## 📸 Visual Tour & Core Features

### 1. Universal Lead Discovery & Multi-Area Scanning
Discover high-intent businesses across granular geographic districts (e.g. *Koramangala, Indiranagar, HSR Layout in Bangalore*). The engine extracts business name, address, phone numbers, websites, genuine emails via website enrichment, and ratings.

<!-- 📸 SCREENSHOT: docs/images/lead-finder.png -->
<p align="center">
  <img src="docs/images/lead-finder.png" alt="Lead Discovery Screen" width="900" style="border-radius: 10px; border: 1px solid #1e293b;" />
</p>

- Multi-area sub-district batch queries in a single operation.
- Fallback website scraping for direct contact email extraction.
- Automatic Place ID deduplication before database commit.

---

### 2. B2B Campaign Management & Complete Database Purge
Organize discovered leads into structured client acquisition projects. View lead counts, monitor campaign statuses, download RFC 4180 CSV files, and purge campaigns cleanly.

<!-- 📸 SCREENSHOT: docs/images/campaigns.png -->
<p align="center">
  <img src="docs/images/campaigns.png" alt="Campaign Management Screen" width="900" style="border-radius: 10px; border: 1px solid #1e293b;" />
</p>

- **Cascade Purge Engine**: Deleting a campaign automatically purges all related leads, scores, notes, tags, contacts, recipient queues, email logs, search history, and sheet sync destinations to ensure zero database bloat.
- **Visual Feedback**: Real-time loading spinners and confirmation dialogs prevent accidental or duplicate deletions.

---

### 3. Lead Qualification & CRM Pipeline
Manage prospect relationships in an integrated CRM view. Filter by priority (*HOT*, *WARM*, *COLD*), pipeline status (*NEW*, *CONTACTED*, *REPLIED*, *CONVERTED*), and view transparent scoring breakdowns.

<!-- 📸 SCREENSHOT: docs/images/leads-crm.png -->
<p align="center">
  <img src="docs/images/leads-crm.png" alt="Leads CRM Table and Score Breakdown" width="900" style="border-radius: 10px; border: 1px solid #1e293b;" />
</p>

- Interactive slide-over lead drawer for notes, contacts, and metadata editing.
- Instant CSV export of custom filtered subsets.
- One-click copy for outreach drafts and phone numbers.

---

### 4. Automated Gmail Outreach Engine
Reach out to qualified leads using official Google OAuth 2.0 sending credentials without third-party email trackers or data sharing.

<!-- 📸 SCREENSHOT: docs/images/gmail-outreach.png -->
<p align="center">
  <img src="docs/images/gmail-outreach.png" alt="Gmail Outreach Queue and Personalization" width="900" style="border-radius: 10px; border: 1px solid #1e293b;" />
</p>

- **Template Personalization**: Dynamic placeholders (`{{name}}`, `{{company}}`, `{{city}}`, `{{category}}`).
- **Preflight Safety Validation**: Pre-checks for invalid formats, missing addresses, and duplicate emails before sending.
- **Suppression Management**: Enforces global Do-Not-Contact and unsubscribed recipient lists.
- **Test Email Sandbox**: Send test emails strictly to verified test accounts before launching queues.
- **Rate Throttling & Controls**: Configurable sends per minute (1–60) with instant Pause/Resume/Cancel controls.

---

### 5. Bi-Directional Google Sheets Sync
Push qualified prospect lists directly into client or team Google Spreadsheets via official Google Sheets API v4.

<!-- 📸 SCREENSHOT: docs/images/sheets-sync.png -->
<p align="center">
  <img src="docs/images/sheets-sync.png" alt="Google Sheets Sync Dialog" width="900" style="border-radius: 10px; border: 1px solid #1e293b;" />
</p>

- Automatic worksheet creation named after the campaign.
- Pre-checks existing Place IDs in the destination tab to prevent duplicate rows.
- Full sync history log with direct clickable spreadsheet URLs.

---

### 6. Smart CSV Importer & Normalization
Import raw business lists from external sources or databases.

<!-- 📸 SCREENSHOT: docs/images/csv-importer.png -->
<p align="center">
  <img src="docs/images/csv-importer.png" alt="CSV Importer Column Detection" width="900" style="border-radius: 10px; border: 1px solid #1e293b;" />
</p>

- Fuzzy header mapping auto-identifies `Business Name`, `Email`, `Phone`, `City`, and `Website`.
- Automatic phone/email sanitation and contact person extraction.
- Immediately assigns imported leads to target campaigns with live scoring.

---

## 🏗 System Architecture

```mermaid
flowchart TD
    subgraph Client ["Frontend Layer (React 18 + Vite + Tailwind CSS)"]
        UI[Duo Systems Dashboard]
        LF[Lead Discovery View]
        CAMP[Campaign Manager]
        CRM[Lead CRM & Drawer]
        OUT[Gmail Outreach Hub]
        IMP[CSV Normalizer & Importer]
        SHEETS[Google Sheets Hub]
    end

    subgraph Server ["Backend API (FastAPI + SQLAlchemy)"]
        ROUTER[FastAPI APIRouter]
        PLACES[Google Places Service]
        SCRAPER[Email Scraper Engine]
        SCORING[Transparent Scoring Service]
        WORKER[Background Email Queue Worker]
        GMAIL_SVC[Gmail OAuth Service]
        SHEETS_SVC[Google Sheets API Service]
        DB[(SQLite / PostgreSQL)]
    end

    subgraph External ["External Services"]
        G_PLACES[Google Places API (New)]
        G_MAIL[Gmail REST API]
        G_SHEETS[Google Sheets API v4]
    end

    UI --> ROUTER
    LF --> ROUTER
    CAMP --> ROUTER
    CRM --> ROUTER
    OUT --> ROUTER
    IMP --> ROUTER
    SHEETS --> ROUTER

    ROUTER --> PLACES
    ROUTER --> SCRAPER
    ROUTER --> SCORING
    ROUTER --> WORKER
    ROUTER --> GMAIL_SVC
    ROUTER --> SHEETS_SVC

    PLACES --> G_PLACES
    GMAIL_SVC --> G_MAIL
    WORKER --> GMAIL_SVC
    SHEETS_SVC --> G_SHEETS

    ROUTER --> DB
    WORKER --> DB
```

---

## 🛠 Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite 5 | Reactive Single Page Application |
| **Styling** | Tailwind CSS 3.4 | Dark glassmorphism slate-950 design system |
| **Icons** | Lucide React | High-clarity vector UI iconography |
| **Backend** | FastAPI (Python 3.11 / 3.12) | Asynchronous, OpenAPI-documented REST backend |
| **ORM / Database** | SQLAlchemy 2.0, SQLite / PostgreSQL | Relational models with cascade deletion |
| **Async Tasks** | Python `asyncio` Task Workers | In-memory throttling queues for email workflows |
| **Google APIs** | `google-api-python-client`, `google-auth` | OAuth 2.0 Gmail & Google Sheets integrations |
| **HTTP Client** | `httpx` | High-throughput asynchronous HTTP operations |

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- **Python**: Version `3.11` or `3.12`
- **Node.js**: Version `18.x` or `20.x` with `npm`

### 1. Clone the Repository
```bash
git clone https://github.com/pk1519/OutreachOS.git
cd OutreachOS
```

### 2. Configure Backend Environment
```bash
cd backend
cp .env.example .env
```
*(Optional: Add your Google Cloud credentials to `.env`. Leave empty to run with built-in high-fidelity simulation).*

### 3. Start Backend Server
```bash
# Set up Python virtual environment
python -m venv venv

# Windows:
.\venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000 --reload
```
*Backend runs at `http://127.0.0.1:8000` (Swagger docs: `http://127.0.0.1:8000/docs`).*

### 4. Start Frontend Client
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs at `http://localhost:5173`.*

---

## 🌐 Zero-Cost 24/7 Production Deployment

Follow this architecture to host the application **100% free**, with **zero cold starts**, and **prevent the backend from sleeping**:

```
[ Frontend: React / Vite ]  ──►  Vercel (Free Global Edge CDN, Never Sleeps)
[ Backend: FastAPI / Python] ──►  Render.com (Free Web Service)
[ Keep-Alive Heartbeat ]    ──►  UptimeRobot (Pings /health every 5 mins to prevent idle sleep)
```

### Step 1: Deploy Backend to Render (Deploy First)
1. Push code to GitHub.
2. Sign in to [Render.com](https://render.com) and click **New +** $\rightarrow$ **Web Service**.
3. Link your GitHub repository and set:
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** `Free`
4. Under **Environment Variables**, add:
   - `DATABASE_URL` = `sqlite:///./duo_leads.db` *(or a free [Neon.tech](https://neon.tech) PostgreSQL connection string for permanent persistence)*
   - `ENABLE_DEMO_SIMULATION` = `true`
5. Click **Create Web Service** and copy your live URL (e.g. `https://duo-api.onrender.com`).

### Step 2: Deploy Frontend to Vercel (Deploy Second)
1. Sign in to [Vercel.com](https://vercel.com) and click **Add New...** $\rightarrow$ **Project**.
2. Select your repository and configure:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Under **Environment Variables**, add:
   - `VITE_API_URL` = `https://duo-api.onrender.com` *(your Render backend URL, without trailing slash)*
4. Click **Deploy**. *(The included `frontend/vercel.json` ensures full SPA client-side routing support without 404s).*

### Step 3: Prevent Backend Sleep (UptimeRobot)
1. Sign in to [UptimeRobot.com](https://uptimerobot.com) (free).
2. Click **Add New Monitor**:
   - **Monitor Type:** `HTTP(s)`
   - **URL:** `https://duo-api.onrender.com/health`
   - **Monitoring Interval:** `Every 5 minutes`
3. **Result:** UptimeRobot pings `/health` 24/7 so Render never spins down, giving users **instant sub-second responses with zero cold starts**.

---

## ⚙️ Configuration & Environment Variables

| Variable | Scope | Default | Description |
| :--- | :--- | :--- | :--- |
| `GOOGLE_PLACES_API_KEY` | Backend | `""` | Google Cloud Places API (New) key |
| `GOOGLE_CLIENT_ID` | Backend | `""` | Google Cloud OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Backend | `""` | Google Cloud OAuth Client Secret |
| `ENABLE_DEMO_SIMULATION`| Backend | `true` | Enables high-fidelity simulation if API key is not supplied |
| `DATABASE_URL` | Backend | `sqlite:///./duo_leads.db` | SQLAlchemy database URI (SQLite or PostgreSQL) |
| `MAX_AREAS_PER_SEARCH` | Backend | `10` | Safety cap on sub-districts per discovery search |
| `VITE_API_URL` | Frontend | `""` (proxied) | Production backend origin when hosting frontend on Vercel |

---

## 📡 API Reference

### 🔍 Discovery & Scraping
- `POST /api/search` — Discover commercial prospects across categories, cities, and sub-areas.
- `GET /api/search/history` — Retrieve history of previous discovery operations.

### 📁 Campaigns
- `GET /api/campaigns` — Fetch all campaigns with lead counts, progress metrics, and statuses.
- `POST /api/campaigns` — Create a new campaign.
- `GET /api/campaigns/{id}` — Retrieve detailed configuration for a specific campaign.
- `PATCH /api/campaigns/{id}` — Update campaign parameters or status.
- `DELETE /api/campaigns/{id}` — **Complete database purge**: deletes the campaign, associated leads, scores, notes, tags, contacts, messages, recipients, and search records.
- `POST /api/campaigns/{id}/add-leads` — Batch add lead IDs to a campaign.

### 👥 Leads & CRM
- `GET /api/leads` — Query paginated leads with full-text search, campaign, score, and status filters.
- `POST /api/leads` — Create a lead manually with contact person details and instant scoring.
- `PATCH /api/leads/{id}/crm` — Update lead priority, status, notes, and follow-up timestamps.
- `DELETE /api/leads/{id}` — Remove a single lead and its child data from the database.
- `POST /api/leads/export/csv` — Stream an RFC 4180 compliant CSV file of filtered or all leads.
- `POST /api/leads/import/detect-columns` — Preview uploaded CSV headers and map to standard schema.
- `POST /api/leads/import` — Ingest and score leads from confirmed CSV mappings.

### ✉️ Outreach & Gmail
- `GET /api/campaigns/{id}/recipients` — View campaign recipient queue with delivery statuses.
- `POST /api/campaigns/{id}/validate` — Preflight validate recipients against format, suppression, and duplicate rules.
- `POST /api/campaigns/{id}/prepare` — Compile personalized templates and queue recipients.
- `POST /api/campaigns/{id}/test-email` — Send a test email strictly to a designated test recipient.
- `POST /api/campaigns/{id}/send` — Start background outreach sending worker.
- `POST /api/campaigns/{id}/pause` — Pause an active background sending queue.
- `POST /api/campaigns/{id}/resume` — Resume a paused campaign sending queue.
- `POST /api/campaigns/{id}/cancel` — Cancel an in-flight outreach job.

### 📊 Google Sheets Sync
- `GET /api/sheets/status` — Check server-side Google OAuth authorization state.
- `POST /api/sheets/connect-demo` — Activate local demo connection for spreadsheet testing.
- `POST /api/sheets/export` — Sync campaign leads to Google Sheets with automatic deduplication.
- `GET /api/sheets/destinations` — Retrieve sync history and live spreadsheet links.

---

## 🧪 Automated Test Suite

The repository includes comprehensive automated test coverage across all subsystems:

```bash
# Run complete test suite
cd backend
..\venv\Scripts\python.exe -m pytest tests/ -v

# Run campaign cascade purge verification specifically
..\venv\Scripts\python.exe -m pytest tests/test_campaign_delete_all_data.py -v

# Verify frontend production bundle
cd ../frontend
cmd /c npm run build
```

---

## 🖼️ Screenshot Guide

To give your repository a visual look, capture and add screenshots to the `docs/images/` folder as outlined below:

### Directory Structure:
```
docs/
└── images/
    ├── hero-dashboard.png       <-- Main overview of the dashboard
    ├── lead-finder.png          <-- Lead discovery search & results
    ├── campaigns.png            <-- Campaigns grid with cards & actions
    ├── leads-crm.png            <-- Leads table with scores and filters
    ├── gmail-outreach.png       <-- Outreach template & queue view
    ├── sheets-sync.png          <-- Google Sheets export modal / sync view
    └── csv-importer.png         <-- CSV upload & column mapping preview
```

### What to Capture for Each Image:

| File Name | Page to Capture | What to Show |
| :--- | :--- | :--- |
| **`hero-dashboard.png`** | `/` (Dashboard) | The main dashboard with metric cards, recent leads, and quick search. |
| **`lead-finder.png`** | `/lead-finder` | Search form filled in (e.g. *Gyms in Bangalore*) with multi-area tags and discovered cards. |
| **`campaigns.png`** | `/campaigns` | Grid of campaign cards showing status badges, lead counts, CSV download, and delete buttons. |
| **`leads-crm.png`** | `/leads` | The table showing business names, transparent scores (e.g. 85 High), tags, and the contact slide drawer. |
| **`gmail-outreach.png`** | `/outreach` | Outreach queue showing personalized template preview, preflight stats, and send controls. |
| **`sheets-sync.png`** | `/google-sheets` | The Google Sheets synchronization dialog or destination history with spreadsheet links. |
| **`csv-importer.png`** | `/import-csv` | The file uploader showing auto-detected column mappings and data preview. |

### 💡 Tips for High-Quality Screenshots:
1. **Resolution**: Maximize your browser window (1920x1080 or 1440x900) at 100% zoom.
2. **Clean Data**: Run a sample search (e.g., *Gyms in Bangalore*) so the tables have populated data.
3. **Format**: Save as `.png` for crisp text and sharp UI lines.
4. **Placement**: Put the `.png` files directly inside `docs/images/` with the exact names listed above. GitHub will automatically display them in this README.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

---

<p align="center">
  <b>Built by Priyanshu — Duo Systems Lead Finder & Outreach Center</b>
</p>
