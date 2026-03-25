import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const TENANT_ID = '11111111-1111-1111-1111-111111111111'
const BRANCH_ID = '22222222-2222-2222-2222-222222222222'

async function createAdmin() {
  console.log('👤 Initializing admin user...')

  // Step 1: Ensure tenant exists with specific ID
  const { data: tenant } = await supabase.from('tenants').select('id').eq('id', TENANT_ID).single()
  if (!tenant) {
    console.log('📦 Creating missing tenant...')
    await supabase.from('tenants').insert({ id: TENANT_ID, name: 'KiTN Store Nairobi', business_type: 'supermarket' })
  }

  // Step 2: Ensure branch exists
  const { data: branch } = await supabase.from('branches').select('id').eq('id', BRANCH_ID).single()
  if (!branch) {
    console.log('🏛️ Creating missing branch...')
    await supabase.from('branches').insert({ id: BRANCH_ID, tenant_id: TENANT_ID, name: 'Main Branch', location: 'Nairobi CBD' })
  }

  // Step 3: Find or Create Auth User
  const { data: { users } } = await supabase.auth.admin.listUsers()
  let authUser = users.find(u => u.email === 'admin@kitnpos.co.ke')

  if (!authUser) {
    console.log('🔑 Creating new auth user...')
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@kitnpos.co.ke',
      password: 'Admin@KiTN2024!',
      email_confirm: true,
      user_metadata: { full_name: 'Kelvin Admin', role: 'admin' }
    })
    if (error) {
      console.error('❌ Auth Error:', error.message)
      return
    }
    authUser = data.user
  } else {
    console.log('✅ Auth user already exists, updating password...')
    await supabase.auth.admin.updateUserById(authUser.id, { password: 'Admin@KiTN2024!' })
  }

  // Step 4: Upsert User Profile
  const { error: pe } = await supabase
    .from('user_profiles')
    .upsert({
      id: authUser.id,
      tenant_id: TENANT_ID,
      branch_id: BRANCH_ID,
      role: 'admin',
      full_name: 'Kelvin Admin',
      pin_hash: '1234'
    })

  if (pe) {
    console.error('❌ Profile error:', pe.message)
    return
  }

  console.log('✅ User profile created/updated')
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Email    : admin@kitnpos.co.ke')
  console.log('Password : Admin@KiTN2024!')
  console.log('PIN      : 1234')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Now go to http://localhost:3000/login')
}

createAdmin().catch(console.error)
