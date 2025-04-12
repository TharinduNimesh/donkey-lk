import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Create response
  const res = NextResponse.next()
  
  // Create client
  const supabase = createMiddlewareClient({ req, res })
  
  // Refresh session if needed (but don't do additional redirects)
  await supabase.auth.getSession()
  
  // Continue with the request
  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}