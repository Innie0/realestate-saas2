type SupabaseClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          single: () => Promise<{ data: ClientRow | null; error: { message: string } | null }>;
        };
      };
    };
  };
};

export interface ClientPartySnapshot {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface LinkedClientSummary {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface ClientLinkedTransaction {
  id: string;
  status: string;
  property_address: string;
  offer_price: number;
  closing_date: string | null;
  role: 'buyer' | 'seller';
  created_at: string;
}

type ClientRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
};

type PartyRole = 'buyer' | 'seller';

const PARTY_PREFIX: Record<PartyRole, string> = {
  buyer: 'buyer',
  seller: 'seller',
};

/** Fetch a CRM client owned by the user for linking to a transaction party. */
export async function fetchClientForTransactionLink(
  supabase: SupabaseClient,
  userId: string,
  clientId: string,
): Promise<ClientPartySnapshot | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, email, phone')
    .eq('id', clientId)
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data;
}

/** Copy client contact fields onto transaction party columns. */
export function partyFieldsFromClient(
  role: PartyRole,
  client: ClientPartySnapshot,
): Record<string, string | null> {
  const prefix = PARTY_PREFIX[role];
  return {
    [`${prefix}_client_id`]: client.id,
    [`${prefix}_name`]: client.name,
    [`${prefix}_email`]: client.email,
    [`${prefix}_phone`]: client.phone,
  };
}

type TransactionPartyBody = {
  buyer_client_id?: string | null;
  seller_client_id?: string | null;
  buyer_name?: string;
  buyer_email?: string | null;
  buyer_phone?: string | null;
  seller_name?: string;
  seller_email?: string | null;
  seller_phone?: string | null;
};

/**
 * Resolve buyer/seller client links on create/update.
 * When a client_id is set, hydrates name/email/phone from the client record.
 */
export async function resolveTransactionPartyLinks(
  supabase: SupabaseClient,
  userId: string,
  body: TransactionPartyBody,
): Promise<{ data: Record<string, unknown>; error?: string }> {
  const resolved: Record<string, unknown> = {};

  for (const role of ['buyer', 'seller'] as const) {
    const clientIdKey = `${role}_client_id` as const;
    const clientId = body[clientIdKey];

    if (clientId === undefined) continue;

    if (clientId === null || clientId === '') {
      resolved[clientIdKey] = null;
      continue;
    }

    const client = await fetchClientForTransactionLink(supabase, userId, clientId);
    if (!client) {
      return { data: {}, error: `${role === 'buyer' ? 'Buyer' : 'Seller'} client not found` };
    }

    Object.assign(resolved, partyFieldsFromClient(role, client));
  }

  return { data: resolved };
}

/** Merge transactions where a client appears as buyer, seller, or legacy client_id. */
export function mergeClientTransactions(
  asBuyer: Array<Omit<ClientLinkedTransaction, 'role'>>,
  asSeller: Array<Omit<ClientLinkedTransaction, 'role'>>,
  legacy: Array<Omit<ClientLinkedTransaction, 'role'>>,
): ClientLinkedTransaction[] {
  const byId = new Map<string, ClientLinkedTransaction>();

  for (const row of asBuyer) {
    byId.set(row.id, { ...row, role: 'buyer' });
  }
  for (const row of asSeller) {
    const existing = byId.get(row.id);
    if (existing) {
      byId.set(row.id, { ...existing, role: 'buyer' });
    } else {
      byId.set(row.id, { ...row, role: 'seller' });
    }
  }
  for (const row of legacy) {
    if (!byId.has(row.id)) {
      byId.set(row.id, { ...row, role: 'buyer' });
    }
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

/** Escape characters that break PostgREST filter strings. */
export function sanitizeClientSearchQuery(raw: string): string {
  return raw.trim().replace(/[%_,()]/g, ' ').replace(/\s+/g, ' ').slice(0, 80);
}
