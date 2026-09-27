import React, { useState } from 'react';
import { MapPin, Globe, Plus, X, Layers } from 'lucide-react';

interface LocationSelectorProps {
  location: string;
  country: string;
  areas: string[];
  onLocationChange: (loc: string) => void;
  onCountryChange: (c: string) => void;
  onAreasChange: (areas: string[]) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  location,
  country,
  areas,
  onLocationChange,
  onCountryChange,
  onAreasChange
}) => {
  const [newAreaInput, setNewAreaInput] = useState('');

  const handleAddArea = () => {
    if (!newAreaInput.trim()) return;
    const clean = newAreaInput.trim();
    if (!areas.includes(clean)) {
      onAreasChange([...areas, clean]);
    }
    setNewAreaInput('');
  };

  const handleRemoveArea = (areaToRemove: string) => {
    onAreasChange(areas.filter(a => a !== areaToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddArea();
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* City / Primary Location */}
        <div>
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>Primary Location / City</span>
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder='e.g. "Bangalore", "Lucknow", "Dubai", "London", "New York"...'
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-medium"
          />
        </div>

        {/* Country (Optional/Explicit) */}
        <div>
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>Country (Optional)</span>
          </label>
          <input
            type="text"
            value={country}
            onChange={(e) => onCountryChange(e.target.value)}
            placeholder='e.g. "India", "UAE", "United Kingdom", "United States"...'
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* Multi-Area Search (Optional) */}
      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Target Sub-Areas / Neighborhoods (Optional Multi-Search)</span>
          </label>
          <span className="text-[10px] text-slate-400 font-medium">Place ID deduplicated</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newAreaInput}
            onChange={(e) => setNewAreaInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='e.g. "Koramangala", "Indiranagar", "Gomti Nagar", "Dubai Marina"...'
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-medium"
          />
          <button
            type="button"
            onClick={handleAddArea}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Area</span>
          </button>
        </div>

        {/* Areas Tag Chips */}
        {areas.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {areas.map((area) => (
              <span
                key={area}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
              >
                <span>{area}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveArea(area)}
                  className="hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
