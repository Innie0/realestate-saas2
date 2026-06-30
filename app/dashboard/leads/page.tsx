'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardPage from '@/components/layout/DashboardPage';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import Surface from '@/components/ui/Surface';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase';
import { useTour } from '@/hooks/useTour';
import { useApi } from '@/lib/swr';
import { useToast } from '@/components/providers/ToastProvider';
import FollowupTemplatesEditor from '@/components/dashboard/FollowupTemplatesEditor';
import { formatFollowupScheduleHuman, type FollowupSettings } from '@/lib/followup-emails';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Inbox, Link2, Copy, Check, Download, Phone, Mail,
  Home, Building2, KeyRound, Search, Flame, Thermometer,
  Snowflake, ArrowRight, Users, Clock, Lock, MailCheck,
  Loader2, DoorOpen, Megaphone, Zap, UserPlus, MailX, MapPin, Sparkles, UserCheck,
} from 'lucide-react';

type LeadsTab = 'inbox' | 'capture' | 'automations';

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  lead_type?: string;
  message?: string;
  source?: string;
  project_id?: string | null;
  projects?: {
    id: string;
    title: string;
    property_info?: { address?: string; city?: string; state?: string; zip_code?: string };
    published?: boolean;
  } | null;
  created_at: string;
  status: string;
  followup_active?: boolean;
}

function leadHasActiveFollowup(
  lead: Lead,
  autoFollowupEnabled: boolean,
  stoppedIds: Set<string>,
): boolean {
  return Boolean(
    autoFollowupEnabled &&
    lead.email &&
    lead.followup_active &&
    !stoppedIds.has(lead.id),
  );
}

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

const SOURCE_LABELS: Record<string, string> = {
  lead_form: 'Lead form',
  open_house: 'Open house',
  listing_page: 'Listing page',
};

function TempBadge({ temp }: { temp: 'hot' | 'warm' | 'cold' }) {
  const config = {
    hot: { variant: 'hot' as const, icon: Flame, label: 'Hot' },
    warm: { variant: 'warm' as const, icon: Thermometer, label: 'Warm' },
    cold: { variant: 'cold' as const, icon: Snowflake, label: 'Cold' },
  }[temp];
  return (
    <Badge variant={config.variant} icon={config.icon}>
      {config.label}
    </Badge>
  );
}

function LeadCard({
  lead,
  autoFollowupEnabled,
  followupScheduleText,
  onAddToCrm,
  addingId,
  onMarkContacted,
  markingContactedId,
  stoppedIds,
  onContactLead,
}: {
  lead: Lead;
  autoFollowupEnabled: boolean;
  followupScheduleText: string;
  onAddToCrm: (id: string) => void;
  addingId: string | null;
  onMarkContacted: (id: string) => void;
  markingContactedId: string | null;
  stoppedIds: Set<string>;
  onContactLead: (lead: Lead, type: 'email' | 'phone') => void;
}) {
  const temp = getLeadTemp(lead);
  const isAdding = addingId === lead.id;
  const isMarkingContacted = markingContactedId === lead.id;
  const followupActive = leadHasActiveFollowup(lead, autoFollowupEnabled, stoppedIds);
  const emailsStopped = stoppedIds.has(lead.id);
  const TypeIcon = lead.lead_type ? LEAD_TYPE_ICONS[lead.lead_type] : null;
  const msg = lead.message || '';
  const infoLines = msg.split('\n').filter(l =>
    l.startsWith('Timeline:') || l.startsWith('Budget:') || l.startsWith('Area:')
  );
  const openHouseLine = lead.source === 'open_house' && msg.startsWith('Open house:')
    ? msg.replace(/^Open house:\s*/, '')
    : null;
  const listingLine = lead.source === 'listing_page' && msg.includes('interested in')
    ? msg.replace(/^I'm interested in\s*/i, '')
    : null;
  const linkedProject = lead.projects && !Array.isArray(lead.projects) ? lead.projects : null;
  const listingDisplay = linkedProject
    ? [linkedProject.property_info?.address, linkedProject.title].find(Boolean) || listingLine
    : listingLine;

  return (
    <div className="rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] p-4 hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-sm">{lead.name}</h3>
            <TempBadge temp={temp} />
            {lead.source && SOURCE_LABELS[lead.source] && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200">
                {SOURCE_LABELS[lead.source]}
              </span>
            )}
            {TypeIcon && lead.lead_type && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-50 text-gray-500 border border-gray-200">
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

      {(openHouseLine || listingDisplay) && (
        <div className="mb-3 flex items-start gap-2 rounded-lg bg-brand-500/5 border border-brand-500/15 px-3 py-2">
          {openHouseLine ? (
            <DoorOpen className="w-3.5 h-3.5 text-brand-600 mt-0.5 shrink-0" />
          ) : (
            <MapPin className="w-3.5 h-3.5 text-brand-600 mt-0.5 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-600">
              {openHouseLine ? 'Open house' : 'Listing inquiry'}
            </p>
            <p className="text-xs text-gray-700 mt-0.5 break-words">{openHouseLine || listingDisplay}</p>
            {linkedProject && (
              <div className="flex flex-wrap gap-2 mt-2">
                <Link
                  href={`/dashboard/projects/${linkedProject.id}`}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  View project
                </Link>
                {linkedProject.published && (
                  <Link
                    href={`/listing/${linkedProject.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-gray-600 hover:text-gray-900"
                  >
                    Public listing
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {followupActive && (
        <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
          <p className="text-xs text-amber-800">
            Auto follow-up is scheduled ({followupScheduleText}).
          </p>
          <button
            type="button"
            onClick={() => onMarkContacted(lead.id)}
            disabled={isMarkingContacted}
            className="shrink-0 inline-flex items-center justify-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-white text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors disabled:opacity-60"
          >
            {isMarkingContacted ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <UserCheck className="w-3 h-3" />
            )}
            Mark contacted
          </button>
        </div>
      )}

      {!followupActive && emailsStopped && lead.email && autoFollowupEnabled && (
        <p className="mb-3 text-xs text-gray-500 flex items-center gap-1.5">
          <MailX className="w-3.5 h-3.5" />
          Auto follow-up stopped for this lead
        </p>
      )}

      <div className="flex flex-wrap gap-3 mb-3">
        {lead.email && (
          <button
            type="button"
            onClick={() => onContactLead(lead, 'email')}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-600 transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            {lead.email}
          </button>
        )}
        {lead.phone && (
          <button
            type="button"
            onClick={() => onContactLead(lead, 'phone')}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-600 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            {lead.phone}
          </button>
        )}
      </div>

      {infoLines.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {infoLines.map((line, i) => (
            <span key={i} className="text-xs bg-gray-50 border border-gray-200 text-gray-500 px-2 py-0.5 rounded-lg">
              {line}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={() => onAddToCrm(lead.id)}
          disabled={isAdding}
          className="flex-1 min-w-[8rem] flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-lg bg-white text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-60"
        >
          {isAdding ? (
            <><Loader2 className="w-3 h-3 animate-spin" /> Adding…</>
          ) : (
            <><UserPlus className="w-3 h-3" /> Add to CRM</>
          )}
        </button>
        {lead.phone && (
          <button
            type="button"
            onClick={() => onContactLead(lead, 'phone')}
            className="flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 transition-colors"
          >
            <Phone className="w-3 h-3" /> Call
          </button>
        )}
        {lead.email && (
          <button
            type="button"
            onClick={() => onContactLead(lead, 'email')}
            className="flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 transition-colors"
          >
            <Mail className="w-3 h-3" /> Email
          </button>
        )}
        {followupActive && (
          <button
            type="button"
            onClick={() => onMarkContacted(lead.id)}
            disabled={isMarkingContacted}
            title="Stop automated follow-up emails"
            className="flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-600 border-gray-200 hover:border-red-200 transition-colors disabled:opacity-60"
          >
            {isMarkingContacted ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <MailX className="w-3 h-3" />
            )}
            Stop emails
          </button>
        )}
      </div>
    </div>
  );
}

const TABS: { id: LeadsTab; label: string; icon: React.ElementType }[] = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'capture', label: 'Capture', icon: Megaphone },
  { id: 'automations', label: 'Automations', icon: Zap },
];

export default function LeadsPage() {
  const toast = useToast();
  useTour({
    tourKey: 'tour_leads',
    steps: [
      {
        element: '[data-tour="leads-tabs"]',
        popover: {
          title: '📬 Leads Hub',
          description: 'Three sections: Inbox (new leads), Capture (your form & QR code), and Automations (email follow-up).',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="leads-stats"]',
        popover: {
          title: '📈 Lead Stats',
          description: 'A quick snapshot of your total leads, new ones this week, and how many are "hot" (came in under 48 hours).',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="leads-filter"]',
        popover: {
          title: '🌡️ Filter by Temperature',
          description: 'Hot leads are fresh (under 48h). Warm leads are within a week. Cold leads are older. Prioritize your hot ones first.',
          side: 'bottom',
        },
      },
    ],
  });

  const [activeTab, setActiveTab] = useState<LeadsTab>('inbox');
  const router = useRouter();
  const { data: leads = [], isLoading, mutate: mutateLeads } = useApi<Lead[]>('/api/clients?status=all&view=inbox');
  const { response: usageResponse } = useApi('/api/usage');
  const { response: profileResponse } = useApi('/api/agent-profile');
  const { data: settingsData, mutate: mutateSettings } = useApi<FollowupSettings & { auto_followup_enabled?: boolean }>('/api/agent-settings');

  const isPaidPlan = usageResponse?.hasAccess === true;
  const isProPlan = usageResponse?.hasProLeadTools === true;
  const profileUrl = (profileResponse?.profileUrl as string) || '';

  const handleProFeatureClick = (href: string) => {
    if (isProPlan) {
      router.push(href);
      return;
    }
    router.push('/dashboard/upgrade');
  };

  const [leadFormUrl, setLeadFormUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');
  const [addingToCrmId, setAddingToCrmId] = useState<string | null>(null);
  const [markingContactedId, setMarkingContactedId] = useState<string | null>(null);
  const [stoppedFollowupIds, setStoppedFollowupIds] = useState<Set<string>>(new Set());
  const [contactPrompt, setContactPrompt] = useState<{ lead: Lead; type: 'email' | 'phone' } | null>(null);

  const followupScheduleText = formatFollowupScheduleHuman(settingsData);
  const [autoFollowup, setAutoFollowup] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    setAutoFollowup(settingsData?.auto_followup_enabled || false);
  }, [settingsData?.auto_followup_enabled]);

  useEffect(() => {
    document.title = 'Leads - Realestic';
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const fullName: string = user.user_metadata?.full_name || '';
      const nameSlug = fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const slug = nameSlug ? `${nameSlug}--${user.id}` : user.id;
      setLeadFormUrl(`${window.location.origin}/lead/${slug}`);
    });
  }, []);

  const openContactLink = (lead: Lead, type: 'email' | 'phone') => {
    const href = type === 'email' ? `mailto:${lead.email}` : `tel:${lead.phone}`;
    window.location.href = href;
  };

  const handleMarkContacted = async (leadId: string, options?: { toast?: boolean }) => {
    setMarkingContactedId(leadId);
    try {
      const res = await fetch(`/api/clients/${leadId}/cancel-sequence`, { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        setStoppedFollowupIds((prev) => new Set([...prev, leadId]));
        mutateLeads(
          (current) =>
            current
              ? {
                  ...current,
                  data: (current.data as Lead[]).map((lead) =>
                    lead.id === leadId ? { ...lead, followup_active: false } : lead,
                  ),
                }
              : current,
          { revalidate: false },
        );
        if (options?.toast !== false) {
          toast.success('Auto follow-up stopped for this lead');
        }
        return true;
      }
      toast.error(result.error || 'Could not stop emails');
      return false;
    } catch {
      toast.error('Could not stop emails');
      return false;
    } finally {
      setMarkingContactedId(null);
    }
  };

  const handleContactLead = (lead: Lead, type: 'email' | 'phone') => {
    if (leadHasActiveFollowup(lead, autoFollowup, stoppedFollowupIds)) {
      setContactPrompt({ lead, type });
      return;
    }
    openContactLink(lead, type);
  };

  const handleContactPromptChoice = async (stopEmails: boolean) => {
    if (!contactPrompt) return;
    const { lead, type } = contactPrompt;
    setContactPrompt(null);
    if (stopEmails) {
      const stopped = await handleMarkContacted(lead.id, { toast: false });
      if (!stopped) return;
      toast.success('Auto follow-up stopped — opening contact');
    }
    openContactLink(lead, type);
  };

  const handleAddToCrm = async (leadId: string) => {
    setAddingToCrmId(leadId);
    try {
      const res = await fetch(`/api/clients/${leadId}/add-to-crm`, { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        setStoppedFollowupIds((prev) => new Set([...prev, leadId]));
        mutateLeads(
          (current) =>
            current
              ? { ...current, data: (current.data as Lead[]).filter((l) => l.id !== leadId) }
              : current,
          { revalidate: false },
        );
        toast.success('Added to CRM · auto follow-up stopped');
      } else {
        toast.error(result.error || 'Could not add to CRM');
      }
    } catch (e) {
      console.error('Add to CRM error:', e);
      toast.error('Could not add to CRM');
    } finally {
      setAddingToCrmId(null);
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
      mutateSettings();
    } catch (e) {
      console.error('Error saving settings:', e);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCopy = async (url: string) => {
    await navigator.clipboard.writeText(url);
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

  const now = Date.now();
  const thisWeek = leads.filter(l => now - new Date(l.created_at).getTime() < 7 * 86_400_000);
  const hotLeads = leads.filter(l => getLeadTemp(l) === 'hot');
  const filteredLeads = leads.filter(l => filter === 'all' || getLeadTemp(l) === filter);

  return (
    <DashboardPage
      title="Leads"
      subtitle={`${leads.length} in inbox · ${hotLeads.length} hot · ${thisWeek.length} this week`}
      size="narrow"
    >
        <div data-tour="leads-tabs">
          <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} hideLabelsOnMobile />
        </div>

        {activeTab === 'inbox' && (
          <div className="space-y-5">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-gray-900">Inbox</h2>
                  <p className="text-sm text-gray-500 mt-0.5">New captures stay here until you add them to your CRM.</p>
                </div>
                <div data-tour="leads-filter" className="flex gap-0.5 bg-gray-100/80 rounded-xl p-1 w-full sm:w-auto">
                  {(['all', 'hot', 'warm', 'cold'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 capitalize ${
                        filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {isLoading && leads.length === 0 ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
                      <div className="h-4 bg-gray-50 rounded w-1/3 mb-3" />
                      <div className="h-3 bg-gray-50 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filteredLeads.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title={filter === 'all' ? 'No leads yet' : `No ${filter} leads`}
                  description={
                    filter === 'all'
                      ? 'Share your lead form or run an open house to start collecting leads.'
                      : 'Try a different filter to see more leads.'
                  }
                  action={
                    filter === 'all' ? (
                      <Button variant="secondary" size="sm" onClick={() => setActiveTab('capture')}>
                        Go to Capture
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="space-y-3">
                  {filteredLeads.map(lead => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      autoFollowupEnabled={autoFollowup}
                      followupScheduleText={followupScheduleText}
                      onAddToCrm={handleAddToCrm}
                      addingId={addingToCrmId}
                      onMarkContacted={handleMarkContacted}
                      markingContactedId={markingContactedId}
                      stoppedIds={stoppedFollowupIds}
                      onContactLead={handleContactLead}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── CAPTURE ───────────────────────────────────────────────────── */}
        {activeTab === 'capture' && (
          <div className="space-y-6">
            <p className="text-sm text-gray-500">
              Tools to collect leads — share your form, run open houses, and publish your profile.
            </p>

            {/* Share Lead Form */}
            <Surface padding="md">
              <div className="flex items-center gap-2 mb-2">
                <Link2 className="w-5 h-5 text-gray-500" />
                <h3 className="text-base font-semibold text-gray-900">Lead capture form</h3>
              </div>
              <p className="text-sm text-gray-500 mb-5">
                Your personal link — add it to your bio, email signature, or business cards.
              </p>

              {isPaidPlan ? (
                <>
                  <div className="flex flex-col sm:flex-row gap-2 mb-6">
                    <input
                      type="text"
                      readOnly
                      value={leadFormUrl}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="flex-1 px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 text-sm focus:outline-none cursor-text min-w-0"
                    />
                    <button
                      onClick={() => handleCopy(leadFormUrl)}
                      className={`flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition-all border flex-shrink-0 ${
                        copied
                          ? 'bg-gray-100 text-gray-900 border-gray-300'
                          : 'bg-white text-gray-900 hover:bg-gray-100 border-gray-200'
                      }`}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied' : 'Copy link'}
                    </button>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <p className="text-sm text-gray-500 mb-4">QR code for yard signs and flyers</p>
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                      <div className="p-4 bg-white rounded-xl">
                        <QRCodeCanvas
                          id="leads-qr"
                          value={leadFormUrl}
                          size={140}
                          bgColor="#ffffff"
                          fgColor="#000000"
                          level="M"
                        />
                      </div>
                      <div className="flex flex-col gap-3 w-full sm:w-auto sm:min-w-[180px]">
                        <button
                          onClick={handleDownloadQR}
                          className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white text-gray-900 hover:bg-gray-100 text-sm font-medium transition-colors border border-gray-200 w-full"
                        >
                          <Download className="w-4 h-4" />
                          Download PNG
                        </button>
                        <a
                          href={leadFormUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-brand-600 transition-colors"
                        >
                          <Link2 className="w-4 h-4" />
                          Preview form
                        </a>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center py-8 text-center border border-gray-100 rounded-lg">
                  <Lock className="w-10 h-10 text-gray-600 mb-3" />
                  <p className="text-sm text-gray-500 mb-4">Available on Starter and Pro plans</p>
                  <Link
                    href="/dashboard/upgrade"
                    className="text-sm font-medium text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-300 px-5 py-2.5 rounded-lg transition-colors"
                  >
                    Upgrade to unlock
                  </Link>
                </div>
              )}
            </Surface>

            <div className="grid sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleProFeatureClick('/dashboard/leads/open-houses')}
                className="rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] p-6 hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-200 group text-left w-full"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <DoorOpen className="w-5 h-5 text-gray-900/70" />
                  </div>
                  {!isProPlan && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200 text-xs font-medium">
                      <Sparkles className="w-3 h-3" />
                      Pro
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 text-gray-600 ml-auto group-hover:text-brand-600 transition-colors" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Open houses</h3>
                <p className="text-sm text-gray-500">
                  Create a sign-in page and QR code for each open house. Visitors become leads automatically.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleProFeatureClick('/dashboard/leads/profile')}
                className="rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] p-6 hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-200 group text-left w-full"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-900/70" />
                  </div>
                  {!isProPlan && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200 text-xs font-medium">
                      <Sparkles className="w-3 h-3" />
                      Pro
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 text-gray-600 ml-auto group-hover:text-brand-600 transition-colors" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Agent profile</h3>
                <p className="text-sm text-gray-500">
                  Your public landing page with bio, specialties, and a built-in lead form.
                </p>
                {isProPlan && profileUrl && (
                  <p className="text-xs text-gray-600 mt-3 truncate">{profileUrl}</p>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─── AUTOMATIONS ───────────────────────────────────────────────── */}
        {activeTab === 'automations' && (
          <div className="space-y-6">
            <p className="text-sm text-gray-500">
              Set up once — these run automatically when someone becomes a lead.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <Surface padding="md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <MailCheck className="w-5 h-5 text-gray-900/70" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">Auto follow-up</h3>
                </div>
                <p className="text-sm text-gray-500 mb-5">
                  Leads with an email get 3 professional follow-ups — right away, then on your schedule. Replies go to your account email (or profile email on Pro).
                </p>
                <button
                  onClick={() => {
                    const next = !autoFollowup;
                    setAutoFollowup(next);
                    saveSettings({ auto_followup_enabled: next });
                  }}
                  disabled={savingSettings}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all border ${
                    autoFollowup
                      ? 'bg-white text-gray-900 border-white'
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-900'
                  }`}
                >
                  {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : autoFollowup ? <Check className="w-4 h-4" /> : <MailCheck className="w-4 h-4" />}
                  {autoFollowup ? 'Enabled' : 'Enable auto follow-up'}
                </button>
              </Surface>

              <Surface padding="md" className="opacity-90">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <h3 className="text-base font-semibold text-gray-900">SMS alerts</h3>
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium">
                      Coming soon
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-5">
                  Get a text when a lead submits your form or signs in at an open house. Not available yet — we&apos;ll announce when it launches.
                </p>
                <button
                  type="button"
                  disabled
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium border bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                >
                  <Phone className="w-4 h-4" />
                  Not available yet
                </button>
              </Surface>
            </div>

            <FollowupTemplatesEditor settings={settingsData} onSaved={() => mutateSettings()} />
          </div>
        )}

        <Modal
          isOpen={contactPrompt !== null}
          onClose={() => setContactPrompt(null)}
          title="Stop auto follow-up?"
          size="sm"
        >
          <p className="text-sm text-gray-600 mb-6">
            This lead still has scheduled follow-up emails. Stop them before you reach out so they don&apos;t get duplicate messages?
          </p>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleContactPromptChoice(false)}
            >
              Keep emails · contact anyway
            </Button>
            <Button
              size="sm"
              onClick={() => handleContactPromptChoice(true)}
            >
              Stop emails & contact
            </Button>
          </div>
        </Modal>
    </DashboardPage>
  );
}
