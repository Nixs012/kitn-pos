
-- KiTN POS Settings Schema Enhancement
-- Run this in your Supabase SQL Editor to enable all store settings fields

ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS receipt_footer text,
ADD COLUMN IF NOT EXISTS vat_number text;

-- Add comment for clarity
COMMENT ON COLUMN public.tenants.receipt_footer IS 'Text shown at the bottom of every receipt';
