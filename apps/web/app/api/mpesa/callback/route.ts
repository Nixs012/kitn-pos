import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { Body: { stkCallback } } = body;
    const supabase = await createClient();

    const checkoutRequestID = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;

    if (resultCode === 0) {
      // Success
      const mpesaReceipt = stkCallback.CallbackMetadata.Item.find((item: { Name: string; Value: string }) => item.Name === 'MpesaReceiptNumber')?.Value;
      
      // Update sale record
      const { data: sale } = await supabase
        .from('sales')
        .update({
          mpesa_ref: mpesaReceipt,
          synced_at: new Date().toISOString()
        })
        .eq('mpesa_ref', checkoutRequestID) // Use checkoutRequestID to find the pending sale
        .select()
        .single();

      if (sale) {
        // Success: Log audit
        await supabase.from('audit_log').insert({
          user_id: sale.cashier_id,
          action: 'PAYMENT_SUCCESS',
          table_name: 'sales',
          record_id: sale.id,
          new_data: { mpesa_receipt: mpesaReceipt, amount: sale.total_amount }
        });
        
        // Stock deduction is handled by the SQL trigger in 005_inventory.sql on sale_items insert
        // But here we might want to trigger any app-side success logic
      }
    } else {
      // Failure
      console.warn(`M-Pesa Payment Failed: ${resultDesc}`);
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (error: unknown) {
    console.error('M-Pesa Callback Error:', error);
    return NextResponse.json({ ResultCode: 1, ResultDesc: 'Internal Error' }, { status: 500 });
  }
}
