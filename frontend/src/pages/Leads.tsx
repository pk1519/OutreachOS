import React, { useState, useEffect } from 'react';
import { Search, FileSpreadsheet, ChevronLeft, ChevronRight, Filter, Plus } from 'lucide-react';
import { LeadTable } from '../components/LeadTable';
import { LeadDrawer } from '../components/LeadDrawer';
import { SheetsExportDialog } from '../components/SheetsExportDialog';
import { ManualLeadModal } from '../components/ManualLeadModal';
import { api } from '../api/client';
import { Lead, Campaign } from '../types';

interface LeadsPageProps {
  initialCampaignId?: number | null;
}

export const Leads: React.FC<LeadsPageProps> = ({ initialCampaignId }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(initialCampaignId || null);
  const [priority, setPriority] = useState('');
  const [outreachStatus, setOutreachStatus] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  // Selection & Drawer
  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);
  const [activeDrawerLead, setActiveDrawerLead] = useState<Lead | null>(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);

  const fetchCampaigns = async () => {
    try {
      const data = await api.getCampaigns();
      setCampaigns(data);
    } catch {
      // ignore
    }
  };

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const res = await api.getLeads({
        campaign_id: selectedCampaignId || undefined,
        business_type: businessType || undefined,
        priority: priority || undefined,
        outreach_status: outreachStatus || undefined,
        search_term: searchTerm || undefined,
        page,
        page_size: pageSize
      });
      setLeads(res.leads);
      setTotalLeads(res.total);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [page, selectedCampaignId, priority, outreachStatus, businessType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLeads();
  };

  const handleToggleSelectAll = () => {
    if (selectedLeadIds.length === leads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leads.map(l => l.id));
    }
  };

  const handleToggleSelectLead = (id: number) => {
    setSelectedLeadIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleLeadUpdated = (updated: Lead) => {
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
    setActiveDrawerLead(updated);
  };

  const totalPages = Math.ceil(totalLeads / pageSize) || 1;

  const handleQuickStatusChange = async (leadId: number, status: string) => {
    try {
      const updated = await api.updateLeadCRM(leadId, { outreach_status: status });
      setLeads(prev => prev.map(l => l.id === leadId ? updated : l));
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">All Discovered Leads</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Deduplicated B2B leads with Duo Systems Lead Score and outreach pipeline tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddLeadModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lead Manually</span>
          </button>

          <button
            onClick={() => setIsExportDialogOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export to Google Sheets</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          {/* Free text search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by business name, city, address..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          {/* Campaign Selector */}
          <select
            value={selectedCampaignId || ''}
            onChange={(e) => {
              setSelectedCampaignId(e.target.value ? Number(e.target.value) : null);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="">All Campaigns</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Priority */}
          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="">All Priorities</option>
            <option value="HIGH">High Priority (70-100)</option>
            <option value="MEDIUM">Medium Priority (40-69)</option>
            <option value="LOW">Low Priority (0-39)</option>
          </select>

          {/* Outreach Status */}
          <select
            value={outreachStatus}
            onChange={(e) => {
              setOutreachStatus(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="">All Outreach Statuses</option>
            <option value="Not Contacted">Not Contacted</option>
            <option value="Contacted">Contacted</option>
            <option value="Replied">Replied</option>
            <option value="Interested">Interested</option>
            <option value="Demo Scheduled">Demo Scheduled</option>
            <option value="Proposal Sent">Proposal Sent</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
            <option value="Follow-up Required">Follow-up Required</option>
          </select>

          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading leads...</div>
      ) : (
        <LeadTable
          leads={leads}
          selectedLeadIds={selectedLeadIds}
          onToggleSelectAll={handleToggleSelectAll}
          onToggleSelectLead={handleToggleSelectLead}
          onSelectLeadForDrawer={setActiveDrawerLead}
          onQuickExportSelected={() => setIsExportDialogOpen(true)}
          onQuickStatusChange={handleQuickStatusChange}
        />
      )}

      {/* Pagination Bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
        <span>
          Showing <strong>{leads.length}</strong> of <strong>{totalLeads}</strong> total leads
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-40 text-slate-300 hover:bg-slate-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono text-white">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-40 text-slate-300 hover:bg-slate-700"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drawer */}
      <LeadDrawer
        lead={activeDrawerLead}
        onClose={() => setActiveDrawerLead(null)}
        onLeadUpdated={handleLeadUpdated}
      />

      {/* Sheets Export Modal */}
      <SheetsExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        selectedLeadIds={selectedLeadIds.length > 0 ? selectedLeadIds : undefined}
        campaignId={selectedCampaignId || undefined}
        defaultWorksheetTitle="Duo Systems Leads"
      />

      {/* Manual Lead Entry Modal */}
      <ManualLeadModal
        isOpen={isAddLeadModalOpen}
        onClose={() => setIsAddLeadModalOpen(false)}
        defaultCampaignId={selectedCampaignId}
        onLeadCreated={(newLead) => {
          fetchLeads();
          setActiveDrawerLead(newLead);
        }}
      />
    </div>
  );
};
