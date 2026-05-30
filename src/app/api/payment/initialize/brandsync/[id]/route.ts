import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/database.types";
import { getPaymentEnvironmentVariables, generatePayHereHash } from "@/lib/utils/payment";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!id) return NextResponse.json({ error: 'Invalid BrandSync id' }, { status: 400 });

    const { data: row, error } = await supabaseAdmin
      .from('brandsync_links')
      .select('id, title, platform, amount, user_id')
      .eq('id', id)
      .single();

    if (error || !row) return NextResponse.json({ error: 'BrandSync not found' }, { status: 404 });

    if (row.is_paid) return NextResponse.json({ error: 'Already paid' }, { status: 400 });

    const { merchantId, merchantSecret, notifyUrl, returnUrl, cancelUrl, checkoutUrl, authorizeUrl } = await getPaymentEnvironmentVariables();

    const formattedAmount = Number(row.amount || 0).toFixed(2);
    const orderId = `BRANDSYNC:${id}`;
    const hash = generatePayHereHash(merchantId, orderId, formattedAmount, 'LKR', merchantSecret);

    const userRes = await createServerComponentClient<Database>({ cookies }).auth.getUser();
    const user = userRes.data.user;
    const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Buyer';
    const lastName = user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || firstName;

    const formData = {
      merchant_id: merchantId,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      order_id: orderId,
      items: row.title || 'BrandSync Link',
      currency: 'LKR',
      amount: formattedAmount,
      first_name: firstName,
      last_name: lastName,
      email: user?.email || '',
      phone: '',
      address: 'Sri Lanka',
      city: 'Colombo',
      country: 'Sri Lanka',
      hash,
      custom_1: user?.id,
      custom_2: String(id),
      checkout_url: checkoutUrl,
      authorize_url: authorizeUrl
    };

    return NextResponse.json(formData);
  } catch (error) {
    console.error('Init existing BrandSync payment error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
