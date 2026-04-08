-- Migration: Create Subscriptions Table
-- Description: Handles tenant subscription status, plans, and payment history logic.

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade unique,
  plan text default 'free' check (plan in ('free', 'basic', 'pro')),
  status text default 'trial' check (status in ('trial', 'active', 'expired')),
  trial_ends_at timestamptz default (now() + interval '14 days'),
  current_period_end timestamptz default (now() + interval '30 days'),
  mpesa_phone text,
  last_payment_amount numeric(12,2),
  last_payment_date timestamptz,
  last_payment_ref text,
  created_at timestamptz default now()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create Policies
DROP POLICY IF EXISTS "allow_subscriptions" ON subscriptions;
CREATE POLICY "allow_subscriptions" ON subscriptions 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert initial trial for the default tenant if it doesn't exist
INSERT INTO subscriptions (tenant_id, plan, status)
VALUES ('11111111-1111-1111-1111-111111111111', 'free', 'trial')
ON CONFLICT (tenant_id) DO NOTHING;
