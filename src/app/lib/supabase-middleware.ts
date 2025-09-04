// src/app/lib/supabase-middleware.ts - SSR session management and token refresh
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname

  // Handle auth callback routes first (before getUser call)
  if (pathname === '/auth/callback') {
    const url = request.nextUrl
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')
    const redirectTo = url.searchParams.get('redirectTo') || '/'

    if (error) {
      console.error('Auth callback error:', error)
      const errorUrl = new URL('/auth', request.url)
      errorUrl.searchParams.set('error', error)
      return NextResponse.redirect(errorUrl)
    }

    if (code) {
      try {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        
        if (exchangeError) {
          console.error('Code exchange error:', exchangeError)
          const errorUrl = new URL('/auth', request.url)
          errorUrl.searchParams.set('error', 'auth_failed')
          return NextResponse.redirect(errorUrl)
        }

        // Successful auth - redirect to intended destination
        return NextResponse.redirect(new URL(redirectTo, request.url))
      } catch (error) {
        console.error('Auth exchange exception:', error)
        const errorUrl = new URL('/auth', request.url)
        errorUrl.searchParams.set('error', 'auth_failed')
        return NextResponse.redirect(errorUrl)
      }
    }
  }

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Auth-protected routes
  const protectedPaths = ['/admin', '/partners', '/bitboard']
  const isProtectedPath = protectedPaths.some(path => 
    pathname.startsWith(path)
  )

  if (!user && isProtectedPath) {
    // No user, redirect to login
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (user && pathname.startsWith('/auth') && pathname !== '/auth/callback') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Admin-only routes
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }

    try {
      // Check if user is admin
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, is_admin')
        .eq('id', user.id)
        .single()

      if (error || (!profile?.is_admin && profile?.role !== 'admin')) {
        console.warn('Admin access denied for user:', user.id)
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
    } catch (error) {
      console.error('Error checking admin role:', error)
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Partner-only routes
  if (pathname.startsWith('/partners') && pathname !== '/partners/request-access') {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }

    try {
      // Check if user has partner access
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, company_id')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile for partner access:', error)
        const url = request.nextUrl.clone()
        url.pathname = '/partners/request-access'
        return NextResponse.redirect(url)
      }

      const hasPartnerAccess = profile?.role === 'admin' || 
                             profile?.role === 'partner' || 
                             profile?.company_id

      if (!hasPartnerAccess) {
        const url = request.nextUrl.clone()
        url.pathname = '/partners/request-access'
        return NextResponse.redirect(url)
      }
    } catch (error) {
      console.error('Exception checking partner access:', error)
      const url = request.nextUrl.clone()
      url.pathname = '/partners/request-access'
      return NextResponse.redirect(url)
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you&apos;re creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so: NextResponse.next({ request })
  // 2. Copy over the cookies, like so: response.cookies.setAll(supabaseResponse.cookies.getAll())

  return supabaseResponse
}