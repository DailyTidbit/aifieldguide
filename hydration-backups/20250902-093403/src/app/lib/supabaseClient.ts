// app/lib/supabaseClient.ts - CONSOLIDATED HYDRATION SAFE VERSION
'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'

// Environment validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey
  })
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// HYDRATION SAFE: Singleton pattern with browser checks
let supabaseClientInstance: SupabaseClient | null = null
let isInitialized = false

// HYDRATION SAFE: Only create client in browser environment
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
      console.log('Supabase browser client initialized successfully')
    } catch (error) {
      console.error('Failed to create Supabase browser client:', error)
      isInitialized = true // Prevent retries
      return null
    }
  }

  return supabaseClientInstance
}

// HYDRATION SAFE: Safe client getter with better error handling
export function getSupabaseBrowserClientSafe(): SupabaseClient | null {
  const client = getSupabaseBrowserClient()
  
  if (!client) {
    console.warn('Supabase browser client not available. Check environment variables and ensure this is called in browser context after mount.')
    return null
  }
  
  return client
}

// Alternative throwing version for cases that require a client
export function getSupabaseBrowserClientOrThrow(): SupabaseClient {
  const client = getSupabaseBrowserClient()
  
  if (!client) {
    throw new Error(
      'Supabase browser client not available. This function should only be called in browser environment after component mount.'
    )
  }
  
  return client
}

// Check if client is available
export function isSupabaseBrowserClientAvailable(): boolean {
  return typeof window !== 'undefined' && supabaseClientInstance !== null
}

// HYDRATION SAFE: Main exports with fallbacks
export const supabaseClient = (() => {
  if (typeof window === 'undefined') {
    // Return null on server-side for backward compatibility
    return null
  }
  return getSupabaseBrowserClient()
})()

// Backward compatibility aliases
export const supabase = supabaseClient
export default supabaseClient

// Alternative getter function for consistency
export { getSupabaseBrowserClient }

// React Hook for hydration-safe Supabase usage
export function useSupabaseBrowser() {
  const [client, setClient] = useState<SupabaseClient | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    
    // Initialize client after mount
    try {
      const supabaseClient = getSupabaseBrowserClient()
      setClient(supabaseClient)
      setIsReady(!!supabaseClient)
      
      if (!supabaseClient) {
        setError('Failed to initialize Supabase client')
      }
    } catch (err) {
      console.error('Error initializing Supabase:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setIsReady(false)
    }
  }, [])

  return {
    client: mounted ? client : null,
    isReady: mounted && isReady,
    mounted,
    error: mounted ? error : null
  }
}

// Hook for authentication state (hydration-safe)
export function useSupabaseAuth() {
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    
    const client = getSupabaseBrowserClient()
    if (!client) {
      setLoading(false)
      setError('Supabase client not available')
      return
    }

    // Get initial session
    client.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Auth session error:', error)
        setError(error.message)
      } else {
        setSession(session)
        setUser(session?.user ?? null)
      }
      setLoading(false)
    }).catch((err) => {
      console.error('Auth session fetch failed:', err)
      setError(err.message)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        setError(null) // Clear errors on successful state change
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
    isAuthenticated: mounted ? !!user : false,
    error: mounted ? error : null
  }
}

// Utility functions for safe Supabase operations
export async function safeSupabaseOperation<T>(
  operation: (client: SupabaseClient) => Promise<T>,
  fallback?: T
): Promise<{ data: T | null; error: string | null }> {
  if (typeof window === 'undefined') {
    console.warn('Supabase operation attempted on server-side')
    return { data: fallback ?? null, error: 'Server-side operation not allowed' }
  }

  const client = getSupabaseBrowserClient()
  if (!client) {
    console.warn('Supabase client not available')
    return { data: fallback ?? null, error: 'Supabase client not available' }
  }

  try {
    const result = await operation(client)
    return { data: result, error: null }
  } catch (error) {
    console.error('Supabase operation failed:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { data: fallback ?? null, error: errorMessage }
  }
}

// Type-safe wrapper for common Supabase queries
export class SafeSupabaseQuery {
  private client: SupabaseClient | null

  constructor() {
    this.client = typeof window !== 'undefined' ? getSupabaseBrowserClient() : null
  }

  isReady(): boolean {
    return this.client !== null
  }

  getClient(): SupabaseClient | null {
    return this.client
  }

  async select<T = any>(
    table: string,
    query: string = '*',
    filters?: Record<string, any>
  ): Promise<{ data: T[] | null; error: any; count?: number | null }> {
    if (!this.client) {
      const error = new Error('Supabase client not available')
      console.error('SafeSupabaseQuery.select failed:', error.message)
      return { data: null, error }
    }

    try {
      let queryBuilder = this.client.from(table).select(query)

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            queryBuilder = queryBuilder.in(key, value)
          } else {
            queryBuilder = queryBuilder.eq(key, value)
          }
        })
      }

      const result = await queryBuilder
      
      if (result.error) {
        console.error(`SafeSupabaseQuery.select error for table ${table}:`, result.error)
      }

      return {
        data: result.data as T[] | null,
        error: result.error,
        count: result.count
      }
    } catch (error) {
      console.error(`SafeSupabaseQuery.select exception for table ${table}:`, error)
      return { data: null, error }
    }
  }

  async insert<T = any>(
    table: string,
    data: any
  ): Promise<{ data: T[] | null; error: any }> {
    if (!this.client) {
      const error = new Error('Supabase client not available')
      console.error('SafeSupabaseQuery.insert failed:', error.message)
      return { data: null, error }
    }

    try {
      const result = await this.client.from(table).insert(data).select()
      
      if (result.error) {
        console.error(`SafeSupabaseQuery.insert error for table ${table}:`, result.error)
      }

      return {
        data: result.data as T[] | null,
        error: result.error
      }
    } catch (error) {
      console.error(`SafeSupabaseQuery.insert exception for table ${table}:`, error)
      return { data: null, error }
    }
  }

  async update<T = any>(
    table: string,
    data: any,
    filters: Record<string, any>
  ): Promise<{ data: T[] | null; error: any }> {
    if (!this.client) {
      const error = new Error('Supabase client not available')
      console.error('SafeSupabaseQuery.update failed:', error.message)
      return { data: null, error }
    }

    try {
      let queryBuilder = this.client.from(table).update(data)

      Object.entries(filters).forEach(([key, value]) => {
        queryBuilder = queryBuilder.eq(key, value)
      })

      const result = await queryBuilder.select()
      
      if (result.error) {
        console.error(`SafeSupabaseQuery.update error for table ${table}:`, result.error)
      }

      return {
        data: result.data as T[] | null,
        error: result.error
      }
    } catch (error) {
      console.error(`SafeSupabaseQuery.update exception for table ${table}:`, error)
      return { data: null, error }
    }
  }

  async delete<T = any>(
    table: string,
    filters: Record<string, any>
  ): Promise<{ data: T[] | null; error: any }> {
    if (!this.client) {
      const error = new Error('Supabase client not available')
      console.error('SafeSupabaseQuery.delete failed:', error.message)
      return { data: null, error }
    }

    try {
      let queryBuilder = this.client.from(table).delete()

      Object.entries(filters).forEach(([key, value]) => {
        queryBuilder = queryBuilder.eq(key, value)
      })

      const result = await queryBuilder.select()
      
      if (result.error) {
        console.error(`SafeSupabaseQuery.delete error for table ${table}:`, result.error)
      }

      return {
        data: result.data as T[] | null,
        error: result.error
      }
    } catch (error) {
      console.error(`SafeSupabaseQuery.delete exception for table ${table}:`, error)
      return { data: null, error }
    }
  }
}

// Global instance for convenience (hydration-safe)
export const safeSupabaseQuery = new SafeSupabaseQuery()

// Environment validation (useful for debugging)
export function validateSupabaseBrowserEnvironment(): { 
  valid: boolean; 
  missing: string[];
  isBrowser: boolean;
  hasClient: boolean;
  details: Record<string, any>;
} {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]

  const missing = required.filter(key => !process.env[key])
  const isBrowser = typeof window !== 'undefined'
  const hasClient = isBrowser && isSupabaseBrowserClientAvailable()

  return {
    valid: missing.length === 0 && isBrowser && hasClient,
    missing,
    isBrowser,
    hasClient,
    details: {
      supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'Missing',
      hasAnonKey: !!supabaseAnonKey,
      isInitialized,
      clientInstance: !!supabaseClientInstance
    }
  }
}

// Debug helper function
export async function debugSupabaseConnection(): Promise<void> {
  const validation = validateSupabaseBrowserEnvironment()
  console.log('Supabase Connection Debug:', validation)
  
  if (!validation.isBrowser) {
    console.warn('Not in browser environment')
    return
  }
  
  const client = getSupabaseBrowserClient()
  if (client) {
    console.log('Supabase client available, testing connection...')
    
    try {
      // Test a simple query to verify connection
      const { count, error } = await client
        .from('tidbits')
        .select('count', { count: 'exact', head: true })
      
      if (error) {
        console.error('Supabase connection test failed:', error)
      } else {
        console.log('Supabase connection test successful, tidbits count:', count)
      }
    } catch (err: any) {
      console.error('Supabase connection test exception:', err)
    }
  } else {
    console.error('Supabase client not available')
  }
}