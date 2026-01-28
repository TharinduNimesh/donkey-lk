import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { taskId, paymentMethod } = await req.json();

    if (!taskId || !paymentMethod) {
      return NextResponse.json({ error: "Missing taskId or paymentMethod" }, { status: 400 });
    }

    const allowed = ["PAYMENT_GATEWAY", "BANK_TRANSFER"];
    if (!allowed.includes(paymentMethod)) {
      return NextResponse.json({ error: "Invalid paymentMethod" }, { status: 400 });
    }

    // Update existing task_cost row for the task. calculate-cost should have created this row.
    const { data, error } = await supabaseAdmin
      .from('task_cost')
      .update({ payment_method: paymentMethod })
      .eq('task_id', taskId)
      .select('*');

    if (error) {
      console.error('Failed to update task_cost payment_method:', error);
      return NextResponse.json({ error: 'Failed to update payment method' }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'task_cost not found for given taskId' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
