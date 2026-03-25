
const fs = require('fs');
const path = require('path');

async function run() {
  console.log('🚀 Running Node.js Migration...');
  
  // Minimal dotenv parser to avoid dependency issues
  const envPath = path.resolve(__dirname, '../.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) env[key.trim()] = vals.join('=').trim();
  });

  const projectRef = 'sfeizccfhwszyvwpqrmm';
  const sql = `ALTER TABLE tenants 
    ADD COLUMN IF NOT EXISTS phone text,
    ADD COLUMN IF NOT EXISTS email text,
    ADD COLUMN IF NOT EXISTS address text,
    ADD COLUMN IF NOT EXISTS logo_url text,
    ADD COLUMN IF NOT EXISTS receipt_footer text,
    ADD COLUMN IF NOT EXISTS vat_number text;`;

  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ query: sql })
  });

  const result = await response.text();
  console.log('Result:', result);
}

run().catch(console.error);
