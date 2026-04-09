
-- Migration: 015_add_expenses_and_tighten_security.sql
-- Description: Creates expenses table and implements tight RLS policies for tenant isolation and RBAC.

-- 1. Create Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('Inventory', 'Rent', 'Utilities', 'Wages', 'Transport', 'Marketing', 'Maintenance', 'Software', 'Taxes', 'Other')),
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 2. Security Functions
-- Helper to get the current user's tenant_id and role efficiently
CREATE OR REPLACE FUNCTION public.get_auth_profile()
RETURNS TABLE (tenant_id UUID, role TEXT, branch_id UUID) AS $$
    SELECT tenant_id, role, branch_id 
    FROM public.user_profiles 
    WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. Revoke Legacy "Allow all" policies
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND policyname = 'Allow all for public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.' || r.tablename;
    END LOOP;
END $$;

-- 4. Specific RLS Policies Based on Permission Matrix

-- A. SALES
CREATE POLICY "Sales: Tenant Isolation" ON public.sales
FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM public.get_auth_profile()) AND
    (SELECT role FROM public.get_auth_profile()) IN ('admin', 'manager', 'viewer', 'cashier') -- Cashier needs select for their own receipts/POS history
);

-- But restrict analytical view if needed? For now, we follow the table:
-- View Reports: Admin, Manager, Viewer (NOT Cashier).
-- This means Cashier shouldn't see ALL sales.
DROP POLICY IF EXISTS "Sales: Tenant Isolation" ON public.sales;

CREATE POLICY "Sales: Role-Based Select" ON public.sales
FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM public.get_auth_profile()) AND
    (
        (SELECT role FROM public.get_auth_profile()) IN ('admin', 'manager', 'viewer') OR
        ((SELECT role FROM public.get_auth_profile()) = 'cashier' AND cashier_id = auth.uid()) -- Cashier sees only their own
    )
);

CREATE POLICY "Sales: Role-Based Insert" ON public.sales
FOR INSERT WITH CHECK (
    tenant_id = (SELECT tenant_id FROM public.get_auth_profile()) AND
    (SELECT role FROM public.get_auth_profile()) IN ('admin', 'manager', 'cashier')
);

-- B. PRODUCTS
CREATE POLICY "Products: Role-Based Select" ON public.products
FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM public.get_auth_profile()) AND
    (SELECT role FROM public.get_auth_profile()) IN ('admin', 'manager', 'cashier', 'viewer')
);

CREATE POLICY "Products: Management Access" ON public.products
FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM public.get_auth_profile()) AND
    (SELECT role FROM public.get_auth_profile()) IN ('admin', 'manager')
);

-- C. FINANCE / EXPENSES
CREATE POLICY "Expenses: Manager/Admin Access" ON public.expenses
FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM public.get_auth_profile()) AND
    (SELECT role FROM public.get_auth_profile()) IN ('admin', 'manager')
);

-- D. TENANTS / BRANCHES (Admin Only Settings)
CREATE POLICY "Tenants: Admin Access" ON public.tenants
FOR ALL USING (
    id = (SELECT tenant_id FROM public.get_auth_profile()) AND
    (SELECT role FROM public.get_auth_profile()) = 'admin'
);

-- E. USER PROFILES (Admin Only Management)
CREATE POLICY "Profiles: Admin CRUD" ON public.user_profiles
FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM public.get_auth_profile()) AND
    (SELECT role FROM public.get_auth_profile()) = 'admin'
);

-- 5. Helper Triggers (Optional but good for data integrity)
-- Auto-set tenant_id on expenses if not provided
CREATE OR REPLACE FUNCTION public.set_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tenant_id IS NULL THEN
        NEW.tenant_id := (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_set_tenant_id_expenses
BEFORE INSERT ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();
