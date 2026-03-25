# Get the directory of the script and load .env.local
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$envPath = Join-Path $scriptDir "..\.env.local"

if (Test-Path $envPath) {
    $envContent = Get-Content $envPath
    foreach ($line in $envContent) {
        if ($line -match "^\s*([^#\s][^=]*)=(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Content -Path "env:$name" -Value $value
        }
    }
}

$URL = $env:NEXT_PUBLIC_SUPABASE_URL
$KEY = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $URL -or -not $KEY) {
    Write-Error "❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
    exit 1
}

$headers = @{
    "apikey" = $KEY
    "Authorization" = "Bearer $KEY"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

Write-Host "🚀 Setting up KiTN POS via PowerShell..."

# Step 1: Create tenant
Write-Host "📦 Creating tenant..."
$tenantBody = @{
    name = "KiTN Store Nairobi"
    business_type = "supermarket"
    county = "Nairobi"
    subscription_tier = "free"
} | ConvertTo-Json
$tenant = Invoke-RestMethod -Uri "$URL/rest/v1/tenants" -Method Post -Headers $headers -Body $tenantBody
$tenantId = $tenant.id
Write-Host "✅ Tenant created: $tenantId"

# Step 2: Create branch
Write-Host "🏪 Creating branch..."
$branchBody = @{
    tenant_id = $tenantId
    name = "Main Branch"
    location = "Nairobi CBD"
    phone = "0700000000"
    is_active = $true
} | ConvertTo-Json
$branch = Invoke-RestMethod -Uri "$URL/rest/v1/branches" -Method Post -Headers $headers -Body $branchBody
$branchId = $branch.id
Write-Host "✅ Branch created: $branchId"

# Step 3: Create admin user in Supabase Auth
Write-Host "👤 Creating admin user in Auth..."
$authHeaders = @{
    "apikey" = $KEY
    "Authorization" = "Bearer $KEY"
    "Content-Type" = "application/json"
}
$authBody = @{
    email = "admin@kitnpos.co.ke"
    password = "Admin@KiTN2024!"
    email_confirm = $true
    user_metadata = @{
        full_name = "Kelvin Admin"
        role = "admin"
        tenant_id = $tenantId
    }
} | ConvertTo-Json
try {
    $authUser = Invoke-RestMethod -Uri "$URL/auth/v1/admin/users" -Method Post -Headers $authHeaders -Body $authBody
    $authUserId = $authUser.id
    Write-Host "✅ Auth user created: $authUserId"
} catch {
    Write-Host "⚠️ Auth user might already exist. Proceeding..."
    # Try to find user by email to get ID
    $users = Invoke-RestMethod -Uri "$URL/auth/v1/admin/users" -Method Get -Headers $authHeaders
    $user = $users.users | Where-Object { $_.email -eq "admin@kitnpos.co.ke" }
    $authUserId = $user.id
}

# Step 4: Create user profile
Write-Host "📋 Creating user profile..."
$profileBody = @{
    id = $authUserId
    tenant_id = $tenantId
    branch_id = $branchId
    role = "admin"
    full_name = "Kelvin Admin"
    pin_hash = "1234"
} | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "$URL/rest/v1/user_profiles" -Method Post -Headers $headers -Body $profileBody
    Write-Host "✅ User profile created"
} catch {
    Write-Host "⚠️ User profile might already exist."
}

# Step 5: Create sample products
Write-Host "🛒 Creating sample products..."
$products = @(
    @{ tenant_id = $tenantId; name = 'Unga Jogoo 2kg'; barcode = '6001255001234'; sku = 'FLR001'; category = 'Flour & Grains'; buying_price = 180; selling_price = 220; vat_rate = 16; unit = 'bag'; is_active = $true },
    @{ tenant_id = $tenantId; name = 'Cooking Oil 1L'; barcode = '6001255001235'; sku = 'OIL001'; category = 'Cooking'; buying_price = 260; selling_price = 320; vat_rate = 16; unit = 'bottle'; is_active = $true },
    @{ tenant_id = $tenantId; name = 'Sugar Mumias 1kg'; barcode = '6001255001236'; sku = 'SUG001'; category = 'Cooking'; buying_price = 120; selling_price = 155; vat_rate = 16; unit = 'packet'; is_active = $true },
    @{ tenant_id = $tenantId; name = 'KCC Fresh Milk 500ml'; barcode = '6001255001237'; sku = 'MLK001'; category = 'Dairy'; buying_price = 50; selling_price = 65; vat_rate = 0; unit = 'bottle'; is_active = $true },
    @{ tenant_id = $tenantId; name = 'Bread Sliced'; barcode = '6001255001238'; sku = 'BRD001'; category = 'Bakery'; buying_price = 50; selling_price = 65; vat_rate = 0; unit = 'loaf'; is_active = $true },
    @{ tenant_id = $tenantId; name = 'Omo Detergent 1kg'; barcode = '6001255001239'; sku = 'CLN001'; category = 'Cleaning'; buying_price = 220; selling_price = 280; vat_rate = 16; unit = 'packet'; is_active = $true },
    @{ tenant_id = $tenantId; name = 'Ketepa Tea 50 bags'; barcode = '6001255001240'; sku = 'TEA001'; category = 'Drinks'; buying_price = 90; selling_price = 120; vat_rate = 0; unit = 'box'; is_active = $true },
    @{ tenant_id = $tenantId; name = 'Eggs Tray 30'; barcode = '6001255001241'; sku = 'EGG001'; category = 'Dairy'; buying_price = 380; selling_price = 480; vat_rate = 0; unit = 'tray'; is_active = $true },
    @{ tenant_id = $tenantId; name = 'Soda Water 500ml'; barcode = '6001255001242'; sku = 'DRK001'; category = 'Drinks'; buying_price = 40; selling_price = 55; vat_rate = 16; unit = 'bottle'; is_active = $true },
    @{ tenant_id = $tenantId; name = 'Colgate Toothpaste 75ml'; barcode = '6001255001243'; sku = 'ORL001'; category = 'Personal Care'; buying_price = 130; selling_price = 170; vat_rate = 16; unit = 'tube'; is_active = $true }
)
$productsJson = $products | ConvertTo-Json
try {
    $createdProducts = Invoke-RestMethod -Uri "$URL/rest/v1/products" -Method Post -Headers $headers -Body $productsJson
    Write-Host "✅ Sample products created"
} catch {
    Write-Host "⚠️ Products might already exist."
    $createdProducts = Invoke-RestMethod -Uri "$URL/rest/v1/products?tenant_id=eq.$tenantId" -Method Get -Headers $headers
}

# Step 6: Create inventory
Write-Host "📊 Creating inventory..."
$inventory = @()
foreach ($p in $createdProducts) {
    $inventory += @{
        product_id = $p.id
        branch_id = $branchId
        quantity = (Get-Random -Minimum 20 -Maximum 100)
        reorder_level = 10
    }
}
$inventoryJson = $inventory | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "$URL/rest/v1/inventory" -Method Post -Headers $headers -Body $inventoryJson
    Write-Host "✅ Inventory created"
} catch {
    Write-Host "⚠️ Inventory might already exist."
}

Write-Host "`n🎉 KiTN POS setup complete!"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "📧 Email:    admin@kitnpos.co.ke"
Write-Host "🔑 Password: Admin@KiTN2024!"
Write-Host "🔢 PIN:      1234"
Write-Host "🏪 Branch:   Main Branch — Nairobi CBD"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "Go to http://localhost:3000/login and sign in!"
