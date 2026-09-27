import React, { useState, useEffect } from 'react';
import {
  Send,
  MessageSquare,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Calendar,
  Sparkles,
  Phone,
  Globe,
  MoreVertical,
  ExternalLink
} from 'lucide-react';
import { api } from '../api/client';
import { Lead } from '../types';
import { ScoreBadge } from '../components/ScoreBadge';
import { StatusBadge } from '../components/StatusBadge';
import { LeadDrawer } from '../components/LeadDrawer';

export const Outreach: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [activeDrawerLead, setActiveDrawerLead] = useState<Lead | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fetchOutreachLeads = async () => {
    setIsLoading(true);
    try {
      const res = await api.getLeads({
        outreach_status: activeTab === 'All' ? undefined : activeTab,
        page_size: 100
      });
      setLeads(res.leads);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOutreachLeads();
  }, [activeTab]);

  const handleQuickStatusUpdate = async (leadId: number, newStatus: string) => {
    try {
      const updated = await api.updateLeadCRM(leadId, { outreach_status: newStatus });
      setLeads(prev => prev.map(l => l.id === leadId ? updated : l));
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleCopyDraft = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const tabs = [
    'All',
    'Not Contacted',
    'Contacted',
    'Replied',
    'Interested',
    'Demo Scheduled',
    'Follow-up Required',
    'Won'
  ];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Outreach & Pipeline Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage conversations, schedule follow-ups, and review tailored B2B pitches with human signoff.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Human Review Mandatory Prior to Outreach</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Leads Pipeline Cards */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading outreach records...</div>
      ) : leads.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400 space-y-2">
          <p className="font-semibold text-slate-300">No leads in the "{activeTab}" status stage.</p>
          <p>Discover new leads or update existing leads to populate this pipeline.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leads.map((lead) => {
            const hasDraft = Boolean(lead.outreach?.draft_message);
            const currentStatus = lead.outreach?.status || 'Not Contacted';
            return (
              <div
                key={lead.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div className="space-y-3">
                  {/* Top badges */}
                  <div className="flex items-center justify-between">
                    <ScoreBadge score={lead.score?.total_score} priority={lead.score?.priority} />
                    <StatusBadge status={currentStatus} />
                  </div>

                  {/* Business info */}
                  <div>
                    <h3
                      onClick={() => setActiveDrawerLead(lead)}
                      className="font-extrabold text-sm text-white hover:text-indigo-400 cursor-pointer transition-colors truncate"
                      title={lead.business_name}
                    >
                      {lead.business_name}
                    </h3>
                    <div className="text-[11px] text-indigo-400 font-semibold mt-0.5">
                      {lead.business_type} • {lead.city || lead.area || lead.country}
                    </div>
                  </div>

                  {/* Contact shortcuts */}
                  <div className="text-xs text-slate-300 space-y-1">
                    {lead.national_phone && (
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <Phone className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        <span>{lead.national_phone}</span>
                      </div>
                    )}
                    {lead.website_uri && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Globe className="w-3 h-3 text-blue-400 flex-shrink-0" />
                        <a
                          href={lead.website_uri}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:underline truncate"
                        >
                          {lead.website_uri}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Pitch draft snippet if available */}
                  {hasDraft && (
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-indigo-300 font-bold uppercase tracking-wider">
                        <span>Prepared B2B Pitch</span>
                        <button
                          type="button"
                          onClick={() => handleCopyDraft(lead.id, lead.outreach?.draft_message || '')}
                          className="hover:text-white flex items-center gap-1 transition-colors"
                        >
                          {copiedId === lead.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedId === lead.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <p className="line-clamp-3 text-slate-400 italic">
                        "{lead.outreach?.draft_message}"
                      </p>
                    </div>
                  )}

                  {/* Follow up date */}
                  {lead.outreach?.follow_up_date && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Follow-up: {new Date(lead.outreach.follow_up_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {currentStatus === 'Not Contacted' && (
                      <button
                        onClick={() => handleQuickStatusUpdate(lead.id, 'Contacted')}
                        className="px-2.5 py-1 rounded-md bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white text-[11px] font-bold transition-all"
                      >
                        Mark Contacted
                      </button>
                    )}
                    {currentStatus === 'Contacted' && (
                      <button
                        onClick={() => handleQuickStatusUpdate(lead.id, 'Replied')}
                        className="px-2.5 py-1 rounded-md bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white text-[11px] font-bold transition-all"
                      >
                        Mark Replied
                      </button>
                    )}
                    {(currentStatus === 'Replied' || currentStatus === 'Interested') && (
                      <button
                        onClick={() => handleQuickStatusUpdate(lead.id, 'Won')}
                        className="px-2.5 py-1 rounded-md bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white text-[11px] font-bold transition-all"
                      >
                        Mark Won
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setActiveDrawerLead(lead)}
                    className="px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors"
                  >
                    Edit / Pitch
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Side drawer */}
      <LeadDrawer
        lead={activeDrawerLead}
        onClose={() => setActiveDrawerLead(null)}
        onLeadUpdated={(updated) => {
          setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
          setActiveDrawerLead(updated);
        }}
      />
    </div>
  );
};
