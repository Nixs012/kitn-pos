
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
    const { email, password, full_name, role, branch_id, tenant_id, pin } = body;

    if (!email || !password || !full_name || !tenant_id || !pin) {
      return NextResponse.json({ error: 'Missing required fields (Email, Password, Name, Tenant, PIN)' }, { status: 400 });
    }

    // 1. Create Auth User
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role }
    });

    if (authError) {
      console.error('Auth Error:', authError.message);
      return NextResponse.json({ error: `Auth Error: ${authError.message}` }, { status: 400 });
    }

    // 2. Create User Profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authUser.user.id,
        tenant_id,
        branch_id,
        role,
        full_name,
        pin_hash: pin, // In production, bcrypt this
        is_active: true
      });

    if (profileError) {
      console.error('Profile Error:', profileError.message);
      // Cleanup auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json({ error: `Profile Error: ${profileError.message}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: authUser.user });

  } catch (error: unknown) {
    console.error('User creation error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
