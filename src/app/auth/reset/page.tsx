// src/app/auth/reset/page.tsx
'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseBrowserClient } from '../../lib/supabaseClient' // ✅ FIXED: Consistent import path
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'

function PasswordResetContent() {
  // ✅ HYDRATION SAFE: Essential mounted state first
  const [mounted, setMounted] = useState(false)
  const [supabaseReady, setSupabaseReady] = useState(false)
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [sessionReady, setSessionReady] = useState(false)

  const router = useRouter()
  const sp = useSearchParams()
  const verifiedOnceRef = useRef(false)

  // ✅ Hydration safety - must be first useEffect
  useEffect(() => {
    setMounted(true)
  }, [])

  // ✅ Check Supabase client availability
  useEffect(() => {
    if (!mounted) return

    const checkSupabaseClient = () => {
      try {
        const supabase = getSupabaseBrowserClient()
        setSupabaseReady(!!supabase)
      } catch (error) {
        console.warn('Supabase client not available:', error)
        setSupabaseReady(false)
      }
    }

    checkSupabaseClient()
    // Retry if not ready
    if (!supabaseReady) {
      const interval = setInterval(checkSupabaseClient, 2000)
      return () => clearInterval(interval)
    }
  }, [mounted, supabaseReady])

  // Establish/confirm session from the link - only after mounted and supabase ready
  useEffect(() => {
    if (!mounted || !supabaseReady) return

    let cancelled = false
    const run = async () => {
      try {
        setError(null)
        const supabase = getSupabaseBrowserClient()
        
        // ✅ CRITICAL: Handle null supabase client
        if (!supabase) {
          setError('Database connection unavailable')
          setInitializing(false)
          return
        }

        const token_hash = sp.get('token_hash')
        const type = (sp.get('type') as 'recovery' | null) ?? null
        const code = sp.get('code')
        
        // ✅ HYDRATION SAFE: Check window exists before accessing
        const hasHash = mounted && typeof window !== 'undefined' && window.location.hash.includes('access_token')

        if (!verifiedOnceRef.current && (token_hash || code || hasHash)) {
          verifiedOnceRef.current = true

          if (token_hash) {
            const { error } = await supabase.auth.verifyOtp({ token_hash, type: type || 'recovery' })
            if (error) throw error
          } else if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code)
            if (error) throw error
          } else if (hasHash && typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.hash.substring(1))
            const access_token = params.get('access_token')
            const refresh_token = params.get('refresh_token')
            if (access_token && refresh_token) {
              const { error } = await supabase.auth.setSession({ access_token, refresh_token })
              if (error) throw error
            }
          }

          // ✅ HYDRATION SAFE: Remove tokens only if in browser
          if (mounted && typeof window !== 'undefined') {
            const url = new URL(window.location.href)
            url.searchParams.delete('token_hash')
            url.searchParams.delete('type')
            url.searchParams.delete('code')
            window.history.replaceState({}, '', url.toString())
          }
        }

        const { data: { session }, error: sessErr } = await supabase.auth.getSession()
        if (sessErr) throw sessErr
        if (!cancelled) setSessionReady(!!session)
      } catch (e: any) {
        const supabase = getSupabaseBrowserClient()
        if (!supabase) {
          if (!cancelled) {
            setError('Database connection unavailable')
            setSessionReady(false)
          }
          return
        }

        const { data } = await supabase.auth.getSession()
        if (!data.session && !cancelled) {
          setError(e?.message || 'Reset link invalid or expired. Please request a new one.')
          setSessionReady(false)
        } else if (!cancelled) {
          setSessionReady(true)
        }
      } finally {
        if (!cancelled) setInitializing(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [mounted, supabaseReady, sp])

  // ✅ Hydration-safe calculations
  const canSubmit = mounted && supabaseReady ? password.length >= 8 && password === confirmPassword : false
  const showForm = mounted && supabaseReady && sessionReady

  // ✅ HYDRATION SAFE: Submit with browser checks
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mounted || !supabaseReady || !password) return setError('Password is required')
    if (password.length < 8) return setError('Password must be at least 8 characters long')
    if (password !== confirmPassword) return setError('Passwords do not match')

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setError('Database connection unavailable')
      return
    }

    setLoading(true); setError(null)
    try {
      const { data: { session }, error: sErr } = await supabase.auth.getSession()
      if (sErr) throw sErr
      if (!session) throw new Error('Auth session missing. Open a fresh reset link and try again.')

      const { error } = await supabase.auth.updateUser({
        password,
        data: { has_password: true },
      })
      if (error) throw error

      // ✅ HYDRATION SAFE: Only redirect if in browser
      if (mounted && typeof window !== 'undefined') {
        window.location.replace('/?reset=success')
      }
      return
    } catch (err: any) {
      setError(err?.message || 'Failed to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // don&apos;t render anything until mounted
  if (!mounted) {
    return null
  }

  // Show loading while initializing or waiting for Supabase
  if (initializing || !supabaseReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin" />
          <h2 className="mt-6 text-3xl font-extrabold">Processing Reset Link</h2>
          <p className="mt-2 text-sm text-gray-600">
            {!supabaseReady ? 'Connecting to database...' : 'Please wait while we verify your reset link…'}
          </p>
        </div>
      </div>
    )
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h2 className="mt-6 text-3xl font-extrabold">Invalid Reset Link</h2>
          <p className="mt-2 text-sm text-gray-600">{error || 'This link is invalid or has expired.'}</p>
          <button 
            onClick={() => router.push('/')} 
            className="mt-4 text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Go back to homepage
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold">Set New Password</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Please enter your new password below</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Show Supabase not ready warning */}
          {!supabaseReady && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <Loader2 className="h-5 w-5 text-yellow-400 animate-spin" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-600">Connecting to authentication service...</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium">New Password</label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter new password (8+ characters)"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium">Confirm Password</label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            {/* Password validation indicators - only show when mounted */}
            {mounted && password && (
              <div className="text-xs space-y-1">
                <div className={`flex items-center gap-2 ${password.length >= 8 ? 'text-brand-greenDark' : 'text-red-500'}`}>
                  <div className={`w-2 h-2 rounded-full ${password.length >= 8 ? 'bg-brand-green' : 'bg-red-500'}`} />
                  At least 8 characters
                </div>
                {confirmPassword && (
                  <div className={`flex items-center gap-2 ${password === confirmPassword ? 'text-brand-greenDark' : 'text-red-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${password === confirmPassword ? 'bg-brand-green' : 'bg-red-500'}`} />
                    Passwords match
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !canSubmit || !supabaseReady}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Update Password'}
            </button>
          </div>

          <div className="text-center">
            <button 
              type="button" 
              onClick={() => router.push('/')} 
              className="text-sm text-gray-600 hover:text-gray-500"
            >
              Cancel and go back
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PasswordResetPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    }>
      <PasswordResetContent />
    </Suspense>
  )
}