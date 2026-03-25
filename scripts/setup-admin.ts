import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setup() {
  console.log('🚀 Setting up KiTN POS...')

  // Step 1: Create tenant
  console.log('📦 Creating tenant...')
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name: 'KiTN Store Nairobi',
      business_type: 'supermarket',
      county: 'Nairobi',
      subscription_tier: 'free'
    })
    .select()
    .single()

  if (tenantError) {
    console.error('❌ Tenant error:', tenantError.message)
    process.exit(1)
  }
  console.log('✅ Tenant created:', tenant.id)

  // Step 2: Create branch
  console.log('🏪 Creating branch...')
  const { data: branch, error: branchError } = await supabase
    .from('branches')
    .insert({
      tenant_id: tenant.id,
      name: 'Main Branch',
      location: 'Nairobi CBD',
      phone: '0700000000',
      is_active: true
    })
    .select()
    .single()

  if (branchError) {
    console.error('❌ Branch error:', branchError.message)
    process.exit(1)
  }
  console.log('✅ Branch created:', branch.id)

  // Step 3: Create admin user in Supabase Auth
  console.log('👤 Creating admin user...')
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: 'admin@kitnpos.co.ke',
    password: 'Admin@KiTN2024!',
    email_confirm: true,
    user_metadata: {
      full_name: 'Kelvin Admin',
      role: 'admin',
      tenant_id: tenant.id
    }
  })

  if (authError) {
    console.error('❌ Auth user error:', authError.message)
    process.exit(1)
  }
  console.log('✅ Auth user created:', authUser.user.id)

  // Step 4: Create user profile
  console.log('📋 Creating user profile...')
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: authUser.user.id,
      tenant_id: tenant.id,
      branch_id: branch.id,
      role: 'admin',
      full_name: 'Kelvin Admin',
      pin_hash: '1234'
    })

  if (profileError) {
    console.error('❌ Profile error:', profileError.message)
    process.exit(1)
  }
  console.log('✅ User profile created')

  // Step 5: Create sample products
  console.log('🛒 Creating sample products...')
  const products = [
    { tenant_id: tenant.id, name: 'Unga Jogoo 2kg', barcode: '6001255001234', sku: 'FLR001', category: 'Flour & Grains', buying_price: 180, selling_price: 220, vat_rate: 16, unit: 'bag', is_active: true },
    { tenant_id: tenant.id, name: 'Cooking Oil 1L', barcode: '6001255001235', sku: 'OIL001', category: 'Cooking', buying_price: 260, selling_price: 320, vat_rate: 16, unit: 'bottle', is_active: true },
    { tenant_id: tenant.id, name: 'Sugar Mumias 1kg', barcode: '6001255001236', sku: 'SUG001', category: 'Cooking', buying_price: 120, selling_price: 155, vat_rate: 16, unit: 'packet', is_active: true },
    { tenant_id: tenant.id, name: 'KCC Fresh Milk 500ml', barcode: '6001255001237', sku: 'MLK001', category: 'Dairy', buying_price: 50, selling_price: 65, vat_rate: 0, unit: 'bottle', is_active: true },
    { tenant_id: tenant.id, name: 'Bread Sliced', barcode: '6001255001238', sku: 'BRD001', category: 'Bakery', buying_price: 50, selling_price: 65, vat_rate: 0, unit: 'loaf', is_active: true },
    { tenant_id: tenant.id, name: 'Omo Detergent 1kg', barcode: '6001255001239', sku: 'CLN001', category: 'Cleaning', buying_price: 220, selling_price: 280, vat_rate: 16, unit: 'packet', is_active: true },
    { tenant_id: tenant.id, name: 'Ketepa Tea 50 bags', barcode: '6001255001240', sku: 'TEA001', category: 'Drinks', buying_price: 90, selling_price: 120, vat_rate: 0, unit: 'box', is_active: true },
    { tenant_id: tenant.id, name: 'Eggs Tray 30', barcode: '6001255001241', sku: 'EGG001', category: 'Dairy', buying_price: 380, selling_price: 480, vat_rate: 0, unit: 'tray', is_active: true },
    { tenant_id: tenant.id, name: 'Soda Water 500ml', barcode: '6001255001242', sku: 'DRK001', category: 'Drinks', buying_price: 40, selling_price: 55, vat_rate: 16, unit: 'bottle', is_active: true },
    { tenant_id: tenant.id, name: 'Colgate Toothpaste 75ml', barcode: '6001255001243', sku: 'ORL001', category: 'Personal Care', buying_price: 130, selling_price: 170, vat_rate: 16, unit: 'tube', is_active: true },
  ]

  const { error: productsError } = await supabase
    .from('products')
    .insert(products)

  if (productsError) {
    console.error('❌ Products error:', productsError.message)
    process.exit(1)
  }
  console.log('✅ Sample products created:', products.length, 'products')

  // Step 6: Create inventory for each product
  console.log('📊 Creating inventory...')
  const { data: createdProducts } = await supabase
    .from('products')
    .select('id')
    .eq('tenant_id', tenant.id)

  if (createdProducts) {
    const inventory = createdProducts.map(p => ({
      product_id: p.id,
      branch_id: branch.id,
      quantity: Math.floor(Math.random() * 80) + 20,
      reorder_level: 10
    }))

    const { error: inventoryError } = await supabase
      .from('inventory')
      .insert(inventory)

    if (inventoryError) {
      console.error('❌ Inventory error:', inventoryError.message)
    } else {
      console.log('✅ Inventory created for all products')
    }
  }

  console.log('\n🎉 KiTN POS setup complete!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📧 Email:    admin@kitnpos.co.ke')
  console.log('🔑 Password: Admin@KiTN2024!')
  console.log('🔢 PIN:      1234')
  console.log('🏪 Branch:   Main Branch — Nairobi CBD')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Go to http://localhost:3000/login and sign in!')
}

setup().catch(console.error)
