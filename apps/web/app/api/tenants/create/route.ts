
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const body = await req.json();
    const { 
      name, 
      business_type, 
      county, 
      admin_email, 
      admin_password, 
      admin_name,
      plan = 'free'
    } = body;

    if (!name || !admin_email || !admin_password || !admin_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create Tenant
    const { data: tenant, error: tError } = await supabase
      .from('tenants')
      .insert({
        name,
        business_type,
        county,
        subscription_tier: plan.toUpperCase()
      })
      .select()
      .single();

    if (tError) throw tError;

    // 2. Create Default Branch
    const { data: branch, error: bError } = await supabase
      .from('branches')
      .insert({
        tenant_id: tenant.id,
        name: 'Main Branch',
        location: county,
        is_active: true
      })
      .select()
      .single();

    if (bError) throw bError;

    // 3. Create Subscription
    const { error: sError } = await supabase
      .from('subscriptions')
      .insert({
        tenant_id: tenant.id,
        plan,
        status: 'trial'
      });

    if (sError) throw sError;

    // 4. Create Admin Auth User
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: admin_email,
      password: admin_password,
      email_confirm: true,
      user_metadata: { full_name: admin_name, role: 'admin' }
    });

    if (authError) throw authError;

    // 5. Create Admin Profile
    const { error: pError } = await supabase
      .from('user_profiles')
      .insert({
        id: authUser.user.id,
        tenant_id: tenant.id,
        branch_id: branch.id,
        role: 'admin',
        full_name: admin_name,
        email: admin_email,
        is_active: true,
        pin_hash: '1234' // Default PIN
      });

    if (pError) throw pError;

    return NextResponse.json({ success: true, tenantId: tenant.id });

  } catch (error: unknown) {
    console.error('Tenant registration error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
