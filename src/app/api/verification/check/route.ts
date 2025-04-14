import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'
import { fetchYoutubeChannelInfo } from '@/lib/youtube'
import { NextRequest } from 'next/server'

// Input validation schema
const requestSchema = z.object({
  profileId: z.number()
})

export async function POST(request: NextRequest) {
  try {
    const { contactId, code } = await request.json();

    if (!contactId || !code) {
      return NextResponse.json(
        { error: 'Contact ID and verification code are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client for user authentication and validation
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

    // Get contact details and verify ownership using user's client
    const { data: contact, error: contactError } = await supabase
      .from('contact_details')
      .select('id')
      .eq('id', contactId)
      .eq('user_id', user.id)
      .single();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Check verification code using admin client
    const now = new Date().toISOString();
    const { data: verification, error: verificationError } = await supabaseAdmin
      .from('contact_verifications')
      .select('*')
      .eq('contact_id', contactId)
      .eq('code', parseInt(code))
      .gt('expired_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (verificationError || !verification) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    // Mark contact as verified using admin client
    const { error: updateError } = await supabaseAdmin
      .from('contact_status')
      .update({
        contact_id: contactId,
        is_verified: true,
        verified_at: now
      })
      .eq('contact_id', contactId)
      .eq('is_verified', false);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update verification status' },
        { status: 500 }
      );
    }

    // Delete used verification code using admin client
    await supabaseAdmin
      .from('contact_verifications')
      .delete()
      .eq('id', verification.id);

    return NextResponse.json({
      message: 'Contact verified successfully'
    });

  } catch (error) {
    console.error('Error in check verification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}