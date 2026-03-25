import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function debug() {
  console.log('🧪 Debugging Auth Data...\n')

  // 1. Check Auth Users
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
  if (authError) {
    console.error('❌ Auth Error:', authError.message)
  } else {
    const admin = users.find(u => u.email === 'admin@kitnpos.co.ke')
    if (admin) {
      console.log('✅ Auth User Found:')
      console.log('   ID:', admin.id)
      console.log('   Email:', admin.email)
      console.log('   Confirmed:', !!admin.email_confirmed_at)
      console.log('   Role (Metadata):', admin.user_metadata?.role)
    } else {
      console.log('❌ Auth User NOT FOUND for admin@kitnpos.co.ke')
    }
  }

  // 2. Check User Profiles
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
  
  if (profileError) {
    console.error('❌ Profile Error:', profileError.message)
  } else {
    console.log('\n📋 User Profiles in Database:')
    profiles.forEach(p => {
      console.log(`   - ID: ${p.id}`)
      console.log(`     Full Name: ${p.full_name}`)
      console.log(`     Role: ${p.role}`)
      console.log(`     PIN Hash: "${p.pin_hash}"`)
      console.log(`     Supabase User ID Alias: ${p.supabase_user_id}`)
    })
  }
}

debug().catch(console.error)
