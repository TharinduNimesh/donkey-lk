import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'
import { fetchYoutubeChannelInfo } from '@/lib/youtube'

// Input validation schema
const requestSchema = z.object({
  profileId: z.number()
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const body = requestSchema.parse(json)

    // Get authenticated user
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the profile and its verification code using admin client
    const { data: profile } = await supabaseAdmin
      .from('influencer_profile')
      .select(`
        id,
        url,
        user_id,
        influencer_profile_verifications!inner(
          id,
          code,
          is_used
        )
      `)
      .eq('id', body.profileId)
      .eq('user_id', user.id)
      .eq('platform', 'YOUTUBE')
      .eq('influencer_profile_verifications.is_used', false)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found or no pending verification' },
        { status: 404 }
      )
    }

    if (profile.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      )
    }

    const verificationCode = profile.influencer_profile_verifications[0].code

    // Fetch current channel info using the YouTube utility
    const channelInfo = await fetchYoutubeChannelInfo(profile.url)

    // Check if verification code exists in description
    if (!channelInfo.description.includes(`#${verificationCode}`)) {
      return NextResponse.json(
        { error: 'Verification code not found in channel description' },
        { status: 400 }
      )
    }

    // Start a transaction to update both profile and verification status
    const { error: updateError } = await supabaseAdmin.rpc('verify_youtube_channel', {
      p_profile_id: profile.id,
      p_verification_id: profile.influencer_profile_verifications[0].id
    })

    if (updateError) {
      console.error('Verification update error:', updateError)
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: 'Channel verified successfully'
    })

  } catch (error) {
    console.error('Verification check error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}