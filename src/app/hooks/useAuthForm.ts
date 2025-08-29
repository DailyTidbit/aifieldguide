// src/app/hooks/useAuthForm.ts - Updated with optimized Supabase import
'use client'

import { useCallback, useMemo, useState } from 'react'
import { getSupabaseBrowserClient } from '../lib/supabase-browser'

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

  const redirectTo = useMemo(() => opts.redirectTo ?? null, [opts.redirectTo])
  const isVendorFlow = useMemo(() => opts.isVendorFlow ?? false, [opts.isVendorFlow])
  const supabase = getSupabaseBrowserClient()

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

  const company = useMemo(() => getCompanyFromEmail(email), [email, getCompanyFromEmail])

  const clearAlerts = useCallback(() => {
    setMessage(null)
    setError(null)
  }, [])

  const handleEmailAuth = useCallback(async () => {
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
            emailRedirectTo: redirectTo || (typeof window !== 'undefined' ? window.location.origin : undefined),
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
  }, [clearAlerts, confirmPassword, email, mode, password, redirectTo, isVendorFlow, supabase])

  const handleMagicLinkAuth = useCallback(async () => {
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
          emailRedirectTo: redirectTo || (typeof window !== 'undefined' ? window.location.href : undefined),
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
  }, [clearAlerts, email, redirectTo, isVendorFlow, company, supabase])

  const handleOAuth = useCallback(async (provider: 'google' | 'apple') => {
    clearAlerts()
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectTo ?? (typeof window !== 'undefined' ? window.location.href : undefined),
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
  }, [clearAlerts, redirectTo, isVendorFlow, supabase])

  const handleReset = useCallback(async () => {
    clearAlerts()
    if (!email) { 
      setError('Enter your email first.') 
      return 
    }
    try {
      setLoading(true)
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
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
  }, [clearAlerts, email, supabase])

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

  return {
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
    handleEmailAuth,
    handleMagicLinkAuth,
    handleOAuth,
    handleReset,
    clearAlerts,
    validateEmailDomain,
    getCompanyFromEmail,
  }
}