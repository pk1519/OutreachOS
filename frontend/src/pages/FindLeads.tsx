import React, { useState } from 'react';
import { SearchForm } from '../components/SearchForm';
import { LeadTable } from '../components/LeadTable';
import { LeadDrawer } from '../components/LeadDrawer';
import { SheetsExportDialog } from '../components/SheetsExportDialog';
import { api } from '../api/client';
import { SearchRequest, SearchStatsResponse, Lead } from '../types';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface FindLeadsProps {
  initialSearchQuery?: string;
}

export const FindLeads: React.FC<FindLeadsProps> = ({ initialSearchQuery }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);
  const [activeDrawerLead, setActiveDrawerLead] = useState<Lead | null>(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSearch = async (req: SearchRequest): Promise<SearchStatsResponse> => {
    setIsSearching(true);
    setLastSearchQuery(`${req.business_type} in ${req.location}`);
    try {
      const stats = await api.discoverLeads(req);
      // Fetch latest leads associated with this search/campaign
      const leadsRes = await api.getLeads({
        campaign_id: stats.campaign_id,
        business_type: req.business_type,
        page_size: req.result_limit || 50
      });
      setRecentLeads(leadsRes.leads);
      showToast(`Discovered ${stats.unique_leads} unique leads successfully!`);
      return stats;
    } finally {
      setIsSearching(false);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedLeadIds.length === recentLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(recentLeads.map(l => l.id));
    }
  };

  const handleToggleSelectLead = (id: number) => {
    setSelectedLeadIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleLeadUpdated = (updated: Lead) => {
    setRecentLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
    setActiveDrawerLead(updated);
    showToast(`Updated "${updated.business_name}"`);
  };

  const handleQuickStatusChange = async (leadId: number, status: string) => {
    try {
      const updated = await api.updateLeadCRM(leadId, { outreach_status: status });
      setRecentLeads(prev => prev.map(l => l.id === leadId ? updated : l));
      showToast(`Status updated to "${status}"`);
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Toast feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Discovery Form */}
      <SearchForm
        onSearch={handleSearch}
        isSearching={isSearching}
      />

      {/* Discovered Results Table */}
      {recentLeads.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Discovered Business Leads</span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {recentLeads.length} live leads loaded for "{lastSearchQuery}"
              </p>
            </div>
            <button
              onClick={() => setIsExportDialogOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5"
            >
              <span>Export {selectedLeadIds.length > 0 ? selectedLeadIds.length : 'All'} to Google Sheets</span>
            </button>
          </div>

          <LeadTable
            leads={recentLeads}
            selectedLeadIds={selectedLeadIds}
            onToggleSelectAll={handleToggleSelectAll}
            onToggleSelectLead={handleToggleSelectLead}
            onSelectLeadForDrawer={setActiveDrawerLead}
            onQuickExportSelected={() => setIsExportDialogOpen(true)}
            onQuickStatusChange={handleQuickStatusChange}
          />
        </div>
      )}

      {/* Details Side Panel Drawer */}
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
        defaultWorksheetTitle={lastSearchQuery || 'Discovered Leads'}
      />
    </div>
  );
};
