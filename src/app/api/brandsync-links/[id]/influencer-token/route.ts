import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Database } from "@/types/database.types";

async function getCurrentUser() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
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

    let token: string;

    if (existing?.token) {
      token = existing.token;
    } else {
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

    return NextResponse.json({ uniqueUrl, token });
  } catch (error) {
    console.error("Influencer token error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
