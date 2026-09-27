import React, { useState, useEffect } from 'react';
import { Activity, Globe, FileSpreadsheet, ShieldAlert, AlertTriangle, Layers, Copy } from 'lucide-react';
import { api } from '../api/client';
import { ApiUsageStats } from '../types';

export const ApiUsage: React.FC = () => {
  const [stats, setStats] = useState<ApiUsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsage = async () => {
    setIsLoading(true);
    try {
      const data = await api.getApiUsage();
      setStats(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  const cards = [
    {
      title: 'Places API (New) Requests',
      value: stats?.places_api_requests || 0,
      icon: Globe,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      description: 'Official POST /places:searchText calls'
    },
    {
      title: 'Completed Search Sessions',
      value: stats?.total_searches || 0,
      icon: Activity,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      description: 'Discovered business domain campaigns'
    },
    {
      title: 'Pages Requested',
      value: stats?.pages_requested || 0,
      icon: Layers,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      description: 'Paginated batches processed'
    },
    {
      title: 'Raw Businesses Returned',
      value: stats?.businesses_returned || 0,
      icon: Activity,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      description: 'Establishments parsed from API'
    },
    {
      title: 'Duplicate Leads Prevented',
      value: stats?.duplicates_prevented || 0,
      icon: ShieldAlert,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      description: 'Deduplicated strictly by Place ID'
    },
    {
      title: 'Google Sheets API Requests',
      value: stats?.sheets_api_requests || 0,
      icon: FileSpreadsheet,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      description: 'Sheet creations, appends & updates'
    },
    {
      title: 'API Errors Encountered',
      value: stats?.errors_count || 0,
      icon: AlertTriangle,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      description: 'Rate limits, timeouts, or quota alerts'
    }
  ];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white">Google Cloud API Telemetry</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Real-time count of requests dispatched to Google Places API (New) and Google Sheets API.
        </p>
      </div>

      {/* Disclaimers & Safety Notice */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-extrabold text-white">Usage & Quota Notice</div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            These figures represent internal application request counts dispatched by the backend.
            They are not Google Cloud billing figures unless official Cloud Billing export APIs are activated.
            Google grants $200 free monthly credit for Maps Platform services.
          </p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">{c.title}</span>
                <div className={`p-2 rounded-xl border ${c.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white font-mono">
                {c.value.toLocaleString()}
              </div>
              <p className="text-[10px] text-slate-400">{c.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
