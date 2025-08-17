'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabaseClient' // adjust if your path differs

export type AuthMode = 'login' | 'signup'

export interface UseAuthFormOptions {
  redirectTo?: string | null
  onSuccess?: () => void
}

export function useAuthForm(opts: UseAuthFormOptions = {}) {
  const router = useRouter()
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
        // Ensure a profile row exists (id = auth user id)
        if (data?.user?.id) {
          await supabase.from('profiles').upsert({ id: data.user.id }, { onConflict: 'id' })
        }
        setMessage('Signed in!')
        // Do not navigate here; let parent (modal/page) react to SIGNED_IN
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data?.user?.id) {
          await supabase.from('profiles').upsert({ id: data.user.id }, { onConflict: 'id' })
        }
        setMessage('Account created! Check your inbox if email confirmation is required.')
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
      // Flow continues after OAuth redirect
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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/reset`,
      })
      if (error) throw error
      setMessage('Reset link sent. Check your email.')
    } catch (e: any) {
      setError(e?.message ?? 'Failed to send reset link.')
    } finally {
      setLoading(false)
    }
  }, [clearAlerts, email])

  return {
    // state
    mode, setMode,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    loading, message, error,
    // actions
    handleEmailAuth,
    handleOAuth,
    handleReset,
    clearAlerts,
  }
}