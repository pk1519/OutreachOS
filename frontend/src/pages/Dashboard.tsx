import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { DashboardStats } from '../components/DashboardStats';
import { FilterBar } from '../components/FilterBar';
import { DynamicDomainCard } from '../components/DynamicDomainCard';
import { CampaignSelector } from '../components/CampaignSelector';
import { AnalyticsCharts } from '../components/AnalyticsCharts';
import { api } from '../api/client';
import { DashboardResponse, Campaign } from '../types';

interface DashboardPageProps {
  onNavigateToFindLeads: () => void;
}

export const Dashboard: React.FC<DashboardPageProps> = ({ onNavigateToFindLeads }) => {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    businessType: '',
    location: '',
    country: '',
    priority: '',
    outreachStatus: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchCampaigns = async () => {
    try {
      const camps = await api.getCampaigns();
      setCampaigns(camps);
    } catch {
      // ignore
    }
  };

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await api.getDashboardAnalytics({
        campaign_id: selectedCampaignId || undefined,
        business_type: filters.businessType || undefined,
        location: filters.location || undefined,
        country: filters.country || undefined,
        priority: filters.priority || undefined,
        outreach_status: filters.outreachStatus || undefined
      });
      setData(res);
    } catch (err: any) {
      console.error("Dashboard load failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [selectedCampaignId, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      businessType: '',
      location: '',
      country: '',
      priority: '',
      outreachStatus: ''
    });
    setSelectedCampaignId(null);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">DUO SYSTEMS LEAD FINDER</h1>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold tracking-wider uppercase">
              B2B Platform
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Find, qualify and manage local business leads anywhere.
          </p>
        </div>

        {/* Campaign Switcher & Refresh */}
        <div className="flex items-center gap-3">
          <CampaignSelector
            campaigns={campaigns}
            selectedCampaignId={selectedCampaignId}
            onSelect={setSelectedCampaignId}
          />
          <button
            onClick={fetchDashboard}
            disabled={isLoading}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dynamic Filter Bar */}
      <FilterBar
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Dynamic Domain Card */}
      <DynamicDomainCard context={data?.current_search_context} />

      {/* KPI Stats Cards */}
      {data && <DashboardStats stats={data.stats} />}

      {/* Real Data Visualizations */}
      {data && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Real-Time Business Intelligence & Funnel</span>
            </h2>
            <span className="text-[11px] text-slate-400">
              * Live calculations strictly using discovered leads
            </span>
          </div>

          <AnalyticsCharts
            hasEnoughData={data.has_enough_data}
            leadsByCategory={data.leads_by_category}
            leadsByLocation={data.leads_by_location}
            priorityDistribution={data.priority_distribution}
            outreachDistribution={data.outreach_distribution}
            ratingDistribution={data.rating_distribution}
            websiteAvailability={data.website_availability}
            phoneAvailability={data.phone_availability}
            reviewsDistribution={data.reviews_distribution}
            leadsOverTime={data.leads_over_time}
          />
        </div>
      )}
    </div>
  );
};
