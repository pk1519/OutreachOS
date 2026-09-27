import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Pause,
  XCircle,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Send,
  Building,
  Mail,
  RefreshCw,
  TrendingUp,
  Inbox
} from 'lucide-react';
import { api } from '../api/client';
import { Campaign } from '../types';

export const EmailQueue: React.FC = () => {
  const [queueData, setQueueData] = useState<{
    summary: any;
    active_campaigns: any[];
    queue_preview: any[];
  } | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchQueue = async () => {
    try {
      const [qData, camps] = await Promise.all([
        api.getEmailQueue(),
        api.getCampaigns()
      ]);
      setQueueData(qData);
      setCampaigns(camps);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchQueue().finally(() => setLoading(false));

    // Auto-refresh queue while looking at this page
    const interval = setInterval(fetchQueue, 4000);
    return () => clearInterval(interval);
  }, []);

  const handlePause = async (id: number) => {
    setActionLoadingId(id);
    try {
      await api.pauseCampaign(id);
      await fetchQueue();
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResume = async (id: number) => {
    setActionLoadingId(id);
    try {
      await api.resumeCampaign(id);
      await fetchQueue();
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this campaign? Pending emails will not be sent.')) return;
    setActionLoadingId(id);
    try {
      await api.cancelCampaign(id);
      await fetchQueue();
    } finally {
      setActionLoadingId(null);
    }
  };

  const summary = queueData?.summary || {
    sent: 0,
    pending: 0,
    failed: 0,
    skipped: 0,
    active_campaigns_count: 0
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Outreach Center</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Email Queue & Active Jobs</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor real-time background email workers, delivery status, and rate limits.
          </p>
        </div>

        <button
          onClick={() => {
            setLoading(true);
            fetchQueue().finally(() => setLoading(false));
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700/60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-bold uppercase">
            <span>Sent</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-white">{summary.sent}</p>
          <span className="text-[10px] text-slate-400">Delivered via Gmail API</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-indigo-400 text-xs font-bold uppercase">
            <span>Pending</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-white">{summary.pending}</p>
          <span className="text-[10px] text-slate-400">In sending queue</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-rose-400 text-xs font-bold uppercase">
            <span>Failed</span>
            <AlertCircle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-white">{summary.failed}</p>
          <span className="text-[10px] text-slate-400">Permanent delivery errors</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-purple-400 text-xs font-bold uppercase">
            <span>Skipped</span>
            <Inbox className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-white">{summary.skipped}</p>
          <span className="text-[10px] text-slate-400">Suppressed or invalid</span>
        </div>
      </div>

      {/* Campaigns Monitor */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          <span>Active & Recent Campaigns</span>
        </h2>

        {campaigns.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No campaigns created yet.</p>
        ) : (
          <div className="space-y-4">
            {campaigns.map(c => {
              const total = c.total_recipients || (c.sent_count + c.pending_count + c.failed_count + c.skipped_count) || 1;
              const percent = Math.min(100, Math.round((c.sent_count / total) * 100));

              return (
                <div
                  key={c.id}
                  className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3 transition-all hover:border-slate-700"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="font-extrabold text-sm text-white">{c.name}</h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                            c.status === 'RUNNING'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60 animate-pulse'
                              : c.status === 'PAUSED'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                              : c.status === 'COMPLETED'
                              ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                              : c.status === 'CANCELLED'
                              ? 'bg-rose-950 text-rose-400 border border-rose-800/60'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Domain: <span className="text-slate-300">{c.business_type}</span> in{' '}
                        <span className="text-slate-300">{c.location}</span> • Rate: {c.emails_per_minute || 10}/min
                      </p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                      {c.status === 'RUNNING' && (
                        <button
                          type="button"
                          disabled={actionLoadingId === c.id}
                          onClick={() => handlePause(c.id)}
                          className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-600/40 text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pause</span>
                        </button>
                      )}

                      {c.status === 'PAUSED' && (
                        <button
                          type="button"
                          disabled={actionLoadingId === c.id}
                          onClick={() => handleResume(c.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-600/40 text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          <Play className="w-3.5 h-3.5 fill-emerald-300" />
                          <span>Resume</span>
                        </button>
                      )}

                      {['RUNNING', 'PAUSED', 'QUEUED'].includes(c.status) && (
                        <button
                          type="button"
                          disabled={actionLoadingId === c.id}
                          onClick={() => handleCancel(c.id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-600/40 text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs text-slate-400 font-mono">
                      <span>Progress: {c.sent_count} / {c.total_recipients || total}</span>
                      <span>{percent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Breakdown tags */}
                  <div className="flex flex-wrap gap-3 text-xs pt-1">
                    <span className="text-emerald-400">Sent: <strong>{c.sent_count}</strong></span>
                    <span className="text-slate-400">•</span>
                    <span className="text-indigo-400">Pending: <strong>{c.pending_count}</strong></span>
                    <span className="text-slate-400">•</span>
                    <span className="text-rose-400">Failed: <strong>{c.failed_count}</strong></span>
                    <span className="text-slate-400">•</span>
                    <span className="text-purple-400">Skipped: <strong>{c.skipped_count}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Real-time Queue Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>Pending Queue Items (Up to Next 100)</span>
        </h2>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Queued At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {(queueData?.queue_preview || []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    Queue is currently empty. Launch a campaign to see pending queue tasks.
                  </td>
                </tr>
              ) : (
                queueData!.queue_preview.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-200">{item.name || item.company}</div>
                      <div className="text-[11px] font-mono text-cyan-400">{item.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-medium">{item.campaign_name || 'Campaign'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                      {item.created_at ? new Date(item.created_at).toLocaleTimeString() : 'Just now'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
