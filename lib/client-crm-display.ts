import type { Client } from '@/types';

export type ClientStage = 'lead' | 'active' | 'under_offer' | 'closed';

export type ClientListRow = Client & {
  latest_note?: { id: string; note: string; created_at: string } | null;
  upcoming_reminders_count?: number;
  next_reminder?: {
    id: string;
    title: string;
    reminder_date: string;
    is_overdue: boolean;
  } | null;
  last_contact_at?: string | null;
  projects?: {
    id: string;
    title: string;
    property_info?: { address?: string; city?: string; state?: string; zip_code?: string };
    published?: boolean;
  } | null;
};

const LEAD_TYPE_LABELS: Record<string, string> = {
  buyer: 'Buyer',
  seller: 'Seller',
  renter: 'Renter',
  browsing: 'Browsing',
};

const BUDGET_LABELS: Record<string, string> = {
  'under-300k': 'Under $300k',
  '300-500k': '$300k–$500k',
  '500-750k': '$500k–$750k',
  '750k-1m': '$750k–$1M',
  '1m+': '$1M+',
  'under-1500': 'Under $1,500/mo',
  '1500-2500': '$1,500–$2,500/mo',
  '2500-3500': '$2,500–$3,500/mo',
  '3500+': '$3,500+/mo',
};

function readNoteField(note: string, field: string): string | null {
  const match = note.match(new RegExp(`${field}:\\s*(.+)$`, 'im'));
  return match?.[1]?.trim() || null;
}

export function getClientInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getClientStage(client: ClientListRow): ClientStage {
  if (client.status === 'archived') return 'closed';
  if (client.status === 'inactive') return 'lead';

  const note = (client.latest_note?.note || client.message || '').toLowerCase();
  if (note.includes('under offer') || note.includes('offer accepted') || note.includes('pending')) {
    return 'under_offer';
  }

  if (client.source && client.source !== 'manual' && client.status === 'active') {
    const hasNotes = Boolean(client.latest_note);
    if (!hasNotes) return 'lead';
  }

  return 'active';
}

export function getClientInterest(client: ClientListRow): { headline: string; subline?: string } {
  const note = client.latest_note?.note || client.message || '';
  const typeLabel = client.lead_type ? LEAD_TYPE_LABELS[client.lead_type] || 'Client' : 'Client';

  const area =
    readNoteField(note, 'Area') ||
    client.projects?.property_info?.city ||
    null;
  const budgetRaw = readNoteField(note, 'Budget');
  const budget = budgetRaw ? BUDGET_LABELS[budgetRaw] || budgetRaw : null;

  if (client.projects?.title && client.lead_type === 'buyer') {
    return {
      headline: `${typeLabel} · ${client.projects.title}`,
      subline: budget || undefined,
    };
  }

  if (area) {
    return {
      headline: `${typeLabel} · ${area}`,
      subline: budget || undefined,
    };
  }

  if (client.lead_type === 'seller') {
    return { headline: `${typeLabel} · listing`, subline: budget || undefined };
  }

  return {
    headline: typeLabel,
    subline: budget || undefined,
  };
}

export function formatLastContact(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (date >= startOfToday) return 'Today';
  if (date >= startOfYesterday) return 'Yesterday';

  return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
}

export function formatFollowUpLabel(reminder: ClientListRow['next_reminder']): {
  text: string;
  tone: 'overdue' | 'upcoming' | 'none';
} {
  if (!reminder) return { text: '—', tone: 'none' };

  const date = new Date(reminder.reminder_date);
  const title = reminder.title.replace(/^New lead:\s*/i, '').split('—')[0]?.trim() || 'Follow up';

  if (reminder.is_overdue) {
    const action = title.length > 28 ? `${title.slice(0, 28)}…` : title;
    return { text: `Overdue · ${action.toLowerCase()}`, tone: 'overdue' };
  }

  const day = date.toLocaleDateString('en-US', { weekday: 'short' });
  const shortTitle = title.length > 24 ? `${title.slice(0, 24)}…` : title;
  return { text: `${day} · ${shortTitle.toLowerCase()}`, tone: 'upcoming' };
}

export const STAGE_BADGE: Record<
  ClientStage,
  { label: string; className: string; dotClassName: string }
> = {
  lead: {
    label: 'Lead',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
    dotClassName: 'bg-amber-500',
  },
  active: {
    label: 'Active',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotClassName: 'bg-emerald-500',
  },
  under_offer: {
    label: 'Under offer',
    className: 'bg-orange-50 text-orange-800 border-orange-200',
    dotClassName: 'bg-orange-500',
  },
  closed: {
    label: 'Closed',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
    dotClassName: 'bg-gray-400',
  },
};

export type ClientSortKey = 'followup' | 'name' | 'last_contact';

export function sortClients(rows: ClientListRow[], sortKey: ClientSortKey): ClientListRow[] {
  const copy = [...rows];

  if (sortKey === 'name') {
    return copy.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (sortKey === 'last_contact') {
    return copy.sort((a, b) => {
      const aTime = a.last_contact_at ? new Date(a.last_contact_at).getTime() : 0;
      const bTime = b.last_contact_at ? new Date(b.last_contact_at).getTime() : 0;
      return bTime - aTime;
    });
  }

  return copy.sort((a, b) => {
    const aReminder = a.next_reminder;
    const bReminder = b.next_reminder;
    if (!aReminder && !bReminder) return 0;
    if (!aReminder) return 1;
    if (!bReminder) return -1;
    if (aReminder.is_overdue !== bReminder.is_overdue) {
      return aReminder.is_overdue ? -1 : 1;
    }
    return new Date(aReminder.reminder_date).getTime() - new Date(bReminder.reminder_date).getTime();
  });
}

export function countNeedsAttention(clients: ClientListRow[]): number {
  return clients.filter((c) => c.next_reminder?.is_overdue).length;
}

const AVATAR_PALETTES = [
  'bg-emerald-800 text-white',
  'bg-stone-600 text-white',
  'bg-sky-700 text-white',
  'bg-violet-700 text-white',
  'bg-rose-700 text-white',
  'bg-amber-700 text-white',
];

export function getClientAvatarClass(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[hash];
}
