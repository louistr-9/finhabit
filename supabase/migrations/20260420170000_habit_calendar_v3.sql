-- Upgrade habits and logs for numeric tracking and heatmaps
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'lần';
ALTER TABLE public.habit_logs ADD COLUMN IF NOT EXISTS current_value NUMERIC DEFAULT 0;

-- Optional: If we want to ensure completed is synced with current_value >= goal_value 
-- but for now we'll handle that in business logic or keep it as is.
