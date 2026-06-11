import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/database.types";
import { generatePayHereHash, getPaymentEnvironmentVariables } from "@/lib/utils/payment";
import { supabaseAdmin } from "@/lib/supabase-admin";
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const shares = Number(body.shares || 0);
    const title = String(body.title || 'BrandSync Link');
    const platform = String(body.platform || 'YOUTUBE');
    const videoUrl = String(body.videoUrl || '');
    const createOnly = Boolean(body.createOnly);

    if (!shares || shares < 100) {
      return NextResponse.json({ error: 'Minimum shares is 100' }, { status: 400 });
    }

    const amount = shares * 0.70; // LKR

    const cookieStore = await cookies();

    // Create pending BrandSync row
    const { data: created, error: insertError } = await (supabaseAdmin as any)
      .from('brandsync_links')
      .insert({
        token: crypto.randomUUID().replace(/-/g, ''),
        user_id: (await createServerComponentClient<Database>({ cookies: () => cookieStore as any }).auth.getUser()).data.user?.id,
        title,
        platform,
        platform_url: videoUrl,
        shares,
        is_paid: false,
        amount
      })
      .select('id')
      .single();

    if (insertError || !created) {
      console.error('Failed to create brandsync pending row', insertError);
      return NextResponse.json({ error: 'Failed to initialize payment' }, { status: 500 });
    }

    const brandsyncId = created.id;
    // If only creating the pending row (for bank transfer flow), return id and amount
    if (createOnly) {
      return NextResponse.json({ brandsyncId, amount }, { status: 201 });
    }

    const { merchantId, merchantSecret, notifyUrl, returnUrl, cancelUrl, checkoutUrl, authorizeUrl } = await getPaymentEnvironmentVariables();

    const formattedAmount = Number(amount).toFixed(2);
    const hash = generatePayHereHash(merchantId, `BRANDSYNC:${brandsyncId}`, formattedAmount, 'LKR', merchantSecret);

    const userRes = await createServerComponentClient<Database>({ cookies: () => cookieStore as any }).auth.getUser();
    const user = userRes.data.user;
    const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Buyer';
    const lastName = user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || firstName;

    const formData = {
      merchant_id: merchantId,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      order_id: `BRANDSYNC:${brandsyncId}`,
      items: title,
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
      custom_2: brandsyncId.toString(),
      checkout_url: checkoutUrl,
      authorize_url: authorizeUrl
    };

    return NextResponse.json(formData);
  } catch (error) {
    console.error('BrandSync payment initialize error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
