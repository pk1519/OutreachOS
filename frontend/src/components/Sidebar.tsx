import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Search,
  Users,
  Send,
  FolderKanban,
  PlusCircle,
  Clock,
  Inbox,
  UploadCloud,
  ShieldBan,
  FileSpreadsheet,
  History,
  BarChart3,
  Settings as SettingsIcon,
  ChevronDown,
  ChevronRight,
  Sparkles,
  MailCheck,
  MailWarning
} from 'lucide-react';
import { api } from '../api/client';
import { GmailStatus } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [outreachOpen, setOutreachOpen] = useState(true);
  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null);

  useEffect(() => {
    const fetchStatus = () => {
      api.getGmailStatus()
        .then(s => setGmailStatus(s))
        .catch(() => setGmailStatus({ is_connected: false }));
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const isOutreachActive = [
    'campaigns',
    'create-campaign',
    'email-queue',
    'email-history',
    'import-leads',
    'suppression-list'
  ].includes(activeTab);

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
              <p className="text-[10px] text-indigo-400 font-semibold tracking-wide uppercase">Lead Finder & Outreach</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
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
              New API
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

          {/* Outreach Accordion */}
          <div className="pt-2">
            <button
              onClick={() => setOutreachOpen(!outreachOpen)}
              className={`w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                isOutreachActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Send className="w-3.5 h-3.5" />
                <span>Outreach Center</span>
              </div>
              {outreachOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {outreachOpen && (
              <div className="ml-3 pl-3 border-l border-slate-800 space-y-1 mt-1">
                <button
                  onClick={() => setActiveTab('campaigns')}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeTab === 'campaigns'
                      ? 'bg-indigo-600/30 text-indigo-300 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <FolderKanban className="w-3.5 h-3.5" />
                  <span>Campaigns</span>
                </button>

                <button
                  onClick={() => setActiveTab('create-campaign')}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeTab === 'create-campaign'
                      ? 'bg-indigo-600/30 text-indigo-300 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Create Campaign</span>
                </button>

                <button
                  onClick={() => setActiveTab('email-queue')}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeTab === 'email-queue'
                      ? 'bg-indigo-600/30 text-indigo-300 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Email Queue</span>
                </button>

                <button
                  onClick={() => setActiveTab('email-history')}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeTab === 'email-history'
                      ? 'bg-indigo-600/30 text-indigo-300 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <Inbox className="w-3.5 h-3.5" />
                  <span>Email History</span>
                </button>

                <button
                  onClick={() => setActiveTab('import-leads')}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeTab === 'import-leads'
                      ? 'bg-indigo-600/30 text-indigo-300 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Imported Leads</span>
                </button>

                <button
                  onClick={() => setActiveTab('suppression-list')}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeTab === 'suppression-list'
                      ? 'bg-indigo-600/30 text-indigo-300 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <ShieldBan className="w-3.5 h-3.5" />
                  <span>Suppression List</span>
                </button>
              </div>
            )}
          </div>

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

          {/* Exports / Google Sheets */}
          <button
            onClick={() => setActiveTab('sheets')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              activeTab === 'sheets'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-emerald-400 hover:bg-slate-800/70 hover:text-emerald-300'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exports & Sheets</span>
          </button>

          {/* Analytics */}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
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

      {/* Footer System Status with Gmail Indicator */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/80 backdrop-blur-md">
        <div
          onClick={() => setActiveTab('settings')}
          className="cursor-pointer group p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              Gmail Outreach
            </span>
            {gmailStatus?.is_connected ? (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Disconnected
              </span>
            )}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            {gmailStatus?.account_email || 'contact.devworks7@gmail.com'}
          </div>
        </div>
      </div>
    </aside>
  );
};
