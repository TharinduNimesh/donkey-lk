import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerComponentClient, type SupabaseClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/database.types";
import { 
  generatePayHereHash, 
  getPaymentEnvironmentVariables,
  validateTaskOwnership 
} from "@/lib/utils/payment";

async function getTaskDetails(taskId: number, supabase: SupabaseClient<Database>) {
  const { data: task, error } = await supabase
    .from('task_details')
    .select('*')
    .eq('task_id', taskId)
    .single();

  if (error) throw error;
  return task;
}

async function getUserDetails(userId: string, supabase: SupabaseClient<Database>) {
  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profile')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError) throw profileError;

  // Get contact details
  const { data: contacts } = await supabase
    .from('contact_details')
    .select('*')
    .eq('user_id', userId);

  const email = contacts?.find(c => c.type === 'EMAIL')?.detail || '';
  const phone = contacts?.find(c => c.type === 'MOBILE')?.detail || '';

  return { profile, email, phone };
}

export async function POST(req: NextRequest) {
  try {
    // Get and validate request body
    const body = await req.json();
    if (!body.taskId || typeof body.taskId !== 'number') {
      return NextResponse.json(
        { error: "Invalid task ID" },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createServerComponentClient<Database>({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate task ownership
    const isOwner = await validateTaskOwnership(body.taskId);
    if (!isOwner) {
      return NextResponse.json(
        { error: "Unauthorized - Not task owner" },
        { status: 403 }
      );
    }

    // Get task and user details
    const task = await getTaskDetails(body.taskId, supabase);
    const { profile, email, phone } = await getUserDetails(user.id, supabase);

    // Extract and validate cost
    const cost = task.cost as {
      amount: number;
      payment_method: Database['public']['Enums']['PaymentMethod'];
      is_paid: boolean;
    };

    if (!cost || cost.is_paid) {
      return NextResponse.json(
        { error: "Invalid payment request" },
        { status: 400 }
      );
    }

    // Get PayHere configuration
    const { 
      merchantId, 
      merchantSecret,
      notifyUrl,
      returnUrl,
      cancelUrl,
      checkoutUrl,
      authorizeUrl 
    } = await getPaymentEnvironmentVariables();

    // Format amount and generate hash
    const formattedAmount = cost.amount.toFixed(2);
    const hash = generatePayHereHash(
      merchantId,
      body.taskId,
      formattedAmount,
      'LKR',
      merchantSecret
    );

    // Split name into first and last name
    const [firstName, ...lastNameParts] = profile.name.split(' ');
    const lastName = lastNameParts.join(' ') || firstName;

    // Prepare PayHere form data
    const formData = {
      merchant_id: merchantId,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      order_id: body.taskId.toString(),
      items: task.title || 'Task Payment',
      currency: 'LKR',
      amount: formattedAmount,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      address: 'Sri Lanka',
      city: 'Colombo',
      country: 'Sri Lanka',
      hash,
      custom_1: user.id,
      custom_2: task.task_id?.toString(),
      checkout_url: checkoutUrl,
      authorize_url: authorizeUrl
    };

    return NextResponse.json(formData);
  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}