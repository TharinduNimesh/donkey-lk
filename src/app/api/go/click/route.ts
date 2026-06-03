import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { headers } from "next/headers";
import { decodeBrandSyncToken } from "@/lib/utils/brandsync-link";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const hdrs = await headers();
    const forwarded = hdrs.get('x-forwarded-for') || hdrs.get('x-real-ip') || '';
    const ip = String(forwarded).split(',')[0]?.trim() || 'unknown';
    const userAgent = hdrs.get('user-agent') || '';
    const purpose = hdrs.get('purpose') || hdrs.get('sec-purpose') || hdrs.get('x-purpose') || hdrs.get('x-moz') || '';

    const isPrefetchOrBot = 
      purpose.toLowerCase().includes('prefetch') || 
      /bot|crawler|spider|preview|facebookexternalhit|whatsapp|slack|telegram|discord|twitter/i.test(userAgent);

    // --- Step 1: Check influencer sub-token ---
    const { data: subToken } = await (supabaseAdmin as any)
      .from('brandsync_influencer_tokens')
      .select('id, brandsync_id, influencer_user_id')
      .eq('token', token)
      .maybeSingle();

    if (subToken) {
      const { data: parent } = await supabaseAdmin
        .from('brandsync_links')
        .select('platform_url, is_paid')
        .eq('id', subToken.brandsync_id)
        .maybeSingle();

      if (!parent?.is_paid) {
        return NextResponse.json({ error: "not_available" }, { status: 403 });
      }

      if (parent?.platform_url) {
        let finalUrl = parent.platform_url;
        if (!/^https?:\/\//i.test(finalUrl)) finalUrl = "https://" + finalUrl;

        if (isPrefetchOrBot) {
          return NextResponse.json({ finalUrl });
        }

        try {
          // Check duplicate click
          const { data: existingClick } = await (supabaseAdmin as any)
            .from('brandsync_clicks')
            .select('id')
            .eq('influencer_token_id', subToken.id)
            .eq('ip_address', ip)
            .maybeSingle();

          if (existingClick) {
            return NextResponse.json({ error: "already_clicked" }, { status: 409 });
          }

          // Record click
          await (supabaseAdmin as any)
            .from('brandsync_clicks')
            .insert({
              brandsync_id: subToken.brandsync_id,
              ip_address: ip,
              influencer_token_id: subToken.id
            });

          // Update clicked_at
          await (supabaseAdmin as any)
            .from('brandsync_influencer_tokens')
            .update({ clicked_at: new Date().toISOString(), ip_address: ip })
            .eq('id', subToken.id);

          // Milestone balance credit
          const { count: clicksCount } = await (supabaseAdmin as any)
            .from('brandsync_clicks')
            .select('id', { count: 'exact', head: true })
            .eq('influencer_token_id', subToken.id);

          if (clicksCount && clicksCount > 0 && clicksCount % 10 === 0) {
            const lkrPerUsd = Number(process.env.NEXT_PUBLIC_LKR_PER_USD || process.env.LKR_PER_USD || 295);
            const reward = 0.01 * lkrPerUsd;

            const { data: currentBalance } = await supabaseAdmin
              .from('account_balance')
              .select('balance, total_earning')
              .eq('user_id', subToken.influencer_user_id)
              .maybeSingle();

            if (currentBalance) {
              await supabaseAdmin
                .from('account_balance')
                .update({
                  balance: currentBalance.balance + reward,
                  total_earning: currentBalance.total_earning + reward,
                })
                .eq('user_id', subToken.influencer_user_id);
            }
          }
        } catch (clickErr) {
          console.error("Influencer click error:", clickErr);
        }

        return NextResponse.json({ finalUrl });
      }
    }

    // --- Step 2: Check direct link ---
    const { data } = await supabaseAdmin
      .from("brandsync_links")
      .select("id, platform_url, is_paid")
      .eq("token", token)
      .maybeSingle();

    if (data && data.platform_url) {
      let finalUrl = data.platform_url;
      if (!/^https?:\/\//i.test(finalUrl)) finalUrl = "https://" + finalUrl;
      if (!data.is_paid) {
        return NextResponse.json({ error: "not_available" }, { status: 403 });
      }

      if (isPrefetchOrBot) {
        return NextResponse.json({ finalUrl });
      }

      try {
        const { data: existing } = await (supabaseAdmin as any)
          .from('brandsync_clicks')
          .select('id')
          .eq('brandsync_id', data.id)
          .eq('ip_address', ip)
          .maybeSingle();

        if (existing) {
          return NextResponse.json({ error: "already_clicked" }, { status: 409 });
        }

        await (supabaseAdmin as any)
          .from('brandsync_clicks')
          .insert({ brandsync_id: data.id, ip_address: ip });
      } catch (err) {
        console.error('Direct link click error:', err);
      }

      return NextResponse.json({ finalUrl });
    }

    // --- Step 3: Fallback encoded link ---
    try {
      const finalUrl = decodeBrandSyncToken(token);
      if (finalUrl && /^https?:\/\//i.test(finalUrl)) {
        return NextResponse.json({ finalUrl });
      }
    } catch {}

    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  } catch (error) {
    console.error("Go click api error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
