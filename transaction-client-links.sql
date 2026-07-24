-- Connection 2: Transactions ↔ Clients (CRM)
-- Links buyer and seller parties to client records.

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS buyer_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS seller_client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_buyer_client
  ON transactions(buyer_client_id)
  WHERE buyer_client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_seller_client
  ON transactions(seller_client_id)
  WHERE seller_client_id IS NOT NULL;

-- Legacy single client_id → buyer (booking-link flows usually mean buyer)
UPDATE transactions
SET buyer_client_id = client_id
WHERE client_id IS NOT NULL
  AND buyer_client_id IS NULL;

-- After running: reload the PostgREST schema cache in Supabase
-- (Dashboard → Project Settings → API → Reload schema, or restart project)
