import React, { useState } from 'react';
import {
  ExternalLink,
  MapPin,
  Phone,
  Globe,
  Mail,
  Star,
  MoreHorizontal,
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  MessageSquare
} from 'lucide-react';
import { Lead } from '../types';
import { ScoreBadge } from './ScoreBadge';
import { StatusBadge } from './StatusBadge';

interface LeadTableProps {
  leads: Lead[];
  selectedLeadIds: number[];
  onToggleSelectAll: () => void;
  onToggleSelectLead: (id: number) => void;
  onSelectLeadForDrawer: (lead: Lead) => void;
  onQuickExportSelected?: () => void;
  onQuickStatusChange?: (leadId: number, status: string) => void;
}

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  selectedLeadIds,
  onToggleSelectAll,
  onToggleSelectLead,
  onSelectLeadForDrawer,
  onQuickExportSelected,
  onQuickStatusChange
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const allSelected = leads.length > 0 && selectedLeadIds.length === leads.length;

  const copyToClipboard = (text: string, idKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idKey);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleExportCSV = () => {
    if (leads.length === 0) return;
    const leadsToExport = selectedLeadIds.length > 0
      ? leads.filter(l => selectedLeadIds.includes(l.id))
      : leads;

    const headers = [
      "Business Name",
      "Business Type",
      "Location",
      "Address",
      "Phone",
      "Website",
      "Email",
      "Rating",
      "Reviews",
      "Place ID",
      "Lead Score",
      "Priority",
      "Outreach Status"
    ];

    const rows = leadsToExport.map(l => [
      `"${(l.business_name || '').replace(/"/g, '""')}"`,
      `"${(l.business_type || '').replace(/"/g, '""')}"`,
      `"${(l.city || l.area || '').replace(/"/g, '""')}"`,
      `"${(l.formatted_address || '').replace(/"/g, '""')}"`,
      `"${(l.national_phone || l.international_phone || '').replace(/"/g, '""')}"`,
      `"${(l.website_uri || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      l.rating || 0,
      l.user_rating_count || 0,
      `"${l.place_id}"`,
      l.score?.total_score || 0,
      `"${l.score?.priority || 'LOW'}"`,
      `"${l.outreach?.status || 'Not Contacted'}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Duo_Systems_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-sm">
      {/* Table Toolbar if leads are selected or for quick actions */}
      <div className="p-3 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-300 font-semibold">
            {selectedLeadIds.length > 0 ? (
              <span className="text-indigo-400 font-bold">{selectedLeadIds.length} of {leads.length} selected</span>
            ) : (
              <span>Total in view: <strong className="text-white">{leads.length} leads</strong></span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick CSV Export */}
          <button
            onClick={handleExportCSV}
            title="Download CSV for quick offline use"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download CSV</span>
          </button>

          {/* Primary Google Sheets Export */}
          {onQuickExportSelected && (
            <button
              onClick={onQuickExportSelected}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-sm transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Sync to Google Sheets</span>
            </button>
          )}
        </div>
      </div>

      {/* Responsive Horizontal Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/90 text-[11px] font-bold uppercase tracking-wider text-slate-400 select-none">
              <th className="py-3 px-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  aria-label="Select all leads"
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </th>
              <th className="py-3 px-4 min-w-[200px]">Business Name</th>
              <th className="py-3 px-4 min-w-[130px]">Domain</th>
              <th className="py-3 px-4 min-w-[120px]">Location</th>
              <th className="py-3 px-4 min-w-[160px]">Address</th>
              <th className="py-3 px-4 min-w-[140px]">Direct Phone</th>
              <th className="py-3 px-4 min-w-[90px]">Website</th>
              <th className="py-3 px-4 min-w-[160px]">Email</th>
              <th className="py-3 px-4 min-w-[90px]">Rating</th>
              <th className="py-3 px-4 min-w-[80px]">Reviews</th>
              <th className="py-3 px-4 min-w-[110px]">Lead Score</th>
              <th className="py-3 px-4 min-w-[140px]">Outreach Status</th>
              <th className="py-3 px-4 min-w-[90px]">Google Maps</th>
              <th className="py-3 px-4 text-right">Quick Pitch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={14} className="py-12 text-center text-slate-400">
                  <div className="max-w-sm mx-auto space-y-2">
                    <p className="text-sm font-semibold text-slate-300">No leads found in this view.</p>
                    <p className="text-xs text-slate-400">
                      Use the <strong>Find Leads</strong> page or select a discovery preset above to populate real leads.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const isSelected = selectedLeadIds.includes(lead.id);
                const phone = lead.national_phone || lead.international_phone;
                return (
                  <tr
                    key={lead.id}
                    className={`hover:bg-slate-800/40 transition-colors group cursor-pointer ${
                      isSelected ? 'bg-indigo-950/20' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelectLead(lead.id)}
                        aria-label={`Select lead ${lead.business_name}`}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>

                    {/* Business Name */}
                    <td className="py-3 px-4 font-bold text-slate-100" onClick={() => onSelectLeadForDrawer(lead)}>
                      <div className="flex flex-col">
                        <span className="group-hover:text-indigo-400 transition-colors truncate max-w-[210px]">
                          {lead.business_name}
                        </span>
                        {lead.campaign_name && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            {lead.campaign_name}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Business Type */}
                    <td className="py-3 px-4 text-slate-300" onClick={() => onSelectLeadForDrawer(lead)}>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300 border border-slate-700">
                        {lead.business_type || 'General'}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4 text-slate-300" onClick={() => onSelectLeadForDrawer(lead)}>
                      <div className="flex items-center gap-1 text-[11px] text-slate-300 truncate max-w-[120px]">
                        <MapPin className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                        <span className="truncate">{lead.area || lead.city || lead.country || 'N/A'}</span>
                      </div>
                    </td>

                    {/* Address */}
                    <td className="py-3 px-4 text-slate-400 text-[11px] truncate max-w-[160px]" onClick={() => onSelectLeadForDrawer(lead)}>
                      <span className="truncate" title={lead.formatted_address || ''}>
                        {lead.formatted_address || '-'}
                      </span>
                    </td>

                    {/* Direct Phone with Copy button */}
                    <td className="py-3 px-4 text-slate-300 text-[11px]" onClick={(e) => e.stopPropagation()}>
                      {phone ? (
                        <div className="flex items-center gap-1.5 font-mono">
                          <Phone className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                          <span className="truncate max-w-[100px]">{phone}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(phone, `phone_${lead.id}`)}
                            title="Copy phone number"
                            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                          >
                            {copiedId === `phone_${lead.id}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Website */}
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      {lead.website_uri ? (
                        <a
                          href={lead.website_uri}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[11px]"
                        >
                          <Globe className="w-3 h-3" />
                          <span>Visit</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Email */}
                    <td className="py-3 px-4 text-slate-300 text-[11px]" onClick={(e) => e.stopPropagation()}>
                      {lead.email ? (
                        <div className="flex items-center gap-1.5 font-mono">
                          <Mail className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                          <a
                            href={`mailto:${lead.email}`}
                            className="truncate max-w-[130px] hover:text-cyan-300 hover:underline"
                            title={`Send email to ${lead.email}`}
                          >
                            {lead.email}
                          </a>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(lead.email!, `email_${lead.id}`)}
                            title="Copy email address"
                            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                          >
                            {copiedId === `email_${lead.id}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">Not provided</span>
                      )}
                    </td>

                    {/* Rating */}
                    <td className="py-3 px-4 text-yellow-400 font-bold" onClick={() => onSelectLeadForDrawer(lead)}>
                      {lead.rating && lead.rating > 0 ? (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400" />
                          <span>{lead.rating.toFixed(1)}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">Unrated</span>
                      )}
                    </td>

                    {/* Reviews */}
                    <td className="py-3 px-4 text-slate-300 text-[11px]" onClick={() => onSelectLeadForDrawer(lead)}>
                      {lead.user_rating_count ? `${lead.user_rating_count.toLocaleString()}` : '0'}
                    </td>

                    {/* Duo Systems Lead Score */}
                    <td className="py-3 px-4" onClick={() => onSelectLeadForDrawer(lead)}>
                      <ScoreBadge score={lead.score?.total_score} priority={lead.score?.priority} />
                    </td>

                    {/* Outreach Status Selector */}
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      {onQuickStatusChange ? (
                        <select
                          value={lead.outreach?.status || 'Not Contacted'}
                          onChange={(e) => onQuickStatusChange(lead.id, e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                        >
                          <option value="Not Contacted">Not Contacted</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Replied">Replied</option>
                          <option value="Interested">Interested</option>
                          <option value="Demo Scheduled">Demo Scheduled</option>
                          <option value="Proposal Sent">Proposal Sent</option>
                          <option value="Won">Won</option>
                          <option value="Lost">Lost</option>
                        </select>
                      ) : (
                        <StatusBadge status={lead.outreach?.status || 'Not Contacted'} />
                      )}
                    </td>

                    {/* Google Maps Link */}
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      {lead.google_maps_uri ? (
                        <a
                          href={lead.google_maps_uri}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Maps</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Quick Pitch Action Button */}
                    <td className="py-3 px-4 text-right" onClick={() => onSelectLeadForDrawer(lead)}>
                      <button
                        type="button"
                        className="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[11px] font-bold flex items-center gap-1 ml-auto transition-all"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Pitch</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
