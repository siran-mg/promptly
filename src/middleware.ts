import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If the user is not signed in and the route is protected, redirect to login
  const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard') || 
                          req.nextUrl.pathname.startsWith('/account');
  
  if (!session && isProtectedRoute) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If the user is signed in and trying to access auth pages, redirect to dashboard
  const isAuthRoute = req.nextUrl.pathname === '/login' || 
                     req.nextUrl.pathname === '/signup' || 
                     req.nextUrl.pathname === '/forgot-password';
  
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}
