-- Recurring Transactions Table
-- Stores user-defined recurring income/expense/saving rules

CREATE TABLE IF NOT EXISTS recurring_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  amount      BIGINT NOT NULL CHECK (amount > 0),
  category    TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('income', 'expense', 'saving')),
  -- Recurrence rule
  frequency   TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  day_of_month INT,        -- 1-31, used when frequency = 'monthly'
  day_of_week  INT,        -- 0-6 (0=Sun), used when frequency = 'weekly'
  -- Tracking last application
  last_applied_date DATE,  -- The date this rule was last turned into a real transaction
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookup by user
CREATE INDEX IF NOT EXISTS recurring_transactions_user_id_idx ON recurring_transactions(user_id);

-- RLS
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own recurring transactions"
  ON recurring_transactions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
