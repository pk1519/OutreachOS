import React, { useState } from 'react';
import {
  Search,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  FolderKanban,
  Sliders,
  Zap,
  Download,
  CheckCircle2
} from 'lucide-react';
import { BusinessTypeSelector } from './BusinessTypeSelector';
import { LocationSelector } from './LocationSelector';
import { SearchRequest, SearchStatsResponse } from '../types';

interface SearchFormProps {
  onSearch: (req: SearchRequest) => Promise<SearchStatsResponse>;
  isSearching: boolean;
  initialBusinessType?: string;
  initialLocation?: string;
  onExportCsv?: () => void;
}

const POPULAR_PRESETS = [
  {
    label: 'Gyms in Bangalore',
    businessType: 'Gyms',
    location: 'Bangalore',
    country: 'India',
    areas: ['Koramangala', 'Indiranagar', 'HSR Layout', 'Whitefield'],
    campaignName: 'Bangalore Premium Gyms'
  },
  {
    label: 'Schools in Lucknow',
    businessType: 'Schools',
    location: 'Lucknow',
    country: 'India',
    areas: ['Gomti Nagar', 'Hazratganj', 'Aliganj', 'Indira Nagar'],
    campaignName: 'Lucknow Top Schools'
  },
  {
    label: 'Real Estate in Dubai',
    businessType: 'Real Estate Agencies',
    location: 'Dubai',
    country: 'UAE',
    areas: ['Dubai Marina', 'Downtown Dubai', 'Business Bay', 'Palm Jumeirah'],
    campaignName: 'Dubai Commercial Real Estate'
  },
  {
    label: 'Restaurants in Mumbai',
    businessType: 'Restaurants',
    location: 'Mumbai',
    country: 'India',
    areas: ['Bandra West', 'Juhu', 'Andheri West', 'Lower Parel'],
    campaignName: 'Mumbai Fine Dining'
  },
  {
    label: 'Dental Clinics in Pune',
    businessType: 'Dental Clinics',
    location: 'Pune',
    country: 'India',
    areas: ['Koregaon Park', 'Kothrud', 'Viman Nagar'],
    campaignName: 'Pune Dental Clinics'
  },
  {
    label: 'Luxury Wedding Planners in Goa',
    businessType: 'Luxury wedding planners',
    location: 'Goa',
    country: 'India',
    areas: ['Panaji', 'Candolim', 'Calangute'],
    campaignName: 'Goa Luxury Wedding Planners'
  }
];

export const SearchForm: React.FC<SearchFormProps> = ({
  onSearch,
  isSearching,
  initialBusinessType = 'Gyms',
  initialLocation = 'Bangalore',
  onExportCsv
}) => {
  const [businessType, setBusinessType] = useState(initialBusinessType);
  const [location, setLocation] = useState(initialLocation);
  const [country, setCountry] = useState('India');
  const [areas, setAreas] = useState<string[]>(['Koramangala', 'Indiranagar', 'HSR Layout']);
  const [customQuery, setCustomQuery] = useState('');
  const [minRating, setMinRating] = useState<number>(4.0);
  const [minReviews, setMinReviews] = useState<number>(20);
  const [resultLimit, setResultLimit] = useState<number>(30);
  const [campaignName, setCampaignName] = useState('Bangalore Premium Gyms');

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [lastStats, setLastStats] = useState<SearchStatsResponse | null>(null);

  const applyPreset = (preset: typeof POPULAR_PRESETS[0]) => {
    setBusinessType(preset.businessType);
    setLocation(preset.location);
    setCountry(preset.country);
    setAreas(preset.areas);
    setCampaignName(preset.campaignName);
    setCustomQuery('');
  };

  const handleBusinessTypeChange = (newType: string) => {
    setBusinessType(newType);
    setCampaignName(`${location} ${newType}`.trim());
  };

  const handleLocationChange = (newLoc: string) => {
    setLocation(newLoc);
    setCampaignName(`${newLoc} ${businessType}`.trim());
  };

  const estimatedRequests = Math.max(1, areas.length || 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessType.trim() || !location.trim()) {
      alert('Please specify both a Business Category and a Location.');
      return;
    }

    if (areas.length > 4) {
      setShowConfirmModal(true);
    } else {
      executeSearch();
    }
  };

  const executeSearch = async () => {
    setShowConfirmModal(false);
    try {
      const stats = await onSearch({
        business_type: businessType.trim(),
        location: location.trim(),
        country: country.trim() || undefined,
        areas: areas.length > 0 ? areas : undefined,
        custom_query: customQuery.trim() || undefined,
        min_rating: minRating,
        min_reviews: minReviews,
        result_limit: resultLimit,
        campaign_name: campaignName.trim() || undefined
      });
      setLastStats(stats);
    } catch (err: any) {
      alert(`Search failed: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1-Click Quick Presets Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Popular Discovery Presets (1-Click Fill):</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Click to populate form instantly</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {POPULAR_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-indigo-600/20 text-slate-300 hover:text-white border border-slate-800 hover:border-indigo-500/40 text-[11px] font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <span className="text-amber-400">⚡</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Search Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-sm">
        {/* Business Category & Universal Location */}
        <BusinessTypeSelector value={businessType} onChange={handleBusinessTypeChange} />

        <LocationSelector
          location={location}
          country={country}
          areas={areas}
          onLocationChange={handleLocationChange}
          onCountryChange={setCountry}
          onAreasChange={setAreas}
        />

        {/* Campaign Name & Custom Search Query */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-indigo-400" />
              <span>Campaign Project Name</span>
            </label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder='e.g. "Bangalore Premium Gyms"'
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span>Custom Google Query (Optional)</span>
            </label>
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder={`Default: "${businessType} in ${location}"`}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-medium"
            />
          </div>
        </div>

        {/* Advanced Filters: Min Rating, Min Reviews, Result Limit */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <Sliders className="w-3 h-3 text-yellow-400" />
                <span>Min Google Rating</span>
              </label>
              <span className="text-xs font-extrabold text-yellow-400">{minRating} ★</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={minRating}
              onChange={(e) => setMinRating(parseFloat(e.target.value))}
              className="w-full accent-yellow-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-300">Min Reviews Filter</label>
              <span className="text-xs font-extrabold text-indigo-400">{minReviews}+ reviews</span>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              step="5"
              value={minReviews}
              onChange={(e) => setMinReviews(parseInt(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-300">Leads Result Limit</label>
              <span className="text-xs font-extrabold text-cyan-400">{resultLimit} leads</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={resultLimit}
              onChange={(e) => setResultLimit(parseInt(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Live Search Trigger & API Notice */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <div className="flex items-center gap-2.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              Official Google Places API (New) • FieldMask Active • <strong>{estimatedRequests}</strong> backend batch query
            </span>
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="px-7 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
          >
            {isSearching ? (
              <>
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                <span>Searching Google Cloud...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Find Leads Now</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Confirmation Modal for Cost Protection */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-extrabold text-sm text-white">Multi-Area Search Confirmation</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This search will perform multiple area queries across <strong>{areas.length}</strong> neighborhoods ({areas.join(', ')}).
              Results will be deduplicated strictly by Google Place ID.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSearch}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-extrabold hover:bg-indigo-500"
              >
                Confirm & Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Place ID Deduplication Results Stats Banner */}
      {lastStats && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h4 className="font-extrabold text-sm text-white">Search Completed Successfully</h4>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">
              Campaign: {lastStats.campaign_name || 'Active'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
              <div className="text-xl font-extrabold text-white">{lastStats.raw_results}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Raw Results</div>
            </div>
            <div className="p-3 bg-slate-950/70 rounded-xl border border-emerald-500/30">
              <div className="text-xl font-extrabold text-emerald-400">{lastStats.unique_leads}</div>
              <div className="text-[10px] text-emerald-300 font-semibold uppercase mt-0.5">Unique Leads</div>
            </div>
            <div className="p-3 bg-slate-950/70 rounded-xl border border-amber-500/30">
              <div className="text-xl font-extrabold text-amber-400">{lastStats.duplicates_removed}</div>
              <div className="text-[10px] text-amber-300 font-semibold uppercase mt-0.5">Duplicates Removed</div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center italic">
            * This search covers the specific locations and parameters you selected; it does not claim to represent every business in the broader region.
          </p>
        </div>
      )}
    </div>
  );
};
