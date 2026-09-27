import React, { useState, useEffect } from 'react';
import {
  ShieldBan,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Search,
  RefreshCw,
  Mail
} from 'lucide-react';
import { api } from '../api/client';
import { SuppressionItem } from '../types';

export const SuppressionList: React.FC = () => {
  const [items, setItems] = useState<SuppressionItem[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newReason, setNewReason] = useState<string>('MANUAL_BLOCK');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ success: boolean; message: string } | null>(null);

  const fetchSuppression = async () => {
    setLoading(true);
    try {
      const data = await api.getSuppressionList();
      setItems(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppression();
  }, []);

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    try {
      await api.addToSuppressionList(newEmail.trim(), newReason);
      setNewEmail('');
      setActionNotice({ success: true, message: `Added ${newEmail.trim()} to suppression list.` });
      await fetchSuppression();
    } catch (err: any) {
      setActionNotice({ success: false, message: err.message || 'Failed to add email to suppression list.' });
    }
  };

  const handleDelete = async (id: number, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from the suppression list?`)) return;

    try {
      await api.deleteFromSuppressionList(id);
      setActionNotice({ success: true, message: `Removed ${email} from suppression list.` });
      await fetchSuppression();
    } catch (err: any) {
      setActionNotice({ success: false, message: err.message || 'Failed to remove entry.' });
    }
  };

  const filteredItems = items.filter(item =>
    item.email.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldBan className="w-3.5 h-3.5" />
            <span>Outreach Center & Compliance</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Suppression List</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Emails listed here are strictly blocked and automatically SKIPPED before every Gmail API campaign delivery.
          </p>
        </div>

        <button
          onClick={fetchSuppression}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700/60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {actionNotice && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
            actionNotice.success
              ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/40 border border-rose-800/60 text-rose-300'
          }`}
        >
          {actionNotice.success ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{actionNotice.message}</span>
        </div>
      )}

      {/* Add Email Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Plus className="w-4 h-4 text-indigo-400" />
          <span>Add Email to Suppression Blocklist</span>
        </h2>

        <form onSubmit={handleAddEmail} className="flex flex-col sm:flex-row gap-3 items-stretch">
          <div className="flex-1 relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="e.g. do-not-contact@example.com"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <select
            value={newReason}
            onChange={e => setNewReason(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="MANUAL_BLOCK">MANUAL_BLOCK</option>
            <option value="UNSUBSCRIBED">UNSUBSCRIBED</option>
            <option value="DO_NOT_CONTACT">DO_NOT_CONTACT</option>
            <option value="BOUNCED">BOUNCED</option>
          </select>

          <button
            type="submit"
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-1.5"
          >
            <ShieldBan className="w-4 h-4" />
            <span>Block Email</span>
          </button>
        </form>
      </div>

      {/* Suppression List Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Blocked Emails ({filteredItems.length})
          </h2>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search suppression list..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Blocked Email Address</th>
                <th className="px-5 py-3">Reason</th>
                <th className="px-5 py-3">Added Date</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                    No emails on suppression list.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3 font-mono font-semibold text-slate-200">
                      {item.email}
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-rose-950/80 text-rose-400 border border-rose-800/60">
                        {item.reason}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400 font-mono text-[11px]">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.email)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition-colors"
                        title="Remove from blocklist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
