import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { checkoutId: string } }
) {
  try {
    const checkoutId = params.checkoutId;
    const supabase = await createClient();

    // Find the sale record with this checkout ID
    const { data: sale, error } = await supabase
      .from('sales')
      .select('id, mpesa_ref, total_amount')
      .eq('mpesa_ref', checkoutId)
      .single();

    if (!sale) {
      return NextResponse.json({ status: 'pending' });
    }

    // Checking if the mpesa_ref is still the checkoutId (pending) 
    // or if it has been updated to an actual M-Pesa receipt (success)
    if (sale.mpesa_ref === checkoutId) {
      // Still waiting or failed
      return NextResponse.json({ status: 'pending' });
    }

    // If it's different and not empty, it's a receipt!
    return NextResponse.json({ 
      status: 'success', 
      receipt: sale.mpesa_ref 
    });

  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
