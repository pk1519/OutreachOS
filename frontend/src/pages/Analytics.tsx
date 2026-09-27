import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Layers, MapPin, Award } from 'lucide-react';
import { AnalyticsCharts } from '../components/AnalyticsCharts';
import { api } from '../api/client';
import { DashboardResponse, Campaign } from '../types';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCampaigns = async () => {
    try {
      const camps = await api.getCampaigns();
      setCampaigns(camps);
    } catch {
      // ignore
    }
  };

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await api.getDashboardAnalytics({
        campaign_id: selectedCampaignId || undefined
      });
      setData(res);
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
    fetchAnalytics();
  }, [selectedCampaignId]);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Advanced Application Analytics</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Objective, factual metrics across business categories, geographic locations, and outreach conversions.
          </p>
        </div>

        {/* Campaign Filter */}
        <select
          value={selectedCampaignId || ''}
          onChange={(e) => setSelectedCampaignId(e.target.value ? Number(e.target.value) : null)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-indigo-500"
        >
          <option value="">Scope: All Campaigns</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              Campaign: {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Summary KPI Badges */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block mb-1">Total Unique Leads</span>
            <div className="text-2xl font-extrabold text-white">{data.stats.unique_leads}</div>
            <span className="text-[10px] text-indigo-400 font-semibold mt-1 block">Cross-market deduplicated</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block mb-1">High Intent Ratio</span>
            <div className="text-2xl font-extrabold text-emerald-400">
              {Math.round((data.stats.high_priority_leads / (data.stats.unique_leads || 1)) * 100)}%
            </div>
            <span className="text-[10px] text-emerald-300 font-semibold mt-1 block">Score ≥ 70</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block mb-1">Verified Contact Rate</span>
            <div className="text-2xl font-extrabold text-cyan-400">
              {Math.round((data.stats.businesses_with_phone / (data.stats.unique_leads || 1)) * 100)}%
            </div>
            <span className="text-[10px] text-cyan-300 font-semibold mt-1 block">Direct phone present</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block mb-1">Pipeline Deals Won</span>
            <div className="text-2xl font-extrabold text-indigo-400">{data.stats.won}</div>
            <span className="text-[10px] text-indigo-300 font-semibold mt-1 block">{data.stats.proposal_sent} proposals sent</span>
          </div>
        </div>
      )}

      {/* 10 Core Visualizations */}
      {data && (
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
      )}
    </div>
  );
};
