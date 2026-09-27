import React, { useState } from 'react';
import { BookOpen, FileText, Shield, Cloud, Server, HelpCircle, Code, Layers } from 'lucide-react';

const DOC_ITEMS = [
  {
    id: 'architecture',
    title: 'ARCHITECTURE.md',
    icon: Layers,
    description: 'System design, services, Place ID deduplication, and Google policy boundaries.',
    content: `# System Architecture - DUO SYSTEMS LEAD FINDER

## 1. High-Level Architecture
DUO SYSTEMS LEAD FINDER is a specialized B2B discovery and CRM synchronizer engineered with:
- Strict adherence to Google Maps Platform policies (Places API New Text Search).
- Deduplication using Google Place ID.
- Dynamic scoring (0-100) with transparent internal criteria.
- Direct synchronization to Google Sheets using OAuth 2.0.

## 2. Universal Domain & Location Freedom
- Business Type: Any commercial category worldwide or user-defined keyword.
- Location: Any city, district, neighborhood, or multi-area array worldwide.
- No hardcoded regional or categorical constraints.

## 3. Data Separation
- Google-Derived Data: Business Name, Address, Phone, Website, Rating, Review Count, Place ID, Maps URL.
- Duo Systems CRM Data: Duo Lead Score, Lead Priority, Campaign, Outreach Status, Follow-up Dates, Notes.`
  },
  {
    id: 'google-cloud',
    title: 'GOOGLE_CLOUD_SETUP.md',
    icon: Cloud,
    description: 'Enabling Places API (New), Google Sheets API, and configuring billing & API keys.',
    content: `# Google Cloud Setup Guide

1. Create a Google Cloud Project named "Duo-Systems-Lead-Finder".
2. Enable "Places API (New)" and "Google Sheets API" in APIs & Services > Library.
3. Link an active billing account (Google provides $200 free monthly credit).
4. Create an API Key in Credentials, restrict it specifically to "Places API (New)".
5. Save the key in your .env or the in-app Settings page under GOOGLE_PLACES_API_KEY.`
  },
  {
    id: 'sheets-setup',
    title: 'GOOGLE_SHEETS_SETUP.md',
    icon: FileText,
    description: 'OAuth 2.0 configuration, duplicate protection, and automated dashboard tab generation.',
    content: `# Google Sheets Setup Guide

1. Primary Export Destination: Google Sheets is the direct sync target.
2. In Google Cloud Console, configure the OAuth Consent Screen (External, with ../auth/spreadsheets scope).
3. Create OAuth 2.0 Client ID (Web Application) with redirect URI: http://localhost:8000/api/sheets/oauth-callback.
4. Duplicate Protection: Before adding rows, Duo Systems queries existing Place IDs in the destination tab. Existing entries are skipped or updated according to user preference.
5. Dynamic Dashboard Tab: Generates summary KPIs, priority breakdown, and outreach funnel numbers.`
  },
  {
    id: 'setup',
    title: 'SETUP.md',
    icon: Server,
    description: 'Local development setup instructions for Python FastAPI backend and React frontend.',
    content: `# Local Setup & Installation

## Backend (FastAPI + SQLAlchemy)
\`\`\`bash
python -m venv venv
.\\venv\\Scripts\\activate  # On Windows
pip install -r backend/requirements.txt
uvicorn app.main:app --app-dir backend --reload --port 8000
\`\`\`

## Frontend (React + TypeScript + Vite + Tailwind)
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
Visit http://localhost:5173 to access the platform.`
  },
  {
    id: 'security',
    title: 'SECURITY.md',
    icon: Shield,
    description: 'Places API policy compliance, token isolation, and human-in-the-loop CRM rules.',
    content: `# Security & Compliance Policy

- No HTML Scraping: Never scrapes Google Maps HTML or uses headless browsers to bypass Google terms.
- Strict FieldMask: Uses explicit field lists (places.id, places.displayName, etc.). Never uses wildcard (*).
- Server-Side Token Isolation: Google API keys and OAuth tokens are never transmitted to the client browser.
- Human-in-the-Loop CRM: Outreach pitches are generated for sales rep review. The platform never sends autonomous messages.`
  },
  {
    id: 'client-guide',
    title: 'CLIENT_USAGE_GUIDE.md',
    icon: BookOpen,
    description: 'End-user workflow guide from discovery to lead qualification and Sheets management.',
    content: `# Duo Systems Client Usage Guide

## Step 1: Discover Leads
- Open 'Find Leads'. Select or type any business domain (e.g. "Gyms", "Schools", "Restaurants").
- Enter any location worldwide (e.g. "Bangalore", "Lucknow", "Dubai").
- Add optional neighborhoods (e.g. "Koramangala", "Indiranagar", "HSR Layout") for deep coverage.
- Click 'Find Leads'. Results are automatically deduplicated by Place ID.

## Step 2: Review Duo Lead Score
- Inspect leads in the table. Click any lead to open the side panel and inspect the transparent scoring reasons.

## Step 3: Export to Google Sheets
- Click 'Export Leads to Google Sheets'. Place IDs are checked to prevent duplicates.
- The dynamic Campaign Dashboard tab is created automatically in your Google Sheet.`
  },
  {
    id: 'troubleshooting',
    title: 'TROUBLESHOOTING.md',
    icon: HelpCircle,
    description: 'Resolving 403 API key errors, billing notices, OAuth redirect issues, and rate limits.',
    content: `# Troubleshooting Guide

### 1. "Google Places API Key Error: 403 Forbidden"
- Cause: Places API (New) is not enabled on your Google Cloud project or billing is inactive.
- Solution: Visit Google Cloud Console > APIs & Services > Library > Enable "Places API (New)", and confirm a billing account is linked.

### 2. "Spreadsheet Not Found / Permission Denied"
- Cause: The authorized Google Account does not have write access to the target sheet.
- Solution: Ensure the target Google Sheet is shared with your account or created using the in-app export wizard.`
  }
];

export const Documentation: React.FC = () => {
  const [activeDocId, setActiveDocId] = useState('architecture');
  const activeDoc = DOC_ITEMS.find(d => d.id === activeDocId) || DOC_ITEMS[0];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white">Platform Documentation</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Comprehensive guides for architecture, Google Cloud configuration, and CRM workflows.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="space-y-1.5 lg:col-span-1">
          {DOC_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeDocId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveDocId(item.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-indigo-600 border-indigo-500 text-white font-bold shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
                  <span className="text-xs font-mono">{item.title}</span>
                </div>
                <p className={`text-[10px] mt-1 line-clamp-1 ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Document Viewer */}
        <div className="lg:col-span-3 p-8 rounded-2xl bg-slate-900 border border-slate-800 min-h-[500px]">
          <div className="prose prose-invert max-w-none text-xs text-slate-300 leading-relaxed font-sans space-y-4">
            <pre className="font-mono text-xs whitespace-pre-wrap bg-slate-950 p-6 rounded-xl border border-slate-800 text-slate-200 leading-relaxed">
              {activeDoc.content}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
