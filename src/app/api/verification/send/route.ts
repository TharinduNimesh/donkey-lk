import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { sendSMS, generateVerificationCode } from '@/lib/utils/sms';
import { supabaseAdmin } from '@/lib/supabase-admin';

const DAILY_VERIFICATION_LIMIT = 3;
const VERIFICATION_EXPIRY_MINUTES = 15;

export async function POST(request: NextRequest) {
  try {
    const { contactId } = await request.json();

    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client for user auth and validation with proper cookies handling
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch contact details and verify ownership using user's client
    const { data: contact, error: contactError } = await supabase
      .from('contact_details')
      .select(`
        *,
        contact_status (
          is_verified
        )
      `)
      .eq('id', contactId)
      .eq('user_id', user.id)
      .single();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Check if contact is already verified
    if (contact.contact_status?.[0]?.is_verified) {
      return NextResponse.json(
        { error: 'Contact is already verified' },
        { status: 400 }
      );
    }

    // Check if contact is a mobile number
    if (contact.type !== 'MOBILE') {
      return NextResponse.json(
        { error: 'Invalid contact type. Only mobile numbers can be verified via SMS.' },
        { status: 400 }
      );
    }

    // Check daily verification limit using admin client
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: dailyVerifications, error: limitError } = await supabaseAdmin
      .from('contact_verifications')
      .select('id')
      .eq('contact_id', contactId)
      .gte('created_at', today.toISOString());

    if (limitError) {
      console.error('Error checking verification limit:', limitError);
      return NextResponse.json(
        { error: 'Error checking verification limit' },
        { status: 500 }
      );
    }

    if (dailyVerifications && dailyVerifications.length >= DAILY_VERIFICATION_LIMIT) {
      return NextResponse.json(
        { error: `Daily verification limit (${DAILY_VERIFICATION_LIMIT}) exceeded. Please try again tomorrow.` },
        { status: 429 }
      );
    }

    // Generate verification code and expiration time
    const code = parseInt(generateVerificationCode(6));
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + VERIFICATION_EXPIRY_MINUTES);

    // Store verification code in database using admin client
    const { error: insertError } = await supabaseAdmin
      .from('contact_verifications')
      .insert({
        contact_id: contactId,
        code,
        expired_at: expiresAt.toISOString()
      });

    if (insertError) {
      console.error('Error storing verification code:', insertError);
      return NextResponse.json(
        { error: 'Error storing verification code' },
        { status: 500 }
      );
    }

    // UNCOMMENT -  Send SMS -- > Uncomment this line to send SMS
    // const success = true; // Placeholder for SMS sending logic
    const { success, error: smsError } = await sendSMS({
      recipient: contact.detail,
      message: `Your DonkeyLK verification code is: ${code}. This code will expire in ${VERIFICATION_EXPIRY_MINUTES} minutes.`
    });

    if (!success) {
      // If SMS fails, delete the verification code using admin client
      await supabaseAdmin
        .from('contact_verifications')
        .delete()
        .eq('contact_id', contactId)
        .eq('code', code);

      return NextResponse.json(
        { error: 'Failed to send verification SMS' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Verification code sent successfully. Code will expire in ${VERIFICATION_EXPIRY_MINUTES} minutes.`,
      expiresAt
    });

  } catch (error) {
    console.error('Error in send verification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}