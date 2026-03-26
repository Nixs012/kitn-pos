-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  id_number text,
  notes text,
  created_at timestamptz default now()
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  company_name text not null,
  contact_person text,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "allow_all_customers" ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_suppliers" ON suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);
