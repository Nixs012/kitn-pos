import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { pin, role } = await request.json()

    if (!pin || !role) {
      return NextResponse.json({ error: 'Missing PIN or role' }, { status: 400 })
    }

    // Use service role to verify PIN and create session
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Fetch user profile to verify PIN
    const { data: profile, error: profileError } = await adminClient
      .from('user_profiles')
      .select('id, role, pin_hash')
      .eq('pin_hash', pin)
      .eq('role', role.toLowerCase())
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Invalid PIN or role' }, { status: 404 })
    }

    // Verify PIN (In v1 we compare directly as per request, bcrypt to be added later)
    if (profile.pin_hash !== pin) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
    }

    // To sign the user in from the server, we'd typically use admin.generateLink or similar.
    // However, the simplest way to "log in" a user from a trusted server context 
    // and give them a session cookie is to use the admin API to get the user, 
    // but we can't easily "push" a session to the browser from here without a magic link.
    
    // In the server context, we use the account email
    const { data: { user }, error: userError } = await adminClient.auth.admin.getUserById(profile.id)
    
    if (userError || !user || !user.email) {
      return NextResponse.json({ error: 'Failed to retrieve user email' }, { status: 500 })
    }

    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
      options: {
        redirectTo: '/dashboard'
      }
    })

    if (linkError || !linkData) {
      return NextResponse.json({ error: 'Failed to generate login link' }, { status: 500 })
    }

    // Since we want a seamless redirect, we can return the properties for the client to handle
    // or set a session if we had the ability to set cookies here correctly for the browser client.
    // But generating a link and returning it (or using it) is what was asked.
    
    return NextResponse.json({ 
      success: true, 
      hashedToken: linkData.properties.hashed_token,
      emailRedirect: linkData.properties.email_otp // This might be used if we redirect to callback
    })

  } catch (error: unknown) {
    console.error('PIN Login Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
