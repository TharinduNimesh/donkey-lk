import { redirect } from "next/navigation";
import { decodeBrandSyncToken } from "@/lib/utils/brandsync-link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { headers } from 'next/headers';

export const dynamic = "force-dynamic";

export default async function BrandSyncRedirectPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const hdrs: any = headers();
  const forwarded = (typeof hdrs.get === 'function' ? hdrs.get('x-forwarded-for') : hdrs['x-forwarded-for']) || (typeof hdrs.get === 'function' ? hdrs.get('x-real-ip') : hdrs['x-real-ip']) || '';
  const ip = String(forwarded).split(',')[0]?.trim() || 'unknown';

  // --- Step 1: Check per-influencer sub-token table first ---
  try {
    const { data: subToken } = await (supabaseAdmin as any)
      .from('brandsync_influencer_tokens')
      .select('id, brandsync_id, influencer_user_id, clicked_at')
      .eq('token', token)
      .maybeSingle();

    if (subToken) {
      // Fetch parent link's platform_url
      const { data: parent } = await supabaseAdmin
        .from('brandsync_links')
        .select('platform_url, is_paid')
        .eq('id', subToken.brandsync_id)
        .maybeSingle();

      if (!parent?.is_paid) {
        redirect('/brandsync/error?code=not_available');
        return;
      }

      if (parent?.platform_url && /^https?:\/\//i.test(parent.platform_url)) {
        // Record the click if not already recorded
        if (!subToken.clicked_at) {
          await (supabaseAdmin as any)
            .from('brandsync_influencer_tokens')
            .update({ clicked_at: new Date().toISOString(), ip_address: ip })
            .eq('id', subToken.id);
        }

        redirect(parent.platform_url);
        return;
      }
    }
  } catch (err) {
    console.error('Error checking influencer sub-token:', err);
  }

  // --- Step 2: Check standard brandsync_links table (direct token) ---
  const { data } = await supabaseAdmin
    .from("brandsync_links")
    .select("id, platform_url, is_paid")
    .eq("token", token)
    .maybeSingle();

  if (data && data.platform_url && /^https?:\/\//i.test(data.platform_url)) {
    if (!data.is_paid) {
      redirect('/brandsync/error?code=not_available');
      return;
    }

    // Check if this IP already clicked this link
    try {
      const { data: existing } = await (supabaseAdmin as any)
        .from('brandsync_clicks')
        .select('id')
        .eq('brandsync_id', data.id)
        .eq('ip_address', ip)
        .maybeSingle();

      if (existing) {
        redirect('/brandsync/error?code=already_clicked');
        return;
      }

      // Record click
      await (supabaseAdmin as any).from('brandsync_clicks').insert({ brandsync_id: data.id, ip_address: ip });
    } catch (err) {
      console.error('Error recording BrandSync click', err);
    }

    redirect(data.platform_url);
  }

  // --- Step 3: Fallback to legacy encoded token ---
  try {
    const targetUrl = decodeBrandSyncToken(token);

    if (!/^https?:\/\//i.test(targetUrl)) {
      redirect("/dashboard/buyer");
    }

    redirect(targetUrl);
  } catch {
    redirect("/dashboard/buyer");
  }
}