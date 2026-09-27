import {
  Lead,
  Campaign,
  CampaignRecipient,
  EmailMessage,
  PreflightValidation,
  SuppressionItem,
  GmailStatus,
  SearchRequest,
  SearchStatsResponse,
  SearchHistoryItem,
  DashboardResponse,
  ApiUsageStats,
  GoogleConnectionStatus,
  SheetDestination
} from '../types';

const BASE_URL = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errMsg = `Request failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      errMsg = errJson.detail || errJson.message || errMsg;
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }
  return res.json();
}

export const api = {
  // Gmail OAuth & Sending
  getGmailStatus: (): Promise<GmailStatus> =>
    fetch(`${BASE_URL}/integrations/gmail/status`).then(res => handleResponse<GmailStatus>(res)),

  getGmailConnectUrl: (redirectUri?: string): Promise<{ configured: boolean; auth_url: string; target_account: string; scope: string }> => {
    const q = redirectUri ? `?redirect_uri=${encodeURIComponent(redirectUri)}` : '';
    return fetch(`${BASE_URL}/integrations/gmail/connect${q}`).then(res => handleResponse(res));
  },

  disconnectGmail: (): Promise<{ status: string; message: string }> =>
    fetch(`${BASE_URL}/integrations/gmail/disconnect`, { method: 'POST' }).then(res => handleResponse(res)),

  simulateConnectGmail: (): Promise<{ status: string; account_email: string }> =>
    fetch(`${BASE_URL}/integrations/gmail/simulate-connect`, { method: 'POST' }).then(res => handleResponse(res)),

  // Dashboard Overview
  getDashboard: (): Promise<DashboardResponse> =>
    fetch(`${BASE_URL}/dashboard`).then(res => handleResponse<DashboardResponse>(res)),

  // Discovery & Places API
  discoverLeads: (req: SearchRequest): Promise<SearchStatsResponse> =>
    fetch(`${BASE_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    }).then(res => handleResponse<SearchStatsResponse>(res)),

  getSearchHistory: (): Promise<SearchHistoryItem[]> =>
    fetch(`${BASE_URL}/search/history`).then(res => handleResponse<SearchHistoryItem[]>(res)),

  // Leads CRM
  getLeads: (params: Record<string, any>): Promise<{ total: number; page: number; page_size: number; leads: Lead[] }> => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        q.append(k, String(v));
      }
    });
    return fetch(`${BASE_URL}/leads?${q.toString()}`).then(res => handleResponse(res));
  },

  getLeadDetails: (id: number): Promise<Lead> =>
    fetch(`${BASE_URL}/leads/${id}`).then(res => handleResponse<Lead>(res)),

  createLead: (lead: Record<string, any>): Promise<Lead> =>
    fetch(`${BASE_URL}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead)
    }).then(res => handleResponse<Lead>(res)),

  updateLead: (id: number, data: Record<string, any>): Promise<Lead> =>
    fetch(`${BASE_URL}/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<Lead>(res)),

  updateLeadCRM: (id: number, data: Record<string, any>): Promise<Lead> =>
    fetch(`${BASE_URL}/leads/${id}/crm`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<Lead>(res)),

  addLeadNote: (id: number, content: string, author?: string): Promise<Lead> =>
    fetch(`${BASE_URL}/leads/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, author })
    }).then(res => handleResponse<Lead>(res)),

  addLeadTag: (id: number, tag: string): Promise<Lead> =>
    fetch(`${BASE_URL}/leads/${id}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag })
    }).then(res => handleResponse<Lead>(res)),

  addLeadContact: (id: number, contact: Record<string, any>): Promise<Lead> =>
    fetch(`${BASE_URL}/leads/${id}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact)
    }).then(res => handleResponse<Lead>(res)),

  deleteLead: (id: number): Promise<void> =>
    fetch(`${BASE_URL}/leads/${id}`, { method: 'DELETE' }).then(res => handleResponse(res)),

  // CSV Import & Export
  detectCsvColumns: (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${BASE_URL}/leads/import/detect-columns`, {
      method: 'POST',
      body: formData
    }).then(res => handleResponse(res));
  },

  importLeadsCsv: (payload: { csv_content: string; column_mapping: Record<string, string>; campaign_id?: number }): Promise<any> =>
    fetch(`${BASE_URL}/leads/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(res => handleResponse(res)),

  exportLeadsCsv: (leadIds?: number[], campaignId?: number): Promise<Blob> =>
    fetch(`${BASE_URL}/leads/export/csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_ids: leadIds, campaign_id: campaignId })
    }).then(res => {
      if (!res.ok) throw new Error('CSV Export failed');
      return res.blob();
    }),

  generateOutreachDraft: (id: number, template: string): Promise<{ draft_message: string }> =>
    fetch(`${BASE_URL}/leads/${id}/generate-outreach?template_type=${template}`, {
      method: 'POST'
    }).then(res => handleResponse(res)),

  // Campaigns & Outreach
  getCampaigns: (): Promise<Campaign[]> =>
    fetch(`${BASE_URL}/campaigns`).then(res => handleResponse<Campaign[]>(res)),

  getCampaign: (id: number): Promise<Campaign> =>
    fetch(`${BASE_URL}/campaigns/${id}`).then(res => handleResponse<Campaign>(res)),

  createCampaign: (data: Partial<Campaign>): Promise<Campaign> =>
    fetch(`${BASE_URL}/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<Campaign>(res)),

  updateCampaign: (id: number, data: Partial<Campaign>): Promise<Campaign> =>
    fetch(`${BASE_URL}/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<Campaign>(res)),

  deleteCampaign: (id: number): Promise<void> =>
    fetch(`${BASE_URL}/campaigns/${id}`, { method: 'DELETE' }).then(res => handleResponse(res)),

  validateCampaign: (campaignId: number, leadIds?: number[]): Promise<PreflightValidation> =>
    fetch(`${BASE_URL}/campaigns/${campaignId}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadIds || null)
    }).then(res => handleResponse<PreflightValidation>(res)),

  sendTestEmail: (campaignId: number, payload: {
    test_email: string;
    subject_template: string;
    body_template: string;
    sample_lead_id?: number;
  }): Promise<any> =>
    fetch(`${BASE_URL}/campaigns/${campaignId}/test-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(res => handleResponse(res)),

  sendCampaign: (campaignId: number, confirmed: boolean, leadIds?: number[]): Promise<any> =>
    fetch(`${BASE_URL}/campaigns/${campaignId}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmed, lead_ids: leadIds })
    }).then(res => handleResponse(res)),

  pauseCampaign: (campaignId: number): Promise<any> =>
    fetch(`${BASE_URL}/campaigns/${campaignId}/pause`, { method: 'POST' }).then(res => handleResponse(res)),

  resumeCampaign: (campaignId: number): Promise<any> =>
    fetch(`${BASE_URL}/campaigns/${campaignId}/resume`, { method: 'POST' }).then(res => handleResponse(res)),

  cancelCampaign: (campaignId: number): Promise<any> =>
    fetch(`${BASE_URL}/campaigns/${campaignId}/cancel`, { method: 'POST' }).then(res => handleResponse(res)),

  getCampaignRecipients: (campaignId: number): Promise<CampaignRecipient[]> =>
    fetch(`${BASE_URL}/campaigns/${campaignId}/recipients`).then(res => handleResponse<CampaignRecipient[]>(res)),

  addLeadsToCampaign: (campaignId: number, leadIds: number[]): Promise<any> =>
    fetch(`${BASE_URL}/campaigns/${campaignId}/add-leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_ids: leadIds })
    }).then(res => handleResponse(res)),

  // Email Queue & History
  getEmailHistory: (params?: Record<string, any>): Promise<{ total: number; page: number; page_size: number; messages: EmailMessage[] }> => {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          q.append(k, String(v));
        }
      });
    }
    return fetch(`${BASE_URL}/email-history?${q.toString()}`).then(res => handleResponse(res));
  },

  getEmailQueue: (): Promise<{ summary: any; active_campaigns: any[]; queue_preview: any[] }> =>
    fetch(`${BASE_URL}/email-queue`).then(res => handleResponse(res)),

  // Suppression List
  getSuppressionList: (): Promise<SuppressionItem[]> =>
    fetch(`${BASE_URL}/suppression`).then(res => handleResponse<SuppressionItem[]>(res)),

  addToSuppressionList: (email: string, reason: string = 'MANUAL_BLOCK'): Promise<any> =>
    fetch(`${BASE_URL}/suppression`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, reason })
    }).then(res => handleResponse(res)),

  deleteFromSuppressionList: (id: number): Promise<void> =>
    fetch(`${BASE_URL}/suppression/${id}`, { method: 'DELETE' }).then(res => handleResponse(res)),

  // Google Sheets
  getGoogleStatus: (): Promise<GoogleConnectionStatus> =>
    fetch(`${BASE_URL}/sheets/status`).then(res => handleResponse<GoogleConnectionStatus>(res)),

  getGoogleAuthUrl: (): Promise<{ auth_url: string; is_configured: boolean }> =>
    fetch(`${BASE_URL}/sheets/auth-url`).then(res => handleResponse(res)),

  connectDemoSheets: (): Promise<GoogleConnectionStatus> =>
    fetch(`${BASE_URL}/sheets/connect-demo`, { method: 'POST' }).then(res => handleResponse<GoogleConnectionStatus>(res)),

  disconnectSheets: (): Promise<{ status: string }> =>
    fetch(`${BASE_URL}/sheets/disconnect`, { method: 'POST' }).then(res => handleResponse(res)),

  exportLeadsToSheet: (payload: {
    spreadsheet_id: string;
    worksheet_title: string;
    lead_ids?: number[];
    campaign_id?: number;
    create_dashboard_tab?: boolean;
    update_existing?: boolean;
  }): Promise<any> =>
    fetch(`${BASE_URL}/sheets/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(res => handleResponse(res)),

  getSheetDestinations: (): Promise<SheetDestination[]> =>
    fetch(`${BASE_URL}/sheets/destinations`).then(res => handleResponse<SheetDestination[]>(res)),

  // Analytics & API Usage
  getDashboardAnalytics: (params?: Record<string, any>): Promise<any> => {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          q.append(k, String(v));
        }
      });
    }
    return fetch(`${BASE_URL}/analytics/dashboard?${q.toString()}`).then(res => handleResponse(res));
  },

  getApiUsage: (): Promise<ApiUsageStats> =>
    fetch(`${BASE_URL}/analytics/api-usage`).then(res => handleResponse<ApiUsageStats>(res)),

  // Settings
  getSettings: (): Promise<any> =>
    fetch(`${BASE_URL}/settings`).then(res => handleResponse(res)),

  updateSettings: (payload: any): Promise<any> =>
    fetch(`${BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(res => handleResponse(res))
};
