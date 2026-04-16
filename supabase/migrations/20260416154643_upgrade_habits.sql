-- Upgrade habits table with professional tracking fields
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS frequency JSONB DEFAULT '{"type": "daily"}'::jsonb;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS reminder_time TIME;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS linked_finance_category TEXT;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS goal_value NUMERIC;

-- Update existing records with default frequency if needed
UPDATE public.habits SET frequency = '{"type": "daily"}'::jsonb WHERE frequency IS NULL;
