
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const body = await req.json();
    const { userId, full_name, role, branch_id, phone, is_active, pin_hash } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 1. Prepare Update Object
    const updateData: {
      full_name?: string;
      role?: string;
      branch_id?: string;
      phone?: string;
      is_active?: boolean;
      pin_hash?: string;
    } = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (role !== undefined) updateData.role = role;
    if (branch_id !== undefined) updateData.branch_id = branch_id;
    if (phone !== undefined) updateData.phone = phone;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (pin_hash !== undefined) updateData.pin_hash = pin_hash;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // 2. Update User Profile
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Update Profile Error:', error.message);
      return NextResponse.json({ error: `Update Profile Error: ${error.message}` }, { status: 400 });
    }

    // 3. If role/name changed, also update auth metadata (optional but recommended)
    if (full_name || role) {
        await supabase.auth.admin.updateUserById(userId, {
            user_metadata: { 
                ...(full_name && { full_name }),
                ...(role && { role })
            }
        });
    }

    return NextResponse.json({ success: true, user: data });

  } catch (error: unknown) {
    console.error('User update error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
