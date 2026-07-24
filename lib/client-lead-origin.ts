export const LEAD_ORIGIN_SOURCES = ['lead_form', 'open_house', 'listing_page'] as const;

export type LeadOriginSource = (typeof LEAD_ORIGIN_SOURCES)[number];

export const LEAD_SOURCE_LABELS: Record<LeadOriginSource, string> = {
  lead_form: 'Lead form',
  open_house: 'Open house',
  listing_page: 'Listing inquiry',
};

export const LEAD_TYPE_LABELS: Record<string, string> = {
  buyer: 'Buyer',
  seller: 'Seller',
  renter: 'Renter',
  browsing: 'Browsing',
};

export interface ClientLeadOriginProject {
  id: string;
  title: string;
  property_info?: {
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  } | null;
}

export interface ClientLeadOrigin {
  source: LeadOriginSource;
  source_label: string;
  captured_at: string;
  promoted_at: string | null;
  lead_type: string | null;
  lead_type_label: string | null;
  message: string | null;
  project_id: string | null;
  ad_source: string | null;
  project?: ClientLeadOriginProject | null;
}

type ClientLeadRow = {
  source?: string | null;
  created_at: string;
  updated_at?: string;
  promoted_to_crm_at?: string | null;
  lead_type?: string | null;
  message?: string | null;
  project_id?: string | null;
  ad_source?: string | null;
  in_crm?: boolean;
};

export function isLeadOriginSource(
  source: string | null | undefined,
): source is LeadOriginSource {
  return LEAD_ORIGIN_SOURCES.includes(source as LeadOriginSource);
}

export function buildClientLeadOrigin(
  client: ClientLeadRow,
  project?: ClientLeadOriginProject | null,
): ClientLeadOrigin | null {
  if (!isLeadOriginSource(client.source)) {
    return null;
  }

  const promotedAt = client.promoted_to_crm_at
    ?? (client.in_crm ? (client.updated_at ?? client.created_at) : null);

  return {
    source: client.source,
    source_label: LEAD_SOURCE_LABELS[client.source],
    captured_at: client.created_at,
    promoted_at: promotedAt,
    lead_type: client.lead_type ?? null,
    lead_type_label: client.lead_type
      ? LEAD_TYPE_LABELS[client.lead_type] || client.lead_type
      : null,
    message: client.message ?? null,
    project_id: client.project_id ?? null,
    ad_source: client.ad_source ?? null,
    project: project ?? null,
  };
}

export function formatLeadCaptureDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function truncateLeadMessage(message: string, maxLength = 160): string {
  const trimmed = message.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength).trim()}…`;
}
