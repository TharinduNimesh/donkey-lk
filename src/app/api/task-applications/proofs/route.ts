import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Database } from "@/types/database.types";

/**
 * PATCH /api/task-applications/proofs
 * Body: { applicationId, platform, proofType, content }
 *
 * Resubmits a rejected proof by updating its content in-place and resetting
 * the proof_status back to UNDER_REVIEW. The previous reviewed_at / reviewed_by
 * values are preserved so the admin can see the rejection history.
 *
 * Uses the admin client to bypass RLS on proof_status.
 */
export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore as any,
    });

    // Authenticate the caller
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { applicationId, platform, proofType, content } = await request.json();

    if (!applicationId || !platform || !proofType || !content) {
      return NextResponse.json(
        { error: "applicationId, platform, proofType, and content are required" },
        { status: 400 }
      );
    }

    // Verify the application belongs to the calling user
    const { data: application, error: appError } = await supabaseAdmin
      .from("task_applications")
      .select("id, user_id")
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (application.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find the existing proof row
    const { data: existingProofs, error: findError } = await supabaseAdmin
      .from("application_proofs")
      .select("id, proof_status(status)")
      .eq("application_id", applicationId)
      .eq("platform", platform)
      .eq("proof_type", proofType);

    if (findError) {
      return NextResponse.json({ error: findError.message }, { status: 500 });
    }

    if (!existingProofs || existingProofs.length === 0) {
      // No existing proof — nothing to resubmit (caller will do a fresh insert)
      return NextResponse.json({ resubmitted: false });
    }

    const existing = existingProofs[0];
    const statusObj = existing.proof_status;
    const statusVal = Array.isArray(statusObj)
      ? (statusObj[0] as any)?.status
      : (statusObj as any)?.status;

    // Only allow resubmission of REJECTED proofs
    if (statusVal !== "REJECTED") {
      return NextResponse.json(
        { error: "Only rejected proofs can be resubmitted" },
        { status: 409 }
      );
    }

    // Update the proof content in-place (preserves the row id and history)
    const { error: updateProofError } = await supabaseAdmin
      .from("application_proofs")
      .update({ content })
      .eq("id", existing.id);

    if (updateProofError) {
      return NextResponse.json({ error: updateProofError.message }, { status: 500 });
    }

    // Reset proof_status back to UNDER_REVIEW.
    // We intentionally keep reviewed_at and reviewed_by so the admin
    // can see that this proof was previously reviewed (rejected).
    const { error: updateStatusError } = await supabaseAdmin
      .from("proof_status")
      .update({ status: "UNDER_REVIEW" })
      .eq("proof_id", existing.id);

    if (updateStatusError) {
      return NextResponse.json({ error: updateStatusError.message }, { status: 500 });
    }

    return NextResponse.json({ resubmitted: true, proofId: existing.id });
  } catch (error) {
    console.error("Resubmit proof error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
