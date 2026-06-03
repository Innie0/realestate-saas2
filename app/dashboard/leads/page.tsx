'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { supabase } from '@/lib/supabase';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Inbox, Link2, Copy, Check, Download, Phone, Mail,
  Home, Building2, KeyRound, Search, Flame, Thermometer,
  Snowflake, X, ArrowRight, Users, Clock, Lock, MailCheck,
  Loader2, DoorOpen, Plus,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  lead_type?: string;
  message?: string;
  created_at: string;
  status: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLeadTemp(lead: Lead): 'hot' | 'warm' | 'cold' {
  const hoursAgo = (Date.now() - new Date(lead.created_at).getTime()) / 3_600_000;
  const msg = (lead.message || '').toLowerCase();
  if (hoursAgo < 48 || msg.includes('timeline: asap')) return 'hot';
  if (hoursAgo < 168 || msg.includes('timeline: 1-3')) return 'warm';
  return 'cold';
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const LEAD_TYPE_ICONS: Record<string, React.ElementType> = {
  buyer: Home,
  seller: Building2,
  renter: KeyRound,
  browsing: Search,
};

const LEAD_TYPE_LABELS: Record<string, string> = {
  buyer: 'Buying',
  seller: 'Selling',
  renter: 'Renting',
  browsing: 'Just looking',
};

// ─── Badge components ─────────────────────────────────────────────────────────

function TempBadge({ temp }: { temp: 'hot' | 'warm' | 'cold' }) {
  if (temp === 'hot') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/20">
      <Flame className="w-3 h-3" /> Hot
    </span>
  );
  if (temp === 'warm') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
      <Thermometer className="w-3 h-3" /> Warm
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-white/5 text-gray-500 border border-white/10">
      <Snowflake className="w-3 h-3" /> Cold
    </span>
  );
}

// ─── Lead Card ────────────────────────────────────────────────────────────────

function LeadCard({ lead }: { lead: Lead }) {
  const temp = getLeadTemp(lead);
  const TypeIcon = lead.lead_type ? LEAD_TYPE_ICONS[lead.lead_type] : null;

  // Parse structured info out of message
  const msg = lead.message || '';
  const lines = msg.split('\n').filter(Boolean);
  const infoLines = lines.filter(l =>
    l.startsWith('Timeline:') || l.startsWith('Budget:') || l.startsWith('Area:')
  );

  return (
    <div className="bg-[#111111] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-white text-sm">{lead.name}</h3>
            <TempBadge temp={temp} />
            {TypeIcon && lead.lead_type && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white/5 text-gray-400 border border-white/10">
                <TypeIcon className="w-3 h-3" />
                {LEAD_TYPE_LABELS[lead.lead_type]}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeAgo(lead.created_at)}
          </p>
        </div>
      </div>

      {/* Contact info */}
      <div className="flex flex-wrap gap-3 mb-3">
        {lead.email && (
          <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
            <Mail className="w-3.5 h-3.5" />
            {lead.email}
          </a>
        )}
        {lead.phone && (
          <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
            <Phone className="w-3.5 h-3.5" />
            {lead.phone}
          </a>
        )}
      </div>

      {/* Structured lead info */}
      {infoLines.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {infoLines.map((line, i) => (
            <span key={i} className="text-xs bg-white/5 border border-white/10 text-gray-400 px-2 py-0.5 rounded-lg">
              {line}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-white/5">
        <Link
          href={`/dashboard/clients/${lead.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors border border-white/10"
        >
          View Profile <ArrowRight className="w-3 h-3" />
        </Link>
        {lead.phone && (
          <a
            href={`tel:${lead.phone}`}
            className="flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-white text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <Phone className="w-3 h-3" /> Call
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaidPlan, setIsPaidPlan] = useState(false);
  const [leadFormUrl, setLeadFormUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');

  // Agent settings state
  const [autoFollowup, setAutoFollowup] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsPhone, setSmsPhone] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    document.title = 'Leads - Realestic';
    fetchLeads();
    checkPlanAndUrl();
    fetchSettings();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/clients?source=lead_form&status=all');
      const result = await res.json();
      if (result.success) setLeads(result.data);
    } catch (e) {
      console.error('Error fetching leads:', e);
    } finally {
      setLoading(false);
    }
  };

  const checkPlanAndUrl = async () => {
    const [{ data: { user } }, usageRes] = await Promise.all([
      supabase.auth.getUser(),
      fetch('/api/usage'),
    ]);
    const usageData = await usageRes.json();
    if (usageData.success) {
      setIsPaidPlan(usageData.plan === 'starter' || usageData.plan === 'pro');
    }
    if (user) {
      const fullName: string = user.user_metadata?.full_name || '';
      const nameSlug = fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const slug = nameSlug ? `${nameSlug}--${user.id}` : user.id;
      setLeadFormUrl(`${window.location.origin}/lead/${slug}`);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/agent-settings');
      const result = await res.json();
      if (result.success && result.data) {
        setAutoFollowup(result.data.auto_followup_enabled || false);
        setSmsEnabled(result.data.sms_alerts_enabled || false);
        setSmsPhone(result.data.sms_phone || '');
      }
    } catch (e) {
      console.error('Error fetching settings:', e);
    }
  };

  const saveSettings = async (updates: Record<string, unknown>) => {
    setSavingSettings(true);
    try {
      await fetch('/api/agent-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (e) {
      console.error('Error saving settings:', e);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCopy = async () => {
    if (!leadFormUrl) return;
    await navigator.clipboard.writeText(leadFormUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById('leads-qr') as HTMLCanvasElement;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'lead-form-qr.png';
    a.click();
  };

  // Stats
  const now = Date.now();
  const thisWeek = leads.filter(l => now - new Date(l.created_at).getTime() < 7 * 86_400_000);
  const hotLeads = leads.filter(l => getLeadTemp(l) === 'hot');

  const filteredLeads = leads.filter(l => {
    if (filter === 'all') return true;
    return getLeadTemp(l) === filter;
  });

  return (
    <div className="min-h-screen">
      <Header title="Leads" subtitle="Manage your incoming leads and sharing tools" />

      <div className="p-4 sm:p-6 text-white space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Leads', value: leads.length, icon: Users },
            { label: 'New This Week', value: thisWeek.length, icon: Clock },
            { label: 'Hot Leads', value: hotLeads.length, icon: Flame },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-[#111111] border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-gray-500" />
                <p className="text-xs text-gray-500">{label}</p>
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 items-start">

          {/* Lead Inbox */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Inbox className="w-4 h-4 text-gray-400" />
                Lead Inbox
              </h2>
              {/* Filter tabs */}
              <div className="flex gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
                {(['all', 'hot', 'warm', 'cold'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all capitalize ${
                      filter === f
                        ? 'bg-white text-gray-900'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-[#111111] border border-white/10 rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-white/5 rounded w-1/3 mb-3" />
                    <div className="h-3 bg-white/5 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-white/5 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="bg-[#111111] border border-white/10 rounded-xl p-10 text-center">
                <Inbox className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 font-medium mb-1">
                  {filter === 'all' ? 'No leads yet' : `No ${filter} leads`}
                </p>
                <p className="text-gray-600 text-sm">
                  {filter === 'all'
                    ? 'Share your lead form link to start collecting leads.'
                    : 'Try switching to a different filter.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLeads.map(lead => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
              </div>
            )}
          </div>

          {/* Tools sidebar */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white">Lead Tools</h2>

            {/* Share Lead Form */}
            <div className="bg-[#111111] border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <Link2 className="w-3.5 h-3.5 text-white/70" />
                </div>
                <h3 className="text-sm font-semibold text-white">Share Lead Form</h3>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Share anywhere — Instagram bio, email signature, or business cards.
              </p>

              {isPaidPlan ? (
                <>
                  {/* Link + copy */}
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="text"
                      readOnly
                      value={leadFormUrl}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-xs focus:outline-none cursor-text min-w-0"
                    />
                    <button
                      onClick={handleCopy}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all border flex-shrink-0 ${
                        copied
                          ? 'bg-white/10 text-white border-white/20'
                          : 'bg-white text-gray-900 hover:bg-gray-100 border-gray-200'
                      }`}
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  {/* QR Code */}
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-xs text-gray-500 mb-3">QR code for yard signs & flyers</p>
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-white rounded-xl flex-shrink-0">
                        <QRCodeCanvas
                          id="leads-qr"
                          value={leadFormUrl}
                          size={90}
                          bgColor="#ffffff"
                          fgColor="#000000"
                          level="M"
                        />
                      </div>
                      <div className="flex flex-col gap-2 flex-1">
                        <button
                          onClick={handleDownloadQR}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white text-gray-900 hover:bg-gray-100 text-xs font-medium transition-colors border border-gray-200 w-full"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download PNG
                        </button>
                        <a
                          href={leadFormUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                        >
                          <Link2 className="w-3 h-3" />
                          Preview form
                        </a>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center py-4 text-center">
                  <Lock className="w-8 h-8 text-gray-600 mb-2" />
                  <p className="text-xs text-gray-500 mb-3">Available on Starter &amp; Pro plans</p>
                  <Link
                    href="/dashboard/upgrade"
                    className="text-xs font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-lg transition-colors"
                  >
                    Upgrade to unlock
                  </Link>
                </div>
              )}
            </div>

            {/* Auto Follow-Up Emails */}
            <div className="bg-[#111111] border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <MailCheck className="w-3.5 h-3.5 text-white/70" />
                </div>
                <h3 className="text-sm font-semibold text-white">Auto Follow-Up</h3>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                When a lead submits your form, they automatically receive 3 follow-up emails over 5 days.
              </p>
              <button
                onClick={() => {
                  const next = !autoFollowup;
                  setAutoFollowup(next);
                  saveSettings({ auto_followup_enabled: next });
                }}
                disabled={savingSettings}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all border ${
                  autoFollowup
                    ? 'bg-white text-gray-900 border-white'
                    : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20 hover:text-white'
                }`}
              >
                {savingSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : autoFollowup ? <Check className="w-3.5 h-3.5" /> : <MailCheck className="w-3.5 h-3.5" />}
                {autoFollowup ? 'Auto Follow-Up On' : 'Enable Auto Follow-Up'}
              </button>
            </div>

            {/* SMS Notifications */}
            <div className="bg-[#111111] border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <Phone className="w-3.5 h-3.5 text-white/70" />
                </div>
                <h3 className="text-sm font-semibold text-white">SMS Alerts</h3>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Get a text the second a lead submits your form.
              </p>
              <div className="space-y-3">
                <input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={smsPhone}
                  onChange={(e) => setSmsPhone(e.target.value)}
                  onBlur={() => { if (smsPhone) saveSettings({ sms_phone: smsPhone }); }}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-white/30"
                />
                <button
                  onClick={() => {
                    const next = !smsEnabled;
                    setSmsEnabled(next);
                    saveSettings({ sms_alerts_enabled: next, sms_phone: smsPhone });
                  }}
                  disabled={savingSettings || !smsPhone.trim()}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all border disabled:opacity-40 disabled:cursor-not-allowed ${
                    smsEnabled
                      ? 'bg-white text-gray-900 border-white'
                      : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {savingSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : smsEnabled ? <Check className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                  {smsEnabled ? 'SMS Alerts On' : 'Enable SMS Alerts'}
                </button>
              </div>
            </div>

            {/* Open Houses link */}
            <Link
              href="/dashboard/leads/open-houses"
              className="block bg-[#111111] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <DoorOpen className="w-3.5 h-3.5 text-white/70" />
                </div>
                <h3 className="text-sm font-semibold text-white">Open Houses</h3>
                <ArrowRight className="w-3.5 h-3.5 text-gray-500 ml-auto" />
              </div>
              <p className="text-xs text-gray-500">
                Create sign-in pages for open houses. Visitors scan a QR code and become leads.
              </p>
            </Link>

            {/* Agent Profile link */}
            <Link
              href="/dashboard/leads/profile"
              className="block bg-[#111111] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-white/70" />
                </div>
                <h3 className="text-sm font-semibold text-white">Agent Profile</h3>
                <ArrowRight className="w-3.5 h-3.5 text-gray-500 ml-auto" />
              </div>
              <p className="text-xs text-gray-500">
                Your public landing page — photo, bio, specialties, and a built-in lead form.
              </p>
            </Link>

          </div>
        </div>
      </div>
    </div>
  );
}
