import React, { useState } from 'react';
import { Building, Sparkles, Check } from 'lucide-react';

const POPULAR_CATEGORIES = [
  "Gyms",
  "Fitness Centers",
  "Schools",
  "Colleges",
  "Universities",
  "Coaching Institutes",
  "Restaurants",
  "Cafes",
  "Hotels",
  "Hostels",
  "Dental Clinics",
  "Hospitals",
  "Medical Clinics",
  "Dermatologists",
  "Salons",
  "Beauty Parlours",
  "Spas",
  "Real Estate Agencies",
  "Property Dealers",
  "Car Dealerships",
  "Car Service Centers",
  "Auto Detailing",
  "Pet Clinics",
  "Veterinary Clinics",
  "Law Firms",
  "Accounting Firms",
  "Travel Agencies",
  "Event Management",
  "Wedding Planners",
  "Photography Studios",
  "Marketing Agencies",
  "IT Companies",
  "Software Companies",
  "SaaS Companies",
  "Consulting Firms",
  "Coworking Spaces",
  "Interior Designers",
  "Architects",
  "Construction Companies",
  "Furniture Stores",
  "Electronics Stores",
  "Retail Stores",
  "E-commerce Businesses"
];

interface BusinessTypeSelectorProps {
  value: string;
  onChange: (val: string) => void;
}

export const BusinessTypeSelector: React.FC<BusinessTypeSelectorProps> = ({ value, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  const filteredCategories = POPULAR_CATEGORIES.filter(c =>
    c.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5 text-indigo-400" />
          <span>Business Domain / Category</span>
        </label>
        <button
          type="button"
          onClick={() => {
            setIsCustomMode(!isCustomMode);
            if (!isCustomMode) {
              setSearchTerm('');
            }
          }}
          className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3" />
          <span>{isCustomMode ? 'Choose from list' : '+ Custom Category'}</span>
        </button>
      </div>

      {isCustomMode ? (
        <div>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder='e.g. "Luxury wedding planners", "AI startups", "Swimming academies"...'
            className="w-full bg-slate-950 border border-indigo-500/50 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            autoFocus
          />
          <p className="text-[10px] text-slate-400 mt-1 font-medium">
            Type any specific commercial domain worldwide. Google Places API will search matching establishments.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Search filter for list */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search 40+ business domains or select below..."
              value={searchTerm || (POPULAR_CATEGORIES.includes(value) ? value : '')}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                onChange(e.target.value);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          {/* Quick Category Chips */}
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-slate-950/50 rounded-lg border border-slate-800/80">
            {filteredCategories.slice(0, 16).map((cat) => {
              const isSelected = value.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => {
                    onChange(cat);
                    setSearchTerm('');
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
