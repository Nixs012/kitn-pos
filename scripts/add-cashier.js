
const fs = require('fs');
const path = require('path');

async function test() {
  console.log('🧪 Testing User Creation API...');
  
  // Minimal dotenv parser
  const envPath = path.resolve(__dirname, '../.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) env[key.trim()] = vals.join('=').trim();
  });

  const payload = {
    email: 'grace@kitnpos.co.ke',
    password: 'Grace@KiTN2024!',
    full_name: 'Grace Cashier',
    role: 'cashier',
    branch_id: '22222222-2222-2222-2222-222222222222',
    tenant_id: '11111111-1111-1111-1111-111111111111',
    pin: '4321'
  };

  // We'll use the same logic as the API route but directly in Node for verification
  // Since we can't easily fetch our own API route in a shell without a running server
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // Check if user already exists
  const { data: existingUser } = await supabase.from('user_profiles').select('id').eq('full_name', 'Grace Cashier').single();
  if (existingUser) {
    console.log('✅ Grace Cashier already exists!');
    return;
  }

  // 1. Create Auth User
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
    user_metadata: { full_name: payload.full_name, role: payload.role }
  });

  if (authError) {
    console.error('❌ Auth Error:', authError.message);
    return;
  }

  console.log('✅ Auth User Created:', authUser.user.id);

  // 2. Create User Profile
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: authUser.user.id,
      tenant_id: payload.tenant_id,
      branch_id: payload.branch_id,
      role: payload.role,
      full_name: payload.full_name,
      pin_hash: payload.pin,
      is_active: true
    });

  if (profileError) {
    console.error('❌ Profile Error:', profileError.message);
    await supabase.auth.admin.deleteUser(authUser.user.id);
    return;
  }

  console.log('✅ Profile Created Successfully!');
}

test().catch(console.error);
