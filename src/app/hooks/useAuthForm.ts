// src/app/hooks/useAuthForm.ts - COMPLETE HYDRATION SAFE FIX
'use client'

import { useCallback, useMemo, useState, useEffect } from 'react'
import { getSupabaseBrowserClient } from '../lib/supabaseClient'

export type AuthMode = 'login' | 'signup'

export interface UseAuthFormOptions {
  redirectTo?: string | null
  isVendorFlow?: boolean
}

export function useAuthForm(opts: UseAuthFormOptions = {}) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // ✅ HYDRATION SAFETY: Enhanced mounting and client availability detection
  const [mounted, setMounted] = useState(false)
  const [clientReady, setClientReady] = useState(false)
  const [clientRetries, setClientRetries] = useState(0)
  const MAX_CLIENT_RETRIES = 5

  // ✅ HYDRATION SAFETY: Wait for component to mount and check client availability
  useEffect(() => {
    setMounted(true)
    
    // Check if Supabase client is available with retries
    const checkClient = () => {
      try {
        const client = getSupabaseBrowserClient()
        if (client) {
          setClientReady(true)
          return true
        }
      } catch (error) {
        console.warn('Supabase client not ready:', error)
      }
      return false
    }
    
    // Initial check
    if (checkClient()) return
    
    // Retry logic for client availability
    const retryInterval = setInterval(() => {
      if (checkClient() || clientRetries >= MAX_CLIENT_RETRIES) {
        clearInterval(retryInterval)
        if (clientRetries >= MAX_CLIENT_RETRIES) {
          console.error('Supabase client failed to initialize after retries')
          setError('Authentication service unavailable. Please refresh the page.')
        }
      } else {
        setClientRetries(prev => prev + 1)
      }
    }, 1000)
    
    return () => clearInterval(retryInterval)
  }, [clientRetries])

  // ✅ HYDRATION SAFE: Memoized redirect URL with proper guards
  const redirectTo = useMemo(() => {
    if (!mounted || typeof window === 'undefined') return opts.redirectTo ?? null
    
    try {
      return opts.redirectTo ?? window.location.href
    } catch (error) {
      console.warn('Error accessing window.location:', error)
      return opts.redirectTo ?? null
    }
  }, [opts.redirectTo, mounted])

  const isVendorFlow = useMemo(() => opts.isVendorFlow ?? false, [opts.isVendorFlow])

  // ✅ HYDRATION SAFE: Get Supabase client safely with proper error handling
  const getClient = useCallback(() => {
    if (!mounted || !clientReady) {
      return null
    }
    
    try {
      return getSupabaseBrowserClient()
    } catch (error) {
      console.warn('Failed to get Supabase client:', error)
      setError('Authentication service temporarily unavailable. Please try again.')
      return null
    }
  }, [mounted, clientReady])

  // ✅ HYDRATION SAFE: Enhanced company detection with error handling
  const getCompanyFromEmail = useCallback((email: string) => {
    if (!mounted || !email) return null
    
    try {
      const domain = email.split('@')[1]
      if (!domain) return null
      
      return {
        name: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
        domain: domain,
        isVerified: ['microsoft.com', 'google.com', 'stripe.com', 'anthropic.com'].includes(domain)
      }
    } catch (error) {
      console.warn('Error parsing email domain:', error)
      return null
    }
  }, [mounted])

  // ✅ HYDRATION SAFE: Only calculate company after mounted
  const company = useMemo(() => {
    if (!mounted) return null
    return getCompanyFromEmail(email)
  }, [email, getCompanyFromEmail, mounted])

  const clearAlerts = useCallback(() => {
    setMessage(null)
    setError(null)
  }, [])

  // ✅ HYDRATION SAFE: Enhanced auth readiness check
  const isAuthReady = useMemo(() => {
    return mounted && clientReady && clientRetries < MAX_CLIENT_RETRIES
  }, [mounted, clientReady, clientRetries])

  // ✅ HYDRATION SAFE: Enhanced email auth with better error handling
  const handleEmailAuth = useCallback(async () => {
    if (!isAuthReady) {
      setError('Authentication system is not ready. Please try again in a moment.')
      return
    }
    
    const supabase = getClient()
    if (!supabase) {
      setError('Authentication service unavailable. Please refresh the page and try again.')
      return
    }
    
    clearAlerts()
    if (!email || !password) { 
      setError('Please enter your email and password.') 
      return 
    }
    if (mode === 'signup' && password !== confirmPassword) { 
      setError('Passwords do not match.') 
      return 
    }

    try {
      setLoading(true)
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        if (data?.user?.id) {
          await supabase.from('profiles').upsert({ id: data.user.id }, { onConflict: 'id' })
        }
        setMessage('Signed in successfully!')
      } else {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: redirectTo || undefined,
            data: {
              email: email,
              vendor_flow: isVendorFlow
            }
          }
        })
        if (error) throw error
        if (data?.user?.id) {
          await supabase.from('profiles').upsert({ id: data.user.id }, { onConflict: 'id' })
        }
        setMessage('Account created! Check your email if confirmation is required.')
      }
    } catch (e: any) {
      console.error('Email auth error:', e)
      setError(e?.message ?? 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [clearAlerts, confirmPassword, email, mode, password, redirectTo, isVendorFlow, getClient, isAuthReady])

  // ✅ HYDRATION SAFE: Enhanced magic link auth
  const handleMagicLinkAuth = useCallback(async () => {
    if (!isAuthReady) {
      setError('Authentication system is not ready. Please try again in a moment.')
      return
    }
    
    const supabase = getClient()
    if (!supabase) {
      setError('Authentication service unavailable. Please refresh the page and try again.')
      return
    }
    
    clearAlerts()
    if (!email) { 
      setError('Please enter your email address.') 
      return 
    }

    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo || undefined,
          data: {
            vendor_flow: isVendorFlow,
            company_domain: company?.domain
          }
        }
      })
      if (error) throw error
      
      setMessage(`Check your email! We sent a sign-in link to ${email}`)
    } catch (e: any) {
      console.error('Magic link auth error:', e)
      setError(e?.message ?? 'Failed to send magic link. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [clearAlerts, email, redirectTo, isVendorFlow, company, getClient, isAuthReady])

  // ✅ HYDRATION SAFE: Enhanced OAuth handling
  const handleOAuth = useCallback(async (provider: 'google' | 'apple') => {
    if (!isAuthReady) {
      setError('Authentication system is not ready. Please try again in a moment.')
      return
    }
    
    const supabase = getClient()
    if (!supabase) {
      setError('Authentication service unavailable. Please refresh the page and try again.')
      return
    }
    
    clearAlerts()
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectTo ?? undefined,
          skipBrowserRedirect: false,
          queryParams: {
            vendor_flow: isVendorFlow ? 'true' : 'false'
          }
        },
      })
      if (error) throw error
    } catch (e: any) {
      console.error('OAuth error:', e)
      setError(e?.message ?? `${provider} sign-in failed. Please try again.`)
      setLoading(false)
    }
  }, [clearAlerts, redirectTo, isVendorFlow, getClient, isAuthReady])

  // ✅ HYDRATION SAFE: Enhanced password reset
  const handleReset = useCallback(async () => {
    if (!isAuthReady) {
      setError('Authentication system is not ready. Please try again in a moment.')
      return
    }
    
    const supabase = getClient()
    if (!supabase) {
      setError('Authentication service unavailable. Please refresh the page and try again.')
      return
    }
    
    clearAlerts()
    if (!email) { 
      setError('Enter your email first.') 
      return 
    }
    
    try {
      setLoading(true)
      const origin = mounted && typeof window !== 'undefined' ? window.location.origin : ''
      const { error } = await supabase.auth.resetPasswordForEmail(email, { 
        redirectTo: `${origin}/auth/reset` 
      })
      if (error) throw error
      setMessage('Reset link sent. Check your email.')
    } catch (e: any) {
      console.error('Password reset error:', e)
      setError(e?.message ?? 'Failed to send reset link. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [clearAlerts, email, getClient, isAuthReady, mounted])

  // ✅ Enhanced email domain validation with better error handling
  const validateEmailDomain = useCallback((email: string, allowedDomains: string[] = []) => {
    if (!allowedDomains.length) return { isValid: true, message: '' }
    
    try {
      const domain = email.split('@')[1]?.toLowerCase()
      if (!domain) return { isValid: false, message: 'Invalid email format' }
      
      const isAllowed = allowedDomains.some(allowedDomain => {
        const normalizedDomain = allowedDomain.toLowerCase()
        return domain === normalizedDomain || 
               domain.endsWith(`.${normalizedDomain}`) ||
               domain === `www.${normalizedDomain}` ||
               normalizedDomain === `www.${domain}`
      })
      
      if (isAllowed) {
        return { 
          isValid: true, 
          message: `Perfect! Using an email ending in @${domain} allows for automatic verification.` 
        }
      } else {
        return { 
          isValid: false, 
          message: `Using an email ending in @${domain} will help us verify your company. Manual verification is also available if needed.` 
        }
      }
    } catch (error) {
      console.warn('Email domain validation error:', error)
      return { isValid: false, message: 'Unable to validate email domain' }
    }
  }, [])

  // ✅ Enhanced status information for better UX and debugging
  const status = useMemo(() => {
    if (!mounted) return 'initializing'
    if (!clientReady && clientRetries < MAX_CLIENT_RETRIES) return 'connecting'
    if (clientRetries >= MAX_CLIENT_RETRIES) return 'failed'
    return 'ready'
  }, [mounted, clientReady, clientRetries])

  // ✅ Helper to check if operations should be disabled
  const isDisabled = useMemo(() => {
    return loading || !isAuthReady || status === 'failed'
  }, [loading, isAuthReady, status])

  return {
    // Basic form state
    mode, 
    setMode,
    email, 
    setEmail,
    password, 
    setPassword,
    confirmPassword, 
    setConfirmPassword,
    loading, 
    message, 
    error,
    company,
    
    // Enhanced hydration safety state
    mounted,
    clientReady,
    isAuthReady,
    status,
    isDisabled,
    clientRetries,
    
    // Auth methods
    handleEmailAuth,
    handleMagicLinkAuth,
    handleOAuth,
    handleReset,
    clearAlerts,
    validateEmailDomain,
    getCompanyFromEmail,
  }
}