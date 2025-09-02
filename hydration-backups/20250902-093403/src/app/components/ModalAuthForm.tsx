// app/components/ModalAuthForm.tsx - Simplified server actions
'use client'

import { useState, useEffect, useTransition } from 'react'
import { useAuth } from '../hooks/useAuth'
import { signInAction, signUpAction, resetPasswordAction } from '../lib/auth-actions'

interface ModalAuthFormProps {
  redirectTo?: string | null
  initialMode?: 'signin' | 'signup'
  onClose?: () => void
}

export default function ModalAuthForm({ 
  redirectTo, 
  initialMode = 'signin',
  onClose
}: ModalAuthFormProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(initialMode)
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  
  const { signInWithOAuth, signInWithMagicLink } = useAuth()

  // Hydration safety
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    const formData = new FormData(event.currentTarget)
    
    startTransition(async () => {
      try {
        let result
        if (mode === 'signin') {
          result = await signInAction(null, formData)
        } else if (mode === 'signup') {
          result = await signUpAction(null, formData)
        } else if (mode === 'reset') {
          result = await resetPasswordAction(null, formData)
        }

        if (result?.error) {
          setError(result.error)
        } else if (result?.message) {
          setMessage(result.message)
        }
      } catch (err) {
        setError('An unexpected error occurred')
      }
    })
  }

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    if (!mounted) return
    
    setError(null)
    
    try {
      await signInWithOAuth(provider)
    } catch (err: any) {
      setError(err.message || 'OAuth sign in failed')
    }
  }

  const handleMagicLink = async (email: string) => {
    if (!mounted || !email.trim()) return
    
    try {
      setError(null)
      await signInWithMagicLink(email, { redirectTo: redirectTo || '/' })
      setMessage('Check your email for a sign in link')
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link')
    }
  }

  // Show minimal loading during hydration
  if (!mounted) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-6 w-6 border-2 border-brand-green border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (mode === 'reset') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="heading-subsection text-gray-900">Reset Password</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
        
        <p className="body-medium text-gray-600">
          Enter your email to receive reset instructions
        </p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="body-small text-red-600">{error}</p>
          </div>
        )}
        
        {message && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="body-small text-brand-greenDark">{message}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="hidden"
            name="redirectTo"
            value={redirectTo || '/'}
          />
          
          <div>
            <label htmlFor="reset-email" className="sr-only">Email address</label>
            <input
              id="reset-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isPending}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-brand-green focus:border-brand-green sm:text-sm disabled:opacity-50"
              placeholder="Email address"
            />
          </div>
          
          <button
            type="submit"
            disabled={isPending}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-green hover:bg-brand-greenDark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green transition-colors body-bold disabled:opacity-50"
          >
            {isPending ? 'Sending...' : 'Send reset instructions'}
          </button>
        </form>
        
        <div className="text-center">
          <button
            onClick={() => setMode('signin')}
            disabled={isPending}
            className="text-brand-blue hover:text-brand-blue body-medium disabled:opacity-50"
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="heading-subsection text-gray-900">
          {mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="body-small text-red-600">{error}</p>
        </div>
      )}
      
      {message && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <p className="body-small text-brand-greenDark">{message}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="hidden"
          name="redirectTo"
          value={redirectTo || '/'}
        />
        
        <div>
          <label htmlFor="auth-email" className="sr-only">Email address</label>
          <input
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={isPending}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-brand-green focus:border-brand-green sm:text-sm disabled:opacity-50"
            placeholder="Email address"
          />
        </div>
        
        {mode === 'signup' && (
          <div>
            <label htmlFor="auth-fullname" className="sr-only">Full Name</label>
            <input
              id="auth-fullname"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              disabled={isPending}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-brand-green focus:border-brand-green sm:text-sm disabled:opacity-50"
              placeholder="Full name"
            />
          </div>
        )}
        
        <div>
          <label htmlFor="auth-password" className="sr-only">Password</label>
          <input
            id="auth-password"
            name="password"
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            required
            disabled={isPending}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-brand-green focus:border-brand-green sm:text-sm disabled:opacity-50"
            placeholder={mode === 'signup' ? 'Password (8+ characters)' : 'Password'}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-green hover:bg-brand-greenDark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green transition-colors body-bold disabled:opacity-50"
        >
          {isPending ? 'Loading...' : (mode === 'signin' ? 'Sign in' : 'Sign up')}
        </button>

        {mode === 'signin' && (
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => setMode('reset')}
              disabled={isPending}
              className="text-brand-blue hover:text-brand-blue body-medium disabled:opacity-50"
            >
              Forgot password?
            </button>
            <button
              type="button"
              onClick={() => {
                const email = (document.getElementById('auth-email') as HTMLInputElement)?.value
                if (email) handleMagicLink(email)
              }}
              disabled={isPending}
              className="text-brand-blue hover:text-brand-blue body-medium disabled:opacity-50"
            >
              Send magic link
            </button>
          </div>
        )}
      </form>

      <div className="mt-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500 body-medium">Or continue with</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleOAuthSignIn('google')}
            disabled={isPending}
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors body-medium disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="ml-2">Google</span>
          </button>

          <button
            type="button"
            onClick={() => handleOAuthSignIn('apple')}
            disabled={isPending}
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors body-medium disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <span className="ml-2">Apple</span>
          </button>
        </div>
      </div>

      <div className="text-center">
        {mode === 'signin' ? (
          <p className="body-medium text-gray-600">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => {
                setMode('signup')
                setError(null)
                setMessage(null)
              }}
              disabled={isPending}
              className="text-brand-blue hover:text-brand-blue font-medium disabled:opacity-50"
            >
              Sign up
            </button>
          </p>
        ) : (
          <p className="body-medium text-gray-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => {
                setMode('signin')
                setError(null)
                setMessage(null)
              }}
              disabled={isPending}
              className="text-brand-blue hover:text-brand-blue font-medium disabled:opacity-50"
            >
              Sign in
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
