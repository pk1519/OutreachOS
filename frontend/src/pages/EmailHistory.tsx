import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Eye,
  RefreshCw,
  MailCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { api } from '../api/client';
import { EmailMessage, Campaign } from '../types';

export const EmailHistory: React.FC = () => {
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Message preview modal
  const [previewMessage, setPreviewMessage] = useState<EmailMessage | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getEmailHistory({
        campaign_id: selectedCampaignId || undefined,
        status: selectedStatus || undefined,
        search: searchTerm.trim() || undefined,
        page,
        page_size: pageSize
      });
      setMessages(res.messages);
      setTotal(res.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getCampaigns().then(setCampaigns).catch(() => {});
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [page, selectedCampaignId, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Inbox className="w-3.5 h-3.5" />
            <span>Outreach Center</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Email History & Audit Log</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Searchable log of all emails sent via official Gmail API with message IDs and delivery statuses.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700/60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search recipient, company, subject, or Gmail message ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedCampaignId}
              onChange={e => {
                setSelectedCampaignId(e.target.value ? Number(e.target.value) : '');
                setPage(1);
              }}
              className="px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Campaigns</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={e => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="SENT">Sent</option>
              <option value="FAILED">Failed</option>
              <option value="SKIPPED">Skipped</option>
              <option value="PENDING">Pending</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* History Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Recipient & Business</th>
                <th className="px-5 py-3.5">Subject</th>
                <th className="px-5 py-3.5">Campaign</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Gmail Message ID</th>
                <th className="px-5 py-3.5">Sent At</th>
                <th className="px-5 py-3.5 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {messages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    No emails logged yet. Launch a campaign or send a test email to record history.
                  </td>
                </tr>
              ) : (
                messages.map(m => {
                  const isSent = m.status === 'SENT';
                  const isFailed = m.status === 'FAILED';
                  return (
                    <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-200">{m.company || 'Business'}</div>
                        <div className="text-[11px] font-mono text-cyan-400">{m.recipient_email}</div>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-200 max-w-xs truncate">
                        {m.subject}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">{m.campaign_name || 'Campaign'}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1 ${
                            isSent
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                              : isFailed
                              ? 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                              : 'bg-purple-950/80 text-purple-400 border border-purple-800/60'
                          }`}
                        >
                          {isSent && <CheckCircle2 className="w-3 h-3" />}
                          {isFailed && <AlertCircle className="w-3 h-3" />}
                          <span>{m.status}</span>
                        </span>
                        {m.failure_reason && (
                          <div className="text-[10px] text-rose-400/80 truncate max-w-xs mt-0.5">
                            {m.failure_reason}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
                        {m.gmail_message_id ? (
                          <span className="text-indigo-400 truncate block max-w-[140px]">
                            {m.gmail_message_id}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {m.sent_at ? new Date(m.sent_at).toLocaleString() : (m.created_at ? new Date(m.created_at).toLocaleString() : '—')}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setPreviewMessage(m)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-300 transition-colors"
                          title="View Message"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > pageSize && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {messages.length} of {total} messages
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-white">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rendered Email Modal */}
      {previewMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white">Delivered Email Message</h3>
                <p className="text-xs text-slate-400 font-mono">Gmail Message ID: {previewMessage.gmail_message_id || 'Simulated'}</p>
              </div>
              <button
                onClick={() => setPreviewMessage(null)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-slate-800 rounded-lg"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex">
                <span className="text-slate-400 w-20">To:</span>
                <span className="text-cyan-400 font-mono">{previewMessage.recipient_email}</span>
              </div>
              <div className="flex">
                <span className="text-slate-400 w-20">From:</span>
                <span className="text-slate-300 font-mono">{previewMessage.sender_email}</span>
              </div>
              <div className="flex">
                <span className="text-slate-400 w-20">Subject:</span>
                <span className="text-white font-semibold">{previewMessage.subject}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-sans max-h-80 overflow-y-auto">
              {previewMessage.rendered_body}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
