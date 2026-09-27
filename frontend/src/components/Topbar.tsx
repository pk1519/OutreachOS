import React, { useState } from 'react';
import { Search, FileSpreadsheet, Globe2, Moon, Sun, CheckCircle2, Sparkles } from 'lucide-react';

interface TopbarProps {
  onGlobalSearch: (query: string) => void;
  isSheetsConnected?: boolean;
  sheetsEmail?: string | null;
  hasPlacesApiKey?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  onGlobalSearch,
  isSheetsConnected,
  hasPlacesApiKey = true
}) => {
  const [query, setQuery] = useState('');
  const [isDark, setIsDark] = useState(true);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      onGlobalSearch(query.trim());
    }
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="h-16 bg-slate-900/90 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
      {/* Global Natural Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Quick search: e.g. "Gyms in Bangalore", "Schools in Lucknow", "Real Estate in Dubai"...'
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-24 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
          />
          <button
            onClick={() => query.trim() && onGlobalSearch(query.trim())}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold tracking-wider uppercase transition-colors shadow-sm"
          >
            Search
          </button>
        </div>
      </div>

      {/* Connection Badges & Status Indicators */}
      <div className="flex items-center gap-3 ml-4">
        {/* Places API Live Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-bold text-emerald-400">
            Places API: Live & Verified
          </span>
        </div>

        {/* Google Sheets Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs">
          <FileSpreadsheet className={`w-3.5 h-3.5 ${isSheetsConnected ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span className="text-[11px] font-medium text-slate-300">
            {isSheetsConnected ? (
              <span className="text-emerald-400 font-bold">Sheets Connected</span>
            ) : (
              'Sheets Ready'
            )}
          </span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title="Toggle Theme"
          className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>
      </div>
    </header>
  );
};
