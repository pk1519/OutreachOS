export interface LeadScore {
  total_score: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  reasons: string[];
}

export interface OutreachRecord {
  status: string;
  priority: string;
  follow_up_date?: string | null;
  last_contacted_date?: string | null;
  notes?: string | null;
  draft_message?: string | null;
}

export interface LeadNote {
  id: number;
  author: string;
  content: string;
  created_at: string;
}

export interface LeadContact {
  id: number;
  name: string;
  first_name?: string | null;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  is_primary?: boolean;
}

export interface Lead {
  id: number;
  place_id: string;
  campaign_id?: number | null;
  campaign_name?: string | null;
  search_id?: number | null;
  business_name: string;
  business_type?: string | null;
  category?: string | null;
  formatted_address?: string | null;
  address?: string | null;
  country?: string | null;
  state_region?: string | null;
  city?: string | null;
  area?: string | null;
  phone?: string | null;
  national_phone?: string | null;
  international_phone?: string | null;
  website?: string | null;
  website_uri?: string | null;
  email?: string | null;
  google_maps_uri?: string | null;
  rating?: number | null;
  user_rating_count?: number | null;
  review_count?: number | null;
  business_status?: string | null;
  primary_type?: string | null;
  source?: string | null;
  source_location?: string | null;
  is_google_derived?: boolean;
  lead_score: number;
  lead_status: 'NEW' | 'QUALIFIED' | 'CONTACTED' | 'REPLIED' | 'CONVERTED' | 'NOT_INTERESTED' | 'INVALID' | string;
  score?: LeadScore | null;
  outreach?: OutreachRecord | null;
  notes?: LeadNote[];
  tags?: string[];
  contacts?: LeadContact[];
  email_history?: Array<{ id: number; subject: string; status: string; sent_at?: string | null }>;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: number;
  name: string;
  business_type: string;
  location: string;
  country?: string | null;
  areas?: string | null;
  search_query?: string | null;
  status: string;
  subject_template?: string | null;
  body_template?: string | null;
  sender_email?: string | null;
  emails_per_minute?: number;
  max_emails?: number;
  total_recipients?: number;
  sent_count?: number;
  failed_count?: number;
  pending_count?: number;
  skipped_count?: number;
  progress_percent?: number;
  lead_ids?: number[];
  created_at: string;
  updated_at: string;
  lead_count?: number;
}

export interface CampaignRecipient {
  id: number;
  campaign_id: number;
  lead_id?: number | null;
  email: string;
  name?: string | null;
  company?: string | null;
  status: 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED' | 'SKIPPED' | string;
  error_message?: string | null;
  sent_at?: string | null;
  created_at: string;
}

export interface EmailMessage {
  id: number;
  campaign_id?: number | null;
  campaign_name?: string | null;
  lead_id?: number | null;
  company?: string | null;
  sender_email: string;
  recipient_email: string;
  subject: string;
  rendered_body: string;
  status: 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED' | 'SKIPPED' | string;
  gmail_message_id?: string | null;
  failure_reason?: string | null;
  sent_at?: string | null;
  created_at: string;
}

export interface PreflightValidation {
  total_selected: number;
  valid_count: number;
  invalid_count: number;
  suppressed_count: number;
  duplicate_count: number;
  already_contacted_count: number;
  estimated_emails_to_send: number;
  sender_email: string;
  valid_recipients: any[];
  invalid_recipients: any[];
  suppressed_recipients: any[];
}

export interface SuppressionItem {
  id: number;
  email: string;
  reason: 'UNSUBSCRIBED' | 'BOUNCED' | 'DO_NOT_CONTACT' | 'MANUAL_BLOCK' | string;
  created_at: string;
}

export interface GmailStatus {
  is_connected: boolean;
  account_email?: string | null;
  scope?: string | null;
  has_refresh_token?: boolean;
  credentials_file_found?: boolean;
  expiry?: string | null;
  message?: string;
}

export interface SearchRequest {
  business_type: string;
  location: string;
  country?: string;
  areas?: string[];
  custom_query?: string;
  min_rating?: number;
  min_reviews?: number;
  result_limit?: number;
  campaign_name?: string;
  campaign_id?: number;
}

export interface SearchStatsResponse {
  search_id: number;
  raw_results: number;
  unique_leads: number;
  duplicates_removed: number;
  campaign_id?: number;
  campaign_name?: string;
  query: string;
  message: string;
}

export interface SearchHistoryItem {
  id: number;
  campaign_id?: number | null;
  business_type: string;
  location: string;
  country?: string | null;
  areas?: string | null;
  query: string;
  raw_result_count: number;
  unique_count: number;
  duplicate_count: number;
  status: string;
  error_message?: string | null;
  created_at: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface DashboardStats {
  total_businesses_found: number;
  unique_leads: number;
  high_priority_leads: number;
  medium_priority_leads: number;
  low_priority_leads: number;
  businesses_with_website: number;
  businesses_with_phone: number;
  average_rating: number;
  total_reviews: number;
  contacted: number;
  replied: number;
  interested: number;
  demo_scheduled: number;
  proposal_sent: number;
  won: number;
  lost: number;
  follow_ups_due: number;
}

export interface CurrentSearchContext {
  business_type: string;
  location: string;
  country?: string;
  areas: string[];
  campaign_name: string;
}

export interface DashboardResponse {
  has_enough_data: boolean;
  stats: DashboardStats;
  current_search_context?: CurrentSearchContext | null;
  leads_by_category: ChartDataPoint[];
  leads_by_location: ChartDataPoint[];
  priority_distribution: ChartDataPoint[];
  outreach_distribution: ChartDataPoint[];
  rating_distribution: ChartDataPoint[];
  website_availability: ChartDataPoint[];
  phone_availability: ChartDataPoint[];
  reviews_distribution: ChartDataPoint[];
  leads_over_time: ChartDataPoint[];
  overview?: {
    total_leads: number;
    qualified_leads: number;
    contacted_leads: number;
    replied_leads: number;
    converted_leads: number;
    total_campaigns: number;
    running_campaigns: number;
    completed_campaigns: number;
    emails_sent: number;
    emails_failed: number;
    emails_pending: number;
  };
  charts?: {
    by_category: { name: string; value: number }[];
    by_city: { city: string; count: number }[];
  };
  recent_searches?: Array<{
    id: number;
    business_type: string;
    location: string;
    raw_result_count: number;
    created_at: string;
  }>;
  audit_logs?: Array<{
    id: number;
    action: string;
    details: string;
    created_at: string;
  }>;
}

export interface ApiUsageStats {
  places_api_requests: number;
  total_searches: number;
  pages_requested: number;
  businesses_returned: number;
  duplicates_prevented: number;
  errors_count: number;
  sheets_api_requests: number;
}

export interface GoogleConnectionStatus {
  is_connected: boolean;
  user_email?: string | null;
  expiry?: string | null;
  has_refresh_token: boolean;
}

export interface SheetDestination {
  id: number;
  campaign_id?: number | null;
  spreadsheet_id: string;
  spreadsheet_title: string;
  worksheet_title: string;
  spreadsheet_url?: string;
  leads_synced_count: number;
  last_synced_at?: string;
}
