import React from 'react';
import { Target, MapPin, Layers, Building2 } from 'lucide-react';
import { CurrentSearchContext } from '../types';

interface DynamicDomainCardProps {
  context?: CurrentSearchContext | null;
  onQuickSearchAgain?: () => void;
}

export const DynamicDomainCard: React.FC<DynamicDomainCardProps> = ({ context }) => {
  if (!context) {
    return (
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400">Current Search Context</div>
            <div className="text-sm font-bold text-slate-200">Universal Lead Discovery Active</div>
          </div>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">Ready for any domain & location</span>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/20 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-400">Current Campaign Scope</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                {context.campaign_name || 'Active Discovery'}
              </span>
            </div>
            <h2 className="text-base font-extrabold text-white mt-0.5 flex items-center gap-2">
              <span>{context.business_type}</span>
              <span className="text-slate-400 font-normal">in</span>
              <span className="text-cyan-400 flex items-center gap-1">
                <MapPin className="w-4 h-4 inline" />
                {context.location}{context.country ? `, ${context.country}` : ''}
              </span>
            </h2>
          </div>
        </div>

        {/* Areas tags */}
        {context.areas && context.areas.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 mr-1">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Target Areas:</span>
            </div>
            {context.areas.map((area, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700"
              >
                {area}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
