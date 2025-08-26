// src/app/lib/adminAuth.ts
// Simplified admin auth that works with your existing setup
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function isUserAdmin(): Promise<boolean> {
  try {
    const jar = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(n: string) { return jar.get(n)?.value },
          set() {}, // No-op for server-side
          remove() {} // No-op for server-side
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return false

    // SIMPLE EMAIL-BASED ADMIN CHECK
    // Replace these emails with your actual admin emails
    const adminEmails = [
      'admin@dailytidbit.com',
      'your-email@example.com', // Replace with your actual email
      // Add more admin emails as needed
    ]
    
    return adminEmails.includes(user.email)

  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

export async function requireAdmin() {
  const isAdmin = await isUserAdmin()
  if (!isAdmin) {
    throw new Error('Admin access required')
  }
  return true
}

// FOR DEVELOPMENT/TESTING ONLY - Remove in production
export async function requireAdminDev() {
  try {
    const jar = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(n: string) { return jar.get(n)?.value },
          set() {},
          remove() {}
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Authentication required')
    }
    
    // DEVELOPMENT ONLY - allows any authenticated user
    console.log(`[DEV] Allowing admin access for: ${user.email}`)
    return true
    
  } catch (error) {
    console.error('Dev admin check error:', error)
    throw new Error('Authentication required')
  }
}