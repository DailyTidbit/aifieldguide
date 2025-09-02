// app/hooks/useAuth.ts - FIXED CIRCULAR REFERENCE + FULLY HYDRATION SAFE
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { usePathname } from 'next/navigation'
import { getSupabaseBrowserClientSafe, getSupabaseBrowserClient } from '../lib/supabaseClient'
import type { AuthUser, Company, UseAuthReturn, AuthState } from '../types'

export function useAuth(): UseAuthReturn {
  // Hydration safety state
  const [mounted, setMounted] = useState(false)
  const [clientReady, setClientReady] = useState(false)
  
  // Auth state - CRITICAL FIX: Rename internal loading to avoid circular reference
  const [user, setUser] = useState<AuthUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true) // ✅ FIXED: Renamed from 'loading'
  const [company, setCompany] = useState<Company | null>(null)
  
  // Refs to prevent infinite loops and manage subscriptions
  const initializedRef = useRef(false)
  const subscriptionRef = useRef<any>(null)
  const loadingRef = useRef(false)

  const pathname = usePathname()

  // Hydration safety - mark as mounted and check client readiness
  useEffect(() => {
    setMounted(true)
    
    // Check if Supabase client is available
    const checkClient = () => {
      try {
        const client = getSupabaseBrowserClient()
        setClientReady(!!client)
      } catch (error) {
        console.warn('Supabase client not ready:', error)
        setClientReady(false)
      }
    }
    
    checkClient()
    
    // Recheck periodically in case client becomes available later
    const interval = setInterval(checkClient, 1000)
    
    return () => clearInterval(interval)
  }, [])

  // Safe client getter
  const getClient = useCallback(() => {
    if (!mounted || !clientReady) {
      return null
    }
    
    try {
      return getSupabaseBrowserClientSafe()
    } catch (error) {
      console.warn('Failed to get Supabase client:', error)
      return null
    }
  }, [mounted, clientReady])

  // Compute derived states safely - FIXED: Use authLoading instead of loading
  const authState: AuthState = (() => {
    if (!mounted || !clientReady || authLoading) return 'loading'
    if (!user) return 'logged-out'
    if (!user.companyMembership) return 'no-company'
    if (!company) return 'no-company'
    return 'has-company-access'
  })()

  const isCompanyAdmin = (mounted && clientReady) ? user?.companyMembership?.role === 'company_admin' : false
  const isPartner = (mounted && clientReady) ? !!(user?.companyMembership && company) : false
  const isAuthReady = mounted && clientReady

  // Load user and company data
  const loadUserData = useCallback(async (supabaseUser: SupabaseUser | null) => {
    if (!isAuthReady || loadingRef.current) return

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

      if (membershipResult.status === 'fulfilled' && membershipResult.value.error) {
        console.warn('Membership check error:', membershipResult.value.error)
      }

      // Get company data if membership exists
      let companyData: Company | null = null
      if (membership?.company_id) {
        const { data: companyResult, error: companyError } = await supabase
          .from('companies')
          .select('id, name, website, domain, status, domains')
          .eq('id', membership.company_id)
          .eq('status', 'active')
          .single()

        if (companyError) {
          console.warn('Company fetch error:', companyError)
        } else if (companyResult) {
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

      console.log('Auth loaded:', {
        userId: supabaseUser.id,
        hasCompanyMembership: !!membership,
        companyActive: companyData?.status === 'active',
        role: membership?.role,
        isPartner: !!(membership && companyData)
      })

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
  }, [getClient, isAuthReady])

  // Initialize auth system - FIXED: Use setAuthLoading
  useEffect(() => {
    if (!isAuthReady || initializedRef.current) return

    let isMounted = true
    initializedRef.current = true

    const initAuth = async () => {
      const supabase = getClient()
      if (!supabase) {
        console.warn('Supabase client not available for auth initialization')
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

    // Set up auth state change listener - FIXED: Use setAuthLoading
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
  }, [isAuthReady, pathname, loadUserData, getClient])

  // Reset initialization when auth readiness changes
  useEffect(() => {
    if (!isAuthReady) {
      initializedRef.current = false
    }
  }, [isAuthReady])

  // Auth methods - all guarded by readiness checks - FIXED: Use setAuthLoading
  const signIn = useCallback(async (email: string, password?: string) => {
    if (!isAuthReady) {
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
      console.error('Sign in error:', error)
      setAuthLoading(false)
      throw error
    }
  }, [getClient, isAuthReady])

  const signInWithOAuth = useCallback(async (provider: 'google' | 'apple') => {
    if (!isAuthReady || typeof window === 'undefined') {
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
      console.error('OAuth error:', error)
      setAuthLoading(false)
      throw error
    }
  }, [getClient, isAuthReady])

  const signInWithMagicLink = useCallback(async (email: string, options: any = {}) => {
    if (!isAuthReady) {
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
      console.error('Magic link error:', error)
      throw error
    } finally {
      setAuthLoading(false)
    }
  }, [getClient, isAuthReady])

  const signUp = useCallback(async (email: string, password: string) => {
    if (!isAuthReady) {
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
      console.error('Sign up error:', error)
      throw error
    } finally {
      setAuthLoading(false)
    }
  }, [getClient, isAuthReady])

  const signOut = useCallback(async () => {
    if (!isAuthReady) {
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
  }, [getClient, isAuthReady])

  const resetPassword = useCallback(async (email: string) => {
    if (!isAuthReady) {
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
  }, [getClient, isAuthReady])

  const updatePassword = useCallback(async (password: string) => {
    if (!isAuthReady) {
      throw new Error('Authentication system not ready')
    }

    const supabase = getClient()
    if (!supabase) {
      throw new Error('Authentication service unavailable')
    }

    console.log('Starting password update...')
    try {
      const { error } = await supabase.auth.updateUser({
        password,
        data: { has_password: true },
      })
      
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      console.log('Password update successful')
    } catch (error) {
      console.error('Update password error:', error)
      throw error
    }
  }, [getClient, isAuthReady])

  const refreshAuth = useCallback(async () => {
    if (!isAuthReady) {
      console.warn('Cannot refresh auth - system not ready')
      return
    }

    const supabase = getClient()
    if (!supabase) {
      console.warn('Cannot refresh auth - client unavailable')
      return
    }

    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser()
      await loadUserData(supabaseUser)
    } catch (error) {
      console.error('Auth refresh error:', error)
    }
  }, [loadUserData, getClient, isAuthReady])

  const checkCompanyAccess = useCallback(async () => {
    if (!isAuthReady) return false
    return !!(user?.companyMembership && company)
  }, [user, company, isAuthReady])

  return {
    user,
    // ✅ CRITICAL FIX: Use authLoading instead of loading to avoid circular reference
    loading: !mounted || !clientReady || authLoading,
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