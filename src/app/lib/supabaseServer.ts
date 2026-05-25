// app/lib/supabaseServer.ts
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Server-side Supabase client for authenticated requests
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Simple server client for public data (no auth needed)
export function createPublicServerClient() {
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: () => undefined,
        set: () => {},
        remove: () => {},
      },
      auth: {
        persistSession: false
      }
    }
  )
}

// Backward compatibility alias
export const createServerClient = createPublicServerClient;

// Service role client — bypasses RLS, for admin operations only
export function createServiceRoleClient() {
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get: () => undefined,
        set: () => {},
        remove: () => {},
      },
      auth: {
        persistSession: false
      }
    }
  )
}

// Admin client — always connects to hosted/production Supabase via PROD_SUPABASE_* vars.
// Use this in /admin routes so local dev reads/writes the same DB the refresh script targets.
export function createAdminClient() {
  const url = process.env.PROD_SUPABASE_URL
  const key = process.env.PROD_SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('PROD_SUPABASE_URL or PROD_SUPABASE_SERVICE_ROLE_KEY is not set in .env.local')
  return createSupabaseServerClient(url, key, {
    cookies: {
      get: () => undefined,
      set: () => {},
      remove: () => {},
    },
    auth: { persistSession: false },
  })
}