import React from 'react';
import { FolderKanban } from 'lucide-react';
import { Campaign } from '../types';

interface CampaignSelectorProps {
  campaigns: Campaign[];
  selectedCampaignId?: number | null;
  onSelect: (campaignId: number | null) => void;
}

export const CampaignSelector: React.FC<CampaignSelectorProps> = ({
  campaigns,
  selectedCampaignId,
  onSelect
}) => {
  return (
    <div className="flex items-center gap-2">
      <FolderKanban className="w-4 h-4 text-indigo-400" />
      <select
        value={selectedCampaignId || ''}
        onChange={(e) => onSelect(e.target.value ? Number(e.target.value) : null)}
        aria-label="Filter by Campaign"
        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
      >
        <option value="">All Campaigns</option>
        {campaigns.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.business_type} • {c.location})
          </option>
        ))}
      </select>
    </div>
  );
};
