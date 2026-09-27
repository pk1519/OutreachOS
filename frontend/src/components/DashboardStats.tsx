import React from 'react';
import {
  Users,
  Award,
  Globe,
  Phone,
  Star,
  MessageSquare,
  CheckCircle2,
  Calendar,
  Send,
  Trophy,
  XCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { DashboardStats as StatsType } from '../types';

interface DashboardStatsProps {
  stats: StatsType;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const cards = [
    {
      title: 'Total Businesses Found',
      value: stats.total_businesses_found,
      icon: Users,
      color: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30',
      subtext: `${stats.unique_leads} deduplicated`
    },
    {
      title: 'High Priority Leads',
      value: stats.high_priority_leads,
      icon: Award,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
      subtext: 'Score 70-100'
    },
    {
      title: 'Medium Priority Leads',
      value: stats.medium_priority_leads,
      icon: Sparkles,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
      subtext: 'Score 40-69'
    },
    {
      title: 'Low Priority Leads',
      value: stats.low_priority_leads,
      icon: Users,
      color: 'from-slate-500/20 to-gray-500/20 text-slate-400 border-slate-500/30',
      subtext: 'Score 0-39'
    },
    {
      title: 'Businesses With Website',
      value: stats.businesses_with_website,
      icon: Globe,
      color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30',
      subtext: `${Math.round((stats.businesses_with_website / (stats.unique_leads || 1)) * 100)}% coverage`
    },
    {
      title: 'Businesses With Phone',
      value: stats.businesses_with_phone,
      icon: Phone,
      color: 'from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30',
      subtext: `${Math.round((stats.businesses_with_phone / (stats.unique_leads || 1)) * 100)}% coverage`
    },
    {
      title: 'Average Google Rating',
      value: stats.average_rating > 0 ? `${stats.average_rating.toFixed(1)} ★` : 'N/A',
      icon: Star,
      color: 'from-yellow-500/20 to-amber-500/20 text-yellow-400 border-yellow-500/30',
      subtext: `${stats.total_reviews.toLocaleString()} total reviews`
    },
    {
      title: 'Contacted Leads',
      value: stats.contacted,
      icon: Send,
      color: 'from-indigo-500/20 to-violet-500/20 text-indigo-400 border-indigo-500/30',
      subtext: `${stats.replied} replied`
    },
    {
      title: 'Interested / In Dialog',
      value: stats.interested,
      icon: MessageSquare,
      color: 'from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/30',
      subtext: 'High sales intent'
    },
    {
      title: 'Demo Scheduled',
      value: stats.demo_scheduled,
      icon: Calendar,
      color: 'from-cyan-500/20 to-teal-500/20 text-cyan-400 border-cyan-500/30',
      subtext: 'Upcoming presentations'
    },
    {
      title: 'Proposals Sent',
      value: stats.proposal_sent,
      icon: CheckCircle2,
      color: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30',
      subtext: 'In final review'
    },
    {
      title: 'Deals Won',
      value: stats.won,
      icon: Trophy,
      color: 'from-emerald-500/20 to-lime-500/20 text-emerald-400 border-emerald-500/30',
      subtext: `${stats.lost} lost`
    },
    {
      title: 'Follow-ups Due',
      value: stats.follow_ups_due,
      icon: Clock,
      color: 'from-rose-500/20 to-pink-500/20 text-rose-400 border-rose-500/30',
      subtext: 'Action required'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
      {cards.map((c, idx) => {
        const Icon = c.icon;
        return (
          <div
            key={idx}
            className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-slate-400 truncate pr-2">{c.title}</span>
              <div className={`p-1.5 rounded-lg bg-gradient-to-br border ${c.color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-white tracking-tight">
              {c.value}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">{c.subtext}</p>
          </div>
        );
      })}
    </div>
  );
};
