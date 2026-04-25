-- Add asset_id to transactions
ALTER TABLE public.transactions ADD COLUMN asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL;

-- Relax constraint on assets type to allow 'saving'
ALTER TABLE public.assets DROP CONSTRAINT IF EXISTS assets_type_check;

ALTER TABLE public.assets ADD CONSTRAINT assets_type_check 
CHECK (type IN ('real_estate', 'cash', 'gold', 'stock', 'crypto', 'saving', 'other'));
