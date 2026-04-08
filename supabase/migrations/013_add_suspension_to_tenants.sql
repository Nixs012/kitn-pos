-- Migration: Add suspension columns to tenants
-- Description: Allows platform owners to suspend businesses and provide reasons.

ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS suspended boolean default false;

ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS suspended_reason text;

-- Optional: Update audit_log to track suspension actions specifically if needed, 
-- but we usually just log it as a standard update for now.
