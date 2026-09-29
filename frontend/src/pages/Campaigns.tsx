import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Plus,
  MapPin,
  Users,
  FileSpreadsheet,
  Trash2,
  Layers,
  UserPlus,
  Download,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { api } from '../api/client';
import { Campaign } from '../types';
import { SheetsExportDialog } from '../components/SheetsExportDialog';
import { ManualLeadModal } from '../components/ManualLeadModal';

interface CampaignsPageProps {
  onSelectCampaignForLeads: (campaignId: number) => void;
}

export const Campaigns: React.FC<CampaignsPageProps> = ({
  onSelectCampaignForLeads
}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [exportCampaign, setExportCampaign] = useState<Campaign | null>(null);
  const [addLeadCampaignId, setAddLeadCampaignId] = useState<number | null>(null);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New campaign form state
  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('');
  const [areas, setAreas] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCampaigns();
      setCampaigns(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !businessType.trim() || !location.trim()) {
      alert('Please fill in Campaign Name, Business Category, and Location.');
      return;
    }

    try {
      await api.createCampaign({
        name: name.trim(),
        business_type: businessType.trim(),
        location: location.trim(),
        country: country.trim() || undefined,
        areas: areas.trim() || undefined,
        status: 'Active'
      });
      setIsCreateOpen(false);
      setName('');
      setBusinessType('');
      setLocation('');
      setCountry('');
      setAreas('');
      fetchCampaigns();
      showToast('Campaign created successfully!');
    } catch (err: any) {
      alert(`Failed to create campaign: ${err.message}`);
    }
  };

  const handleDeleteCampaign = async (id: number) => {
    if (!confirm('Are you sure you want to delete this campaign? All leads, searches, outreach logs, and campaign data will be permanently removed from the database.')) return;
    setDeletingId(id);
    try {
      await api.deleteCampaign(id);
      await fetchCampaigns();
      showToast('Campaign and all its data permanently deleted from database.');
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadCampaignCsv = async (campaign: Campaign) => {
    setDownloadingId(campaign.id);
    try {
      const cleanName = campaign.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      await api.downloadLeadsCsv(undefined, campaign.id, `${cleanName}_leads.csv`);
      showToast(`Downloaded CSV for "${campaign.name}"!`);
    } catch (err: any) {
      alert(`CSV download error: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadAllLeadsCsv = async () => {
    try {
      await api.downloadLeadsCsv(undefined, undefined, `all_duo_leads_${new Date().toISOString().slice(0, 10)}.csv`);
      showToast('Downloaded CSV for all discovered leads!');
    } catch (err: any) {
      alert(`CSV download error: ${err.message}`);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">B2B Lead Campaigns</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Organize discovery projects by business niche, download CSVs, or synchronize directly with Google Sheets.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadAllLeadsCsv}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-extrabold text-xs transition-all border border-slate-700/80"
            title="Download full database leads as CSV"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Download All Leads CSV</span>
          </button>
          <button
            onClick={() => {
              setAddLeadCampaignId(null);
              setIsAddLeadOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs transition-all border border-slate-700/80"
          >
            <UserPlus className="w-4 h-4 text-indigo-400" />
            <span>Add Lead</span>
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {/* Campaigns Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-slate-900 border border-slate-800 rounded-2xl"></div>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
          <FolderKanban className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-extrabold text-white">No campaigns created yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Create a campaign or run a search in <strong>Lead Finder</strong> to auto-create lead generation projects.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((camp) => (
            <div
              key={camp.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      {camp.status}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteCampaign(camp.id)}
                    disabled={deletingId === camp.id}
                    className="p-1 text-slate-400 hover:text-rose-400 disabled:opacity-50 transition-colors"
                    title="Delete campaign and all its database data"
                  >
                    {deletingId === camp.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-white truncate" title={camp.name}>
                    {camp.name}
                  </h3>
                  <div className="text-xs text-indigo-400 font-semibold mt-0.5">
                    {camp.business_type}
                  </div>
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span>{camp.location}{camp.country ? `, ${camp.country}` : ''}</span>
                  </div>
                  {camp.areas && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Layers className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                      <span className="truncate">{camp.areas}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{camp.lead_count} Leads</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Add Lead Manually */}
                  <button
                    onClick={() => {
                      setAddLeadCampaignId(camp.id);
                      setIsAddLeadOpen(true);
                    }}
                    className="p-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 transition-colors"
                    title="Add a lead manually to this campaign"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                  </button>

                  {/* Direct CSV Download */}
                  <button
                    onClick={() => handleDownloadCampaignCsv(camp)}
                    disabled={downloadingId === camp.id}
                    className="p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 transition-colors"
                    title="Download this campaign's leads as CSV"
                  >
                    <Download className={`w-3.5 h-3.5 ${downloadingId === camp.id ? 'animate-bounce' : ''}`} />
                  </button>

                  {/* Export to Google Sheets */}
                  <button
                    onClick={() => setExportCampaign(camp)}
                    className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors"
                    title="Export campaign to Google Sheets"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  </button>

                  {/* View Leads */}
                  <button
                    onClick={() => onSelectCampaignForLeads(camp.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                  >
                    View Leads
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Campaign Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-white">Create New Lead Campaign</h3>
            <form onSubmit={handleCreateCampaign} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Campaign Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='e.g. "Bangalore Hostels & PGs", "Dubai Luxury Real Estate"'
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Business Domain / Type</label>
                <input
                  type="text"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  placeholder='e.g. "Hostels", "Real Estate Agencies", "Schools", "Gyms"'
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">City / Region</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder='e.g. "Bangalore", "Dubai", "Lucknow"'
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder='e.g. "India", "UAE"'
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Sub-Areas (Optional comma-separated)</label>
                <input
                  type="text"
                  value={areas}
                  onChange={(e) => setAreas(e.target.value)}
                  placeholder='e.g. "Koramangala, HSR Layout, Indiranagar"'
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-medium"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-extrabold"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sheets Export Modal for Campaign */}
      {exportCampaign && (
        <SheetsExportDialog
          isOpen={true}
          onClose={() => setExportCampaign(null)}
          campaignId={exportCampaign.id}
          defaultWorksheetTitle={exportCampaign.name}
        />
      )}

      {/* Manual Lead Entry Modal */}
      <ManualLeadModal
        isOpen={isAddLeadOpen}
        onClose={() => {
          setIsAddLeadOpen(false);
          setAddLeadCampaignId(null);
        }}
        defaultCampaignId={addLeadCampaignId}
        onLeadCreated={() => {
          fetchCampaigns();
        }}
      />
    </div>
  );
};
