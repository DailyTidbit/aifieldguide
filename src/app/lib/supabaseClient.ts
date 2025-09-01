// app/lib/supabaseClient.ts - CONSOLIDATED HYDRATION SAFE VERSION
'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'

// ✅ Environment validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// ✅ HYDRATION SAFE: Singleton pattern with browser checks
let supabaseClientInstance: SupabaseClient | null = null
let isInitialized = false

// ✅ HYDRATION SAFE: Only create client in browser environment
function getSupabaseBrowserClient(): SupabaseClient | null {
  // Guard against server-side execution
  if (typeof window === 'undefined') {
    return null
  }

  // Only create instance once and when actually needed
  if (!supabaseClientInstance && !isInitialized) {
    try {
      supabaseClientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
      isInitialized = true
    } catch (error) {
      console.error('Failed to create Supabase browser client:', error)
      isInitialized = true // Prevent retries
      return null
    }
  }

  return supabaseClientInstance
}

// ✅ HYDRATION SAFE: Safe client getter with error handling
export function getSupabaseBrowserClientSafe(): SupabaseClient {
  const client = getSupabaseBrowserClient()
  
  if (!client) {
    throw new Error(
      'Supabase browser client not available. This function should only be called in browser environment after component mount.'
    )
  }
  
  return client
}

// ✅ Check if client is available
export function isSupabaseBrowserClientAvailable(): boolean {
  return typeof window !== 'undefined' && supabaseClientInstance !== null
}

// ✅ HYDRATION SAFE: Main exports with fallbacks
export const supabaseClient = (() => {
  if (typeof window === 'undefined') {
    // Return null on server-side for backward compatibility
    return null
  }
  return getSupabaseBrowserClient()
})()

// ✅ Backward compatibility aliases
export const supabase = supabaseClient
export default supabaseClient

// ✅ Alternative getter function for consistency
export { getSupabaseBrowserClient }

// ✅ React Hook for hydration-safe Supabase usage
export function useSupabaseBrowser() {
  const [client, setClient] = useState<SupabaseClient | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Initialize client after mount
    const supabaseClient = getSupabaseBrowserClient()
    setClient(supabaseClient)
    setIsReady(!!supabaseClient)
  }, [])

  return {
    client: mounted ? client : null,
    isReady: mounted && isReady,
    mounted
  }
}

// ✅ Hook for authentication state (hydration-safe)
export function useSupabaseAuth() {
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    
    const client = getSupabaseBrowserClient()
    if (!client) {
      setLoading(false)
      return
    }

    // Get initial session
    client.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  return {
    user: mounted ? user : null,
    session: mounted ? session : null,
    loading: mounted ? loading : true,
    mounted,
    isAuthenticated: mounted ? !!user : false
  }
}

// ✅ Utility functions for safe Supabase operations
export async function safeSupabaseOperation<T>(
  operation: (client: SupabaseClient) => Promise<T>,
  fallback?: T
): Promise<T | null> {
  if (typeof window === 'undefined') {
    console.warn('Supabase operation attempted on server-side')
    return fallback ?? null
  }

  const client = getSupabaseBrowserClient()
  if (!client) {
    console.warn('Supabase client not available')
    return fallback ?? null
  }

  try {
    return await operation(client)
  } catch (error) {
    console.error('Supabase operation failed:', error)
    return fallback ?? null
  }
}

// ✅ Type-safe wrapper for common Supabase queries
export class SafeSupabaseQuery {
  private client: SupabaseClient | null

  constructor() {
    this.client = typeof window !== 'undefined' ? getSupabaseBrowserClient() : null
  }

  isReady(): boolean {
    return this.client !== null
  }

  async select<T = any>(
    table: string,
    query: string = '*',
    filters?: Record<string, any>
  ): Promise<{ data: T[] | null; error: any; count?: number | null }> {
    if (!this.client) {
      return { data: null, error: new Error('Supabase client not available') }
    }

    try {
      let queryBuilder = this.client.from(table).select(query)

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          queryBuilder = queryBuilder.eq(key, value)
        })
      }

      const result = await queryBuilder
      return {
        data: result.data as T[] | null,
        error: result.error,
        count: result.count
      }
    } catch (error) {
      return { data: null, error }
    }
  }

  async insert<T = any>(
    table: string,
    data: any
  ): Promise<{ data: T[] | null; error: any }> {
    if (!this.client) {
      return { data: null, error: new Error('Supabase client not available') }
    }

    try {
      const result = await this.client.from(table).insert(data).select()
      return {
        data: result.data as T[] | null,
        error: result.error
      }
    } catch (error) {
      return { data: null, error }
    }
  }

  async update<T = any>(
    table: string,
    data: any,
    filters: Record<string, any>
  ): Promise<{ data: T[] | null; error: any }> {
    if (!this.client) {
      return { data: null, error: new Error('Supabase client not available') }
    }

    try {
      let queryBuilder = this.client.from(table).update(data)

      Object.entries(filters).forEach(([key, value]) => {
        queryBuilder = queryBuilder.eq(key, value)
      })

      const result = await queryBuilder.select()
      return {
        data: result.data as T[] | null,
        error: result.error
      }
    } catch (error) {
      return { data: null, error }
    }
  }

  async delete<T = any>(
    table: string,
    filters: Record<string, any>
  ): Promise<{ data: T[] | null; error: any }> {
    if (!this.client) {
      return { data: null, error: new Error('Supabase client not available') }
    }

    try {
      let queryBuilder = this.client.from(table).delete()

      Object.entries(filters).forEach(([key, value]) => {
        queryBuilder = queryBuilder.eq(key, value)
      })

      const result = await queryBuilder.select()
      return {
        data: result.data as T[] | null,
        error: result.error
      }
    } catch (error) {
      return { data: null, error }
    }
  }
}

// ✅ Global instance for convenience (hydration-safe)
export const safeSupabaseQuery = new SafeSupabaseQuery()

// ✅ Environment validation (useful for debugging)
export function validateSupabaseBrowserEnvironment(): { 
  valid: boolean; 
  missing: string[];
  isBrowser: boolean;
} {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]

  const missing = required.filter(key => !process.env[key])
  const isBrowser = typeof window !== 'undefined'

  return {
    valid: missing.length === 0 && isBrowser,
    missing,
    isBrowser
  }
}