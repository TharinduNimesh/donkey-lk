import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { z } from "zod";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Database } from "@/types/database.types";
import { buildBrandSyncUrl } from "@/lib/utils/brandsync-link";

const platformSchema = z.enum(["YOUTUBE", "TIKTOK", "FACEBOOK"]);

const requestSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120, "Title is too long"),
  platform: platformSchema,
  videoUrl: z.string().trim().url("Enter a valid video URL"),
  shares: z.preprocess((v) => Number(v), z.number().int().min(0)),
  paid: z.boolean().optional(),
});

type BrandSyncLinkRow = Database["public"]["Tables"]["brandsync_links"]["Row"];

function getOrigin(request: Request) {
  return new URL(request.url).origin;
}

function getPublicOrigin(request: Request) {
  return env.APP_URL ?? getOrigin(request);
}

async function getCurrentUser() {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

async function uploadThumbnail(file: File, userId: string) {
  const extension = file.name.split(".").pop() || "png";
  const filePath = `${userId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabaseAdmin.storage
    .from("proof-images")
    .upload(filePath, file, {
      contentType: file.type || "image/png",
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return filePath;
}

async function getThumbnailUrl(thumbnailPath: string | null) {
  if (!thumbnailPath) {
    return null;
  }

  const { data, error } = await supabaseAdmin.storage
    .from("proof-images")
    .createSignedUrl(thumbnailPath, 60 * 60 * 24 * 7); // 7 days

  if (error) {
    return null;
  }

  return data.signedUrl;
}

function mapLink(row: BrandSyncLinkRow, origin: string, thumbnailUrl: string | null) {
  return {
    id: row.id,
    title: row.title,
    platform: row.platform,
    shares: row.shares,
    isPaid: row.is_paid,
    amount: Number(row.amount || 0),
    thumbnailUrl,
    brandSyncUrl: buildBrandSyncUrl(origin, row.token),
    platformUrl: row.platform_url,
    createdAt: row.created_at,
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const scope = url.searchParams.get("scope");

    if (scope === "public") {
      const origin = getPublicOrigin(request);
      const { data, error } = await supabaseAdmin
        .from("brandsync_links")
        .select("id, title, platform, token, thumbnail_path, created_at")
        .eq('is_paid', true)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("BrandSync public load error:", error);
        return NextResponse.json(
          {
            error: error.message || "Failed to load BrandSync links",
            details: error.details ?? null,
            hint: error.hint ?? null,
            code: error.code ?? null,
          },
          { status: 500 }
        );
      }

      const links = await Promise.all(
        (data ?? []).map(async (row) => {
          const thumbnailUrl = await getThumbnailUrl(row.thumbnail_path);
          const { count } = await (supabaseAdmin as any)
            .from("brandsync_clicks")
            .select("id", { count: "exact", head: true })
            .eq("brandsync_id", row.id);
          return {
            ...mapLink(row as BrandSyncLinkRow, origin, thumbnailUrl),
            clicks: count || 0,
          };
        })
      );

      return NextResponse.json({ links });
    }

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const origin = getPublicOrigin(request);
    const { data, error } = await supabaseAdmin
      .from("brandsync_links")
      .select("id, title, platform, token, thumbnail_path, created_at, platform_url, is_paid, shares, amount")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) {
      console.error("BrandSync user load error:", error);
      return NextResponse.json(
        {
          error: error.message || "Failed to load BrandSync links",
          details: error.details ?? null,
          hint: error.hint ?? null,
          code: error.code ?? null,
        },
        { status: 500 }
      );
    }

    const linkIds = (data ?? []).map(r => r.id);
    
    // Batch query slips and their statuses
    const { data: slips } = linkIds.length
      ? await (supabaseAdmin as any)
          .from("bank_transfer_slip")
          .select("id, brandsync_id, bank_transfer_status ( status )")
          .in("brandsync_id", linkIds)
      : { data: [] };

    const links = await Promise.all(
      (data ?? []).map(async (row) => {
        const thumbnailUrl = await getThumbnailUrl(row.thumbnail_path);
        const { count } = await (supabaseAdmin as any)
          .from("brandsync_clicks")
          .select("id", { count: "exact", head: true })
          .eq("brandsync_id", row.id);
        
        const linkSlips = (slips || []).filter((s: any) => s.brandsync_id === row.id);
        const latestSlip = linkSlips.length > 0 
          ? linkSlips.reduce((prev: any, current: any) => (prev.id > current.id) ? prev : current)
          : null;
        
        let paymentStatus: string | null = null;
        if (latestSlip) {
          const statusObj = latestSlip.bank_transfer_status;
          const statusVal = Array.isArray(statusObj) 
            ? statusObj[0]?.status 
            : statusObj?.status;
          paymentStatus = statusVal || "PENDING";
        }

        const rejectionCount = linkSlips.filter((s: any) => {
          const statusObj = s.bank_transfer_status;
          const statusVal = Array.isArray(statusObj) 
            ? statusObj[0]?.status 
            : statusObj?.status;
          return statusVal === "REJECTED";
        }).length;

        return {
          ...mapLink(row as BrandSyncLinkRow, origin, thumbnailUrl),
          clicks: count || 0,
          paymentStatus,
          rejectionCount,
        };
      })
    );

    return NextResponse.json({ links });
  } catch (error) {
    console.error("BrandSync link list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const parsed = requestSchema.parse({
      title: formData.get("title"),
      platform: formData.get("platform"),
      videoUrl: formData.get("videoUrl"),
      shares: formData.get("shares") ?? 0,
      paid: formData.get("paid") === "true",
    });

    const thumbnailValue = formData.get("thumbnail");
    const thumbnailFile = thumbnailValue instanceof File && thumbnailValue.size > 0 ? thumbnailValue : null;

    if (thumbnailFile && thumbnailFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Thumbnail must be smaller than 5MB" }, { status: 400 });
    }

    let thumbnailPath: string | null = null;

    if (thumbnailFile) {
      thumbnailPath = await uploadThumbnail(thumbnailFile, user.id);
    }

    // Enforce shares business rule: minimum 100 shares, Rs.6 per share
    const shares = parsed.shares ?? 0;
    const MIN_SHARES = 100;
    const PRICE_PER_SHARE = 6; // LKR

    if (shares < MIN_SHARES) {
      return NextResponse.json({ error: `Minimum shares is ${MIN_SHARES}` }, { status: 400 });
    }

    const amount = shares * PRICE_PER_SHARE;

    if (shares > MIN_SHARES && !parsed.paid) {
      // Require payment before creating the link
      return NextResponse.json({ error: "Payment required", requiredAmount: amount }, { status: 402 });
    }

    const token = crypto.randomUUID().replace(/-/g, "");
    const origin = getPublicOrigin(request);

    const { data: createdLink, error: insertError } = await supabaseAdmin
      .from("brandsync_links")
      .insert({
        token,
        user_id: user.id,
        title: parsed.title,
        platform: parsed.platform,
        platform_url: parsed.videoUrl,
        thumbnail_path: thumbnailPath,
        shares: shares,
        is_paid: Boolean(parsed.paid),
        amount: amount,
      })
      .select("id, title, platform, token, thumbnail_path, created_at, shares, is_paid, amount")
      .single();

    if (insertError || !createdLink) {
      if (thumbnailPath) {
        await supabaseAdmin.storage.from("proof-images").remove([thumbnailPath]);
      }

      console.error("BrandSync insert error:", insertError);
      return NextResponse.json(
        {
          error: insertError?.message || "Failed to create BrandSync link",
          details: insertError?.details ?? null,
          hint: insertError?.hint ?? null,
          code: insertError?.code ?? null,
        },
        { status: 500 }
      );
    }

    const thumbnailUrl = await getThumbnailUrl(createdLink.thumbnail_path);

    return NextResponse.json({
      link: mapLink(createdLink as BrandSyncLinkRow, origin, thumbnailUrl),
    }, { status: 201 });
  } catch (error) {
    console.error("BrandSync link create error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.issues }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}