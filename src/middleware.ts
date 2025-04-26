import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { isUserAdmin, isUserBuyer, isUserInfluencer } from "@/lib/utils/user";

export async function middleware(req: NextRequest) {
  // Create response
  const res = NextResponse.next();

  // Create client
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if needed (but don't do additional redirects)
  await supabase.auth.getSession();

  // Role-based dashboard navigation
  const url = req.nextUrl.clone();
  const path = url.pathname;

  if (path.startsWith("/dashboard")) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Not authenticated, redirect to login
      return NextResponse.redirect(new URL("/login", req.url));
    }
    const userId = user.id;
    // Check roles
    let isAdmin = false, isBuyer = false, isInfluencer = false;
    try {
      [isAdmin, isBuyer, isInfluencer] = await Promise.all([
        isUserAdmin(userId),
        isUserBuyer(userId),
        isUserInfluencer(userId)
      ]);
    } catch (e) {
      // If error, redirect to error page
      return NextResponse.redirect(new URL("/error?reason=role", req.url));
    }
    // Route protection logic
    if (path.startsWith("/dashboard/admin") && !isAdmin) {
      // Not admin, redirect to correct dashboard
      if (isBuyer) return NextResponse.redirect(new URL("/dashboard/buyer", req.url));
      if (isInfluencer) return NextResponse.redirect(new URL("/dashboard/influencer", req.url));
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (path.startsWith("/dashboard/buyer") && !isBuyer) {
      if (isAdmin) return NextResponse.redirect(new URL("/dashboard/admin", req.url));
      if (isInfluencer) return NextResponse.redirect(new URL("/dashboard/influencer", req.url));
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (path.startsWith("/dashboard/influencer") && !isInfluencer) {
      if (isAdmin) return NextResponse.redirect(new URL("/dashboard/admin", req.url));
      if (isBuyer) return NextResponse.redirect(new URL("/dashboard/buyer", req.url));
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Continue with the request
  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}