// middleware.ts - Enhanced SSR cookie authentication and token refresh
import { type NextRequest } from 'next/server'
import { updateSession } from './src/app/lib/supabase-middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files) 
     * - favicon and icon files
     * - API routes (they handle their own auth)
     * - Public assets
     */
    '/((?!_next/static|_next/image|favicon|icon-|apple-touch-icon|web-app-manifest|site\.webmanifest|browserconfig\.xml|robots\.txt|sitemap\.xml|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}