-- Connection 3: Leads → Clients
-- Track when an inbox lead was promoted to the CRM.

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS promoted_to_crm_at TIMESTAMPTZ;

UPDATE clients
SET promoted_to_crm_at = updated_at
WHERE in_crm = true
  AND source IN ('lead_form', 'open_house', 'listing_page')
  AND promoted_to_crm_at IS NULL;
