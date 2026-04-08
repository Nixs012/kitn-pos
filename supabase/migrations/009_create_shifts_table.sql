-- Create shifts table for staff performance and shift tracking
CREATE TABLE IF NOT EXISTS shifts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references user_profiles(id) on delete cascade,
  branch_id uuid references branches(id),
  tenant_id uuid references tenants(id),
  clock_in timestamptz default now(),
  clock_out timestamptz,
  notes text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to manage shifts (as per requirement)
-- Note: In production, consider restricting this based on role and tenant_id
CREATE POLICY "allow_all_shifts" ON shifts 
FOR ALL TO authenticated USING (true) WITH CHECK (true);
