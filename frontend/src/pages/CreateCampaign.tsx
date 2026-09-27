import React, { useState, useEffect } from 'react';
import {
  Send,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Mail,
  User,
  Users,
  Building,
  MapPin,
  Tag,
  Globe,
  Phone,
  Eye,
  Play,
  RotateCcw,
  Check
} from 'lucide-react';
import { api } from '../api/client';
import { Lead, Campaign, PreflightValidation } from '../types';

interface CreateCampaignProps {
  onCampaignCreated?: (campaignId: number) => void;
  onNavigateToQueue?: () => void;
}

export const CreateCampaign: React.FC<CreateCampaignProps> = ({
  onCampaignCreated,
  onNavigateToQueue
}) => {
  const [campaignName, setCampaignName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [location, setLocation] = useState('Bangalore');
  const [subjectTemplate, setSubjectTemplate] = useState('AI Automation Solutions for {{company}}');
  const [bodyTemplate, setBodyTemplate] = useState(
    'Hi {{name}},\n\n' +
    'I came across {{company}} in {{city}} and wanted to reach out regarding ' +
    'some AI and automation solutions that could help improve your client operations ' +
    'and customer engagement.\n\n' +
    'Regards,\n' +
    'Priyanshu\n' +
    'Duo Systems'
  );
  const [emailsPerMinute, setEmailsPerMinute] = useState(10);
  const [testEmail, setTestEmail] = useState('contact.devworks7@gmail.com');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  // Preview & Test state
  const [previewSampleLead, setPreviewSampleLead] = useState<Lead | null>(null);
  const [sendingTest, setSendingTest] = useState(false);
  const [testStatus, setTestStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Confirmation Dialog
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<PreflightValidation | null>(null);
  const [userConfirmed, setUserConfirmed] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  useEffect(() => {
    setLoadingLeads(true);
    api.getLeads({ page_size: 100 })
      .then(res => {
        setLeads(res.leads);
        if (res.leads.length > 0) {
          setPreviewSampleLead(res.leads[0]);
          // Default select leads that have email
          const withEmail = res.leads.filter(l => l.email && l.email !== 'Not available').map(l => l.id);
          setSelectedLeadIds(withEmail.length > 0 ? withEmail : res.leads.slice(0, 10).map(l => l.id));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingLeads(false));
  }, []);

  const variables = [
    { label: '{{name}}', desc: 'Recipient / Owner Name', icon: User },
    { label: '{{first_name}}', desc: 'First Name only', icon: User },
    { label: '{{company}}', desc: 'Business Name', icon: Building },
    { label: '{{email}}', desc: 'Lead Email', icon: Mail },
    { label: '{{city}}', desc: 'City / Region', icon: MapPin },
    { label: '{{category}}', desc: 'Business Category', icon: Tag },
    { label: '{{website}}', desc: 'Website URL', icon: Globe },
    { label: '{{phone}}', desc: 'Phone Number', icon: Phone },
  ];

  const insertVariable = (variable: string) => {
    setBodyTemplate(prev => prev + ' ' + variable + ' ');
  };

  const renderPreview = (template: string) => {
    const sample = previewSampleLead || {
      business_name: 'ABC Restaurant',
      email: 'manager@example.com',
      city: location || 'Bangalore',
      category: businessType || 'Restaurant',
      phone: '+91 98765 43210',
      website: 'https://abcrestaurant.com'
    };

    let rendered = template
      .replace(/\{\{\s*company\s*\}\}/g, sample.business_name || 'Your Company')
      .replace(/\{\{\s*name\s*\}\}/g, sample.business_name || 'Business Owner')
      .replace(/\{\{\s*first_name\s*\}\}/g, (sample.business_name || 'Partner').split(' ')[0])
      .replace(/\{\{\s*email\s*\}\}/g, sample.email || 'partner@example.com')
      .replace(/\{\{\s*city\s*\}\}/g, sample.city || location || 'Bangalore')
      .replace(/\{\{\s*category\s*\}\}/g, sample.category || (sample as any).business_type || businessType || 'Business')
      .replace(/\{\{\s*phone\s*\}\}/g, sample.phone || '+91 98765 43210')
      .replace(/\{\{\s*website\s*\}\}/g, sample.website || 'https://example.com');

    return rendered;
  };

  const handleSendTestEmail = async () => {
    setSendingTest(true);
    setTestStatus(null);
    setErrorNotice(null);

    try {
      // First create a temporary draft campaign or send directly
      const camp = await api.createCampaign({
        name: campaignName.trim() || `Draft Campaign ${Date.now()}`,
        business_type: businessType || 'General',
        location: location || 'Bangalore',
        subject_template: subjectTemplate,
        body_template: bodyTemplate,
        sender_email: 'contact.devworks7@gmail.com'
      });

      const res = await api.sendTestEmail(camp.id, {
        test_email: testEmail.trim() || 'contact.devworks7@gmail.com',
        subject_template: subjectTemplate,
        body_template: bodyTemplate,
        sample_lead_id: previewSampleLead?.id
      });

      setTestStatus({
        success: true,
        message: `Test email successfully delivered to ${testEmail}! Check your inbox.`
      });
    } catch (err: any) {
      setTestStatus({
        success: false,
        message: err.message || 'Failed to send test email. Ensure Gmail is connected in Settings.'
      });
    } finally {
      setSendingTest(false);
    }
  };

  const handleOpenConfirmation = async () => {
    if (!campaignName.trim()) {
      setErrorNotice('Please provide a campaign name.');
      return;
    }
    if (selectedLeadIds.length === 0) {
      setErrorNotice('Please select at least one recipient lead.');
      return;
    }

    setErrorNotice(null);
    setValidating(true);

    try {
      // Create campaign
      const camp = await api.createCampaign({
        name: campaignName.trim(),
        business_type: businessType || 'General',
        location: location || 'Bangalore',
        subject_template: subjectTemplate,
        body_template: bodyTemplate,
        emails_per_minute: emailsPerMinute,
        sender_email: 'contact.devworks7@gmail.com',
        lead_ids: selectedLeadIds
      });

      // Run pre-flight validation
      const val = await api.validateCampaign(camp.id, selectedLeadIds);
      setValidationResult(val);
      setShowConfirmModal(true);
      if (onCampaignCreated) onCampaignCreated(camp.id);
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to prepare campaign.');
    } finally {
      setValidating(false);
    }
  };

  const handleLaunchCampaign = async () => {
    if (!userConfirmed) return;
    setLaunching(true);

    try {
      // Find latest created campaign
      const campaigns = await api.getCampaigns();
      const current = campaigns.find(c => c.name === campaignName.trim()) || campaigns[0];

      await api.sendCampaign(current.id, true, selectedLeadIds);
      setShowConfirmModal(false);
      if (onNavigateToQueue) {
        onNavigateToQueue();
      }
    } catch (err: any) {
      setErrorNotice(err.message || 'Error launching campaign.');
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Send className="w-3.5 h-3.5" />
            <span>Outreach Center</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Create Email Campaign</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure personalized B2B outreach with Gmail API sending and suppression protection.
          </p>
        </div>
      </div>

      {errorNotice && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 flex items-center gap-3 text-rose-300 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Main Grid: Form on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Configuration Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Basic Info */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-400" />
              <span>1. Campaign Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Campaign Name *</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={e => setCampaignName(e.target.value)}
                  placeholder="e.g. Bangalore Restaurant Outreach"
                  className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Bangalore"
                  className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Business Domain / Category</label>
                <input
                  type="text"
                  value={businessType}
                  onChange={e => setBusinessType(e.target.value)}
                  placeholder="e.g. Restaurants, Dental Clinics, AI Agencies"
                  className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Card: Email Composition */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-4 h-4 text-cyan-400" />
              <span>2. Email Composition & Placeholders</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Subject Line *</label>
              <input
                type="text"
                value={subjectTemplate}
                onChange={e => setSubjectTemplate(e.target.value)}
                placeholder="AI Automation Solutions for {{company}}"
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>

            {/* Variable inserter chips */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Click to Insert Variable:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {variables.map(v => (
                  <button
                    key={v.label}
                    type="button"
                    onClick={() => insertVariable(v.label)}
                    title={v.desc}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-800/80 hover:bg-indigo-600/30 text-indigo-300 border border-slate-700/60 hover:border-indigo-500 transition-all font-mono"
                  >
                    <span>{v.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Body Template *</label>
              <textarea
                rows={9}
                value={bodyTemplate}
                onChange={e => setBodyTemplate(e.target.value)}
                placeholder="Hi {{name}},\n\nI came across {{company}}..."
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors font-mono leading-relaxed"
              />
            </div>

            {/* Rate limit & sender setting */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/60">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Sending Rate (emails/min)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={emailsPerMinute}
                  onChange={e => setEmailsPerMinute(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">Safe throttling prevents API rate limit hits.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Authenticated Sender</label>
                <input
                  type="text"
                  disabled
                  value="contact.devworks7@gmail.com"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800/50 rounded-xl text-xs text-slate-400 font-mono cursor-not-allowed"
                />
                <p className="text-[10px] text-emerald-400 mt-1">✓ Gmail API Authorized</p>
              </div>
            </div>
          </div>

          {/* Card: Select Leads */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>3. Select Recipients ({selectedLeadIds.length} chosen)</span>
              </h2>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedLeadIds(leads.map(l => l.id))}
                  className="text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  Select All
                </button>
                <span className="text-slate-600">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedLeadIds([])}
                  className="text-slate-400 hover:text-slate-300"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {leads.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No leads available. Search leads in Lead Finder or import a CSV first.
                </p>
              ) : (
                leads.map(l => {
                  const isChecked = selectedLeadIds.includes(l.id);
                  const hasEmail = l.email && l.email !== 'Not available';
                  return (
                    <label
                      key={l.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-indigo-950/30 border-indigo-700/60 text-white'
                          : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedLeadIds(prev => [...prev, l.id]);
                            } else {
                              setSelectedLeadIds(prev => prev.filter(id => id !== l.id));
                            }
                          }}
                          className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
                        />
                        <div>
                          <span className="font-semibold text-slate-200">{l.business_name}</span>
                          <span className="text-[11px] text-slate-400 ml-2">({l.city || 'Bangalore'})</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasEmail ? (
                          <span className="font-mono text-[11px] text-cyan-400">{l.email}</span>
                        ) : (
                          <span className="text-[10px] text-amber-400/80 bg-amber-950/30 px-1.5 py-0.5 rounded">
                            No Email
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/40">
                          Score {l.lead_score || 0}
                        </span>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Preview & Testing */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: Email Preview */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl sticky top-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-400" />
                <span>Live Email Preview</span>
              </h2>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                Recipient Preview
              </span>
            </div>

            {/* Email Container Simulation */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 font-sans">
              <div className="text-xs space-y-1.5 pb-3 border-b border-slate-800/80">
                <div className="flex">
                  <span className="text-slate-400 w-16">To:</span>
                  <span className="text-cyan-400 font-mono text-xs">
                    {previewSampleLead?.email || 'manager@example.com'}
                  </span>
                </div>
                <div className="flex">
                  <span className="text-slate-400 w-16">From:</span>
                  <span className="text-slate-300 font-mono text-xs">contact.devworks7@gmail.com</span>
                </div>
                <div className="flex">
                  <span className="text-slate-400 w-16">Subject:</span>
                  <span className="text-white font-semibold text-xs">{renderPreview(subjectTemplate)}</span>
                </div>
              </div>

              {/* Rendered Body */}
              <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed pt-1 font-sans">
                {renderPreview(bodyTemplate)}
              </div>
            </div>

            {/* Test Email Section */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  Send Test Email First
                </label>
                <span className="text-[10px] text-slate-400">Strictly sends 1 test copy</span>
              </div>

              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  placeholder="contact.devworks7@gmail.com"
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  disabled={sendingTest}
                  onClick={handleSendTestEmail}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {sendingTest ? (
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Test</span>
                </button>
              </div>

              {testStatus && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    testStatus.success
                      ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-300'
                      : 'bg-rose-950/40 border border-rose-800/60 text-rose-300'
                  }`}
                >
                  {testStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{testStatus.message}</span>
                </div>
              )}
            </div>

            {/* Launch Campaign CTA */}
            <div className="pt-2">
              <button
                type="button"
                disabled={validating || selectedLeadIds.length === 0}
                onClick={handleOpenConfirmation}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {validating ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Validating Pre-Flight...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Review & Launch Campaign ({selectedLeadIds.length} Recipients)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && validationResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            {/* Modal Header */}
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white">Campaign Launch Confirmation</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confirm recipient breakdown and authorization before starting queue.
                </p>
              </div>
              <span className="px-2 py-1 rounded bg-indigo-600/20 text-indigo-300 text-xs font-bold font-mono">
                {campaignName}
              </span>
            </div>

            {/* Pre-flight Audit Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Selected</span>
                <p className="text-lg font-extrabold text-white">{validationResult.total_selected}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-emerald-400 uppercase font-bold">Valid Emails</span>
                <p className="text-lg font-extrabold text-emerald-400">{validationResult.valid_count}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-rose-400 uppercase font-bold">Invalid / Missing</span>
                <p className="text-lg font-extrabold text-rose-400">{validationResult.invalid_count}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-amber-400 uppercase font-bold">Already Contacted</span>
                <p className="text-lg font-extrabold text-amber-400">{validationResult.already_contacted_count}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-purple-400 uppercase font-bold">Suppressed</span>
                <p className="text-lg font-extrabold text-purple-400">{validationResult.suppressed_count}</p>
              </div>
              <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-700/60">
                <span className="text-[10px] text-indigo-300 uppercase font-bold">Estimated to Send</span>
                <p className="text-lg font-extrabold text-white">{validationResult.estimated_emails_to_send}</p>
              </div>
            </div>

            {/* Sender and rate info */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Authenticated Sender:</span>
                <span className="text-cyan-400 font-mono font-semibold">contact.devworks7@gmail.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Throttling Rate:</span>
                <span className="text-slate-200 font-semibold">{emailsPerMinute} emails / min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Suppression Policy:</span>
                <span className="text-emerald-400 font-semibold">Active (Automatic Skip)</span>
              </div>
            </div>

            {/* Explicit confirmation checkbox */}
            <label className="flex items-start gap-3 p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 cursor-pointer">
              <input
                type="checkbox"
                checked={userConfirmed}
                onChange={e => setUserConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
              />
              <span className="text-xs text-slate-200 font-medium leading-relaxed">
                I confirm that I want to send this campaign to{' '}
                <strong className="text-white">{validationResult.estimated_emails_to_send} recipients</strong> via
                official Gmail API with Duo Systems rate limiting.
              </span>
            </label>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Back to Edit
              </button>
              <button
                type="button"
                disabled={!userConfirmed || launching}
                onClick={handleLaunchCampaign}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-40 flex items-center gap-2"
              >
                {launching ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Queuing Emails...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Start Sending</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
