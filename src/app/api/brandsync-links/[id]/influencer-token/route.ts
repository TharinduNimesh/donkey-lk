import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Database } from "@/types/database.types";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

function getPublicOrigin(request: Request) {
  return process.env.APP_URL ?? new URL(request.url).origin;
}

/**
 * GET /api/brandsync-links/[id]/influencer-token
 *
 * Called by the influencer dashboard. Returns (or creates) a unique
 * sub-token for this influencer + brandsync_id pair. Each influencer
 * gets a different /go/<sub-token> URL, but they all redirect to the
 * same underlying video. The original platform_url is NEVER exposed.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const brandsyncId = Number(id);
    if (!brandsyncId || isNaN(brandsyncId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Verify the parent brandsync link exists and is paid
    const { data: parent, error: parentError } = await supabaseAdmin
      .from("brandsync_links")
      .select("id, title, platform, thumbnail_path, is_paid")
      .eq("id", brandsyncId)
      .eq("is_paid", true)
      .maybeSingle();

    if (parentError || !parent) {
      return NextResponse.json({ error: "BrandSync link not found or not active" }, { status: 404 });
    }

    // Check for an existing sub-token for this influencer
    const { data: existing } = await (supabaseAdmin as any)
      .from("brandsync_influencer_tokens")
      .select("token")
      .eq("brandsync_id", brandsyncId)
      .eq("influencer_user_id", user.id)
      .maybeSingle();

    if (existing?.token) {
      const origin = getPublicOrigin(request);
      const uniqueUrl = `${origin}/go/${existing.token}`;
      return NextResponse.json({ uniqueUrl, token: existing.token, unlocked: true });
    }

    // Get unlock limits metadata
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentTokens } = await (supabaseAdmin as any)
      .from("brandsync_influencer_tokens")
      .select("created_at")
      .eq("influencer_user_id", user.id)
      .gte("created_at", twentyFourHoursAgo)
      .order("created_at", { ascending: true });

    const reachedLimit = recentTokens && recentTokens.length >= 3;
    let nextUnlockAt = null;
    if (reachedLimit && recentTokens && recentTokens[0]) {
      nextUnlockAt = new Date(new Date(recentTokens[0].created_at).getTime() + 24 * 60 * 60 * 1000).toISOString();
    }

    return NextResponse.json({ unlocked: false, nextUnlockAt });
  } catch (error) {
    console.error("Influencer token check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const brandsyncId = Number(id);
    if (!brandsyncId || isNaN(brandsyncId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Verify the parent brandsync link exists and is paid
    const { data: parent, error: parentError } = await supabaseAdmin
      .from("brandsync_links")
      .select("id, title, platform, thumbnail_path, is_paid")
      .eq("id", brandsyncId)
      .eq("is_paid", true)
      .maybeSingle();

    if (parentError || !parent) {
      return NextResponse.json({ error: "BrandSync link not found or not active" }, { status: 404 });
    }

    // Check for an existing sub-token for this influencer
    const { data: existing } = await (supabaseAdmin as any)
      .from("brandsync_influencer_tokens")
      .select("token")
      .eq("brandsync_id", brandsyncId)
      .eq("influencer_user_id", user.id)
      .maybeSingle();

    let token: string;

    if (existing?.token) {
      token = existing.token;
    } else {
      // Check the daily unlock limit (created in the last 24 hours)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: createdTodayCount, error: countError } = await (supabaseAdmin as any)
        .from("brandsync_influencer_tokens")
        .select("id", { count: "exact", head: true })
        .eq("influencer_user_id", user.id)
        .gte("created_at", twentyFourHoursAgo);

      if (countError) {
        console.error("Failed to check daily limit:", countError);
        return NextResponse.json({ error: "Failed to check daily limit" }, { status: 550 });
      }

      if (createdTodayCount && createdTodayCount >= 3) {
        // Find the oldest of the last 3 unlocks
        const { data: oldestToken } = await (supabaseAdmin as any)
          .from("brandsync_influencer_tokens")
          .select("created_at")
          .eq("influencer_user_id", user.id)
          .gte("created_at", twentyFourHoursAgo)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        const nextUnlockAt = oldestToken 
          ? new Date(new Date(oldestToken.created_at).getTime() + 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        return NextResponse.json(
          { error: "daily_limit_reached", message: "You have reached your daily limit of 3 unlocked links.", nextUnlockAt },
          { status: 403 }
        );
      }

      // Generate a new unique sub-token
      token = crypto.randomUUID().replace(/-/g, "");

      const { error: insertError } = await (supabaseAdmin as any)
        .from("brandsync_influencer_tokens")
        .insert({
          brandsync_id: brandsyncId,
          influencer_user_id: user.id,
          token,
        });

      if (insertError) {
        console.error("Failed to create influencer token:", insertError);
        return NextResponse.json({ error: "Failed to create influencer token" }, { status: 500 });
      }
    }

    const origin = getPublicOrigin(request);
    const uniqueUrl = `${origin}/go/${token}`;

    return NextResponse.json({ uniqueUrl, token, unlocked: true });
  } catch (error) {
    console.error("Influencer token unlock error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
