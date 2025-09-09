// src/app/lib/supabase-middleware.ts - SAFE middleware without process.exit
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { validateEnvironmentForMiddleware } from './env-check'

// Run environment validation once at startup
const envCheck = validateEnvironmentForMiddleware()

export async function updateSession(request: NextRequest) {
  // SAFE: Check environment but don't crash - use graceful degradation
  if (!envCheck.canContinue) {
    console.error('[Supabase Middleware] Critical environment issues detected')
    
    // Return the configured error response for critical issues
    if (envCheck.errorResponse) {
      return envCheck.errorResponse
    }
    
    // Fallback error response if none configured
    return new Response(
      'Service temporarily unavailable due to configuration issues',
      { 
        status: 503,
        headers: {
          'Content-Type': 'text/plain',
          'Retry-After': '300'
        }
      }
    )
  }

  // SAFE: Handle missing environment variables gracefully
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase Middleware] Missing Supabase configuration')
    
    // In development, show helpful error
    if (process.env.NODE_ENV === 'development') {
      return new Response(
        'Development Error: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY',
        { status: 500 }
      )
    }
    
    // In production, graceful degradation
    return new Response('Service temporarily unavailable', { status: 503 })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
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
        } catch (authException) {
          console.error('Auth exchange exception:', authException)
          const errorUrl = new URL('/auth', request.url)
          errorUrl.searchParams.set('error', 'auth_failed')
          return NextResponse.redirect(errorUrl)
        }
      }
    }

    // SAFE: Get user with error handling
    let user
    try {
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError && userError.message !== 'Auth session missing!') {
        console.warn('Auth user fetch warning:', userError)
      }
      
      user = authUser
    } catch (userException) {
      console.error('Auth user fetch exception:', userException)
      // Continue without user - don't crash
      user = null
    }

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

    // Admin-only routes with safe error handling
    if (pathname.startsWith('/admin')) {
      if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth'
        url.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(url)
      }

      try {
        // SAFE: Check admin role with error handling
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, is_admin')
          .eq('id', user.id)
          .single()

        // SAFE: Handle database errors gracefully
        if (profileError) {
          console.error('Admin profile check error:', profileError)
          
          // In development, show more info
          if (process.env.NODE_ENV === 'development') {
            console.warn('Admin check failed - allowing access in development mode')
          } else {
            // In production, deny access on database errors
            const url = request.nextUrl.clone()
            url.pathname = '/'
            url.searchParams.set('error', 'access_check_failed')
            return NextResponse.redirect(url)
          }
        } else {
          // Check admin permissions with consistent logic
          const isAdmin = profile?.is_admin === true || profile?.role === 'admin'
          
          if (!isAdmin) {
            console.warn('Admin access denied for user:', user.id)
            const url = request.nextUrl.clone()
            url.pathname = '/'
            url.searchParams.set('error', 'insufficient_permissions')
            return NextResponse.redirect(url)
          }
        }
      } catch (adminCheckException) {
        console.error('Admin check exception:', adminCheckException)
        
        // SAFE: Don't crash on admin check errors
        if (process.env.NODE_ENV === 'production') {
          const url = request.nextUrl.clone()
          url.pathname = '/'
          url.searchParams.set('error', 'access_verification_failed')
          return NextResponse.redirect(url)
        }
        // Allow in development despite errors
      }
    }

    // Partner-only routes with safe error handling
    if (pathname.startsWith('/partners') && pathname !== '/partners/request-access') {
      if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth'
        url.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(url)
      }

      try {
        // SAFE: Check partner access with error handling
        const { data: membership, error: membershipError } = await supabase
          .from('company_users')
          .select('company_id, role')
          .eq('user_id', user.id)
          .maybeSingle()

        if (membershipError) {
          console.error('Partner membership check error:', membershipError)
          
          // SAFE: Handle database errors
          if (process.env.NODE_ENV === 'development') {
            console.warn('Partner check failed - redirecting to request access')
          }
          
          const url = request.nextUrl.clone()
          url.pathname = '/partners/request-access'
          url.searchParams.set('error', 'access_check_failed')
          return NextResponse.redirect(url)
        }

        // Check if user has partner access
        const hasPartnerAccess = membership?.company_id || 
                               membership?.role === 'partner' ||
                               membership?.role === 'company_admin'

        if (!hasPartnerAccess) {
          const url = request.nextUrl.clone()
          url.pathname = '/partners/request-access'
          return NextResponse.redirect(url)
        }
      } catch (partnerCheckException) {
        console.error('Partner check exception:', partnerCheckException)
        
        // SAFE: Don't crash on partner check errors
        const url = request.nextUrl.clone()
        url.pathname = '/partners/request-access'
        url.searchParams.set('error', 'access_verification_failed')
        return NextResponse.redirect(url)
      }
    }

    // Add environment validation headers for monitoring
    if (process.env.NODE_ENV === 'development') {
      supabaseResponse.headers.set('X-Env-Valid', envCheck.valid.toString())
      supabaseResponse.headers.set('X-Env-Can-Continue', envCheck.canContinue.toString())
      if (envCheck.result.warnings.length > 0) {
        supabaseResponse.headers.set('X-Env-Warnings', envCheck.result.warnings.length.toString())
      }
    }

    // Add health status header
    supabaseResponse.headers.set('X-Service-Status', envCheck.canContinue ? 'operational' : 'degraded')

    return supabaseResponse

  } catch (middlewareException) {
    console.error('Supabase middleware exception:', middlewareException)
    
    // SAFE: Don't crash on middleware errors - return basic response
    if (process.env.NODE_ENV === 'development') {
      return new Response(
        `Middleware Error: ${middlewareException instanceof Error ? middlewareException.message : 'Unknown error'}`,
        { status: 500 }
      )
    }
    
    // In production, return graceful error
    return new Response('Service temporarily unavailable', { 
      status: 503,
      headers: {
        'Retry-After': '60'
      }
    })
  }
}