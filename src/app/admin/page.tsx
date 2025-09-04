// app/admin/page.tsx - Force Dynamic Rendering
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '../lib/supabaseServer'
import AdminDashboard from '../components/AdminDashboard'
import AdminErrorBoundary from './AdminErrorBoundary'
import type { Metadata } from 'next'

// ✅ CRITICAL: Force dynamic rendering - prevents build-time auth errors
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export const metadata: Metadata = {
  title: 'Admin Dashboard | Daily Tidbit',
  description: 'Administrative dashboard for Daily Tidbit',
}

async function checkAdminAccess() {
  try {
    const supabase = await createServerSupabaseClient()
    
    if (!supabase) {
      console.error('Failed to create Supabase server client')
      throw new Error('Database connection unavailable')
    }

    // Get the current user with timeout
    let user = null
    let userError = null
    
    try {
      const result = await Promise.race([
        supabase.auth.getUser(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('User fetch timeout')), 5000)
        )
      ]) as any
      
      user = result.data?.user
      userError = result.error
    } catch (error) {
      console.warn('User fetch failed:', error)
      userError = error
    }

    if (userError || !user) {
      console.warn('Admin access denied - no authenticated user:', userError)
      redirect('/auth?redirect=/admin&error=not_authenticated')
    }

    // Check if user is admin
    let profile = null
    let profileError = null

    try {
      const result = await Promise.race([
        supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
        )
      ]) as any

      profile = result.data
      profileError = result.error
    } catch (error) {
      console.warn('Profile fetch failed:', error)
      profileError = error
    }

    if (profileError) {
      console.error('Admin access check failed:', {
        error: profileError.message || String(profileError),
        userId: user.id,
        timestamp: new Date().toISOString()
      })
      
      if (profileError.message?.includes('database') || profileError.message?.includes('connection')) {
        redirect('/auth?redirect=/admin&error=database_unavailable')
      }
    }

    if (!profile) {
      console.warn('Admin access denied - no profile found:', user.id)
      redirect('/?error=profile_not_found')
    }

    if (profile.role !== 'admin') {
      console.warn('Admin access denied - insufficient permissions:', {
        userId: user.id,
        userRole: profile.role,
        timestamp: new Date().toISOString()
      })
      redirect('/?error=insufficient_permissions')
    }

    console.log('Admin access granted:', {
      userId: user.id,
      timestamp: new Date().toISOString()
    })

    return user
  } catch (error) {
    console.error('Admin auth error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })

    if (error instanceof Error) {
      if (error.message.includes('NEXT_REDIRECT')) {
        // This is expected - let the redirect happen
        throw error
      }
      if (error.message.includes('Database connection')) {
        redirect('/auth?redirect=/admin&error=database_unavailable')
      } else if (error.message.includes('timeout')) {
        redirect('/auth?redirect=/admin&error=service_timeout')
      }
    }
    
    redirect('/auth?redirect=/admin&error=verification_failed')
  }
}

export default async function AdminPage() {
  try {
    // Server-side auth check
    await checkAdminAccess()
    
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminErrorBoundary>
          <AdminDashboard />
        </AdminErrorBoundary>
      </div>
    )
  } catch (error) {
    // Let redirects pass through
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error
    }
    
    console.error('Admin page render error:', error)
    
    // Fallback UI for unexpected errors
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Access Error</h1>
          <p className="text-gray-600 mb-6">
            There was an issue verifying your admin access. Please try again.
          </p>
          <div className="space-y-3">
            <a
              href="/auth?redirect=/admin"
              className="block w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Try Again
            </a>
            <a
              href="/"
              className="block w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    )
  }
}