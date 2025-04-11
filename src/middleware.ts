import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  // Store the current URL in a cookie for the layout to use
  res.cookies.set('next-url', req.url)
  
  const { data: { session } } = await supabase.auth.getSession()

  // Auth pages middleware
  if (req.nextUrl.pathname.startsWith('/auth')) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return res
  }

  // Protected routes middleware
  if (req.nextUrl.pathname.startsWith('/dashboard') || req.nextUrl.pathname.startsWith('/setup')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth', req.url))
    }

    // Get user profile with role for dashboard routes
    if (req.nextUrl.pathname.startsWith('/dashboard/')) {
      const { data: profile } = await supabase
        .from('profile')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (!profile) {
        return NextResponse.redirect(new URL('/setup', req.url))
      }

      // Only check role-specific access for role-specific routes
      const path = req.nextUrl.pathname
      if (path.startsWith('/dashboard/influencer') && !profile.role.includes('INFLUENCER')) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
      if (path.startsWith('/dashboard/buyer') && !profile.role.includes('BUYER')) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return res
  }

  return res
}

export const config = {
  matcher: ['/auth/:path*', '/dashboard/:path*', '/setup/:path*']
}