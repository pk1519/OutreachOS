import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, CheckCircle2, AlertCircle, LogOut, Sparkles } from 'lucide-react';
import { api } from '../api/client';
import { GoogleConnectionStatus } from '../types';

export const SheetsConnect: React.FC = () => {
  const [status, setStatus] = useState<GoogleConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const data = await api.getGoogleStatus();
      setStatus(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnectOAuth = async () => {
    try {
      const auth = await api.getGoogleAuthUrl();
      if (auth.auth_url) {
        window.location.href = auth.auth_url;
      } else {
        alert("Google Client ID is not configured yet in .env or Settings. You can click 'Quick Demo Connect' below to test immediately!");
      }
    } catch (err: any) {
      alert(`OAuth error: ${err.message}`);
    }
  };

  const handleDemoConnect = async () => {
    setIsLoading(true);
    try {
      const res = await api.connectDemoSheets();
      setStatus(res);
    } catch (err: any) {
      alert(`Demo connect error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await api.disconnectSheets();
      setStatus({ is_connected: false, has_refresh_token: false });
    } catch (err: any) {
      alert(`Disconnect error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 animate-pulse text-xs text-slate-400">
        Checking Google Sheets connection status...
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Google Sheets Integration</h3>
            <p className="text-xs text-slate-400">
              Primary CRM destination. Leads are exported with Place ID deduplication.
            </p>
          </div>
        </div>

        {status?.is_connected ? (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" />
            <span>Connected</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-semibold border border-slate-700">
            <AlertCircle className="w-4 h-4" />
            <span>Not Connected</span>
          </span>
        )}
      </div>

      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-slate-800/80">
        <div className="text-slate-400">
          {status?.is_connected ? (
            <span>
              Authorized Google Account: <strong className="text-white">{status.user_email || 'partner@duosystems.com'}</strong>
            </span>
          ) : (
            <span>Connect your Google Account via official OAuth 2.0 to export leads directly to Sheets.</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {status?.is_connected ? (
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleConnectOAuth}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow-md shadow-emerald-600/30 transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Connect Google Account</span>
              </button>
              <button
                onClick={handleDemoConnect}
                title="Authorize demo connection for immediate testing"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold border border-cyan-500/30 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quick Demo Connect</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
