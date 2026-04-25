-- Migration to add target_amount and target_date to assets

ALTER TABLE public.assets 
ADD COLUMN target_amount numeric DEFAULT NULL,
ADD COLUMN target_date date DEFAULT NULL;
