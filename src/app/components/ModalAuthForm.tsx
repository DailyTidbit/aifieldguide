// src/app/components/ModalAuthForm.tsx - Fixed UX issues
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'

interface ModalAuthFormProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'signin' | 'signup'
}

export default function ModalAuthForm({ isOpen, onClose, initialMode = 'signin' }: ModalAuthFormProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showSuccessBanner, setShowSuccessBanner] = useState(false)
  
  const { signIn, signUp, resetPassword, signInWithOAuth, signInWithMagicLink } = useAuth()

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError(null)
      setMessage(null)
      setShowSuccessBanner(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Email is required')
      return
    }

    setLoading(true)
    setError(null)
    setMessage(null)
    setShowSuccessBanner(false)

    try {
      if (mode === 'signin') {
        if (password) {
          await signIn(email, password)
          // Only close modal if sign-in was successful (no verification needed)
          onClose()
        } else {
          await signInWithMagicLink(email)
          setMessage('Check your email for a sign in link')
          setShowSuccessBanner(true)
          // Don't close modal - show success message
        }
      } else if (mode === 'signup') {
        if (!password || password.length < 8) {
          setError('Password must be at least 8 characters')
          return
        }
        await signUp(email, password)
        setMessage('Check your email to verify your account, then sign in')
        setShowSuccessBanner(true)
        // Don't close modal - show success message and let them verify
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      setShowSuccessBanner(false)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!email.trim()) { 
      setError('Enter your email first.')
      return 
    }
    
    setLoading(true)
    try {
      await resetPassword(email)
    } catch (error) {
      // Don't expose the actual error - prevents email enumeration
      console.error('Password reset error:', error)
    } finally {
      setMessage("If an account exists for this email, we'll send reset instructions.")
      setShowSuccessBanner(true)
      setLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    setLoading(true)
    setError(null)
    
    try {
      await signInWithOAuth(provider)
      // OAuth will redirect, so modal stays open until redirect completes
    } catch (err: any) {
      setError(err.message || 'OAuth sign in failed')
    } finally {
      // Always reset loading state
      setLoading(false)
    }
  }

  const handleCloseModal = () => {
    // Reset all state when closing
    setError(null)
    setMessage(null)
    setShowSuccessBanner(false)
    setEmail('')
    setPassword('')
    setMode(initialMode)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleCloseModal}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full sm:p-6">
          {/* Close button */}
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleCloseModal}
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
              {mode === 'reset' ? (
                <>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Reset your password
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Enter your email to receive reset instructions
                  </p>
                </>
              ) : (
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
                </h3>
              )}

              {/* Success banner - stays visible */}
              {showSuccessBanner && message && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-600">{message}</p>
                      {mode === 'signup' && (
                        <p className="text-xs text-green-500 mt-1">
                          After verifying your email, you can sign in below.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {mode === 'reset' ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="modal-email" className="sr-only">Email address</label>
                    <input
                      id="modal-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Email address"
                    />
                  </div>
                  
                  <button
                    onClick={handleReset}
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send reset instructions'}
                  </button>
                  
                  <div className="text-center">
                    <button
                      onClick={() => {
                        setMode('signin')
                        setShowSuccessBanner(false)
                        setMessage(null)
                      }}
                      className="text-indigo-600 hover:text-indigo-500 text-sm"
                    >
                      Back to sign in
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="modal-email" className="sr-only">Email address</label>
                      <input
                        id="modal-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Email address"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="modal-password" className="sr-only">Password</label>
                      <input
                        id="modal-password"
                        name="password"
                        type="password"
                        autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                        required={mode === 'signup'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder={mode === 'signup' ? 'Password (8+ characters)' : 'Password (optional)'}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : (mode === 'signin' ? 'Sign in' : 'Sign up')}
                  </button>

                  {mode === 'signin' && (
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('reset')
                          setShowSuccessBanner(false)
                          setMessage(null)
                        }}
                        className="text-sm text-indigo-600 hover:text-indigo-500"
                      >
                        Forgot your password?
                      </button>
                    </div>
                  )}
                </form>
              )}

              {mode !== 'reset' && (
                <>
                  <div className="mt-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or continue with</span>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleOAuthSignIn('google')}
                        disabled={loading}
                        className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
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
                        disabled={loading}
                        className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                        </svg>
                        <span className="ml-2">Apple</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    {mode === 'signin' ? (
                      <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setMode('signup')
                            setShowSuccessBanner(false)
                            setMessage(null)
                          }}
                          className="text-indigo-600 hover:text-indigo-500 font-medium"
                        >
                          Sign up
                        </button>
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setMode('signin')
                            setShowSuccessBanner(false)
                            setMessage(null)
                          }}
                          className="text-indigo-600 hover:text-indigo-500 font-medium"
                        >
                          Sign in
                        </button>
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}