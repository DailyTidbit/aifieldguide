// src/app/hooks/useAuth.ts - Complete fixed with database relationship workaround
'use client'

import { useState, useEffect, useCallback } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabaseClient } from '../lib/supabaseClient'
import type { 
  AuthState, 
  AuthUser, 
  Company, 
  CompanyMembership, 
  Profile, 
  UseAuthReturn 
} from '../types'

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [authState, setAuthState] = useState<AuthState>('loading')
  const [company, setCompany] = useState<Company | null>(null)

  // Determine auth state based on user data
  const determineAuthState = useCallback(async (supabaseUser: SupabaseUser | null) => {
    try {
      if (!supabaseUser) {
        setAuthState('logged-out')
        setUser(null)
        setCompany(null)
        return
      }

      // Check if user needs password setup
      if (!supabaseUser.user_metadata?.has_password) {
        setAuthState('needs-password-setup')
        setUser(supabaseUser as AuthUser)
        return
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle()

      if (profileError) {
        console.warn('Profile fetch error:', profileError)
      }

      // Get company membership - simplified query without problematic join
      const { data: membership, error: membershipError } = await supabaseClient
        .from('company_users')
        .select('company_id, role, created_at')
        .eq('user_id', supabaseUser.id)
        .limit(1)
        .maybeSingle()

      if (membershipError) {
        console.warn('Membership fetch error:', membershipError)
      }

      // If we have membership, get the company separately to avoid join issues
      let companyData = null
      if (membership?.company_id) {
        const { data: company, error: companyError } = await supabaseClient
          .from('companies')
          .select('*')
          .eq('id', membership.company_id)
          .single()
        
        if (companyError) {
          console.warn('Company fetch error:', companyError)
        } else {
          companyData = company
        }
      }

      // Create the membership object manually with the company data
      const membershipWithCompany: CompanyMembership | null = membership ? {
        company_id: membership.company_id,
        role: membership.role,
        created_at: membership.created_at,
        companies: companyData
      } : null

      console.log('Membership data (fixed):', membershipWithCompany)

      const authUser: AuthUser = {
        ...supabaseUser,
        profile: profile || undefined,
        companyMembership: membershipWithCompany || undefined
      }

      setUser(authUser)

      if (membershipWithCompany?.company_id && companyData) {
        setCompany(companyData as Company)
        setAuthState('has-company-access')
      } else {
        setAuthState('no-company')
        setCompany(null)
      }
    } catch (error) {
      console.error('Auth state determination error:', error)
      setAuthState('logged-out')
      setUser(null)
      setCompany(null)
    }
  }, [])

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const { data: { user: supabaseUser }, error } = await supabaseClient.auth.getUser()
        
        if (error) {
          console.warn('Auth initialization error:', error)
        }
        
        if (mounted) {
          await determineAuthState(supabaseUser)
          setLoading(false)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setAuthState('logged-out')
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('Auth state change:', event)

        if (event === 'SIGNED_IN' && session?.user) {
          await determineAuthState(session.user)
        } else if (event === 'SIGNED_OUT') {
          setAuthState('logged-out')
          setUser(null)
          setCompany(null)
        } else if (event === 'USER_UPDATED' && session?.user) {
          await determineAuthState(session.user)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [determineAuthState])

  // Sign in with email/password
  const signIn = useCallback(async (email: string, password?: string) => {
    setLoading(true)
    try {
      if (password) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        
        // Ensure profile exists
        if (data.user) {
          await supabaseClient
            .from('profiles')
            .upsert({ id: data.user.id }, { onConflict: 'id' })
        }
      } else {
        // Magic link fallback
        const { error } = await supabaseClient.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: { vendor_flow: false }
          }
        })
        if (error) throw error
      }
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // Sign in with OAuth
  const signInWithOAuth = useCallback(async (provider: 'google' | 'apple') => {
    setLoading(true)
    try {
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth`,
          skipBrowserRedirect: false
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('OAuth error:', error)
      setLoading(false)
      throw error
    }
  }, [])

  // Sign in with magic link
  const signInWithMagicLink = useCallback(async (email: string, options: any = {}) => {
    setLoading(true)
    try {
      const { error } = await supabaseClient.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: options.redirectTo || `${window.location.origin}/auth`,
          data: {
            vendor_flow: options.isVendorFlow || false,
            company_name: options.companyName,
            suggested_domain: options.suggestedDomain
          }
        }
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
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: { email }
        }
      })
      if (error) throw error
      
      // Create profile
      if (data.user) {
        await supabaseClient
          .from('profiles')
          .upsert({ id: data.user.id }, { onConflict: 'id' })
      }
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
        redirectTo: `${window.location.origin}/auth/reset`
      })
      if (error) throw error
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    }
  }, [])

  // Update password
  const updatePassword = useCallback(async (password: string) => {
    setLoading(true)
    try {
      const { error } = await supabaseClient.auth.updateUser({
        password,
        data: { 
          has_password: true,
          setup_completed_at: new Date().toISOString()
        }
      })
      if (error) throw error
      
      // Refresh auth state
      await refreshAuthState()
    } catch (error) {
      console.error('Update password error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // Check company access
  const checkCompanyAccess = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false
    
    try {
      const { data } = await supabaseClient
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()
      
      return !!data?.company_id
    } catch (error) {
      console.error('Company access check error:', error)
      return false
    }
  }, [user?.id])

  // Refresh auth state
  const refreshAuthState = useCallback(async () => {
    const { data: { user: supabaseUser } } = await supabaseClient.auth.getUser()
    await determineAuthState(supabaseUser)
  }, [determineAuthState])

  // Computed properties
  const isCompanyAdmin = user?.companyMembership?.role === 'company_admin'

  return {
    // State
    user,
    loading,
    authState,
    
    // Company info
    company,
    isCompanyAdmin,
    
    // Methods
    signIn,
    signInWithOAuth,
    signInWithMagicLink,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    
    // Utility
    checkCompanyAccess,
    refreshAuthState
  }
}