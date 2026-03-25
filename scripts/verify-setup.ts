import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verify() {
  console.log('🔍 Verifying KiTN POS setup...\n')
  
  const checks = [
    { name: 'Tenants table', query: () => supabase.from('tenants').select('*', { count: 'exact', head: true }) },
    { name: 'Branches table', query: () => supabase.from('branches').select('*', { count: 'exact', head: true }) },
    { name: 'User profiles table', query: () => supabase.from('user_profiles').select('*', { count: 'exact', head: true }) },
    { name: 'Products table', query: () => supabase.from('products').select('*', { count: 'exact', head: true }) },
    { name: 'Inventory table', query: () => supabase.from('inventory').select('*', { count: 'exact', head: true }) },
  ]

  for (const check of checks) {
    const { error } = await check.query()
    if (error) {
      console.log(`❌ ${check.name}: ${error.message}`)
    } else {
      console.log(`✅ ${check.name}: OK`)
    }
  }

  // Check admin user exists
  const { data: users } = await supabase.auth.admin.listUsers()
  const admin = users?.users?.find(u => u.email === 'admin@kitnpos.co.ke')
  if (admin) {
    console.log('✅ Admin user: found —', admin.email)
  } else {
    console.log('❌ Admin user: NOT found — run npm run setup again')
  }

  // Check products loaded
  const { data: products } = await supabase.from('products').select('name')
  console.log(`✅ Products loaded: ${products?.length ?? 0} products`)

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('If all show ✅ — go to http://localhost:3000/login')
  console.log('Email:    admin@kitnpos.co.ke')
  console.log('Password: Admin@KiTN2024!')
  console.log('PIN:      1234')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

verify().catch(console.error)
