-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Tenants
create table if not exists tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  business_type text check (business_type in ('supermarket','grocery','wholesale','retail','shop')) default 'retail',
  county text,
  subscription_tier text check (subscription_tier in ('free','basic','pro')) default 'free',
  created_at timestamptz default now()
);

-- Branches
create table if not exists branches (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  name text not null,
  location text,
  phone text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- User profiles (extends Supabase auth.users)
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references tenants(id) on delete cascade,
  branch_id uuid references branches(id),
  role text check (role in ('admin','manager','cashier','viewer')) default 'cashier',
  full_name text,
  pin_hash text,
  supabase_user_id uuid generated always as (id) stored,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Products
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  name text not null,
  barcode text,
  sku text,
  category text,
  buying_price numeric(12,2) default 0,
  selling_price numeric(12,2) not null,
  vat_rate numeric(5,2) default 16,
  unit text default 'pcs',
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Inventory
create table if not exists inventory (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  branch_id uuid references branches(id) on delete cascade,
  quantity numeric(12,3) default 0,
  reorder_level numeric default 10,
  last_restocked timestamptz,
  unique(product_id, branch_id)
);

-- Sales
create table if not exists sales (
  id uuid primary key default uuid_generate_v4(),
  branch_id uuid references branches(id),
  cashier_id uuid references user_profiles(id),
  receipt_number text unique,
  total_amount numeric(12,2) not null,
  discount numeric(12,2) default 0,
  tax_amount numeric(12,2) default 0,
  payment_method text check (payment_method in ('mpesa','cash','card','split')) default 'cash',
  mpesa_ref text,
  synced_at timestamptz,
  created_at timestamptz default now()
);

-- Sale items
create table if not exists sale_items (
  id uuid primary key default uuid_generate_v4(),
  sale_id uuid references sales(id) on delete cascade,
  product_id uuid references products(id),
  quantity numeric(12,3) not null,
  unit_price numeric(12,2) not null,
  discount numeric(12,2) default 0,
  vat_amount numeric(12,2) default 0
);

-- Stock movements
create table if not exists stock_movements (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id),
  branch_id uuid references branches(id),
  type text check (type in ('sale','restock','adjustment','return')),
  quantity_change numeric not null,
  reference_id uuid,
  created_by uuid references user_profiles(id),
  created_at timestamptz default now()
);

-- Audit log
create table if not exists audit_log (
  id bigserial primary key,
  user_id uuid,
  action text,
  table_name text,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz default now()
);

-- Enable Row Level Security on all tables
alter table tenants enable row level security;
alter table branches enable row level security;
alter table user_profiles enable row level security;
alter table products enable row level security;
alter table inventory enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table stock_movements enable row level security;

-- RLS Policies: service_role bypasses all (for our scripts)
-- Allow all for now during development (tighten in Phase 7)
create policy "Allow all for public" on tenants for all to public using (true);
create policy "Allow all for public" on branches for all to public using (true);
create policy "Allow all for public" on user_profiles for all to public using (true);
create policy "Allow all for public" on products for all to public using (true);
create policy "Allow all for public" on inventory for all to public using (true);
create policy "Allow all for public" on sales for all to public using (true);
create policy "Allow all for public" on sale_items for all to public using (true);
create policy "Allow all for public" on stock_movements for all to public using (true);
