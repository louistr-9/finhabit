import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with cross-site request forgery (CSRF) protection.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define protected routes that require an authenticated user
  const protectedRoutes = ['/finance', '/habit', '/report', '/settings'];
  const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route));
  
  // If user is trying to access a protected route without being authenticated
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If user is logged in and trying to access the login page
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone();
    url.pathname = '/finance';
    return NextResponse.redirect(url);
  }

  // If user goes to the root path and is logged in, redirect them to /finance
  if (user && request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/finance';
    return NextResponse.redirect(url);
  }

  // If user goes to the root path and is NOT logged in, let them see a landing page or redirect to login.
  // For now, redirect to /login.
  if (!user && request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
