import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function reset() {
  console.log('🔄 Resetting Admin Password...')

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  const admin = users?.find(u => u.email === 'admin@kitnpos.co.ke')

  if (!admin) {
    console.error('❌ Admin user not found')
    return
  }

  const { data, error } = await supabase.auth.admin.updateUserById(
    admin.id,
    { password: 'Admin@KiTN2024!' }
  )

  if (error) {
    console.error('❌ Reset Error:', error.message)
  } else {
    console.log('✅ Admin password reset to: Admin@KiTN2024!')
  }
}

reset().catch(console.error)
