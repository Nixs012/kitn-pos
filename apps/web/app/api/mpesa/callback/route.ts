import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface CallbackItem {
  Name: string;
  Value?: string | number;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('M-Pesa Callback Received:', JSON.stringify(body, null, 2));

    const { stkCallback } = body.Body;
    const {
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata
    } = stkCallback;

    const supabase = await createClient();

    // 1. Log the callback result
    console.log(`STK Push Callback for ${CheckoutRequestID}: ${ResultDesc} (${ResultCode})`);

    if (ResultCode === 0 && CallbackMetadata) {
      // SUCCESS
      const items: CallbackItem[] = CallbackMetadata.Item;
      const receipt = items.find((i) => i.Name === 'MpesaReceiptNumber')?.Value;

      // 2. Update the sale record
      // We assume the CheckoutRequestID was stored in the mpesa_ref temporarily
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .update({
          payment_method: 'mpesa',
          mpesa_ref: String(receipt),
          synced_at: new Date().toISOString()
        })
        .eq('mpesa_ref', CheckoutRequestID)
        .select()
        .single();

      if (saleError) {
        console.error('Error updating sale from callback:', saleError);
      } else {
        console.log('Sale completed successfully via M-Pesa:', sale?.id);
      }
    } else {
      // FAILED or CANCELLED
      console.warn(`M-Pesa Payment Failed/Cancelled: ${ResultDesc}`);
      
      // Optionally mark the sale as failed/cancelled
      await supabase
        .from('sales')
        .update({ mpesa_ref: `FAILED-${CheckoutRequestID}` })
        .eq('mpesa_ref', CheckoutRequestID);
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (err: unknown) {
    console.error('M-Pesa Callback Error:', err);
    return NextResponse.json({ ResultCode: 1, ResultDesc: 'Internal Error' }, { status: 500 });
  }
}
