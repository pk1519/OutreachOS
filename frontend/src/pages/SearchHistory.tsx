import React, { useState, useEffect } from 'react';
import { History, Search, MapPin, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';
import { SearchHistoryItem } from '../types';

export const SearchHistory: React.FC = () => {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSearchHistory();
      setHistory(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white">Discovery Audit Log</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit trail of Places API queries, area expansions, and deduplication statistics.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Compliant Metadata Tracking</span>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading audit history...</div>
      ) : history.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400 space-y-2">
          <History className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="font-semibold text-slate-300">No search operations recorded yet.</p>
          <p>Discovered searches will be logged here with deduplication metrics.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Search ID</th>
                <th className="py-3 px-4">Category / Domain</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Sub-Areas</th>
                <th className="py-3 px-4 text-center">Raw Results</th>
                <th className="py-3 px-4 text-center">Unique Leads</th>
                <th className="py-3 px-4 text-center">Duplicates Skipped</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-400">#{item.id}</td>
                  <td className="py-3 px-4 font-bold text-white">{item.business_type}</td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                      <span>{item.location}{item.country ? `, ${item.country}` : ''}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[11px] text-slate-400 max-w-[160px] truncate">
                    {item.areas || 'Primary region'}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-semibold text-slate-300">
                    {item.raw_result_count}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">
                    {item.unique_count}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-amber-400">
                    {item.duplicate_count}
                  </td>
                  <td className="py-3 px-4">
                    {item.status === 'Completed' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Failed</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-[11px] text-slate-400">
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
