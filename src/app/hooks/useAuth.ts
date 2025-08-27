// src/app/hooks/useAuth.ts - Updated with missing properties
'use client'

import { useState, useEffect, useCallback } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { usePathname } from 'next/navigation'
import { supabaseClient } from '../lib/supabaseClient'

interface CompanyData {
  id: string
  name: string | null
  website: string | null
  domain: string | null
  status: string | null
  domains: string | null // JSON array as string
}

// Add company membership info to the user type
interface CompanyMembership {
  company_id: string
  role: string
  created_at?: string
}

interface PartnerUser extends SupabaseUser {
  company?: CompanyData
  role?: string
  companyMembership?: CompanyMembership // Add this for Navigation compatibility
  profile?: {
    full_name?: string | null
  }
}

// Add missing properties for Navigation
type AuthState = 'loading' | 'logged-out' | 'needs-password-setup' | 'no-company' | 'has-company-access'

interface UseAuthReturn {
  user: PartnerUser | null
  loading: boolean
  isPartner: boolean
  company: CompanyData | null
  authState: AuthState // Add this
  isCompanyAdmin: boolean // Add this

  // Auth methods
  signIn: (email: string, password?: string) => Promise<void>
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<void>
  signInWithMagicLink: (email: string, options?: any) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  refreshAuth: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<PartnerUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [isPartner, setIsPartner] = useState(false)

  const pathname = usePathname()

  // Calculate derived states
  const authState: AuthState = (() => {
    if (loading) return 'loading'
    if (!user) return 'logged-out'
    if (!user.companyMembership) return 'no-company'
    if (!company) return 'no-company'
    // You can add logic here for 'needs-password-setup' if needed
    return 'has-company-access'
  })()

  const isCompanyAdmin = user?.companyMembership?.role === 'company_admin'

  // Load user + partner/company info
  const loadUserData = useCallback(async (supabaseUser: SupabaseUser | null) => {
    try {
      if (!supabaseUser) {
        setUser(null)
        setCompany(null)
        setIsPartner(false)
        return
      }

      // Get user profile
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('full_name')
        .eq('id', supabaseUser.id)
        .single()

      // membership
      const { data: membership, error: membershipError } = await supabaseClient
        .from('company_users')
        .select('company_id, role, created_at')
        .eq('user_id', supabaseUser.id)
        .limit(1)
        .maybeSingle()

      if (membershipError) {
        console.warn('Membership check error:', membershipError)
      }

      // company
      let companyData: CompanyData | null = null
      if (membership?.company_id) {
        const { data: companyResult, error: companyError } = await supabaseClient
          .from('companies')
          .select('id, name, website, domain, status, domains')
          .eq('id', membership.company_id)
          .eq('status', 'active')
          .single()

        if (companyError) {
          console.warn('Company fetch error:', companyError)
        } else {
          companyData = companyResult
        }
      }

      const partnerUser: PartnerUser = {
        ...supabaseUser,
        company: companyData || undefined,
        role: membership?.role || undefined,
        companyMembership: membership ? {
          company_id: membership.company_id,
          role: membership.role,
          created_at: membership.created_at
        } : undefined,
        profile: profile ? { full_name: profile.full_name } : undefined
      }

      const userIsPartner = !!(membership && companyData)

      setUser(partnerUser)
      setCompany(companyData)
      setIsPartner(userIsPartner)

      console.log('Auth loaded:', {
        userId: supabaseUser.id,
        hasCompanyMembership: !!membership,
        companyActive: companyData?.status === 'active',
        role: membership?.role,
        isPartner: userIsPartner,
        authState: authState
      })
    } catch (error) {
      console.error('User data loading error:', error)
      setUser(supabaseUser as PartnerUser)
      setCompany(null)
      setIsPartner(false)
    }
  }, [])

  // Initialize auth
  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        const { data: { user: supabaseUser }, error } = await supabaseClient.auth.getUser()
        // Not an error to be logged hard if logged out
        if (error && error.message !== 'Auth session missing!') {
          console.warn('Auth init warning:', error)
        }
        if (mounted) {
          await loadUserData(supabaseUser)
          setLoading(false)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        // ✅ IMPORTANT: while on /auth/reset, ignore churn that happens during password reset.
        if (pathname.startsWith('/auth/reset')) {
          if (event === 'PASSWORD_RECOVERY' || event === 'USER_UPDATED' || event === 'SIGNED_IN') {
            // Avoid doing heavy state work that can cause HMR/UX glitches.
            return
          }
        }

        console.log('Auth event:', event)

        if (session?.user) {
          await loadUserData(session.user)
        } else {
          setUser(null)
          setCompany(null)
          setIsPartner(false)
        }

        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadUserData, pathname])

  // Sign in with email/password or magic link fallback
  const signIn = useCallback(async (email: string, password?: string) => {
    setLoading(true)
    try {
      if (password) {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabaseClient.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        })
        if (error) throw error
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setLoading(false)
      throw error
    }
  }, [])

  // OAuth sign in
  const signInWithOAuth = useCallback(async (provider: 'google' | 'apple') => {
    setLoading(true)
    try {
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth` },
      })
      if (error) throw error
    } catch (error) {
      console.error('OAuth error:', error)
      setLoading(false)
      throw error
    }
  }, [])

  // Magic link sign in
  const signInWithMagicLink = useCallback(async (email: string, options: any = {}) => {
    setLoading(true)
    try {
      const { error } = await supabaseClient.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: options.redirectTo || `${window.location.origin}/auth`,
          data: options.data || {},
        },
      })
      if (error) throw error
    } catch (error) {
      console.error('Magic link error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // Sign up
  const signUp = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const { error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth` },
      })
      if (error) throw error
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // Sign out
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabaseClient.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }, [])

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`, // your custom page
      })
      if (error) throw error
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    }
  }, [])

  // Update password (used after recovery)
  const updatePassword = useCallback(async (password: string) => {
    console.log('🔄 Starting password update...')
    try {
      console.log('📡 Calling Supabase updateUser...')
      const { error } = await supabaseClient.auth.updateUser({
        password,
        data: { has_password: true },
      })
      console.log('🔥 Supabase response:', { error })
      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }
      console.log('✅ Password update successful')
    } catch (error) {
      console.error('💥 Update password error:', error)
      throw error
    }
  }, [])

  // Refresh auth state
  const refreshAuth = useCallback(async () => {
    const { data: { user: supabaseUser } } = await supabaseClient.auth.getUser()
    await loadUserData(supabaseUser)
  }, [loadUserData])

  return {
    user,
    loading,
    isPartner,
    company,
    authState, // Now included
    isCompanyAdmin, // Now included

    signIn,
    signInWithOAuth,
    signInWithMagicLink,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshAuth,
  }
}