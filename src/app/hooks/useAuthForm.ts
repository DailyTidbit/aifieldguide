// src/app/hooks/useAuthForm.ts - Fixed hydration safety issues
'use client'

import { useCallback, useMemo, useState, useEffect } from 'react'
import { getSupabaseBrowserClientSafe, getSupabaseBrowserClient } from '../lib/supabaseClient'

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
  const [mounted, setMounted] = useState(false) // HYDRATION FIX
  const [clientReady, setClientReady] = useState(false) // HYDRATION FIX

  // HYDRATION FIX: Wait for component to mount and check client availability
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

  const redirectTo = useMemo(() => opts.redirectTo ?? null, [opts.redirectTo])
  const isVendorFlow = useMemo(() => opts.isVendorFlow ?? false, [opts.isVendorFlow])

  // ✅ HYDRATION SAFE: Get Supabase client safely
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

  // Detect company from email domain
  const getCompanyFromEmail = useCallback((email: string) => {
    const domain = email.split('@')[1]
    if (!domain) return null
    
    return {
      name: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
      domain: domain,
      isVerified: ['microsoft.com', 'google.com', 'stripe.com', 'anthropic.com'].includes(domain)
    }
  }, [])

  // HYDRATION FIX: Only calculate company after mounted
  const company = useMemo(() => {
    if (!mounted) return null
    return getCompanyFromEmail(email)
  }, [email, getCompanyFromEmail, mounted])

  const clearAlerts = useCallback(() => {
    setMessage(null)
    setError(null)
  }, [])

  // ✅ HYDRATION SAFE: Check if auth operations are available
  const isAuthReady = useMemo(() => {
    return mounted && clientReady
  }, [mounted, clientReady])

  const handleEmailAuth = useCallback(async () => {
    if (!isAuthReady) {
      setError('Authentication system is not ready. Please try again in a moment.')
      return
    }
    
    const supabase = getClient()
    if (!supabase) {
      setError('Authentication service unavailable. Please try again.')
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
        setMessage('Signed in!')
      } else {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            // HYDRATION FIX: Guard window access
            emailRedirectTo: redirectTo || (mounted && typeof window !== 'undefined' ? window.location.origin : undefined),
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
      setError(e?.message ?? 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }, [clearAlerts, confirmPassword, email, mode, password, redirectTo, isVendorFlow, getClient, isAuthReady, mounted])

  const handleMagicLinkAuth = useCallback(async () => {
    if (!isAuthReady) {
      setError('Authentication system is not ready. Please try again in a moment.')
      return
    }
    
    const supabase = getClient()
    if (!supabase) {
      setError('Authentication service unavailable. Please try again.')
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
          // HYDRATION FIX: Guard window access
          emailRedirectTo: redirectTo || (mounted && typeof window !== 'undefined' ? window.location.href : undefined),
          data: {
            vendor_flow: isVendorFlow,
            company_domain: company?.domain
          }
        }
      })
      if (error) throw error
      
      setMessage(`Check your email! We sent a sign-in link to ${email}`)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to send magic link.')
    } finally {
      setLoading(false)
    }
  }, [clearAlerts, email, redirectTo, isVendorFlow, company, getClient, isAuthReady, mounted])

  const handleOAuth = useCallback(async (provider: 'google' | 'apple') => {
    if (!isAuthReady) {
      setError('Authentication system is not ready. Please try again in a moment.')
      return
    }
    
    const supabase = getClient()
    if (!supabase) {
      setError('Authentication service unavailable. Please try again.')
      return
    }
    
    clearAlerts()
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          // HYDRATION FIX: Guard window access
          redirectTo: redirectTo ?? (mounted && typeof window !== 'undefined' ? window.location.href : undefined),
          skipBrowserRedirect: false,
          queryParams: {
            vendor_flow: isVendorFlow ? 'true' : 'false'
          }
        },
      })
      if (error) throw error
    } catch (e: any) {
      setError(e?.message ?? 'OAuth sign-in failed.')
      setLoading(false)
    }
  }, [clearAlerts, redirectTo, isVendorFlow, getClient, isAuthReady, mounted])

  const handleReset = useCallback(async () => {
    if (!isAuthReady) {
      setError('Authentication system is not ready. Please try again in a moment.')
      return
    }
    
    const supabase = getClient()
    if (!supabase) {
      setError('Authentication service unavailable. Please try again.')
      return
    }
    
    clearAlerts()
    if (!email) { 
      setError('Enter your email first.') 
      return 
    }
    try {
      setLoading(true)
      // HYDRATION FIX: Guard window access
      const origin = mounted && typeof window !== 'undefined' ? window.location.origin : ''
      const { error } = await supabase.auth.resetPasswordForEmail(email, { 
        redirectTo: `${origin}/auth/reset` 
      })
      if (error) throw error
      setMessage('Reset link sent. Check your email.')
    } catch (e: any) {
      setError(e?.message ?? 'Failed to send reset link.')
    } finally {
      setLoading(false)
    }
  }, [clearAlerts, email, getClient, isAuthReady, mounted])

  const validateEmailDomain = useCallback((email: string, allowedDomains: string[] = []) => {
    if (!allowedDomains.length) return { isValid: true, message: '' }
    
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
  }, [])

  // ✅ Enhanced status information for better UX
  const status = useMemo(() => {
    if (!mounted) return 'initializing'
    if (!clientReady) return 'connecting'
    return 'ready'
  }, [mounted, clientReady])

  // ✅ Helper to check if operations should be disabled
  const isDisabled = useMemo(() => {
    return loading || !isAuthReady
  }, [loading, isAuthReady])

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
    
    // Hydration safety state
    mounted,
    clientReady,
    isAuthReady,
    status,
    isDisabled,
    
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