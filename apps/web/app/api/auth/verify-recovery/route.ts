import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const { key } = await req.json()

    if (!key) {
      return NextResponse.json({ error: 'Recovery key is required' }, { status: 400 })
    }

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ error: 'System configuration missing' }, { status: 500 })
    }

    // Initialize Supabase with Service Role Key to bypass RLS
    const supabase = createClient(supabaseUrl, serviceKey)

    // Fetch the hash from the database
    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'recovery_key_hash')
      .single()

    if (error || !data) {
      console.error('Database error fetching recovery hash:', error)
      return NextResponse.json({ error: 'System configuration error' }, { status: 500 })
    }

    // Hash the provided key and compare
    const providedHash = crypto.createHash('sha256').update(key).digest('hex')

    if (providedHash === data.value) {
      return NextResponse.json({ 
        success: true, 
        message: 'System access granted. Recovery mode active.',
        // In a real scenario, you might return a special token here
      })
    } else {
      return NextResponse.json({ error: 'Invalid recovery key' }, { status: 401 })
    }
  } catch (err) {
    console.error('Recovery verification error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
