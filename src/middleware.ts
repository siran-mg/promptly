import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales, defaultLocale } from './config/locales';

// Function to detect the preferred locale from the Accept-Language header
function detectLocale(req: NextRequest): string {
  const acceptLanguage = req.headers.get('accept-language');
  console.log('Accept-Language header:', acceptLanguage);

  if (!acceptLanguage) return defaultLocale;

  // Parse the Accept-Language header
  const preferredLocales = acceptLanguage
    .split(',')
    .map(lang => {
      const [locale, priority = '1.0'] = lang.trim().split(';q=');
      return { locale: locale.split('-')[0], priority: parseFloat(priority) };
    })
    .sort((a, b) => b.priority - a.priority);

  console.log('Parsed preferred locales:', preferredLocales);

  // Find the first supported locale
  for (const { locale } of preferredLocales) {
    if (locales.includes(locale)) {
      console.log('Found supported locale:', locale);
      return locale;
    }
  }

  console.log('No supported locale found, using default:', defaultLocale);
  return defaultLocale;
}

export async function middleware(req: NextRequest) {
  // Check if the pathname is for static files or API routes
  const isStaticFile = req.nextUrl.pathname.includes('.');
  const isApiRoute = req.nextUrl.pathname.startsWith('/api');

  if (isStaticFile || isApiRoute) {
    return NextResponse.next();
  }

  // Extract the locale from the pathname
  const segments = req.nextUrl.pathname.split('/');
  const hasLocalePrefix = segments.length > 1 && locales.includes(segments[1]);
  // Use the detected locale if no locale is specified in the URL
  const currentLocale = hasLocalePrefix ? segments[1] : detectLocale(req);

  console.log('URL path:', req.nextUrl.pathname);
  console.log('Has locale prefix:', hasLocalePrefix);
  console.log('Current locale:', currentLocale);

  // If the pathname doesn't have a locale prefix, redirect to add it
  // Skip redirects for static files, API routes, and Next.js internal routes
  if (!hasLocalePrefix &&
      !req.nextUrl.pathname.startsWith('/_next') &&
      !req.nextUrl.pathname.includes('.') &&
      !req.nextUrl.pathname.startsWith('/api')) {
    // Detect the preferred locale from the browser
    const preferredLocale = detectLocale(req);
    const url = new URL(`/${preferredLocale}${req.nextUrl.pathname}`, req.url);
    url.search = req.nextUrl.search;
    return NextResponse.redirect(url);
  }

  // Remove the locale from the pathname for further processing
  const pathWithoutLocale = hasLocalePrefix
    ? `/${segments.slice(2).join('/')}`
    : req.nextUrl.pathname;

  // Handle authentication
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If the user is not signed in and the route is protected, redirect to login
  const isProtectedRoute = pathWithoutLocale.startsWith('/dashboard') ||
                          pathWithoutLocale.startsWith('/account');

  if (!session && isProtectedRoute) {
    const redirectUrl = new URL(`/${currentLocale}/login`, req.url);
    redirectUrl.searchParams.set('redirectedFrom', pathWithoutLocale);
    return NextResponse.redirect(redirectUrl);
  }

  // If the user is signed in and trying to access auth pages, redirect to dashboard
  const isAuthRoute = pathWithoutLocale === '/login' ||
                     pathWithoutLocale === '/signup' ||
                     pathWithoutLocale === '/forgot-password';

  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL(`/${currentLocale}/dashboard`, req.url));
  }

  // We're removing the special handling for dashboard routes to prevent redirect loops
  // Instead, we'll let the dashboard routes be handled by their respective pages

  return res;
}
