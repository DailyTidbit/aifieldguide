// app/lib/supabaseClient.ts - FINAL SIMPLIFIED VERSION WITH FIXED SINGLETON
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

// FIXED: True singleton client instance with initialization guard
let supabaseClientInstance: SupabaseClient | null = null
let isInitializing = false

// Primary client getter - returns null on server, client instance in browser
export function getSupabaseBrowserClient(): SupabaseClient | null {
  // Guard against server-side execution
  if (typeof window === 'undefined') {
    return null
  }

  // Return existing instance if available
  if (supabaseClientInstance) {
    return supabaseClientInstance
  }

  // Prevent multiple instances during initialization
  if (isInitializing) {
    return null
  }

  // Create instance only once
  isInitializing = true
  try {
    supabaseClientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error('Failed to create Supabase browser client:', error)
    supabaseClientInstance = null
  } finally {
    isInitializing = false
  }

  return supabaseClientInstance
}

// Throwing version for cases that absolutely require a client
export function getSupabaseBrowserClientOrThrow(): SupabaseClient {
  const client = getSupabaseBrowserClient()
  
  if (!client) {
    throw new Error(
      'Supabase browser client not available. This function should only be called in browser environment after component mount.'
    )
  }
  
  return client
}

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

// Utility function for safe Supabase operations
export async function safeSupabaseOperation<T>(
  operation: (client: SupabaseClient) => Promise<T>,
  fallback?: T
): Promise<{ data: T | null; error: string | null }> {
  if (typeof window === 'undefined') {
    return { data: fallback ?? null, error: 'Server-side operation not allowed' }
  }

  const client = getSupabaseBrowserClient()
  if (!client) {
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

// Check if client is available
export function isSupabaseBrowserClientAvailable(): boolean {
  return typeof window !== 'undefined' && supabaseClientInstance !== null
}

// Debug helper (keep for development)
export async function debugSupabaseConnection(): Promise<void> {
  if (typeof window === 'undefined') {
    console.warn('Debug function called on server-side')
    return
  }
  
  const client = getSupabaseBrowserClient()
  if (!client) {
    console.error('Supabase client not available for debugging')
    return
  }

  console.log('Testing Supabase connection...')
  
  try {
    const { count, error } = await client
      .from('field_guide_sections')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('Connection test failed:', error)
    } else {
      console.log('Connection test successful, sections count:', count)
    }
  } catch (err: any) {
    console.error('Connection test exception:', err)
  }
}

// Default export for backward compatibility (returns null on server)
export default typeof window !== 'undefined' ? getSupabaseBrowserClient() : null