'use client'

import { useCallback, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient' // adjust if your path differs

export type AuthMode = 'login' | 'signup'

export interface UseAuthFormOptions {
  redirectTo?: string | null
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

  const clearAlerts = useCallback(() => {
    setMessage(null)
    setError(null)
  }, [])

  const handleEmailAuth = useCallback(async () => {
    clearAlerts()
    if (!email || !password) { setError('Please enter your email and password.'); return }
    if (mode === 'signup' && password !== confirmPassword) { setError('Passwords do not match.'); return }

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
        const { data, error } = await supabase.auth.signUp({ email, password })
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
  }, [clearAlerts, confirmPassword, email, mode, password])

  const handleOAuth = useCallback(async (provider: 'google' | 'apple') => {
    clearAlerts()
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectTo ?? (typeof window !== 'undefined' ? window.location.href : undefined),
          skipBrowserRedirect: false,
        },
      })
      if (error) throw error
    } catch (e: any) {
      setError(e?.message ?? 'OAuth sign-in failed.')
      setLoading(false)
    }
  }, [clearAlerts, redirectTo])

  const handleReset = useCallback(async () => {
    clearAlerts()
    if (!email) { setError('Enter your email first.'); return }
    try {
      setLoading(true)
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/reset` })
      if (error) throw error
      setMessage('Reset link sent. Check your email.')
    } catch (e: any) {
      setError(e?.message ?? 'Failed to send reset link.')
    } finally {
      setLoading(false)
    }
  }, [clearAlerts, email])

  return {
    mode, setMode,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    loading, message, error,
    handleEmailAuth,
    handleOAuth,
    handleReset,
    clearAlerts,
  }
}