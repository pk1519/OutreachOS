import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

interface FilterBarProps {
  filters: {
    businessType: string;
    location: string;
    country: string;
    priority: string;
    outreachStatus: string;
  };
  onChange: (key: string, value: string) => void;
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onChange, onReset }) => {
  return (
    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mr-2">
        <Filter className="w-3.5 h-3.5 text-indigo-400" />
        <span>Filters:</span>
      </div>

      {/* Business Type */}
      <input
        type="text"
        placeholder="Domain (e.g. Gyms, Schools...)"
        value={filters.businessType}
        onChange={(e) => onChange('businessType', e.target.value)}
        className="bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-44 font-medium"
      />

      {/* Location */}
      <input
        type="text"
        placeholder="Location (e.g. Bangalore, Dubai...)"
        value={filters.location}
        onChange={(e) => onChange('location', e.target.value)}
        className="bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-44 font-medium"
      />

      {/* Country */}
      <input
        type="text"
        placeholder="Country (e.g. India, UAE, UK...)"
        value={filters.country}
        onChange={(e) => onChange('country', e.target.value)}
        className="bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-36 font-medium"
      />

      {/* Lead Priority */}
      <select
        value={filters.priority}
        onChange={(e) => onChange('priority', e.target.value)}
        className="bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
      >
        <option value="">All Priorities</option>
        <option value="HIGH">High Priority (70-100)</option>
        <option value="MEDIUM">Medium Priority (40-69)</option>
        <option value="LOW">Low Priority (0-39)</option>
      </select>

      {/* Outreach Status */}
      <select
        value={filters.outreachStatus}
        onChange={(e) => onChange('outreachStatus', e.target.value)}
        className="bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
      >
        <option value="">All Outreach Statuses</option>
        <option value="Not Contacted">Not Contacted</option>
        <option value="Contacted">Contacted</option>
        <option value="Replied">Replied</option>
        <option value="Interested">Interested</option>
        <option value="Demo Scheduled">Demo Scheduled</option>
        <option value="Proposal Sent">Proposal Sent</option>
        <option value="Negotiating">Negotiating</option>
        <option value="Won">Won</option>
        <option value="Lost">Lost</option>
        <option value="Follow-up Required">Follow-up Required</option>
      </select>

      {/* Reset button */}
      <button
        onClick={onReset}
        title="Reset all filters"
        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
      >
        <RotateCcw className="w-3 h-3 text-slate-400" />
        <span>Reset</span>
      </button>
    </div>
  );
};
