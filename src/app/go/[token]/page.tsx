import { redirect } from "next/navigation";
import { decodeBrandSyncToken } from "@/lib/utils/brandsync-link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { headers } from 'next/headers';

export const dynamic = "force-dynamic";

export default async function BrandSyncRedirectPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  // try to resolve a stored BrandSync link first (only paid links should be public)
  const { data } = await supabaseAdmin
    .from("brandsync_links")
    .select("id, platform_url, is_paid")
    .eq("token", token)
    .maybeSingle();

  const hdrs: any = headers();
  const forwarded = (typeof hdrs.get === 'function' ? hdrs.get('x-forwarded-for') : hdrs['x-forwarded-for']) || (typeof hdrs.get === 'function' ? hdrs.get('x-real-ip') : hdrs['x-real-ip']) || '';
  const ip = String(forwarded).split(',')[0]?.trim() || 'unknown';

  if (data && data.platform_url && /^https?:\/\//i.test(data.platform_url)) {
    // If the link is stored, ensure it's paid
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

      // record click
      await (supabaseAdmin as any).from('brandsync_clicks').insert({ brandsync_id: data.id, ip_address: ip });
    } catch (err) {
      console.error('Error recording BrandSync click', err);
      // continue with redirect if recording fails
    }

    redirect(data.platform_url);
  }

  // fallback: token might be an encoded URL
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