import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Dashboard } from './pages/Dashboard';
import { FindLeads } from './pages/FindLeads';
import { Campaigns } from './pages/Campaigns';
import { ImportedLeads } from './pages/ImportedLeads';
import { Leads } from './pages/Leads';
import { GoogleSheets } from './pages/GoogleSheets';
import { Analytics } from './pages/Analytics';
import { SearchHistory } from './pages/SearchHistory';
import { ApiUsage } from './pages/ApiUsage';
import { Settings } from './pages/Settings';
import { Documentation } from './pages/Documentation';
import { api } from './api/client';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCampaignIdForLeads, setSelectedCampaignIdForLeads] = useState<number | null>(null);
  const [isSheetsConnected, setIsSheetsConnected] = useState(false);
  const [hasPlacesKey, setHasPlacesKey] = useState(false);

  useEffect(() => {
    // Check initial connection states
    api.getGoogleStatus().then(status => {
      setIsSheetsConnected(status.is_connected);
    }).catch(() => {});

    api.getSettings().then(s => {
      setHasPlacesKey(s.has_places_api_key);
    }).catch(() => {});
  }, []);

  const handleGlobalSearch = (_query: string) => {
    setActiveTab('find-leads');
  };

  const handleSelectCampaignForLeads = (campaignId: number) => {
    setSelectedCampaignIdForLeads(campaignId);
    setActiveTab('leads');
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Sidebar with Lead Finder, Campaigns & Google Sheets branding */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Topbar */}
        <Topbar
          onGlobalSearch={handleGlobalSearch}
          isSheetsConnected={isSheetsConnected}
          hasPlacesApiKey={hasPlacesKey}
        />

        {/* Page Routing */}
        <main className="flex-1 pb-16">
          {activeTab === 'dashboard' && (
            <Dashboard onNavigateToFindLeads={() => setActiveTab('find-leads')} />
          )}
          {activeTab === 'find-leads' && <FindLeads />}
          {activeTab === 'leads' && (
            <Leads initialCampaignId={selectedCampaignIdForLeads} />
          )}

          {/* Campaign & Lead Import Pages */}
          {activeTab === 'campaigns' && (
            <Campaigns
              onSelectCampaignForLeads={handleSelectCampaignForLeads}
            />
          )}
          {activeTab === 'import-leads' && (
            <ImportedLeads
              onNavigateToLeads={() => setActiveTab('leads')}
              onNavigateToSheets={() => setActiveTab('sheets')}
            />
          )}

          {/* Google Sheets, Search History & Settings */}
          {activeTab === 'sheets' && <GoogleSheets />}
          {activeTab === 'analytics' && <Analytics />}
          {activeTab === 'search-history' && <SearchHistory />}
          {activeTab === 'api-usage' && <ApiUsage />}
          {activeTab === 'settings' && <Settings />}
          {activeTab === 'documentation' && <Documentation />}
        </main>
      </div>
    </div>
  );
};

export default App;
