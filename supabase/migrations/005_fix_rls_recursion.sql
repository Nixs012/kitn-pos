
-- Fix circular dependency in user_profiles RLS
-- Users must be able to view their own profile row to determine their tenant_id
-- We bypass the get_tenant_id() helper for the initial profile fetch

DROP POLICY IF EXISTS "Tenant profile access" ON public.user_profiles;

-- Allow users to see their own profile row (required for get_tenant_id to work)
CREATE POLICY "Users can always view own profile"
ON public.user_profiles FOR SELECT
USING (auth.uid() = id);

-- Allow users to see other profiles in their tenant (requires a non-recursive check)
-- We use a direct subquery that doesn't trigger the same policy recursively
CREATE POLICY "Users can view profiles in their tenant"
ON public.user_profiles FOR SELECT
USING (
  tenant_id = (
    SELECT p.tenant_id 
    FROM public.user_profiles p 
    WHERE p.id = auth.uid()
    LIMIT 1
  )
);
