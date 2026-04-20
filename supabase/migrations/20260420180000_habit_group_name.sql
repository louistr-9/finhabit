-- Add group_name column to habits table for categorization
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS group_name TEXT;

-- Index for performance when filtering by group (if we decide to filter later)
CREATE INDEX IF NOT EXISTS idx_habits_group_name ON public.habits(group_name);
