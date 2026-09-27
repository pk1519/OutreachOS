import React from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

interface ScoreBadgeProps {
  score?: number | null;
  priority?: string | null;
  showIcon?: boolean;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, priority, showIcon = true }) => {
  const finalScore = score !== undefined && score !== null ? score : 0;
  const finalPriority = priority || (finalScore >= 70 ? 'HIGH' : finalScore >= 40 ? 'MEDIUM' : 'LOW');

  if (finalPriority === 'HIGH') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        {showIcon && <ShieldCheck className="w-3.5 h-3.5" />}
        <span>{finalScore}</span>
        <span className="text-[10px] uppercase tracking-wider opacity-75 font-bold">HIGH</span>
      </span>
    );
  }

  if (finalPriority === 'MEDIUM') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        {showIcon && <Shield className="w-3.5 h-3.5" />}
        <span>{finalScore}</span>
        <span className="text-[10px] uppercase tracking-wider opacity-75 font-bold">MED</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
      {showIcon && <ShieldAlert className="w-3.5 h-3.5" />}
      <span>{finalScore}</span>
      <span className="text-[10px] uppercase tracking-wider opacity-75 font-bold">LOW</span>
    </span>
  );
};
