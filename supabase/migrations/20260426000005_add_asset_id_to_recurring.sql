-- Add asset_id to recurring_transactions table
ALTER TABLE recurring_transactions 
ADD COLUMN asset_id UUID REFERENCES assets(id) ON DELETE SET NULL;
