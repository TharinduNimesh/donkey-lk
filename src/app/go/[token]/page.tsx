import { redirect } from "next/navigation";
import { decodeBrandSyncToken } from "@/lib/utils/brandsync-link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { headers } from 'next/headers';

export const dynamic = "force-dynamic";

export default async function BrandSyncRedirectPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const hdrs = await headers();
  const forwarded = hdrs.get('x-forwarded-for') || hdrs.get('x-real-ip') || '';
  const ip = String(forwarded).split(',')[0]?.trim() || 'unknown';

  // --- Step 1: Check per-influencer sub-token table first ---
  try {
    const { data: subToken } = await (supabaseAdmin as any)
      .from('brandsync_influencer_tokens')
      .select('id, brandsync_id, influencer_user_id')
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

      if (parent?.platform_url) {
        let finalUrl = parent.platform_url;
        if (!/^https?:\/\//i.test(finalUrl)) finalUrl = "https://" + finalUrl;
        
        // Record the click in a safe block
        try {
          // 1. Check if this IP has already clicked this influencer's link
          const { data: existingClick } = await (supabaseAdmin as any)
            .from('brandsync_clicks')
            .select('id')
            .eq('influencer_token_id', subToken.id)
            .eq('ip_address', ip)
            .maybeSingle();

          if (existingClick) {
            redirect('/brandsync/error?code=already_clicked');
            return;
          }

          // 2. Record click in brandsync_clicks
          await (supabaseAdmin as any)
            .from('brandsync_clicks')
            .insert({
              brandsync_id: subToken.brandsync_id,
              ip_address: ip,
              influencer_token_id: subToken.id
            });

          // 3. For backwards compatibility, update clicked_at in brandsync_influencer_tokens
          await (supabaseAdmin as any)
            .from('brandsync_influencer_tokens')
            .update({ clicked_at: new Date().toISOString(), ip_address: ip })
            .eq('id', subToken.id);
        } catch (clickErr) {
          // If it was a redirect, we must re-throw it so Next.js handles the redirect correctly
          if (clickErr && typeof clickErr === 'object' && 'digest' in clickErr) {
            throw clickErr;
          }
          console.error('Failed to record influencer sub-token click:', clickErr);
        }

        redirect(finalUrl);
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

  if (data && data.platform_url) {
    let finalUrl = data.platform_url;
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = "https://" + finalUrl;
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

    redirect(finalUrl);
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