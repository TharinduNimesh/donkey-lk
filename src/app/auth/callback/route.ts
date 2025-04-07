import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)

    // Get the user session after exchange
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      // Check if user has a profile
      const { data: profile } = await supabase
        .from('profile')
        .select('*')
        .eq('id', session.user.id)
        .single()

      // If no profile exists, redirect to setup
      if (!profile) {
        return NextResponse.redirect(`${requestUrl.origin}/setup`)
      }
    }
  }

  // If profile exists or there's an error, redirect to dashboard
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}