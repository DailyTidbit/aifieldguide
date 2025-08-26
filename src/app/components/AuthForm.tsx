// src/app/components/AuthForm.tsx - Refactored to use useAuth hook
'use client'

import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import ProfileSetupWizard from './ProfileSetupWizard'
import { Mail, Lock, Eye, EyeOff, Loader2, Check, AlertCircle } from 'lucide-react'

export default function EnhancedAuthForm() {
  const { 
    user, 
    loading: authLoading, 
    authState,
    signIn, 
    signUp, 
    signInWithOAuth, 
    resetPassword 
  } = useAuth()
  
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const validateForm = () => {
    if (!email || !password) {
      setError('Please fill in all fields')
      return false
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    if (!isLogin && password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }

    return true
  }

  const handleEmailAuth = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      setError(null)
      setMessage(null)

      if (isLogin) {
        await signIn(email, password)
        setMessage('Successfully logged in!')
      } else {
        await signUp(email, password)
        setMessage('Account created! Check your email if confirmation is required.')
      }
    } catch (err: any) {
      console.error('Auth error:', err)
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    try {
      setLoading(true)
      setError(null)
      
      await signInWithOAuth(provider)
    } catch (err: any) {
      setError(err.message || `${provider} login failed`)
      setLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email address first')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      await resetPassword(email)
      setMessage('Password reset email sent! Check your inbox.')
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSetupComplete = () => {
    setMessage('Profile setup complete! Welcome to Daily Tidbit!')
  }

  const handleSkipSetup = () => {
    setMessage('You can complete your profile anytime from the profile page.')
  }

  // Show profile setup wizard if user needs it
  if (user && authState === 'logged-out' && !user.profile?.full_name) {
    return (
      <ProfileSetupWizard
        userId={user.id}
        onComplete={handleProfileSetupComplete}
        onSkip={handleSkipSetup}
      />
    )
  }

  // Hide form if user is already authenticated and setup is complete
  if (authState === 'has-company-access' || authState === 'needs-password-setup') {
    return null
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-[#60A875] to-[#59B1E3] rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl">✨</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isLogin ? 'Welcome back!' : 'Join Daily Tidbit'}
        </h2>
        <p className="text-gray-600">
          {isLogin 
            ? 'Sign in to continue your AI learning journey' 
            : 'Start learning AI with real people, real tools'
          }
        </p>
      </div>

      {/* Messages */}
      {message && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-green-700 text-sm">{message}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {/* OAuth Buttons */}
      <div className="space-y-3">
        <button
          onClick={() => handleOAuthLogin('google')}
          disabled={loading || authLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="font-medium text-gray-700">
            {isLogin ? 'Sign in' : 'Sign up'} with Google
          </span>
        </button>

        <button
          onClick={() => handleOAuthLogin('apple')}
          disabled={loading || authLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          <span className="font-medium">
            {isLogin ? 'Sign in' : 'Sign up'} with Apple
          </span>
        </button>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">or continue with email</span>
        </div>
      </div>

      {/* Email Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#60A875] focus:border-[#60A875] transition-colors"
              placeholder="Enter your email"
              disabled={loading || authLoading}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#60A875] focus:border-[#60A875] transition-colors"
              placeholder="Enter your password"
              disabled={loading || authLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#60A875] focus:border-[#60A875] transition-colors"
                placeholder="Confirm your password"
                disabled={loading || authLoading}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleEmailAuth}
          disabled={loading || authLoading}
          className="w-full flex items-center justify-center gap-2 bg-[#60A875] text-white py-3 rounded-lg hover:bg-green-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {(loading || authLoading) ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {isLogin ? 'Signing in...' : 'Creating account...'}
            </>
          ) : (
            <>
              {isLogin ? 'Sign In' : 'Create Account'}
            </>
          )}
        </button>
      </div>

      {/* Toggle Login/Signup */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            onClick={() => {
              setIsLogin(!isLogin)
              setError(null)
              setMessage(null)
              setPassword('')
              setConfirmPassword('')
            }}
            className="text-[#60A875] hover:text-green-600 font-medium transition-colors"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>

      {isLogin && (
        <div className="text-center">
          <button 
            onClick={handlePasswordReset}
            disabled={loading || authLoading}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            Forgot your password?
          </button>
        </div>
      )}
    </div>
  )
}