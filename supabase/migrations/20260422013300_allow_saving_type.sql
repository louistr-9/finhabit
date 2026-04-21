-- Relaxing the check constraint on transactions to allow 'saving' type
-- We need to find the name of the check constraint or just drop all checks on the 'type' column if possible.
-- Since the migration script used inline CHECK, it likely has a system-generated name like 'transactions_type_check'.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'transactions_type_check'
    ) THEN
        ALTER TABLE public.transactions DROP CONSTRAINT transactions_type_check;
    END IF;
END $$;

-- Add the new constraint
ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('income', 'expense', 'saving'));
