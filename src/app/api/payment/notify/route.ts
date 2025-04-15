import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient, type SupabaseClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/database.types";
import { 
  validatePayHereNotification, 
  getPaymentEnvironmentVariables,
  updatePaymentStatus
} from "@/lib/utils/payment";

// Required fields in PayHere notification
const REQUIRED_FIELDS = [
  'merchant_id',
  'order_id',
  'payhere_amount',
  'payhere_currency',
  'status_code',
  'md5sig'
] as const;

type PayhereNotification = {
  merchant_id: string;
  order_id: string;
  payhere_amount: string;
  payhere_currency: string;
  status_code: string;
  md5sig: string;
  method?: string;
  payment_id?: string;
  card_holder_name?: string;
  card_no?: string;
  card_expiry?: string;
};

async function validateFormData(formData: FormData): Promise<PayhereNotification> {
  const notification: Partial<PayhereNotification> = {};

  // Validate required fields
  for (const field of REQUIRED_FIELDS) {
    const value = formData.get(field);
    if (!value || typeof value !== 'string') {
      throw new Error(`Missing or invalid required field: ${field}`);
    }
    notification[field] = value;
  }

  // Validate order_id format (must be a number)
  if (!/^\d+$/.test(notification.order_id!)) {
    throw new Error('Invalid order_id format');
  }

  // Validate amount format (must be a valid decimal number)
  if (!/^\d+(\.\d{2})?$/.test(notification.payhere_amount!)) {
    throw new Error('Invalid amount format');
  }

  // Validate currency (only LKR supported for now)
  if (notification.payhere_currency !== 'LKR') {
    throw new Error('Invalid currency. Only LKR is supported.');
  }

  // Validate status code (must be a valid PayHere status)
  if (!['2', '0', '-1', '-2'].includes(notification.status_code!)) {
    throw new Error('Invalid status code');
  }

  return notification as PayhereNotification;
}

async function verifyTaskStatus(taskId: number, supabase: SupabaseClient<Database>) {
  const { data: task, error } = await supabase
    .from('tasks')
    .select('status')
    .eq('id', taskId)
    .single();

  if (error) throw error;
  if (!task) throw new Error('Task not found');
  if (task.status !== 'DRAFT') throw new Error('Invalid task status for payment');

  return task;
}

export async function POST(req: NextRequest) {
  try {
    // Validate content type and user agent
    const contentType = req.headers.get('content-type');
    const userAgent = req.headers.get('user-agent');
    console.log('[PayHere Notify] Content-Type:', contentType);
    console.log('[PayHere Notify] User-Agent:', userAgent);
    
    if (!contentType?.includes('multipart/form-data') && !contentType?.includes('application/x-www-form-urlencoded')) {
      console.error('[PayHere Notify] Invalid content type:', contentType);
      return NextResponse.json(
        { error: 'Invalid content type. Expected multipart/form-data or application/x-www-form-urlencoded' },
        { status: 400 }
      );
    }

    // Verify PayHere User-Agent
    if (!userAgent?.startsWith('PayHere-HttpClient')) {
      console.error('[PayHere Notify] Invalid User-Agent:', userAgent);
      return NextResponse.json(
        { error: 'Invalid User-Agent' },
        { status: 400 }
      );
    }

    let formData: FormData;
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      const formDataObject = new FormData();
      const bodyText = await req.text();
      const urlParams = new URLSearchParams(bodyText);
      urlParams.forEach((value, key) => {
        formDataObject.append(key, value);
      });
      formData = formDataObject;
    } else {
      formData = await req.formData();
    }

    console.log('[PayHere Notify] Received form data fields:', Array.from(formData.keys()));
    
    const notification = await validateFormData(formData);
    console.log('[PayHere Notify] Validated notification data:', {
      merchant_id: notification.merchant_id,
      order_id: notification.order_id,
      amount: notification.payhere_amount,
      currency: notification.payhere_currency,
      status_code: notification.status_code
    });

    // Get PayHere configuration
    const { merchantId, merchantSecret } = await getPaymentEnvironmentVariables();
    console.log('[PayHere Notify] Merchant ID match:', merchantId === notification.merchant_id);

    // Validate notification signature
    const isValid = validatePayHereNotification(
      notification.merchant_id,
      notification.order_id,
      notification.payhere_amount,
      notification.payhere_currency,
      notification.status_code,
      notification.md5sig,
      merchantSecret
    );

    if (!isValid) {
      console.error('[PayHere Notify] Invalid signature. Received signature:', notification.md5sig);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createServerComponentClient<Database>({ cookies });
    const taskId = parseInt(notification.order_id);

    // Handle successful payment
    if (notification.status_code === '2') {
      // Verify task exists and is in DRAFT status
      await verifyTaskStatus(taskId, supabase);

      // Collect payment details
      const paymentDetails = {
        is_paid: true,
        payment_method: 'PAYMENT_GATEWAY' as const,
        paid_at: new Date().toISOString(),
        metadata: {
          payment_id: notification.payment_id,
          payment_method: notification.method,
          card_holder_name: notification.card_holder_name,
          card_no: notification.card_no,
          card_expiry: notification.card_expiry
        }
      };

      // Update payment status and task status
      await updatePaymentStatus(taskId, paymentDetails);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('[PayHere Notify] Error details:', {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}