// src/app/hooks/useAuth.ts - Simplified single-tier partner system
'use client'

import { useState, useEffect, useCallback } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabaseClient } from '../lib/supabaseClient'

interface CompanyData {
  id: string
  name: string
  website: string | null
  domain: string | null
  status: string
  domains: string // JSON array as string
}

interface PartnerUser extends SupabaseUser {
  company?: CompanyData
  role?: string
}

interface UseAuthReturn {
  user: PartnerUser | null
  loading: boolean
  isPartner: boolean
  company: CompanyData | null
  
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

  // Load user and determine if they're a partner
  const loadUserData = useCallback(async (supabaseUser: SupabaseUser | null) => {
    try {
      if (!supabaseUser) {
        setUser(null)
        setCompany(null)
        setIsPartner(false)
        return
      }

      // Check if user is a company member - simplified query
      const { data: membership, error: membershipError } = await supabaseClient
        .from('company_users')
        .select('company_id, role')
        .eq('user_id', supabaseUser.id)
        .limit(1)
        .maybeSingle()

      if (membershipError) {
        console.warn('Membership check error:', membershipError)
      }

      // If they have a company membership, get company data
      let companyData: CompanyData | null = null
      if (membership?.company_id) {
        const { data: companyResult, error: companyError } = await supabaseClient
          .from('companies')
          .select('id, name, website, domain, status, domains')
          .eq('id', membership.company_id)
          .eq('status', 'active') // Only active companies
          .single()

        if (companyError) {
          console.warn('Company fetch error:', companyError)
        } else {
          companyData = companyResult
        }
      }

      // Create partner user with company info
      const partnerUser: PartnerUser = {
        ...supabaseUser,
        company: companyData || undefined,
        role: membership?.role || undefined
      }

      // Single-tier logic: if they have an active company membership, they're a partner
      const userIsPartner = !!(membership && companyData)

      setUser(partnerUser)
      setCompany(companyData)
      setIsPartner(userIsPartner)

      console.log('Auth loaded:', {
        userId: supabaseUser.id,
        hasCompanyMembership: !!membership,
        companyActive: companyData?.status === 'active',
        role: membership?.role,
        isPartner: userIsPartner
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
        
        if (error) {
          console.warn('Auth init error:', error)
        }
        
        if (mounted) {
          await loadUserData(supabaseUser)
          setLoading(false)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

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
  }, [loadUserData])

  // Sign in with email/password
  const signIn = useCallback(async (email: string, password?: string) => {
    setLoading(true)
    try {
      if (password) {
        const { error } = await supabaseClient.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
      } else {
        // Fallback to magic link
        const { error } = await supabaseClient.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`
          }
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
        options: {
          redirectTo: `${window.location.origin}/auth`
        }
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
          data: options.data || {}
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
      const { error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`
        }
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
        data: { has_password: true }
      })
      if (error) throw error
      
      // Refresh to get updated user data
      await refreshAuth()
    } catch (error) {
      console.error('Update password error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // Refresh auth state
  const refreshAuth = useCallback(async () => {
    const { data: { user: supabaseUser } } = await supabaseClient.auth.getUser()
    await loadUserData(supabaseUser)
  }, [loadUserData])

  return {
    // State - simplified to just what matters for partners
    user,
    loading,
    isPartner,
    company,
    
    // Methods
    signIn,
    signInWithOAuth,
    signInWithMagicLink,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshAuth
  }
}