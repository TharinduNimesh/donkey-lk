import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Database } from "@/types/database.types";
import crypto from "crypto";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/**
 * POST /api/brandsync-links/[id]/thumbnail
 * Accepts multipart/form-data with a "thumbnail" file field.
 * Uploads it to Supabase storage and updates the brandsync_links row.
 */
export async function POST(
  request: NextRequest,
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

    // Verify this link belongs to the current user
    const { data: row, error: rowError } = await supabaseAdmin
      .from("brandsync_links")
      .select("id, user_id, thumbnail_path")
      .eq("id", brandsyncId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (rowError || !row) {
      return NextResponse.json({ error: "BrandSync link not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("thumbnail");

    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "No thumbnail file provided" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Thumbnail must be smaller than 5MB" }, { status: 400 });
    }

    const extension = file.name.split(".").pop() || "png";
    const filePath = `brandsync/${user.id}/${crypto.randomUUID()}.${extension}`;

    // Delete old thumbnail if exists
    if (row.thumbnail_path) {
      await supabaseAdmin.storage.from("proof-images").remove([row.thumbnail_path]);
    }

    // Upload new thumbnail
    const { error: uploadError } = await supabaseAdmin.storage
      .from("proof-images")
      .upload(filePath, file, {
        contentType: file.type || "image/png",
        upsert: false,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("Thumbnail upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload thumbnail" }, { status: 500 });
    }

    // Update the brandsync_links row with the new thumbnail_path
    const { error: updateError } = await supabaseAdmin
      .from("brandsync_links")
      .update({ thumbnail_path: filePath })
      .eq("id", brandsyncId);

    if (updateError) {
      // Clean up uploaded file on DB error
      await supabaseAdmin.storage.from("proof-images").remove([filePath]);
      console.error("Thumbnail path update error:", updateError);
      return NextResponse.json({ error: "Failed to save thumbnail path" }, { status: 500 });
    }

    // Return a fresh signed URL (1 week) for immediate display
    const { data: signedData } = await supabaseAdmin.storage
      .from("proof-images")
      .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days

    return NextResponse.json({
      thumbnailUrl: signedData?.signedUrl ?? null,
      thumbnailPath: filePath,
    });
  } catch (error) {
    console.error("Thumbnail endpoint error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
