ALTER TABLE public.assets ADD COLUMN symbol VARCHAR(50);

-- Try to drop constraint if it exists. Postgres automatically names it tablename_column_check if not specified
ALTER TABLE public.assets DROP CONSTRAINT IF EXISTS assets_type_check;

ALTER TABLE public.assets ADD CONSTRAINT assets_type_check CHECK (type IN ('real_estate', 'cash', 'gold', 'stock', 'crypto', 'other'));
