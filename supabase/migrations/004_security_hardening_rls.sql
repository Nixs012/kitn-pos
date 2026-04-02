
-- Helper function to get current user's tenant_id efficiently
-- This avoids repeating subqueries in every RLS policy
CREATE OR REPLACE FUNCTION auth.get_tenant_id()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid();
$$;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION auth.get_role()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$;

-- 1. CLEANUP: Drop development policies
DROP POLICY IF EXISTS "Allow all for public" ON tenants;
DROP POLICY IF EXISTS "Allow all for public" ON branches;
DROP POLICY IF EXISTS "Allow all for public" ON user_profiles;
DROP POLICY IF EXISTS "Allow all for public" ON products;
DROP POLICY IF EXISTS "Allow all for public" ON inventory;
DROP POLICY IF EXISTS "Allow all for public" ON sales;
DROP POLICY IF EXISTS "Allow all for public" ON sale_items;
DROP POLICY IF EXISTS "Allow all for public" ON stock_movements;
DROP POLICY IF EXISTS "allow_all_customers" ON customers;
DROP POLICY IF EXISTS "allow_all_suppliers" ON suppliers;

-- 2. TENANTS
CREATE POLICY "Users can view their own tenant"
  ON tenants FOR SELECT
  USING (id = auth.get_tenant_id());

CREATE POLICY "Admins can update their tenant"
  ON tenants FOR UPDATE
  USING (id = auth.get_tenant_id() AND auth.get_role() = 'admin');

-- 3. BRANCHES
CREATE POLICY "Tenant branch access"
  ON branches FOR ALL
  USING (tenant_id = auth.get_tenant_id());

-- 4. USER PROFILES
CREATE POLICY "Tenant profile access"
  ON user_profiles FOR SELECT
  USING (tenant_id = auth.get_tenant_id());

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins can manage tenant profiles"
  ON user_profiles FOR ALL
  USING (tenant_id = auth.get_tenant_id() AND auth.get_role() = 'admin');

-- 5. PRODUCTS
CREATE POLICY "Tenant product access"
  ON products FOR SELECT
  USING (tenant_id = auth.get_tenant_id());

CREATE POLICY "Managers/Admins can manage products"
  ON products FOR ALL
  USING (tenant_id = auth.get_tenant_id() AND auth.get_role() IN ('admin', 'manager'));

-- 6. INVENTORY
CREATE POLICY "Tenant inventory access"
  ON inventory FOR SELECT
  USING (product_id IN (SELECT id FROM products WHERE tenant_id = auth.get_tenant_id()));

CREATE POLICY "Managers/Admins can update inventory"
  ON inventory FOR ALL
  USING (product_id IN (SELECT id FROM products WHERE tenant_id = auth.get_tenant_id()) 
         AND auth.get_role() IN ('admin', 'manager'));

-- 7. SALES & SALE ITEMS
CREATE POLICY "Tenant sales access"
  ON sales FOR ALL
  USING (branch_id IN (SELECT id FROM branches WHERE tenant_id = auth.get_tenant_id()));

CREATE POLICY "Tenant sale items access"
  ON sale_items FOR ALL
  USING (sale_id IN (SELECT id FROM sales WHERE branch_id IN (SELECT id FROM branches WHERE tenant_id = auth.get_tenant_id())));

-- 8. CUSTOMERS & SUPPLIERS
CREATE POLICY "Tenant customer access"
  ON customers FOR ALL
  USING (tenant_id = auth.get_tenant_id());

CREATE POLICY "Tenant supplier access"
  ON suppliers FOR ALL
  USING (tenant_id = auth.get_tenant_id());

-- 9. STOCK MOVEMENTS
CREATE POLICY "Tenant stock movement access"
  ON stock_movements FOR ALL
  USING (product_id IN (SELECT id FROM products WHERE tenant_id = auth.get_tenant_id()));

-- 10. AUDIT LOG
CREATE POLICY "Admins can view audit logs"
  ON audit_log FOR SELECT
  USING (auth.get_role() = 'admin');
