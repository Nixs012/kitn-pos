import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const { key } = await req.json()

    if (!key) {
      return NextResponse.json({ error: 'Recovery key is required' }, { status: 400 })
    }

    console.log('Recovery verification request received');

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error('Missing Supabase environment variables:', { 
        url: !!supabaseUrl, 
        key: !!serviceKey 
      });
      return NextResponse.json({ error: 'System configuration missing' }, { status: 500 })
    }

    // Initialize Supabase with Service Role Key to bypass RLS
    const supabase = createClient(supabaseUrl, serviceKey)

    // Fetch the hash from the database
    console.log('Fetching recovery hash from database...');
    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'recovery_key_hash')
      .single()

    if (error) {
      console.error('Database error fetching recovery hash:', error.message, error.details);
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 })
    }

    if (!data) {
      console.error('Recovery key hash not found in system_config table');
      return NextResponse.json({ error: 'Recovery system not initialized in DB' }, { status: 404 })
    }

    // Hash the provided key (trimmed) and compare
    const trimmedKey = key.trim()
    const providedHash = crypto.createHash('sha256').update(trimmedKey).digest('hex')
    console.log('Comparing hashes...');

    if (providedHash === data.value) {
      console.log('Recovery verified successfully');
      
      const response = NextResponse.json({ 
        success: true, 
        message: 'System access granted. Recovery mode active.',
      })

      // Set a short-lived recovery cookie (15 mins)
      response.cookies.set('kitn_recovery_access', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 15, // 15 minutes
        path: '/'
      })

      return response
    } else {
      console.warn('Invalid recovery key attempt');
      return NextResponse.json({ error: 'Invalid recovery key' }, { status: 401 })
    }
  } catch (err) {
    console.error('Recovery verification error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
