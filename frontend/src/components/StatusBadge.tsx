import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStyle = (s: string) => {
    switch (s) {
      case 'Won':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Interested':
      case 'Demo Scheduled':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'Proposal Sent':
      case 'Negotiating':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'Contacted':
      case 'Replied':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'Follow-up Required':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Lost':
      case 'Not Interested':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${getStyle(status)}`}>
      {status || 'Not Contacted'}
    </span>
  );
};
