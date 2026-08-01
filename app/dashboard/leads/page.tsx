'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardPage from '@/components/layout/DashboardPage';
import LeadsSectionSwitcher, { type LeadsTab } from '@/components/leads/LeadsSectionSwitcher';
import LeadsInbox from '@/components/leads/LeadsInbox';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase';
import { useTour } from '@/hooks/useTour';
import { useMounted } from '@/hooks/useMounted';
import { useApi } from '@/lib/swr';
import { useToast } from '@/components/providers/ToastProvider';
import { LeadsPageContentSkeleton } from '@/components/dashboard/page-loading';
import FollowupTemplatesEditor from '@/components/dashboard/FollowupTemplatesEditor';
import SequenceTemplatesEditor from '@/components/leads/SequenceTemplatesEditor';
import { getLeadTemperature } from '@/components/dashboard/LeadTemperatureBadge';
import { formatFollowupScheduleHuman, type FollowupSettings } from '@/lib/followup-emails';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Link2, Copy, Check, Download,
  ArrowRight, Users, Lock, MailCheck,
  Loader2, CalendarClock, DoorOpen, Sparkles, Phone,
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  lead_type?: string;
  message?: string;
  source?: string;
  ad_source?: string | null;
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
  sequence_awaiting_approval?: boolean;
  lead_read?: string | null;
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
  return getLeadTemperature(lead.created_at, lead.message);
}

function LeadsPageContent() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const mounted = useMounted();

  const initialTab = (searchParams.get('tab') as LeadsTab) || 'inbox';
  const highlightId = searchParams.get('highlight');
  const [activeTab, setActiveTab] = useState<LeadsTab>(
    initialTab === 'capture' || initialTab === 'automations' ? initialTab : 'inbox'
  );
  const router = useRouter();
  const { data: leads = [], isLoading, mutate: mutateLeads } = useApi<Lead[]>('/api/clients?status=all&view=inbox');

  useTour({
    tourKey: 'tour_leads',
    ready: mounted && !(activeTab === 'inbox' && isLoading),
    steps: [
      {
        element: '[data-tour="leads-tabs"]',
        popover: {
          title: 'Leads hub',
          description: 'Three sections: Inbox (new leads), Capture (your form and QR code), and Automations (email follow-up).',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="leads-filter"]',
        popover: {
          title: 'Filter by temperature',
          description: 'Hot leads are fresh (under 48h). Warm leads are within a week. Cold leads are older. Prioritize your hot ones first.',
          side: 'bottom',
        },
      },
    ],
  });

  const { response: usageResponse } = useApi('/api/usage');
  const { response: profileResponse } = useApi('/api/agent-profile');
  const { data: settingsData, mutate: mutateSettings } = useApi<FollowupSettings & { auto_followup_enabled?: boolean; booking_enabled?: boolean }>('/api/agent-settings');

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
  const [bookingUrl, setBookingUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(highlightId);

  useEffect(() => {
    if (highlightId) {
      setActiveTab('inbox');
      setSelectedLeadId(highlightId);
    }
  }, [highlightId]);
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
    document.title = 'Leads - Oikaro';
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const fullName: string = user.user_metadata?.full_name || '';
      const nameSlug = fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const slug = nameSlug ? `${nameSlug}--${user.id}` : user.id;
      setLeadFormUrl(`${window.location.origin}/lead/${slug}`);
      setBookingUrl(`${window.location.origin}/book/${slug}`);
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

  const safeLeads = useMemo(() => (Array.isArray(leads) ? leads : []), [leads]);
  const statsSubtitle = useMemo(() => {
    if (!mounted) return 'Inbox, capture, and automations';
    const now = Date.now();
    const thisWeek = safeLeads.filter(
      (l) => now - new Date(l.created_at).getTime() < 7 * 86_400_000,
    );
    const hotLeads = safeLeads.filter((l) => getLeadTemp(l) === 'hot');
    return `${safeLeads.length} in inbox · ${hotLeads.length} hot · ${thisWeek.length} this week`;
  }, [mounted, safeLeads]);
  const filteredLeads = useMemo(
    () => safeLeads.filter((l) => filter === 'all' || getLeadTemp(l) === filter),
    [safeLeads, filter],
  );
  const showInboxSkeleton = !mounted || (activeTab === 'inbox' && isLoading);

  useEffect(() => {
    if (filteredLeads.length === 0) {
      setSelectedLeadId(null);
      return;
    }
    setSelectedLeadId((current) =>
      current && filteredLeads.some((l) => l.id === current) ? current : filteredLeads[0].id,
    );
  }, [filteredLeads]);

  return (
    <DashboardPage
      title="Leads"
      subtitle={statsSubtitle}
      size="default"
    >
      {showInboxSkeleton ? (
        <LeadsPageContentSkeleton />
      ) : (
        <>
        <div data-tour="leads-tabs">
          <LeadsSectionSwitcher active={activeTab} onChange={setActiveTab} />
        </div>

        {activeTab === 'inbox' && (
            <LeadsInbox
              leads={safeLeads}
              filter={filter}
              onFilterChange={setFilter}
              selectedLeadId={selectedLeadId}
              onSelectLead={setSelectedLeadId}
              autoFollowupEnabled={autoFollowup}
              followupScheduleText={followupScheduleText}
              stoppedIds={stoppedFollowupIds}
              addingId={addingToCrmId}
              markingContactedId={markingContactedId}
              onAddToCrm={handleAddToCrm}
              onMarkContacted={handleMarkContacted}
              onContactLead={handleContactLead}
              onGoToCapture={() => setActiveTab('capture')}
              onSequenceChange={() => mutateLeads()}
            />
        )}

        {/* ─── CAPTURE ───────────────────────────────────────────────────── */}
        {activeTab === 'capture' && (
          <div className="space-y-5">
            <p className="text-[13.5px] text-gray-600">
              Tools to collect leads — share your form, run open houses, and publish your profile.
            </p>

            {/* Share Lead Form */}
            <Card className="p-5 sm:p-[22px]">
              <div className="flex items-center gap-2 mb-2">
                <Link2 className="w-4 h-4 text-gray-700" strokeWidth={1.8} />
                <h3 className="text-[15px] font-semibold text-gray-900">Lead capture form</h3>
              </div>
              <p className="text-[13px] text-gray-600 mb-5">
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
                      className="flex-1 px-3.5 py-2.5 rounded-[10px] bg-gray-50 border border-gray-200 font-mono text-gray-600 text-[12.5px] focus:outline-none cursor-text min-w-0 truncate"
                    />
                    <button
                      onClick={() => handleCopy(leadFormUrl)}
                      className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[10px] text-[13px] font-medium transition-all border flex-shrink-0 ${
                        copied
                          ? 'bg-teal-50 text-teal-700 border-teal-200'
                          : 'bg-[var(--surface)] text-gray-900 hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy link'}
                    </button>
                  </div>

                  <div className="border-t border-gray-150 pt-6">
                    <p className="text-[13px] text-gray-600 mb-4">QR code for yard signs and flyers</p>
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                      <div className="p-3 bg-[var(--surface)] rounded-[10px] border border-gray-150">
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
                          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] bg-[var(--surface)] text-gray-900 hover:bg-gray-50 text-[13px] font-medium transition-colors border border-gray-200 w-full"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download PNG
                        </button>
                        <a
                          href={leadFormUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 text-[13px] text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          Preview form
                        </a>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center py-8 text-center border border-gray-150 rounded-[10px]">
                  <Lock className="w-9 h-9 text-gray-400 mb-3" />
                  <p className="text-[13px] text-gray-600 mb-4">Available on Starter and Pro plans</p>
                  <Link
                    href="/dashboard/upgrade"
                    className="text-[13px] font-medium text-[var(--brand-foreground)] bg-brand-500 hover:bg-brand-600 px-5 py-2.5 rounded-lg transition-colors"
                  >
                    Upgrade to unlock
                  </Link>
                </div>
              )}
            </Card>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  href: '/dashboard/leads/booking',
                  icon: CalendarClock,
                  title: 'Booking link',
                  description: 'Share a link so leads can pick an open time and book a showing themselves.',
                  live: isProPlan && settingsData?.booking_enabled === true,
                  url: isProPlan && settingsData?.booking_enabled ? bookingUrl : '',
                },
                {
                  href: '/dashboard/leads/open-houses',
                  icon: DoorOpen,
                  title: 'Open houses',
                  description: 'Create a sign-in page and QR code for each open house. Visitors become leads automatically.',
                  live: false,
                  url: '',
                },
                {
                  href: '/dashboard/leads/profile',
                  icon: Users,
                  title: 'Agent profile',
                  description: 'Your public landing page with bio, specialties, and a built-in lead form.',
                  live: false,
                  url: isProPlan ? profileUrl : '',
                },
              ].map(({ href, icon: Icon, title, description, live, url }) => (
                <button
                  key={href}
                  type="button"
                  onClick={() => handleProFeatureClick(href)}
                  className="rounded-[10px] bg-[var(--surface)] border border-gray-200 p-5 hover:border-gray-300 hover:bg-gray-50 transition-colors duration-150 group text-left w-full flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gray-100 text-gray-900 shrink-0">
                      <Icon className="w-4 h-4" strokeWidth={1.8} />
                    </div>
                    {!isProPlan && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-medium">
                        <Sparkles className="w-3 h-3" />
                        Pro
                      </span>
                    )}
                    {live && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                        Live
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h3 className="text-[15px] font-semibold tracking-tight text-gray-900 mb-1">{title}</h3>
                  <p className="text-[12.5px] text-gray-600">{description}</p>
                  {url && (
                    <p className="font-mono text-[11px] text-gray-600 mt-3 pt-3 border-t border-gray-150 truncate w-full">
                      {url}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── AUTOMATIONS ───────────────────────────────────────────────── */}
        {activeTab === 'automations' && (
          <div className="space-y-5">
            <p className="text-[13.5px] text-gray-600">
              Set up once — these run automatically when someone becomes a lead.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="p-5 sm:p-[22px]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gray-100 shrink-0">
                    <MailCheck className="w-4 h-4 text-gray-700" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-[15px] font-semibold tracking-tight text-gray-900">Auto follow-up</h3>
                </div>
                <p className="text-[12.5px] text-gray-600 mb-5">
                  Leads with an email get a Hot / Warm / Cold sequence — AI-drafted first email (you approve), then emails and call reminders on schedule.
                </p>
                <button
                  onClick={() => {
                    const next = !autoFollowup;
                    setAutoFollowup(next);
                    saveSettings({ auto_followup_enabled: next });
                  }}
                  disabled={savingSettings}
                  className={`w-full flex items-center justify-center gap-2 h-10 px-4 rounded-[10px] text-[13px] font-medium transition-all ${
                    autoFollowup
                      ? 'bg-card text-foreground border border-border shadow-sm'
                      : 'bg-[var(--surface)] text-muted-foreground border border-border hover:border-gray-300 hover:text-foreground'
                  }`}
                >
                  {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : autoFollowup ? <Check className="w-4 h-4" /> : <MailCheck className="w-4 h-4" />}
                  {autoFollowup ? 'Enabled' : 'Enable auto follow-up'}
                </button>
              </Card>

              <Card className="p-5 sm:p-[22px]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gray-100 shrink-0">
                    <Phone className="w-4 h-4 text-gray-400" strokeWidth={1.8} />
                  </div>
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <h3 className="text-[15px] font-semibold tracking-tight text-gray-900">SMS alerts</h3>
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-medium">
                      Coming soon
                    </span>
                  </div>
                </div>
                <p className="text-[12.5px] text-gray-600 mb-5">
                  Get a text when a lead submits your form or signs in at an open house. Not available yet — we&apos;ll announce when it launches.
                </p>
                <button
                  type="button"
                  disabled
                  className="w-full flex items-center justify-center gap-2 h-10 px-4 rounded-[10px] text-[13px] font-medium bg-gray-50 text-gray-400 border border-gray-150 cursor-not-allowed"
                >
                  <Phone className="w-4 h-4" />
                  Not available yet
                </button>
              </Card>
            </div>

            <SequenceTemplatesEditor />

            <FollowupTemplatesEditor settings={settingsData} onSaved={() => mutateSettings()} />
          </div>
        )}
        </>
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

export default function LeadsPage() {
  return (
    <Suspense fallback={null}>
      <LeadsPageContent />
    </Suspense>
  );
}
