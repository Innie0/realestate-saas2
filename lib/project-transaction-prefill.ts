import { listingPriceFromProject } from '@/lib/project-transaction-sync';

export interface LinkedTransactionSummary {
  id: string;
  status: string;
  property_address: string;
  offer_price: number;
  closing_date: string | null;
  buyer_name: string;
  created_at: string;
}

export interface LinkedProjectSummary {
  id: string;
  title: string;
  status: string;
  property_type: string | null;
  property_info: {
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    price?: number;
  } | null;
}

export interface ProjectTransactionPrefill {
  project_id: string;
  project_title: string;
  property_address: string;
  property_city: string | null;
  property_state: string | null;
  property_zip: string | null;
  property_type: string | null;
  offer_price: number | null;
}

type ProjectPrefillSource = {
  id: string;
  title: string;
  property_type?: string | null;
  property_info?: {
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    price?: number;
  } | null;
};

/** Build canonical transaction prefill fields from a listing project. */
export function buildProjectTransactionPrefill(
  project: ProjectPrefillSource,
): ProjectTransactionPrefill {
  const info = project.property_info ?? {};

  return {
    project_id: project.id,
    project_title: project.title,
    property_address: info.address?.trim() || project.title,
    property_city: info.city?.trim() || null,
    property_state: info.state?.trim() || null,
    property_zip: info.zip_code?.trim() || null,
    property_type: project.property_type || null,
    offer_price: listingPriceFromProject(
      project.property_info ? { property_info: project.property_info } : null,
    ),
  };
}

/** Dashboard route for creating a transaction linked to a project. */
export function newTransactionFromProjectPath(projectId: string): string {
  return `/dashboard/transactions/new?project_id=${encodeURIComponent(projectId)}`;
}
