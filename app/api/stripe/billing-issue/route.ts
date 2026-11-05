// @ts-nocheck -- same as the other Stripe routes (generated Supabase types reject these columns)
// For a user whose payment failed: the unpaid amount, a link to pay it now,
// and when Stripe will retry. Their plan comes back as soon as it's paid.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { stripe } from '@/lib/stripe-server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id, subscription_status')
      .eq('id', user.id)
      .single();

    const status = userData?.subscription_status ?? null;
    if (status !== 'past_due' || !userData?.stripe_customer_id) {
      return NextResponse.json({ status });
    }

    const { data: invoices } = await stripe.invoices.list({
      customer: userData.stripe_customer_id,
      status: 'open',
      limit: 1,
    });
    const invoice = invoices[0];

    return NextResponse.json({
      status,
      amountDue: invoice ? invoice.amount_due / 100 : null,
      currency: invoice?.currency ?? 'usd',
      payUrl: invoice?.hosted_invoice_url ?? null,
      nextRetry: invoice?.next_payment_attempt ? invoice.next_payment_attempt * 1000 : null,
    });
  } catch (error) {
    console.error('[Billing issue]', error);
    return NextResponse.json({ error: 'Could not load billing details' }, { status: 500 });
  }
}
