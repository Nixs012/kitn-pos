import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface ImportProduct {
  name: string;
  category?: string;
  buying_price?: number | string;
  selling_price?: number | string;
  sku?: string;
  unit?: string;
  barcode?: string;
  stock?: number | string;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const data = await req.json();
    const products: ImportProduct[] = data.products;

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty products data' }, { status: 400 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id, branch_id')
      .eq('id', user.id)
      .single();

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const { tenant_id, branch_id } = profile;
    let importedCount = 0;

    for (const p of products) {
      // 1. Insert product
      const { data: product, error: prdError } = await supabase
        .from('products')
        .insert({
          tenant_id,
          name: p.name,
          category: p.category || 'Uncategorized',
          buying_price: Number(p.buying_price) || 0,
          selling_price: Number(p.selling_price) || 0,
          sku: p.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          unit: p.unit || 'pcs',
          barcode: p.barcode || null,
          is_active: true
        })
        .select()
        .single();

      if (prdError || !product) {
        console.error('Error importing product:', prdError);
        continue;
      }

      // 2. Insert initial inventory
      if (branch_id) {
        const { error: invError } = await supabase
          .from('inventory')
          .insert({
            product_id: product.id,
            branch_id,
            quantity: Number(p.stock) || 0,
            reorder_level: 10,
          });
          
        if (invError) {
          console.error('Error creating inventory:', invError);
        }
      }
      
      importedCount++;
    }

    return NextResponse.json({ 
      success: true, 
      count: importedCount,
      total: products.length 
    });
  } catch (err: unknown) {
    console.error('Import API Error:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
