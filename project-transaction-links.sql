-- Connection 1: Projects ↔ Transactions
-- Optional performance index for listing linked transactions on project pages.

CREATE INDEX IF NOT EXISTS idx_transactions_project_id
  ON transactions(project_id)
  WHERE project_id IS NOT NULL;
