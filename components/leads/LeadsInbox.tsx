'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LeadTemperatureBadge, { getLeadTemperature } from '@/components/dashboard/LeadTemperatureBadge';
import LeadSequencePanel from '@/components/leads/LeadSequencePanel';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import EmptyState from '@/components/ui/EmptyState';
import FilterSidebar from '@/components/layout/FilterSidebar';
import { Flame } from 'lucide-react';
import { nameAvatarClasses } from '@/lib/accent';
import { cn } from '@/lib/utils';
import {
  DoorOpen,
  Inbox,
  Loader2,
  Mail,
  MailX,
  MapPin,
  MoreHorizontal,
  Phone,
  Sparkles,
  UserCheck,
  UserPlus,
} from 'lucide-react';

export type Lead = {
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
  sequence_next_step?: {
    id: string;
    step_type: string;
    status: string;
  } | null;
};

type TempFilter = 'all' | 'hot' | 'warm' | 'cold';

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

const AD_SOURCE_LABELS: Record<string, string> = {
  meta_ad: 'From ad',
  google_ad: 'From ad',
};

function leadInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'
  );
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getAdSourceLabel(adSource?: string | null): string | null {
  if (!adSource) return null;
  return AD_SOURCE_LABELS[adSource] ?? null;
}

function parseLeadDetail(lead: Lead) {
  const msg = lead.message || '';
  const infoLines = msg.split('\n').filter((l) =>
    l.startsWith('Timeline:') || l.startsWith('Budget:') || l.startsWith('Area:'),
  );
  const openHouseLine =
    lead.source === 'open_house' && msg.startsWith('Open house:')
      ? msg.replace(/^Open house:\s*/, '')
      : null;
  const listingLine =
    lead.source === 'listing_page' && msg.includes('interested in')
      ? msg.replace(/^I'm interested in\s*/i, '')
      : null;
  const linkedProject = lead.projects && !Array.isArray(lead.projects) ? lead.projects : null;
  const listingDisplay = linkedProject
    ? [linkedProject.property_info?.address, linkedProject.title].find(Boolean) || listingLine
    : listingLine;

  return { infoLines, openHouseLine, listingDisplay, linkedProject };
}

function getLeadSummaryLine(lead: Lead): string {
  const { infoLines, openHouseLine, listingDisplay } = parseLeadDetail(lead);
  if (getAdSourceLabel(lead.ad_source)) return 'From paid ad';
  if (openHouseLine) return `Open house · ${openHouseLine}`;
  if (listingDisplay) return `Re: ${listingDisplay}`;
  if (infoLines.length > 0) return infoLines.join(' · ');
  if (lead.lead_type && LEAD_TYPE_LABELS[lead.lead_type]) return LEAD_TYPE_LABELS[lead.lead_type];
  if (lead.source && SOURCE_LABELS[lead.source]) return SOURCE_LABELS[lead.source];
  return lead.email || lead.phone || 'New lead';
}

function leadHasActiveFollowup(
  lead: Lead,
  autoFollowupEnabled: boolean,
  stoppedIds: Set<string>,
): boolean {
  return Boolean(
    autoFollowupEnabled && lead.email && lead.followup_active && !stoppedIds.has(lead.id),
  );
}

type LeadsInboxProps = {
  leads: Lead[];
  filter: TempFilter;
  onFilterChange: (filter: TempFilter) => void;
  selectedLeadId: string | null;
  onSelectLead: (id: string) => void;
  autoFollowupEnabled: boolean;
  followupScheduleText: string;
  stoppedIds: Set<string>;
  addingId: string | null;
  markingContactedId: string | null;
  onAddToCrm: (id: string) => void;
  onMarkContacted: (id: string) => void;
  onContactLead: (lead: Lead, type: 'email' | 'phone') => void;
  onGoToCapture: () => void;
  onSequenceChange?: () => void;
};

export default function LeadsInbox({
  leads,
  filter,
  onFilterChange,
  selectedLeadId,
  onSelectLead,
  autoFollowupEnabled,
  followupScheduleText,
  stoppedIds,
  addingId,
  markingContactedId,
  onAddToCrm,
  onMarkContacted,
  onContactLead,
  onGoToCapture,
  onSequenceChange,
}: LeadsInboxProps) {
  const counts = {
    all: leads.length,
    hot: leads.filter((l) => getLeadTemperature(l.created_at, l.message) === 'hot').length,
    warm: leads.filter((l) => getLeadTemperature(l.created_at, l.message) === 'warm').length,
    cold: leads.filter((l) => getLeadTemperature(l.created_at, l.message) === 'cold').length,
  };

  const filteredLeads = leads.filter(
    (l) => filter === 'all' || getLeadTemperature(l.created_at, l.message) === filter,
  );

  const selectedLead = filteredLeads.find((l) => l.id === selectedLeadId) ?? null;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <FilterSidebar
        title="Filters"
        className="lg:sticky lg:top-24"
        groups={[
          {
            id: 'temperature',
            label: 'Temperature',
            icon: Flame,
            defaultOpen: true,
            children: (
              <div className="space-y-1" data-tour="leads-filter">
                {(['all', 'hot', 'warm', 'cold'] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onFilterChange(key)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors',
                      filter === key
                        ? 'bg-brand-50 text-brand-600'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                    )}
                  >
                    <span className="capitalize">{key === 'all' ? 'All leads' : key}</span>
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
                      {counts[key]}
                    </span>
                  </button>
                ))}
              </div>
            ),
          },
        ]}
      />

      <div className="min-w-0 flex-1 space-y-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">Inbox</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            New captures stay here until you add them to your CRM.
          </p>
        </div>

      {filteredLeads.length === 0 ? (
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
              <Button variant="secondary" size="sm" onClick={onGoToCapture}>
                Go to Capture
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] lg:items-start">
          <Card className="overflow-hidden p-0">
            <CardHeader className="border-b py-3">
              <CardTitle className="text-sm">Leads</CardTitle>
              <CardDescription>{filteredLeads.length} in view</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-0 p-0">
              {filteredLeads.map((lead) => {
                const temp = getLeadTemperature(lead.created_at, lead.message);
                const selected = lead.id === selectedLeadId;
                return (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => onSelectLead(lead.id)}
                    className={cn(
                      'flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/50',
                      selected && 'bg-muted',
                    )}
                  >
                    <div
                      className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                        nameAvatarClasses(lead.name),
                      )}
                    >
                      {leadInitials(lead.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-foreground">{lead.name}</span>
                        <LeadTemperatureBadge temperature={temp} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {lead.lead_read || getLeadSummaryLine(lead)}
                      </p>
                      {lead.sequence_awaiting_approval ? (
                        <Badge variant="warm" className="mt-1 text-[10px]">
                          Approve email
                        </Badge>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(lead.created_at)}</span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {selectedLead ? (
            <LeadDetailPanel
              lead={selectedLead}
              autoFollowupEnabled={autoFollowupEnabled}
              followupScheduleText={followupScheduleText}
              stoppedIds={stoppedIds}
              addingId={addingId}
              markingContactedId={markingContactedId}
              onAddToCrm={onAddToCrm}
              onMarkContacted={onMarkContacted}
              onContactLead={onContactLead}
              onSequenceChange={onSequenceChange}
            />
          ) : (
            <Card className="flex min-h-[280px] items-center justify-center p-8">
              <p className="text-sm text-muted-foreground">Select a lead to view details</p>
            </Card>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

function LeadDetailPanel({
  lead,
  autoFollowupEnabled,
  followupScheduleText,
  stoppedIds,
  addingId,
  markingContactedId,
  onAddToCrm,
  onMarkContacted,
  onContactLead,
  onSequenceChange,
}: {
  lead: Lead;
  autoFollowupEnabled: boolean;
  followupScheduleText: string;
  stoppedIds: Set<string>;
  addingId: string | null;
  markingContactedId: string | null;
  onAddToCrm: (id: string) => void;
  onMarkContacted: (id: string) => void;
  onContactLead: (lead: Lead, type: 'email' | 'phone') => void;
  onSequenceChange?: () => void;
}) {
  const temp = getLeadTemperature(lead.created_at, lead.message);
  const isAdding = addingId === lead.id;
  const isMarkingContacted = markingContactedId === lead.id;
  const followupActive = leadHasActiveFollowup(lead, autoFollowupEnabled, stoppedIds);
  const emailsStopped = stoppedIds.has(lead.id);
  const { infoLines, openHouseLine, listingDisplay, linkedProject } = parseLeadDetail(lead);

  const primaryContact = lead.phone ? 'phone' : lead.email ? 'email' : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="truncate">{lead.name}</CardTitle>
            <LeadTemperatureBadge temperature={temp} size="md" />
            {getAdSourceLabel(lead.ad_source) && (
              <Badge variant="ad" icon={Sparkles} className="text-[10.5px]">
                From ad
              </Badge>
            )}
          </div>
          <CardDescription className="mt-1">{getLeadSummaryLine(lead)}</CardDescription>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {primaryContact ? (
            <Button
              size="sm"
              onClick={() => onContactLead(lead, primaryContact)}
              className="gap-1.5"
            >
              {primaryContact === 'phone' ? <Phone /> : <Mail />}
              {primaryContact === 'phone' ? 'Call' : 'Email'}
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onAddToCrm(lead.id)}
            disabled={isAdding}
            isLoading={isAdding}
            className="gap-1.5"
          >
            {!isAdding && <UserPlus />}
            Add to CRM
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="size-8 p-0">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {lead.phone ? (
                <DropdownMenuItem onClick={() => onContactLead(lead, 'phone')}>
                  <Phone />
                  Call {lead.phone}
                </DropdownMenuItem>
              ) : null}
              {lead.email ? (
                <DropdownMenuItem onClick={() => onContactLead(lead, 'email')}>
                  <Mail />
                  Email {lead.email}
                </DropdownMenuItem>
              ) : null}
              {(lead.phone || lead.email) && followupActive ? <DropdownMenuSeparator /> : null}
              {followupActive ? (
                <DropdownMenuItem onClick={() => onMarkContacted(lead.id)} disabled={isMarkingContacted}>
                  {isMarkingContacted ? <Loader2 className="animate-spin" /> : <UserCheck />}
                  Mark contacted
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {(openHouseLine || listingDisplay) && (
          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
            {openHouseLine ? (
              <DoorOpen className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            ) : (
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {openHouseLine ? 'Open house' : 'Listing inquiry'}
              </p>
              <p className="mt-0.5 break-words text-sm text-foreground">{openHouseLine || listingDisplay}</p>
              {linkedProject ? (
                <Link
                  href={`/dashboard/projects/${linkedProject.id}`}
                  className="mt-2 inline-block text-sm font-medium text-foreground hover:underline"
                >
                  View project
                </Link>
              ) : null}
            </div>
          </div>
        )}

        {followupActive ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Auto follow-up is active
            {lead.sequence_awaiting_approval ? ' — first email needs your approval below.' : ` (${followupScheduleText}).`}
          </div>
        ) : null}

        {autoFollowupEnabled ? (
          <LeadSequencePanel
            leadId={lead.id}
            leadName={lead.name}
            autoFollowupEnabled={autoFollowupEnabled}
            onSequenceChange={onSequenceChange}
          />
        ) : null}

        {!followupActive && emailsStopped && lead.email && autoFollowupEnabled ? (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MailX className="size-4" />
            Auto follow-up stopped for this lead
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {lead.source && SOURCE_LABELS[lead.source] ? (
            <Badge variant="neutral">{SOURCE_LABELS[lead.source]}</Badge>
          ) : null}
          {infoLines.map((line, i) => (
            <Badge key={i} variant="neutral">
              {line}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="text-xs text-muted-foreground">
        Captured {timeAgo(lead.created_at)}
      </CardFooter>
    </Card>
  );
}

export { getLeadTemperature, parseLeadDetail, getLeadSummaryLine };
