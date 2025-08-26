// src/app/components/ModalAuthForm.tsx - Refactored to use useAuth hook
'use client'

import { useState } from 'react'
import { AlertCircle, Apple, Chrome, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

interface ModalAuthFormProps { 
  redirectTo?: string | null 
}

export default function ModalAuthForm({ redirectTo }: ModalAuthFormProps) {
  const {
    loading: authLoading,
    signIn,
    signUp,
    signInWithOAuth,
    resetPassword
  } = useAuth()

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isLogin = mode === 'login'

  const clearMessages = () => {
    setMessage(null)
    setError(null)
  }

  const handleEmailAuth = async () => {
    clearMessages()
    
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
      
      if (isLogin) {
        await signIn(email, password)
        setMessage('Signed in!')
      } else {
        await signUp(email, password)
        setMessage('Account created! Check your email if confirmation is required.')
      }
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async (provider: 'google' | 'apple') => {
    clearMessages()
    
    try {
      setLoading(true)
      await signInWithOAuth(provider)
    } catch (e: any) {
      setError(e?.message ?? 'OAuth sign-in failed.')
      setLoading(false)
    }
  }

  const handleReset = async () => {
    clearMessages()
    
    if (!email) {
      setError('Enter your email first.')
      return
    }
    
    try {
      setLoading(true)
      await resetPassword(email)
      setMessage('Reset link sent. Check your email.')
    } catch (e: any) {
      setError(e?.message ?? 'Failed to send reset link.')
    } finally {
      setLoading(false)
    }
  }

  const isLoading = loading || authLoading

  return (
    <div className="w-full">
      <div className="mb-4">
        <div className="flex gap-2 text-sm">
          <button 
            onClick={() => setMode('login')} 
            className={`px-3 py-1 rounded-full ${
              isLogin ? 'bg-black text-white' : 'bg-gray-100'
            }`} 
            aria-pressed={isLogin}
          >
            Sign In
          </button>
          <button 
            onClick={() => setMode('signup')} 
            className={`px-3 py-1 rounded-full ${
              !isLogin ? 'bg-black text-white' : 'bg-gray-100'
            }`} 
            aria-pressed={!isLogin}
          >
            Create Account
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-3 flex items-center gap-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      
      {message && (
        <div role="status" className="mb-3 text-green-700">{message}</div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleEmailAuth() }} className="space-y-3">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input 
            type="email" 
            required 
            autoComplete="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full rounded-xl border p-2" 
            aria-invalid={Boolean(error)} 
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Password</label>
          <input 
            type="password" 
            required 
            autoComplete={isLogin ? 'current-password' : 'new-password'} 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="w-full rounded-xl border p-2"
            disabled={isLoading}
          />
        </div>

        {!isLogin && (
          <div>
            <label className="block text-sm font-medium">Confirm Password</label>
            <input 
              type="password" 
              required 
              autoComplete="new-password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              className="w-full rounded-xl border p-2"
              disabled={isLoading}
            />
          </div>
        )}

        <button 
          type="submit" 
          disabled={isLoading} 
          className="mt-2 inline-flex w-full items-center justify-center rounded-xl border bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isLogin ? 'Signing in...' : 'Creating account...'}
            </>
          ) : (
            isLogin ? 'Sign In' : 'Create Account'
          )}
        </button>

        <button 
          type="button" 
          onClick={handleReset} 
          className="w-full text-center text-sm text-gray-600 underline" 
          disabled={isLoading || !email}
        >
          Forgot your password?
        </button>
      </form>

      <div className="my-4 flex items-center gap-2 text-xs text-gray-500">
        <div className="h-px flex-1 bg-gray-200" /> 
        or 
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <div className="grid grid-cols-1 gap-2">
        <button 
          type="button" 
          onClick={() => handleOAuth('google')} 
          disabled={isLoading} 
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2 disabled:opacity-60"
        >
          <Chrome className="h-4 w-4" /> Continue with Google
        </button>
        <button 
          type="button" 
          onClick={() => handleOAuth('apple')} 
          disabled={isLoading} 
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2 disabled:opacity-60"
        >
          <Apple className="h-4 w-4" /> Continue with Apple
        </button>
      </div>
    </div>
  )
}