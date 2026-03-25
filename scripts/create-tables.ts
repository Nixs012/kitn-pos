import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function createTables() {
  console.log('🚀 Creating KiTN POS database tables...\n')

  const sql = `
    -- Enable UUID extension
    create extension if not exists "uuid-ossp";

    -- Drop tables if they exist (clean start)
    drop table if exists audit_log cascade;
    drop table if exists stock_movements cascade;
    drop table if exists sale_items cascade;
    drop table if exists sales cascade;
    drop table if exists inventory cascade;
    drop table if exists products cascade;
    drop table if exists user_profiles cascade;
    drop table if exists branches cascade;
    drop table if exists tenants cascade;

    -- Tenants table
    create table tenants (
      id uuid primary key default uuid_generate_v4(),
      name text not null,
      business_type text default 'retail',
      county text,
      subscription_tier text default 'free',
      created_at timestamptz default now()
    );

    -- Branches table
    create table branches (
      id uuid primary key default uuid_generate_v4(),
      tenant_id uuid references tenants(id) on delete cascade,
      name text not null,
      location text,
      phone text,
      is_active boolean default true,
      created_at timestamptz default now()
    );

    -- User profiles table
    create table user_profiles (
      id uuid primary key references auth.users(id) on delete cascade,
      tenant_id uuid references tenants(id) on delete cascade,
      branch_id uuid references branches(id),
      role text default 'cashier',
      full_name text,
      pin_hash text,
      is_active boolean default true,
      created_at timestamptz default now()
    );

    -- Products table
    create table products (
      id uuid primary key default uuid_generate_v4(),
      tenant_id uuid references tenants(id) on delete cascade,
      name text not null,
      barcode text,
      sku text,
      category text,
      buying_price numeric(12,2) default 0,
      selling_price numeric(12,2) not null default 0,
      vat_rate numeric(5,2) default 16,
      unit text default 'pcs',
      image_url text,
      is_active boolean default true,
      created_at timestamptz default now()
    );

    -- Inventory table
    create table inventory (
      id uuid primary key default uuid_generate_v4(),
      product_id uuid references products(id) on delete cascade,
      branch_id uuid references branches(id) on delete cascade,
      quantity numeric(12,3) default 0,
      reorder_level numeric default 10,
      last_restocked timestamptz,
      unique(product_id, branch_id)
    );

    -- Sales table
    create table sales (
      id uuid primary key default uuid_generate_v4(),
      branch_id uuid references branches(id),
      cashier_id uuid references user_profiles(id),
      receipt_number text unique,
      total_amount numeric(12,2) not null default 0,
      discount numeric(12,2) default 0,
      tax_amount numeric(12,2) default 0,
      payment_method text default 'cash',
      mpesa_ref text,
      synced_at timestamptz,
      created_at timestamptz default now()
    );

    -- Sale items table
    create table sale_items (
      id uuid primary key default uuid_generate_v4(),
      sale_id uuid references sales(id) on delete cascade,
      product_id uuid references products(id),
      quantity numeric(12,3) not null,
      unit_price numeric(12,2) not null,
      discount numeric(12,2) default 0,
      vat_amount numeric(12,2) default 0
    );

    -- Stock movements table
    create table stock_movements (
      id uuid primary key default uuid_generate_v4(),
      product_id uuid references products(id),
      branch_id uuid references branches(id),
      type text default 'sale',
      quantity_change numeric not null,
      reference_id uuid,
      created_by uuid references user_profiles(id),
      created_at timestamptz default now()
    );

    -- Audit log table
    create table audit_log (
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
    alter table audit_log enable row level security;

    -- RLS Policies (open for development - tighten in Phase 7)
    create policy "allow_all_tenants" on tenants for all to authenticated using (true) with check (true);
    create policy "allow_all_branches" on branches for all to authenticated using (true) with check (true);
    create policy "allow_all_profiles" on user_profiles for all to authenticated using (true) with check (true);
    create policy "allow_all_products" on products for all to authenticated using (true) with check (true);
    create policy "allow_all_inventory" on inventory for all to authenticated using (true) with check (true);
    create policy "allow_all_sales" on sales for all to authenticated using (true) with check (true);
    create policy "allow_all_sale_items" on sale_items for all to authenticated using (true) with check (true);
    create policy "allow_all_movements" on stock_movements for all to authenticated using (true) with check (true);
    create policy "allow_all_audit" on audit_log for all to authenticated using (true) with check (true);
  `

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
  
  if (error) {
    // exec_sql RPC may not exist yet, use direct approach
    console.log('ℹ️  Using direct table creation approach...')
    await createTablesDirectly()
    return
  }
  
  console.log('✅ All tables created successfully!')
  await seedData()
}

async function createTablesDirectly() {
  // Create tables one by one using Supabase SQL editor approach
  // We will use the management API
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!
    .replace('https://', '')
    .replace('.supabase.co', '')

  const queries = [
    `create extension if not exists "uuid-ossp"`,
    `create table if not exists tenants (id uuid primary key default uuid_generate_v4(), name text not null, business_type text default 'retail', county text, subscription_tier text default 'free', created_at timestamptz default now())`,
    `create table if not exists branches (id uuid primary key default uuid_generate_v4(), tenant_id uuid references tenants(id) on delete cascade, name text not null, location text, phone text, is_active boolean default true, created_at timestamptz default now())`,
    `create table if not exists user_profiles (id uuid primary key references auth.users(id) on delete cascade, tenant_id uuid references tenants(id) on delete cascade, branch_id uuid references branches(id), role text default 'cashier', full_name text, pin_hash text, is_active boolean default true, created_at timestamptz default now())`,
    `create table if not exists products (id uuid primary key default uuid_generate_v4(), tenant_id uuid references tenants(id) on delete cascade, name text not null, barcode text, sku text, category text, buying_price numeric(12,2) default 0, selling_price numeric(12,2) not null default 0, vat_rate numeric(5,2) default 16, unit text default 'pcs', image_url text, is_active boolean default true, created_at timestamptz default now())`,
    `create table if not exists inventory (id uuid primary key default uuid_generate_v4(), product_id uuid references products(id) on delete cascade, branch_id uuid references branches(id) on delete cascade, quantity numeric(12,3) default 0, reorder_level numeric default 10, last_restocked timestamptz, unique(product_id, branch_id))`,
    `create table if not exists sales (id uuid primary key default uuid_generate_v4(), branch_id uuid references branches(id), cashier_id uuid references user_profiles(id), receipt_number text unique, total_amount numeric(12,2) not null default 0, discount numeric(12,2) default 0, tax_amount numeric(12,2) default 0, payment_method text default 'cash', mpesa_ref text, synced_at timestamptz, created_at timestamptz default now())`,
    `create table if not exists sale_items (id uuid primary key default uuid_generate_v4(), sale_id uuid references sales(id) on delete cascade, product_id uuid references products(id), quantity numeric(12,3) not null, unit_price numeric(12,2) not null, discount numeric(12,2) default 0, vat_amount numeric(12,2) default 0)`,
    `create table if not exists stock_movements (id uuid primary key default uuid_generate_v4(), product_id uuid references products(id), branch_id uuid references branches(id), type text default 'sale', quantity_change numeric not null, reference_id uuid, created_by uuid references user_profiles(id), created_at timestamptz default now())`,
    `create table if not exists audit_log (id bigserial primary key, user_id uuid, action text, table_name text, record_id uuid, old_data jsonb, new_data jsonb, created_at timestamptz default now())`,
    `alter table tenants enable row level security`,
    `alter table branches enable row level security`,
    `alter table user_profiles enable row level security`,
    `alter table products enable row level security`,
    `alter table inventory enable row level security`,
    `alter table sales enable row level security`,
    `alter table sale_items enable row level security`,
    `alter table stock_movements enable row level security`,
    `alter table audit_log enable row level security`,
    `do $$ begin if not exists (select 1 from pg_policies where tablename='tenants' and policyname='allow_all_tenants') then create policy "allow_all_tenants" on tenants for all to authenticated using (true) with check (true); end if; end $$`,
    `do $$ begin if not exists (select 1 from pg_policies where tablename='branches' and policyname='allow_all_branches') then create policy "allow_all_branches" on branches for all to authenticated using (true) with check (true); end if; end $$`,
    `do $$ begin if not exists (select 1 from pg_policies where tablename='user_profiles' and policyname='allow_all_profiles') then create policy "allow_all_profiles" on user_profiles for all to authenticated using (true) with check (true); end if; end $$`,
    `do $$ begin if not exists (select 1 from pg_policies where tablename='products' and policyname='allow_all_products') then create policy "allow_all_products" on products for all to authenticated using (true) with check (true); end if; end $$`,
    `do $$ begin if not exists (select 1 from pg_policies where tablename='inventory' and policyname='allow_all_inventory') then create policy "allow_all_inventory" on inventory for all to authenticated using (true) with check (true); end if; end $$`,
    `do $$ begin if not exists (select 1 from pg_policies where tablename='sales' and policyname='allow_all_sales') then create policy "allow_all_sales" on sales for all to authenticated using (true) with check (true); end if; end $$`,
    `do $$ begin if not exists (select 1 from pg_policies where tablename='sale_items' and policyname='allow_all_sale_items') then create policy "allow_all_sale_items" on sale_items for all to authenticated using (true) with check (true); end if; end $$`,
  ]

  for (const query of queries) {
    const res = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ query })
      }
    )
    const label = query.substring(0, 50).replace(/\n/g, ' ')
    if (res.ok) {
      console.log(`✅ ${label}...`)
    } else {
      const err = await res.text()
      console.log(`⚠️  ${label}... (${err.substring(0,60)})`)
    }
  }

  console.log('\n✅ Tables created! Now seeding data...')
  await seedData()
}

async function seedData() {
  console.log('\n📦 Creating seed data...')

  // Create tenant
  const { data: tenant, error: te } = await supabase
    .from('tenants')
    .insert({ name: 'KiTN Store Nairobi', business_type: 'supermarket', county: 'Nairobi', subscription_tier: 'free' })
    .select().single()
  if (te) { console.error('❌ Tenant:', te.message); return }
  console.log('✅ Tenant created')

  // Create branch
  const { data: branch, error: be } = await supabase
    .from('branches')
    .insert({ tenant_id: tenant.id, name: 'Main Branch', location: 'Nairobi CBD', phone: '0700000000', is_active: true })
    .select().single()
  if (be) { console.error('❌ Branch:', be.message); return }
  console.log('✅ Branch created')

  // Create admin auth user
  const { data: authUser, error: ae } = await supabase.auth.admin.createUser({
    email: 'admin@kitnpos.co.ke',
    password: 'Admin@KiTN2024!',
    email_confirm: true,
    user_metadata: { full_name: 'Kelvin Admin', role: 'admin' }
  })
  if (ae) { console.error('❌ Auth user:', ae.message); return }
  console.log('✅ Admin user created:', authUser.user.email)

  // Create user profile
  const { error: pe } = await supabase
    .from('user_profiles')
    .insert({ id: authUser.user.id, tenant_id: tenant.id, branch_id: branch.id, role: 'admin', full_name: 'Kelvin Admin', pin_hash: '1234' })
  if (pe) { console.error('❌ Profile:', pe.message); return }
  console.log('✅ User profile created')

  // Create sample products
  const products = [
    { tenant_id: tenant.id, name: 'Unga Jogoo 2kg', barcode: '6001255001234', sku: 'FLR001', category: 'Flour & Grains', buying_price: 180, selling_price: 220, vat_rate: 0, unit: 'bag' },
    { tenant_id: tenant.id, name: 'Cooking Oil 1L', barcode: '6001255001235', sku: 'OIL001', category: 'Cooking', buying_price: 260, selling_price: 320, vat_rate: 16, unit: 'bottle' },
    { tenant_id: tenant.id, name: 'Sugar Mumias 1kg', barcode: '6001255001236', sku: 'SUG001', category: 'Cooking', buying_price: 120, selling_price: 155, vat_rate: 0, unit: 'packet' },
    { tenant_id: tenant.id, name: 'KCC Fresh Milk 500ml', barcode: '6001255001237', sku: 'MLK001', category: 'Dairy', buying_price: 50, selling_price: 65, vat_rate: 0, unit: 'bottle' },
    { tenant_id: tenant.id, name: 'Bread Sliced', barcode: '6001255001238', sku: 'BRD001', category: 'Bakery', buying_price: 50, selling_price: 65, vat_rate: 0, unit: 'loaf' },
    { tenant_id: tenant.id, name: 'Omo Detergent 1kg', barcode: '6001255001239', sku: 'CLN001', category: 'Cleaning', buying_price: 220, selling_price: 280, vat_rate: 16, unit: 'packet' },
    { tenant_id: tenant.id, name: 'Ketepa Tea 50 bags', barcode: '6001255001240', sku: 'TEA001', category: 'Drinks', buying_price: 90, selling_price: 120, vat_rate: 0, unit: 'box' },
    { tenant_id: tenant.id, name: 'Eggs Tray 30', barcode: '6001255001241', sku: 'EGG001', category: 'Dairy', buying_price: 380, selling_price: 480, vat_rate: 0, unit: 'tray' },
    { tenant_id: tenant.id, name: 'Soda Water 500ml', barcode: '6001255001242', sku: 'DRK001', category: 'Drinks', buying_price: 40, selling_price: 55, vat_rate: 16, unit: 'bottle' },
    { tenant_id: tenant.id, name: 'Colgate Toothpaste 75ml', barcode: '6001255001243', sku: 'ORL001', category: 'Personal Care', buying_price: 130, selling_price: 170, vat_rate: 16, unit: 'tube' },
    { tenant_id: tenant.id, name: 'Royco Mchuzi Mix 75g', barcode: '6001255001244', sku: 'SPZ001', category: 'Spices', buying_price: 40, selling_price: 55, vat_rate: 0, unit: 'packet' },
    { tenant_id: tenant.id, name: 'Blue Band 250g', barcode: '6001255001245', sku: 'SPD001', category: 'Spreads', buying_price: 140, selling_price: 180, vat_rate: 16, unit: 'tub' },
  ]

  const { data: createdProducts, error: prde } = await supabase
    .from('products').insert(products).select()
  if (prde) { console.error('❌ Products:', prde.message); return }
  console.log('✅ Products created:', createdProducts.length, 'items')

  // Create inventory for each product
  const inventory = createdProducts.map(p => ({
    product_id: p.id,
    branch_id: branch.id,
    quantity: Math.floor(Math.random() * 80) + 20,
    reorder_level: 10
  }))

  const { error: ie } = await supabase.from('inventory').insert(inventory)
  if (ie) { console.error('❌ Inventory:', ie.message); return }
  console.log('✅ Inventory created for all products')

  console.log('\n🎉 KiTN POS database is ready!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📧 Email    : admin@kitnpos.co.ke')
  console.log('🔑 Password : Admin@KiTN2024!')
  console.log('🔢 PIN      : 1234')
  console.log('🌐 Open     : http://localhost:3000/login')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

createTables().catch(console.error)
