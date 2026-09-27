import React, { useState } from 'react';
import {
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../api/client';

interface SheetsExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLeadIds?: number[];
  campaignId?: number | null;
  defaultWorksheetTitle?: string;
}

export const SheetsExportDialog: React.FC<SheetsExportDialogProps> = ({
  isOpen,
  onClose,
  selectedLeadIds = [],
  campaignId,
  defaultWorksheetTitle = 'Duo Leads Export'
}) => {
  if (!isOpen) return null;

  const [spreadsheetId, setSpreadsheetId] = useState('1_DuoSystemsLeadsDB_Spreadsheet');
  const [worksheetTitle, setWorksheetTitle] = useState(defaultWorksheetTitle);
  const [createDashboardTab, setCreateDashboardTab] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExporting(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.exportLeadsToSheet({
        spreadsheet_id: spreadsheetId.trim(),
        worksheet_title: worksheetTitle.trim(),
        lead_ids: selectedLeadIds.length > 0 ? selectedLeadIds : undefined,
        campaign_id: campaignId || undefined,
        create_dashboard_tab: createDashboardTab,
        update_existing: updateExisting
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Export to Google Sheets failed.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Export to Google Sheets</h3>
              <p className="text-[11px] text-slate-400">Primary Duo Systems CRM synchronization</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content / Form */}
        <div className="p-6 space-y-4 text-xs">
          {result ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3 text-emerald-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-extrabold text-sm text-white">Export Completed Successfully</div>
                  <p className="text-xs text-slate-300">{result.message}</p>
                </div>
              </div>

              {/* Deduplication Summary breakdown */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="font-extrabold text-sm text-white">{result.existing_count}</div>
                  <div className="text-[9px] text-slate-400 uppercase font-semibold">Existing</div>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-emerald-500/30">
                  <div className="font-extrabold text-sm text-emerald-400">{result.new_added}</div>
                  <div className="text-[9px] text-emerald-300 uppercase font-semibold">New Added</div>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-amber-500/30">
                  <div className="font-extrabold text-sm text-amber-400">{result.duplicates_skipped}</div>
                  <div className="text-[9px] text-amber-300 uppercase font-semibold">Duplicates</div>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-indigo-500/30">
                  <div className="font-extrabold text-sm text-indigo-400">{result.updated_count}</div>
                  <div className="text-[9px] text-indigo-300 uppercase font-semibold">Updated</div>
                </div>
              </div>

              {result.dashboard_created && (
                <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-[11px] text-cyan-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>Dynamic Campaign Dashboard tab was created with real CRM metrics and KPI cards.</span>
                </div>
              )}

              <div className="pt-2 flex justify-between items-center">
                <a
                  href={result.spreadsheet_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Google Sheet</span>
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleExport} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Spreadsheet ID or Name</label>
                <input
                  type="text"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  placeholder="e.g. Duo Systems Lead Database"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Spreadsheet identifier or URL from your Google Drive.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Target Worksheet (Tab) Name
                </label>
                <input
                  type="text"
                  value={worksheetTitle}
                  onChange={(e) => setWorksheetTitle(e.target.value)}
                  placeholder="e.g. Bangalore Gyms, Lucknow Schools, Dubai Real Estate"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Automatically adapts tab title to your active campaign or business domain.
                </p>
              </div>

              {/* Options */}
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2.5">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createDashboardTab}
                    onChange={(e) => setCreateDashboardTab(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-white">Create/Update Campaign Dashboard Tab</span>
                </label>
                <p className="text-[10px] text-slate-400 pl-5">
                  Generates summary statistics, priority breakdown, and outreach funnel numbers inside the Google Sheet.
                </p>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={updateExisting}
                    onChange={(e) => setUpdateExisting(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Update Existing Leads (Refresh notes & CRM status for matching Place IDs)</span>
                </label>
              </div>

              {/* Export Button */}
              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isExporting}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all"
                >
                  {isExporting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Export to Google Sheets</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
