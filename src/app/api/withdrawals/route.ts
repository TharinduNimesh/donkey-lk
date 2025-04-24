import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Database } from '@/types/database.types';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, withdrawalOptionId } = body;

    // Input validation
    if (!amount || !withdrawalOptionId) {
      return NextResponse.json(
        { error: "Amount and withdrawal option are required" },
        { status: 400 }
      );
    }

    if (amount < 1000) {
      return NextResponse.json(
        { error: "Minimum withdrawal amount is LKR 1,000" },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check balance using regular supabase client
    const { data: balanceData, error: balanceError } = await supabase
      .from("account_balance")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (balanceError) {
      return NextResponse.json(
        { error: "Failed to fetch balance" },
        { status: 500 }
      );
    }

    if (!balanceData || amount > balanceData.balance) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Insert withdrawal request using regular supabase client
    const { data: withdrawalData, error: withdrawalError } = await supabase
      .from("withdrawal_requests")
      .insert([
        {
          amount,
          withdrawal_option_id: withdrawalOptionId,
          user_id: user.id
        }
      ])
      .select(`
        *,
        withdrawal_options (
          bank_name,
          account_name,
          account_number,
          branch_name
        ),
        withdrawal_request_status (
          status,
          created_at
        )
      `)
      .single();

    if (withdrawalError) {
      return NextResponse.json(
        { error: "Failed to create withdrawal request" },
        { status: 500 }
      );
    }

    // Update balance using supabaseAdmin for security
    const { error: updateError } = await supabaseAdmin
      .from("account_balance")
      .update({ 
        balance: balanceData.balance - amount,
        last_withdrawal: new Date().toISOString()
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Failed to update balance:", updateError);
      // Revert withdrawal request if balance update fails
      await supabase
        .from("withdrawal_requests")
        .delete()
        .eq("id", withdrawalData.id);

      return NextResponse.json(
        { error: "Failed to process withdrawal" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: withdrawalData });
  } catch (error) {
    console.error("Withdrawal request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch withdrawal requests
    const { data: withdrawalRequests, error: withdrawalError } = await supabase
      .from("withdrawal_requests")
      .select(`
        *,
        withdrawal_options (
          bank_name,
          account_name,
          account_number,
          branch_name
        ),
        withdrawal_request_status (
          status,
          created_at
        )
      `)
      .eq("user_id", user.id)
      .order('created_at', { ascending: false });

    if (withdrawalError) {
      return NextResponse.json(
        { error: "Failed to fetch withdrawal requests" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: withdrawalRequests });
  } catch (error) {
    console.error("Fetch withdrawal requests error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}