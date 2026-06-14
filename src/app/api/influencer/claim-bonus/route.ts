import { NextResponse } from "next/server";
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

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is an influencer
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profile')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileErr || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const isInfluencer = profile.role?.includes('INFLUENCER');
    if (!isInfluencer) {
      return NextResponse.json({ error: "Only influencers can claim signup bonus" }, { status: 403 });
    }

    // Check if they already have account balance record and total_earning > 0
    const { data: currentBalance, error: balErr } = await supabaseAdmin
      .from('account_balance')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (balErr) {
      console.error("Failed to query account balance:", balErr);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (currentBalance && currentBalance.total_earning > 0) {
      return NextResponse.json({ error: "not_eligible", message: "You have already claimed your signup bonus or earned rewards." }, { status: 400 });
    }

    const lkrPerUsd = Number(process.env.NEXT_PUBLIC_LKR_PER_USD || process.env.LKR_PER_USD || 295);
    const bonusLKR = 1 * lkrPerUsd;

    let updatedBalance;
    if (currentBalance) {
      // Update
      const { data: updated, error: updateErr } = await supabaseAdmin
        .from('account_balance')
        .update({
          balance: currentBalance.balance + bonusLKR,
          total_earning: currentBalance.total_earning + bonusLKR
        })
        .eq('user_id', user.id)
        .select()
        .maybeSingle();

      if (updateErr || !updated) {
        console.error("Failed to update balance:", updateErr);
        return NextResponse.json({ error: "Failed to update balance" }, { status: 500 });
      }
      updatedBalance = updated;
    } else {
      // Insert
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('account_balance')
        .insert({
          user_id: user.id,
          balance: bonusLKR,
          total_earning: bonusLKR
        })
        .select()
        .maybeSingle();

      if (insertErr || !inserted) {
        console.error("Failed to insert balance:", insertErr);
        return NextResponse.json({ error: "Failed to create balance" }, { status: 500 });
      }
      updatedBalance = inserted;
    }

    return NextResponse.json({ success: true, balance: updatedBalance });
  } catch (error) {
    console.error("Claim bonus api error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
