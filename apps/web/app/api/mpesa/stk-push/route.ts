import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { stkPush } from '@/lib/mpesa/daraja';
import { createClient } from '@/lib/supabase/server';

const stkPushSchema = z.object({
  phone: z.string().regex(/^(07|01|2547|2541|\+2547|\+2541)\d{8}$/),
  amount: z.number().positive(),
  saleId: z.string().uuid().optional(),
  reference: z.string()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = stkPushSchema.parse(body);

    // Sanitize phone number to 254...
    let phone = validated.phone.replace('+', '');
    if (phone.startsWith('0')) {
      phone = '254' + phone.slice(1);
    } else if (!phone.startsWith('254')) {
      phone = '254' + phone;
    }

    const mpesaResponse = await stkPush(phone, validated.amount, validated.reference);

    // Log the transaction attempt to Supabase if saleId provided
    if (validated.saleId) {
      const supabase = await createClient();
      await supabase.from('sales').update({
        mpesa_ref: mpesaResponse.CheckoutRequestID 
      }).eq('id', validated.saleId);
    }

    return NextResponse.json({ 
      success: true, 
      checkoutRequestID: mpesaResponse.CheckoutRequestID 
    });
  } catch (error: unknown) {
    console.error('STK Push Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status: 400 });
  }
}
