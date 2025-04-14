import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

// Input validation schema
const requestSchema = z.object({
  platform: z.enum(['YOUTUBE', 'FACEBOOK', 'TIKTOK', 'INSTAGRAM']),
  profileId: z.number()
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const body = requestSchema.parse(json)

    // Get authenticated user - properly initialize with cookie store
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate that the profile belongs to the user
    const { data: profile, error: profileError } = await supabase
      .from('influencer_profile')
      .select('id')
      .eq('id', body.profileId)
      .eq('user_id', user.id)
      .eq('platform', body.platform)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Invalid profile or unauthorized access' },
        { status: 403 }
      )
    }

    // Check for existing unused verification code
    const { data: existingCode } = await supabaseAdmin
      .from('influencer_profile_verifications')
      .select('code')
      .eq('profile_id', profile.id)
      .eq('is_used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existingCode) {
      return NextResponse.json({
        code: existingCode.code
      })
    }

    // Generate unique verification code
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    const verificationCode = `DNKY${random}${timestamp}`

    // Store verification code using admin client
    const { error: codeError } = await supabaseAdmin
      .from('influencer_profile_verifications')
      .insert({
        profile_id: profile.id,
        code: verificationCode,
        is_used: false
      })

    if (codeError) {
      console.error('Code creation error:', codeError)
      return NextResponse.json(
        { error: 'Failed to generate verification code' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      code: verificationCode
    })

  } catch (error) {
    console.error('Verification code generation error:', error)
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