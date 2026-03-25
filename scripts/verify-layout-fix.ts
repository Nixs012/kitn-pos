import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function test() {
  console.log('🧪 Testing standard Supabase Client...')
  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey)
    console.log('✅ createClient() returned successfully')
    
    if (supabase && supabase.auth) {
      console.log('✅ supabase.auth is defined')
    } else {
      console.error('❌ supabase.auth is UNDEFINED')
    }
  } catch (err: any) {
    console.error('❌ Test Failed:', err.message)
  }
}

test()
