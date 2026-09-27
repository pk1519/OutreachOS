import React from 'react';
import { ChartDataPoint } from '../types';
import { BarChart, PieChart, TrendingUp, Star, Phone, Globe, Award, ShieldAlert } from 'lucide-react';

interface AnalyticsChartsProps {
  hasEnoughData: boolean;
  leadsByCategory: ChartDataPoint[];
  leadsByLocation: ChartDataPoint[];
  priorityDistribution: ChartDataPoint[];
  outreachDistribution: ChartDataPoint[];
  ratingDistribution: ChartDataPoint[];
  websiteAvailability: ChartDataPoint[];
  phoneAvailability: ChartDataPoint[];
  reviewsDistribution: ChartDataPoint[];
  leadsOverTime: ChartDataPoint[];
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  hasEnoughData,
  leadsByCategory,
  leadsByLocation,
  priorityDistribution,
  outreachDistribution,
  ratingDistribution,
  websiteAvailability,
  phoneAvailability,
  reviewsDistribution,
  leadsOverTime
}) => {
  if (!hasEnoughData) {
    return (
      <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-base font-extrabold text-white">Not enough data yet</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Charts are generated strictly from live application discoveries and CRM actions.
          Run a search in <strong>Find Leads</strong> to populate real visual analytics.
        </p>
      </div>
    );
  }

  // Helper for simple responsive horizontal bar charts
  const renderBarChart = (data: ChartDataPoint[], colorClass: string = 'bg-indigo-500') => {
    if (!data || data.length === 0) {
      return <div className="text-xs text-slate-400 py-6 text-center">No data points available</div>;
    }
    const maxVal = Math.max(...data.map(d => d.value), 1);
    return (
      <div className="space-y-2.5 pt-2">
        {data.map((item, idx) => {
          const pct = Math.round((item.value / maxVal) * 100);
          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-[11px] font-medium text-slate-300">
                <span className="truncate max-w-[200px]">{item.name}</span>
                <span className="font-mono font-bold text-white">{item.value}</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                  style={{ width: `${Math.max(4, pct)}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Helper for percentage progress/availability cards
  const renderAvailabilityPill = (data: ChartDataPoint[], positiveColor: string) => {
    const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
    const positive = data[0]?.value || 0;
    const positivePct = Math.round((positive / total) * 100);

    return (
      <div className="space-y-3 pt-2">
        <div className="flex items-end justify-between">
          <div className="text-2xl font-extrabold text-white">{positivePct}%</div>
          <div className="text-[11px] text-slate-400 font-medium">
            {positive} of {total} leads
          </div>
        </div>
        <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800 flex">
          <div
            className={`h-full ${positiveColor} transition-all duration-500`}
            style={{ width: `${positivePct}%` }}
          ></div>
          <div
            className="h-full bg-slate-800 transition-all duration-500"
            style={{ width: `${100 - positivePct}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-[10px] font-semibold text-slate-400">
          <span>{data[0]?.name || 'Available'}: {positive}</span>
          <span>{data[1]?.name || 'Missing'}: {total - positive}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* 1. Leads by Business Category */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-extrabold text-white uppercase tracking-wider">
          <BarChart className="w-4 h-4 text-indigo-400" />
          <span>Leads by Business Category</span>
        </div>
        {renderBarChart(leadsByCategory, 'bg-indigo-500')}
      </div>

      {/* 2. Leads by Location */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-extrabold text-white uppercase tracking-wider">
          <BarChart className="w-4 h-4 text-cyan-400" />
          <span>Leads by Location / Area</span>
        </div>
        {renderBarChart(leadsByLocation, 'bg-cyan-500')}
      </div>

      {/* 3. Lead Priority Distribution */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-extrabold text-white uppercase tracking-wider">
          <Award className="w-4 h-4 text-emerald-400" />
          <span>Lead Priority Distribution</span>
        </div>
        {renderBarChart(priorityDistribution, 'bg-emerald-500')}
      </div>

      {/* 4. Outreach Status Distribution */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-extrabold text-white uppercase tracking-wider">
          <PieChart className="w-4 h-4 text-purple-400" />
          <span>Outreach Status Funnel</span>
        </div>
        {renderBarChart(outreachDistribution, 'bg-purple-500')}
      </div>

      {/* 5. Rating Distribution */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-extrabold text-white uppercase tracking-wider">
          <Star className="w-4 h-4 text-yellow-400" />
          <span>Google Rating Distribution</span>
        </div>
        {renderBarChart(ratingDistribution, 'bg-yellow-400')}
      </div>

      {/* 6. Reviews Distribution */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-extrabold text-white uppercase tracking-wider">
          <BarChart className="w-4 h-4 text-teal-400" />
          <span>Review Count Distribution</span>
        </div>
        {renderBarChart(reviewsDistribution, 'bg-teal-400')}
      </div>

      {/* 7. Website Availability */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-extrabold text-white uppercase tracking-wider">
          <Globe className="w-4 h-4 text-blue-400" />
          <span>Website Availability Rate</span>
        </div>
        {renderAvailabilityPill(websiteAvailability, 'bg-blue-500')}
      </div>

      {/* 8. Phone Availability */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-extrabold text-white uppercase tracking-wider">
          <Phone className="w-4 h-4 text-emerald-400" />
          <span>Direct Phone Availability</span>
        </div>
        {renderAvailabilityPill(phoneAvailability, 'bg-emerald-500')}
      </div>

      {/* 9. Leads Discovered Over Time */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-extrabold text-white uppercase tracking-wider">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          <span>Discovery Timeline</span>
        </div>
        {renderBarChart(leadsOverTime, 'bg-indigo-400')}
      </div>
    </div>
  );
};
