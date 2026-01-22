-- Transaction Manager Schema for RealEstate SaaS
-- Run this script in your Supabase SQL editor to add transactions support

-- Transactions table
-- Stores real estate transaction information
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Property Information
  property_address TEXT NOT NULL,
  property_city TEXT,
  property_state TEXT,
  property_zip TEXT,
  property_type TEXT CHECK (property_type IN ('house', 'apartment', 'condo', 'land', 'commercial')),
  
  -- Buyer Information
  buyer_name TEXT NOT NULL,
  buyer_email TEXT,
  buyer_phone TEXT,
  buyer_agent_name TEXT,
  buyer_agent_email TEXT,
  buyer_agent_phone TEXT,
  
  -- Seller Information
  seller_name TEXT NOT NULL,
  seller_email TEXT,
  seller_phone TEXT,
  seller_agent_name TEXT,
  seller_agent_email TEXT,
  seller_agent_phone TEXT,
  
  -- Financial Information
  offer_price DECIMAL(12, 2) NOT NULL,
  earnest_money DECIMAL(12, 2),
  down_payment DECIMAL(12, 2),
  loan_amount DECIMAL(12, 2),
  
  -- Key Terms
  terms JSONB DEFAULT '{}', -- Flexible storage for additional terms
  notes TEXT,
  
  -- Important Dates
  offer_date DATE,
  acceptance_date DATE,
  inspection_date DATE,
  inspection_deadline DATE,
  appraisal_date DATE,
  appraisal_deadline DATE,
  financing_deadline DATE,
  title_deadline DATE,
  closing_date DATE,
  possession_date DATE,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'under_contract', 'closed', 'cancelled', 'expired')),
  
  -- Link to project if applicable
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Link to client if applicable  
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction Checklist Items table
-- Stores checklist items for each transaction
CREATE TABLE IF NOT EXISTS transaction_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('inspection', 'appraisal', 'financing', 'title', 'closing', 'other')),
  due_date DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  order_index INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction Reminders table
-- Stores automated reminders for transaction milestones
CREATE TABLE IF NOT EXISTS transaction_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reminder_type TEXT CHECK (reminder_type IN ('inspection', 'appraisal', 'financing', 'closing', 'custom')),
  days_before INTEGER, -- How many days before the milestone
  
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_closing_date ON transactions(closing_date);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_checklist_transaction_id ON transaction_checklist_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_checklist_user_id ON transaction_checklist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_reminders_transaction_id ON transaction_reminders(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_reminders_user_id ON transaction_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_reminders_reminder_date ON transaction_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_transaction_reminders_is_sent ON transaction_reminders(is_sent);

-- Enable Row Level Security (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_reminders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running the script)
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can manage own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view own transaction checklist items" ON transaction_checklist_items;
DROP POLICY IF EXISTS "Users can manage own transaction checklist items" ON transaction_checklist_items;
DROP POLICY IF EXISTS "Users can view own transaction reminders" ON transaction_reminders;
DROP POLICY IF EXISTS "Users can manage own transaction reminders" ON transaction_reminders;

-- Create RLS policies for transactions table
CREATE POLICY "Users can view own transactions" 
  ON transactions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own transactions" 
  ON transactions FOR ALL 
  USING (auth.uid() = user_id);

-- Create RLS policies for transaction_checklist_items table
CREATE POLICY "Users can view own transaction checklist items" 
  ON transaction_checklist_items FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own transaction checklist items" 
  ON transaction_checklist_items FOR ALL 
  USING (auth.uid() = user_id);

-- Create RLS policies for transaction_reminders table
CREATE POLICY "Users can view own transaction reminders" 
  ON transaction_reminders FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own transaction reminders" 
  ON transaction_reminders FOR ALL 
  USING (auth.uid() = user_id);

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transaction_checklist_items_updated_at ON transaction_checklist_items;
CREATE TRIGGER update_transaction_checklist_items_updated_at
  BEFORE UPDATE ON transaction_checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transaction_reminders_updated_at ON transaction_reminders;
CREATE TRIGGER update_transaction_reminders_updated_at
  BEFORE UPDATE ON transaction_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-generate checklist items when a transaction is created
CREATE OR REPLACE FUNCTION generate_transaction_checklist()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert standard checklist items based on transaction dates
  
  -- Inspection items
  IF NEW.inspection_date IS NOT NULL OR NEW.inspection_deadline IS NOT NULL THEN
    INSERT INTO transaction_checklist_items (transaction_id, user_id, title, category, due_date, order_index)
    VALUES 
      (NEW.id, NEW.user_id, 'Schedule home inspection', 'inspection', NEW.inspection_date, 1),
      (NEW.id, NEW.user_id, 'Review inspection report', 'inspection', NEW.inspection_deadline, 2),
      (NEW.id, NEW.user_id, 'Negotiate repairs (if needed)', 'inspection', NEW.inspection_deadline, 3);
  END IF;
  
  -- Appraisal items
  IF NEW.appraisal_date IS NOT NULL OR NEW.appraisal_deadline IS NOT NULL THEN
    INSERT INTO transaction_checklist_items (transaction_id, user_id, title, category, due_date, order_index)
    VALUES 
      (NEW.id, NEW.user_id, 'Order appraisal', 'appraisal', NEW.appraisal_date, 4),
      (NEW.id, NEW.user_id, 'Review appraisal report', 'appraisal', NEW.appraisal_deadline, 5);
  END IF;
  
  -- Financing items
  IF NEW.financing_deadline IS NOT NULL THEN
    INSERT INTO transaction_checklist_items (transaction_id, user_id, title, category, due_date, order_index)
    VALUES 
      (NEW.id, NEW.user_id, 'Submit loan application', 'financing', NULL, 6),
      (NEW.id, NEW.user_id, 'Provide required documents to lender', 'financing', NULL, 7),
      (NEW.id, NEW.user_id, 'Receive loan approval', 'financing', NEW.financing_deadline, 8);
  END IF;
  
  -- Title items
  IF NEW.title_deadline IS NOT NULL THEN
    INSERT INTO transaction_checklist_items (transaction_id, user_id, title, category, due_date, order_index)
    VALUES 
      (NEW.id, NEW.user_id, 'Order title search', 'title', NULL, 9),
      (NEW.id, NEW.user_id, 'Review title report', 'title', NEW.title_deadline, 10),
      (NEW.id, NEW.user_id, 'Clear any title issues', 'title', NEW.title_deadline, 11);
  END IF;
  
  -- Closing items
  IF NEW.closing_date IS NOT NULL THEN
    INSERT INTO transaction_checklist_items (transaction_id, user_id, title, category, due_date, order_index)
    VALUES 
      (NEW.id, NEW.user_id, 'Schedule final walkthrough', 'closing', NEW.closing_date, 12),
      (NEW.id, NEW.user_id, 'Review closing documents', 'closing', NEW.closing_date, 13),
      (NEW.id, NEW.user_id, 'Wire closing funds', 'closing', NEW.closing_date, 14),
      (NEW.id, NEW.user_id, 'Attend closing', 'closing', NEW.closing_date, 15);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate checklist
DROP TRIGGER IF EXISTS generate_checklist_on_transaction_create ON transactions;
CREATE TRIGGER generate_checklist_on_transaction_create
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION generate_transaction_checklist();

-- Function to auto-generate reminders when a transaction is created
CREATE OR REPLACE FUNCTION generate_transaction_reminders()
RETURNS TRIGGER AS $$
BEGIN
  -- Create reminders for key dates (3 days before, 1 day before)
  
  -- Inspection reminders
  IF NEW.inspection_deadline IS NOT NULL THEN
    INSERT INTO transaction_reminders (transaction_id, user_id, title, reminder_type, reminder_date, days_before)
    VALUES 
      (NEW.id, NEW.user_id, 'Inspection deadline in 3 days', 'inspection', NEW.inspection_deadline - INTERVAL '3 days', 3),
      (NEW.id, NEW.user_id, 'Inspection deadline tomorrow', 'inspection', NEW.inspection_deadline - INTERVAL '1 day', 1);
  END IF;
  
  -- Appraisal reminders
  IF NEW.appraisal_deadline IS NOT NULL THEN
    INSERT INTO transaction_reminders (transaction_id, user_id, title, reminder_type, reminder_date, days_before)
    VALUES 
      (NEW.id, NEW.user_id, 'Appraisal deadline in 3 days', 'appraisal', NEW.appraisal_deadline - INTERVAL '3 days', 3),
      (NEW.id, NEW.user_id, 'Appraisal deadline tomorrow', 'appraisal', NEW.appraisal_deadline - INTERVAL '1 day', 1);
  END IF;
  
  -- Financing reminders
  IF NEW.financing_deadline IS NOT NULL THEN
    INSERT INTO transaction_reminders (transaction_id, user_id, title, reminder_type, reminder_date, days_before)
    VALUES 
      (NEW.id, NEW.user_id, 'Financing deadline in 3 days', 'financing', NEW.financing_deadline - INTERVAL '3 days', 3),
      (NEW.id, NEW.user_id, 'Financing deadline tomorrow', 'financing', NEW.financing_deadline - INTERVAL '1 day', 1);
  END IF;
  
  -- Closing reminders
  IF NEW.closing_date IS NOT NULL THEN
    INSERT INTO transaction_reminders (transaction_id, user_id, title, reminder_type, reminder_date, days_before)
    VALUES 
      (NEW.id, NEW.user_id, 'Closing in 7 days', 'closing', NEW.closing_date - INTERVAL '7 days', 7),
      (NEW.id, NEW.user_id, 'Closing in 3 days', 'closing', NEW.closing_date - INTERVAL '3 days', 3),
      (NEW.id, NEW.user_id, 'Closing tomorrow!', 'closing', NEW.closing_date - INTERVAL '1 day', 1);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate reminders
DROP TRIGGER IF EXISTS generate_reminders_on_transaction_create ON transactions;
CREATE TRIGGER generate_reminders_on_transaction_create
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION generate_transaction_reminders();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Transaction Manager schema created successfully!';
END $$;
