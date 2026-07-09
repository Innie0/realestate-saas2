type TransactionPriceSyncClient = {
  from: (table: string) => {
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          in: (column: string, values: string[]) => Promise<{ error: { message: string } | null }>;
        };
      };
    };
  };
};

/** Transaction statuses that represent an active listing tied to a project price. */
export const LISTING_TRANSACTION_STATUSES = ['active'] as const;

export function listingPriceFromProject(
  project: { property_info?: { price?: number } } | null | undefined,
): number | null {
  const price = project?.property_info?.price;
  return typeof price === 'number' && price > 0 ? price : null;
}

/** Keep linked listing transactions in sync when a project's list price changes. */
export async function syncProjectListingPriceToTransactions(
  supabase: TransactionPriceSyncClient,
  userId: string,
  projectId: string,
  listingPrice: number,
): Promise<void> {
  if (!(listingPrice > 0)) return;

  const { error } = await supabase
    .from('transactions')
    .update({
      offer_price: listingPrice,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .in('status', [...LISTING_TRANSACTION_STATUSES]);

  if (error) {
    console.warn('Failed to sync transaction offer_price from project:', error.message);
  }
}

/** Prefer the linked project's list price for active listing deals. */
export function resolveTransactionOfferPrice(transaction: {
  offer_price: number;
  status: string;
  project?: { property_info?: { price?: number } } | null;
}): number {
  if (transaction.status === 'active') {
    const listingPrice = listingPriceFromProject(transaction.project);
    if (listingPrice != null) return listingPrice;
  }
  return transaction.offer_price;
}
