import { supabaseAdmin } from "@/lib/supabase-admin";
import { BrandSyncRedirectClient } from "./BrandSyncRedirectClient";
import type { Metadata } from "next";

async function getLinkDetails(token: string) {
  if (!token) return null;

  try {
    // 1. Check if it's an influencer sub-token
    const { data: subToken } = await (supabaseAdmin as any)
      .from('brandsync_influencer_tokens')
      .select('id, brandsync_id')
      .eq('token', token)
      .maybeSingle();

    let parentLink = null;
    if (subToken) {
      const { data } = await supabaseAdmin
        .from('brandsync_links')
        .select('platform_url, is_paid, title, thumbnail_path')
        .eq('id', subToken.brandsync_id)
        .maybeSingle();
      parentLink = data;
    } else {
      // 2. Check if it's a direct link
      const { data } = await supabaseAdmin
        .from('brandsync_links')
        .select('platform_url, is_paid, title, thumbnail_path')
        .eq('token', token)
        .maybeSingle();
      parentLink = data;
    }

    if (!parentLink) return null;

    let thumbnailUrl = null;
    if (parentLink.thumbnail_path) {
      const { data: signRes } = await supabaseAdmin.storage
        .from("proof-images")
        .createSignedUrl(parentLink.thumbnail_path, 60 * 60 * 24); // 1 day
      thumbnailUrl = signRes?.signedUrl || null;
    }

    let finalUrl = parentLink.platform_url;
    if (finalUrl && !/^https?:\/\//i.test(finalUrl)) {
      finalUrl = "https://" + finalUrl;
    }

    return {
      title: parentLink.title,
      thumbnailUrl,
      finalUrl,
      isPaid: parentLink.is_paid
    };
  } catch (err) {
    console.error("Error in getLinkDetails:", err);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const details = await getLinkDetails(token);

  if (!details) {
    return {
      title: "BrandSync Platform",
      description: "Secure Campaign Redirect System",
    };
  }

  return {
    title: details.title,
    description: "Watch this campaign video on BrandSync",
    openGraph: {
      title: details.title,
      description: "Watch this campaign video on BrandSync",
      images: details.thumbnailUrl ? [{ url: details.thumbnailUrl }] : [],
      type: "video.other",
    },
    twitter: {
      card: "summary_large_image",
      title: details.title,
      description: "Watch this campaign video on BrandSync",
      images: details.thumbnailUrl ? [details.thumbnailUrl] : [],
    }
  };
}

export default async function BrandSyncRedirectPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const details = await getLinkDetails(token);

  return (
    <BrandSyncRedirectClient
      token={token}
      initialTitle={details?.title || null}
      initialThumbnailUrl={details?.thumbnailUrl || null}
      initialFinalUrl={details?.finalUrl || null}
    />
  );
}