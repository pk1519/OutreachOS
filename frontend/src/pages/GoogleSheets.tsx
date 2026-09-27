import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  Download
} from 'lucide-react';
import { SheetsConnect } from '../components/SheetsConnect';
import { SheetsExportDialog } from '../components/SheetsExportDialog';
import { api } from '../api/client';
import { SheetDestination, Campaign } from '../types';

export const GoogleSheets: React.FC = () => {
  const [destinations, setDestinations] = useState<SheetDestination[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);

  const fetchDestinations = async () => {
    try {
      const data = await api.getSheetDestinations();
      setDestinations(data);
    } catch {
      // ignore
    }
  };

  const fetchCampaigns = async () => {
    try {
      const data = await api.getCampaigns();
      setCampaigns(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchDestinations();
    fetchCampaigns();
  }, []);

  const handleDownloadCsv = async () => {
    try {
      await api.downloadLeadsCsv(undefined, selectedCampaignId || undefined, `duo_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (err: any) {
      alert(`CSV download error: ${err.message}`);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Primary Export Hub</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">Google Sheets & CSV Export</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Directly synchronize leads to Google Sheets with Place ID deduplication, or download offline CSV files formatted for instant CRM importing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadCsv}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-extrabold text-xs border border-slate-700/80 flex items-center gap-2 transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Download CSV</span>
          </button>
          <button
            onClick={() => setIsExportDialogOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Launch Sheets Wizard</span>
          </button>
        </div>
      </div>

      {/* Google OAuth Connection Widget */}
      <SheetsConnect />

      {/* Feature Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-sm text-white">Place ID Deduplication</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Reads existing Place IDs in the destination worksheet prior to appending. Duplicate leads are safely skipped with full transparency.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-sm text-white">Dynamic Campaign Tabs</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every campaign creates or updates its own dedicated tab (e.g., "Bangalore Gyms", "Lucknow Schools", "Dubai Real Estate").
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-sm text-white">Automated KPI Dashboard Tab</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Optionally builds a Google Sheet Dashboard tab with summary cards, priority breakdowns, and outreach status metrics.
          </p>
        </div>
      </div>

      {/* Previous Export Destinations */}
      <div className="space-y-4">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
          Exported Google Sheets Destinations
        </h3>

        {destinations.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
            No Google Sheets exports completed yet. Use the <strong>Export Wizard</strong> above to push leads.
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden divide-y divide-slate-800/80">
            {destinations.map((dest) => (
              <div key={dest.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">{dest.spreadsheet_title}</h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Tab: <span className="text-cyan-400 font-semibold">{dest.worksheet_title}</span> • {dest.leads_synced_count} leads synced
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400">
                    {dest.last_synced_at ? new Date(dest.last_synced_at).toLocaleString() : ''}
                  </span>
                  {dest.spreadsheet_url && (
                    <a
                      href={dest.spreadsheet_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold transition-colors"
                    >
                      <span>Open Sheet</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sheets Export Dialog Modal */}
      <SheetsExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => {
          setIsExportDialogOpen(false);
          fetchDestinations();
        }}
        campaignId={selectedCampaignId || undefined}
        defaultWorksheetTitle="Duo Systems Leads"
      />
    </div>
  );
};
