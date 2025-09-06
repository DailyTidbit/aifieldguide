// app/hooks/useAuth.ts - COMPLETELY FIXED VERSION
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { usePathname } from 'next/navigation'
import { getSupabaseBrowserClient } from '../lib/supabaseClient'
import { useMounted } from '../lib/clientUtils'
import type { AuthUser, Company, UseAuthReturn, AuthState } from '../types'

export function useAuth(): UseAuthReturn {
  // Hydration safety from clientUtils
  const mounted = useMounted()
  
  // Auth state
  const [user, setUser] = useState<AuthUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [company, setCompany] = useState<Company | null>(null)
  const [supabaseReady, setSupabaseReady] = useState(false)
  
  // Refs to prevent infinite loops
  const initializedRef = useRef(false)
  const subscriptionRef = useRef<any>(null)
  const loadingRef = useRef(false)

  const pathname = usePathname()

  // Check Supabase availability after mount
  useEffect(() => {
    if (!mounted) return

    const checkClient = () => {
      try {
        const client = getSupabaseBrowserClient()
        setSupabaseReady(!!client)
        return !!client
      } catch (error) {
        console.warn('Supabase client check failed:', error)
        setSupabaseReady(false)
        return false
      }
    }

    if (checkClient()) {
      return // Client is ready immediately
    }

    // Retry if not ready
    const interval = setInterval(() => {
      if (checkClient()) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [mounted])

  // Safe client getter
  const getClient = useCallback(() => {
    if (!mounted || !supabaseReady) return null
    
    try {
      return getSupabaseBrowserClient()
    } catch (error) {
      console.warn('Failed to get Supabase client:', error)
      return null
    }
  }, [mounted, supabaseReady])

  // Auth state computation
  const authState: AuthState = (() => {
    if (!mounted || !supabaseReady || authLoading) return 'loading'
    if (!user) return 'logged-out'
    if (!user.companyMembership) return 'no-company'
    if (!company) return 'no-company'
    return 'has-company-access'
  })()

  const isCompanyAdmin = mounted && supabaseReady ? user?.companyMembership?.role === 'company_admin' : false
  const isPartner = mounted && supabaseReady ? !!(user?.companyMembership && company) : false

  // Load user and company data
  const loadUserData = useCallback(async (supabaseUser: SupabaseUser | null) => {
    if (!mounted || !supabaseReady || loadingRef.current) return

    const supabase = getClient()
    if (!supabase) {
      console.warn('Supabase client not available for loading user data')
      return
    }

    loadingRef.current = true

    try {
      if (!supabaseUser) {
        setUser(null)
        setCompany(null)
        return
      }

      // Parallel data fetching
      const [profileResult, membershipResult] = await Promise.allSettled([
        supabase
          .from('profiles')
          .select('full_name')
          .eq('id', supabaseUser.id)
          .single(),
        supabase
          .from('company_users')
          .select('company_id, role, created_at')
          .eq('user_id', supabaseUser.id)
          .limit(1)
          .maybeSingle()
      ])

      // Handle profile result
      const profile = profileResult.status === 'fulfilled' && !profileResult.value.error 
        ? profileResult.value.data 
        : null

      // Handle membership result
      const membership = membershipResult.status === 'fulfilled' && !membershipResult.value.error 
        ? membershipResult.value.data 
        : null

      // Get company data if membership exists
      let companyData: Company | null = null
      if (membership?.company_id) {
        const { data: companyResult, error: companyError } = await supabase
          .from('companies')
          .select('id, name, website, domain, status, domains')
          .eq('id', membership.company_id)
          .eq('status', 'active')
          .single()

        if (!companyError && companyResult) {
          companyData = companyResult
        }
      }

      // Build auth user object
      const authUser: AuthUser = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        created_at: supabaseUser.created_at,
        updated_at: supabaseUser.updated_at,
        user_metadata: supabaseUser.user_metadata,
        company: companyData || undefined,
        role: membership?.role || undefined,
        companyMembership: membership ? {
          company_id: membership.company_id,
          role: membership.role,
          created_at: membership.created_at
        } : undefined,
        profile: profile ? { 
          id: supabaseUser.id,
          username: null,
          full_name: profile.full_name,
          avatar_url: null,
          bio: null,
          website: null,
          created_at: null,
          updated_at: null
        } : undefined
      }

      setUser(authUser)
      setCompany(companyData)

    } catch (error) {
      console.error('User data loading error:', error)
      
      // Set minimal user data on error
      if (supabaseUser) {
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email,
          created_at: supabaseUser.created_at,
          updated_at: supabaseUser.updated_at,
          user_metadata: supabaseUser.user_metadata,
          profile: undefined,
          companyMembership: undefined,
          company: undefined,
          role: undefined
        })
      }
      setCompany(null)
    } finally {
      loadingRef.current = false
    }
  }, [getClient, mounted, supabaseReady])

  // Initialize auth system
  useEffect(() => {
    if (!mounted || !supabaseReady || initializedRef.current) return

    let isMounted = true
    initializedRef.current = true

    const initAuth = async () => {
      const supabase = getClient()
      if (!supabase) {
        if (isMounted) setAuthLoading(false)
        return
      }
      
      try {
        const { data: { user: supabaseUser }, error } = await supabase.auth.getUser()
        
        if (error && error.message !== 'Auth session missing!') {
          console.warn('Auth init warning:', error)
        }
        
        if (isMounted) {
          await loadUserData(supabaseUser)
          setAuthLoading(false)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (isMounted) setAuthLoading(false)
      }
    }

    initAuth()

    // Set up auth state change listener
    const supabase = getClient()
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!isMounted) return

          // Skip heavy processing during password reset flow
          if (pathname.startsWith('/auth/reset')) {
            if (event === 'PASSWORD_RECOVERY' || event === 'USER_UPDATED' || event === 'SIGNED_IN') {
              return
            }
          }

          console.log('Auth event:', event)

          if (session?.user) {
            await loadUserData(session.user)
          } else {
            setUser(null)
            setCompany(null)
          }

          setAuthLoading(false)
        }
      )

      subscriptionRef.current = subscription
    }

    return () => {
      isMounted = false
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, [mounted, supabaseReady, pathname, loadUserData, getClient])

  // Reset initialization when readiness changes
  useEffect(() => {
    if (!mounted || !supabaseReady) {
      initializedRef.current = false
    }
  }, [mounted, supabaseReady])

  // Auth methods
  const signIn = useCallback(async (email: string, password?: string) => {
    if (!mounted || !supabaseReady) {
      throw new Error('Authentication system not ready')
    }

    const supabase = getClient()
    if (!supabase) {
      throw new Error('Authentication service unavailable')
    }

    setAuthLoading(true)
    try {
      if (password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { 
            emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth` : undefined 
          },
        })
        if (error) throw error
      }
    } catch (error) {
      setAuthLoading(false)
      throw error
    }
  }, [getClient, mounted, supabaseReady])

  const signInWithOAuth = useCallback(async (provider: 'google' | 'apple') => {
    if (!mounted || !supabaseReady || typeof window === 'undefined') {
      throw new Error('Authentication system not ready')
    }

    const supabase = getClient()
    if (!supabase) {
      throw new Error('Authentication service unavailable')
    }

    setAuthLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth` },
      })
      if (error) throw error
    } catch (error) {
      setAuthLoading(false)
      throw error
    }
  }, [getClient, mounted, supabaseReady])

  const signInWithMagicLink = useCallback(async (email: string, options: any = {}) => {
    if (!mounted || !supabaseReady) {
      throw new Error('Authentication system not ready')
    }

    const supabase = getClient()
    if (!supabase) {
      throw new Error('Authentication service unavailable')
    }

    setAuthLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: options.redirectTo || (typeof window !== 'undefined' ? `${window.location.origin}/auth` : undefined),
          data: options.data || {},
        },
      })
      if (error) throw error
    } catch (error) {
      throw error
    } finally {
      setAuthLoading(false)
    }
  }, [getClient, mounted, supabaseReady])

  const signUp = useCallback(async (email: string, password: string) => {
    if (!mounted || !supabaseReady) {
      throw new Error('Authentication system not ready')
    }

    const supabase = getClient()
    if (!supabase) {
      throw new Error('Authentication service unavailable')
    }

    setAuthLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth` : undefined 
        },
      })
      if (error) throw error
    } catch (error) {
      throw error
    } finally {
      setAuthLoading(false)
    }
  }, [getClient, mounted, supabaseReady])

  const signOut = useCallback(async () => {
    if (!mounted || !supabaseReady) {
      throw new Error('Authentication system not ready')
    }

    const supabase = getClient()
    if (!supabase) {
      throw new Error('Authentication service unavailable')
    }

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }, [getClient, mounted, supabaseReady])

  const resetPassword = useCallback(async (email: string) => {
    if (!mounted || !supabaseReady) {
      throw new Error('Authentication system not ready')
    }

    const supabase = getClient()
    if (!supabase) {
      throw new Error('Authentication service unavailable')
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/reset` : undefined,
      })
      if (error) throw error
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    }
  }, [getClient, mounted, supabaseReady])

  const updatePassword = useCallback(async (password: string) => {
    if (!mounted || !supabaseReady) {
      throw new Error('Authentication system not ready')
    }

    const supabase = getClient()
    if (!supabase) {
      throw new Error('Authentication service unavailable')
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password,
        data: { has_password: true },
      })
      
      if (error) throw error
    } catch (error) {
      console.error('Update password error:', error)
      throw error
    }
  }, [getClient, mounted, supabaseReady])

  const refreshAuth = useCallback(async () => {
    if (!mounted || !supabaseReady) return

    const supabase = getClient()
    if (!supabase) return

    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser()
      await loadUserData(supabaseUser)
    } catch (error) {
      console.error('Auth refresh error:', error)
    }
  }, [loadUserData, getClient, mounted, supabaseReady])

  const checkCompanyAccess = useCallback(async () => {
    if (!mounted || !supabaseReady) return false
    return !!(user?.companyMembership && company)
  }, [user, company, mounted, supabaseReady])

  return {
    user,
    loading: !mounted || !supabaseReady || authLoading,
    authState,
    mounted,
    company,
    isCompanyAdmin,
    isPartner,
    signIn,
    signInWithOAuth,
    signInWithMagicLink,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshAuth,
    checkCompanyAccess,
  }
}