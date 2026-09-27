import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Search,
  Users,
  FolderKanban,
  UploadCloud,
  FileSpreadsheet,
  History,
  Settings as SettingsIcon,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { api } from '../api/client';
import { GoogleConnectionStatus } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [sheetsStatus, setSheetsStatus] = useState<GoogleConnectionStatus | null>(null);

  useEffect(() => {
    const fetchStatus = () => {
      api.getGoogleStatus()
        .then(s => setSheetsStatus(s))
        .catch(() => setSheetsStatus({ is_connected: false, has_refresh_token: false }));
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-64 flex-shrink-0 bg-slate-900/95 backdrop-blur-md border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 z-30 select-none">
      <div className="flex-1 overflow-y-auto">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-wider text-white">DUO SYSTEMS</h1>
              <p className="text-[10px] text-indigo-400 font-semibold tracking-wide uppercase">Lead Finder & Campaigns</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1.5">
          {/* Dashboard */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          {/* Lead Finder */}
          <button
            onClick={() => setActiveTab('find-leads')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              activeTab === 'find-leads'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <Search className="w-4 h-4" />
              <span>Lead Finder</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 uppercase tracking-wider">
              Places API
            </span>
          </button>

          {/* Leads CRM */}
          <button
            onClick={() => setActiveTab('leads')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              activeTab === 'leads'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Leads</span>
          </button>

          {/* Campaigns */}
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              activeTab === 'campaigns'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span>Campaigns</span>
          </button>

          {/* Import CSV */}
          <button
            onClick={() => setActiveTab('import-leads')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              activeTab === 'import-leads'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-4 h-4 text-cyan-400" />
            <span>Import CSV</span>
          </button>

          {/* Exports / Google Sheets */}
          <button
            onClick={() => setActiveTab('sheets')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              activeTab === 'sheets'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-emerald-400 hover:bg-slate-800/70 hover:text-emerald-300'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Google Sheets & CSV</span>
          </button>

          {/* Search History */}
          <button
            onClick={() => setActiveTab('search-history')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              activeTab === 'search-history'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Search History</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </nav>
      </div>

      {/* Footer System Status with Google Sheets Indicator */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/80 backdrop-blur-md">
        <div
          onClick={() => setActiveTab('sheets')}
          className="cursor-pointer group p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-emerald-600/50 transition-all"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Google Sheets
            </span>
            {sheetsStatus?.is_connected ? (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                Ready
              </span>
            )}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            {sheetsStatus?.user_email || 'Click to Connect Sheets'}
          </div>
        </div>
      </div>
    </aside>
  );
};
