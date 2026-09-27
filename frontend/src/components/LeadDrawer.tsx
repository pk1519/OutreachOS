import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Phone,
  Globe,
  Mail,
  Star,
  ExternalLink,
  ShieldCheck,
  Send,
  Calendar,
  FileText,
  Copy,
  Check,
  Sparkles,
  Save
} from 'lucide-react';
import { Lead } from '../types';
import { ScoreBadge } from './ScoreBadge';
import { StatusBadge } from './StatusBadge';
import { api } from '../api/client';

interface LeadDrawerProps {
  lead: Lead | null;
  onClose: () => void;
  onLeadUpdated: (updated: Lead) => void;
}

export const LeadDrawer: React.FC<LeadDrawerProps> = ({ lead, onClose, onLeadUpdated }) => {
  if (!lead) return null;

  const [status, setStatus] = useState(lead.outreach?.status || 'Not Contacted');
  const [priority, setPriority] = useState<string>(lead.score?.priority || 'MEDIUM');
  const [email, setEmail] = useState(lead.email || '');
  const [notes, setNotes] = useState(lead.outreach?.notes || '');
  const [followUpDate, setFollowUpDate] = useState(lead.outreach?.follow_up_date?.slice(0, 10) || '');
  const [draftMessage, setDraftMessage] = useState(lead.outreach?.draft_message || '');
  const [templateType, setTemplateType] = useState('value_proposition');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setStatus(lead.outreach?.status || 'Not Contacted');
    setPriority(lead.score?.priority || 'MEDIUM');
    setEmail(lead.email || '');
    setNotes(lead.outreach?.notes || '');
    setFollowUpDate(lead.outreach?.follow_up_date?.slice(0, 10) || '');
    setDraftMessage(lead.outreach?.draft_message || '');
  }, [lead]);

  const handleSaveCRM = async () => {
    setIsSaving(true);
    try {
      const updated = await api.updateLeadCRM(lead.id, {
        outreach_status: status,
        priority: priority,
        email: email.trim() || null,
        notes: notes,
        follow_up_date: followUpDate ? new Date(followUpDate).toISOString() : null,
        draft_message: draftMessage
      });
      onLeadUpdated(updated);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateDraft = async () => {
    setIsGenerating(true);
    try {
      const res = await api.generateOutreachDraft(lead.id, templateType);
      setDraftMessage(res.draft_message);
    } catch (err: any) {
      alert(`Generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyMessage = () => {
    if (!draftMessage) return;
    navigator.clipboard.writeText(draftMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-400">
              {lead.campaign_name || 'Active Discovery'}
            </span>
            <ScoreBadge score={lead.score?.total_score} priority={priority} />
            <StatusBadge status={status} />
          </div>
          <h2 className="text-lg font-extrabold text-white">{lead.business_name}</h2>
          <p className="text-xs text-slate-400 font-medium">{lead.business_type}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body Content */}
      <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
        {/* Transparent Lead Score Breakdown */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 to-slate-950 border border-indigo-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>DUO SYSTEMS LEAD SCORE: {lead.score?.total_score || 0}/100</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Internal Scoring</span>
          </div>

          <div className="space-y-1 pt-1">
            {lead.score?.reasons && lead.score.reasons.length > 0 ? (
              lead.score.reasons.map((reason, idx) => (
                <div key={idx} className="text-[11px] text-slate-300 flex items-center gap-2">
                  <span>{reason}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-[11px]">Score computed from verified business presence & contact availability.</p>
            )}
          </div>
        </div>

        {/* Google-Derived Verified Attributes */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Verified Establishment Details</span>
            <span className="text-[10px] text-slate-400 lowercase font-mono">Google Places (New)</span>
          </h3>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
            {/* Address */}
            <div className="flex items-start gap-2.5 text-slate-300">
              <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <div>{lead.formatted_address || 'No formatted address listed'}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  City: {lead.city || 'N/A'} | Area: {lead.area || 'N/A'} | Country: {lead.country || 'N/A'}
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-2.5 text-slate-300">
              <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{lead.national_phone || lead.international_phone || 'No phone number listed'}</span>
            </div>

            {/* Direct Email */}
            <div className="flex items-center gap-2.5 text-slate-300">
              <Mail className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              {lead.email ? (
                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${lead.email}`}
                    className="text-cyan-400 hover:underline font-mono truncate"
                    title={`Send email to ${lead.email}`}
                  >
                    {lead.email}
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(lead.email!);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Copy email"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <span className="text-slate-400">No public email discovered</span>
              )}
            </div>

            {/* Website */}
            <div className="flex items-center gap-2.5 text-slate-300">
              <Globe className="w-4 h-4 text-blue-400 flex-shrink-0" />
              {lead.website_uri ? (
                <a
                  href={lead.website_uri}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:underline flex items-center gap-1 truncate"
                >
                  <span className="truncate">{lead.website_uri}</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              ) : (
                <span className="text-slate-400">No official website listed</span>
              )}
            </div>

            {/* Rating & Google Maps */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
              <div className="flex items-center gap-1.5 text-yellow-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-yellow-400" />
                <span>{lead.rating ? `${lead.rating.toFixed(1)} / 5.0` : 'Unrated'}</span>
                <span className="text-slate-400 font-normal">({lead.user_rating_count || 0} reviews)</span>
              </div>

              {lead.google_maps_uri && (
                <a
                  href={lead.google_maps_uri}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Unique Place ID */}
            <div className="text-[10px] text-slate-400 font-mono pt-1">
              Place ID: {lead.place_id}
            </div>
          </div>
        </div>

        {/* Duo Systems CRM Controls */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider">
            Duo Systems CRM & Pipeline
          </h3>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Outreach Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="Not Contacted">Not Contacted</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Replied">Replied</option>
                  <option value="Interested">Interested</option>
                  <option value="Demo Scheduled">Demo Scheduled</option>
                  <option value="Proposal Sent">Proposal Sent</option>
                  <option value="Negotiating">Negotiating</option>
                  <option value="Won">Won</option>
                  <option value="Lost">Lost</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="Follow-up Required">Follow-up Required</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Lead Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="HIGH">HIGH (Priority)</option>
                  <option value="MEDIUM">MEDIUM (Standard)</option>
                  <option value="LOW">LOW (Backlog)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Direct Business Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@business.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Schedule Follow-up Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Internal Rep Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Log call outcome, decision-maker details, next steps..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Personalized B2B Outreach Message Generator */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Outreach Draft Generator</span>
            </h3>
            <span className="text-[10px] text-amber-400 font-semibold">* Human Review Required</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2">
              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="value_proposition">Value Proposition Angle</option>
                <option value="friendly_intro">Friendly Discovery Intro</option>
                <option value="partnership">Strategic Partnership Angle</option>
              </select>
              <button
                type="button"
                onClick={handleGenerateDraft}
                disabled={isGenerating}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGenerating ? 'Drafting...' : 'Generate Draft'}</span>
              </button>
            </div>

            {draftMessage && (
              <div className="space-y-2">
                <textarea
                  value={draftMessage}
                  onChange={(e) => setDraftMessage(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied to Clipboard</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Message</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          Last updated: {new Date(lead.updated_at).toLocaleDateString()}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSaveCRM}
            disabled={isSaving}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save CRM Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
