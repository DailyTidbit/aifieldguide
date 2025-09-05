// src/app/partners/setup/page.tsx - FULLY HYDRATION SAFE & OPTIMIZED
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseBrowser } from '../../lib/supabaseClient'
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle, Loader2, Shield, Building2 } from 'lucide-react'
import Link from 'next/link'

// Types
type SetupStep = 'loading' | 'setup' | 'success' | 'error'

type CompanyInfo = {
  name: string
  isFirstUser: boolean
}

type PasswordStrength = {
  strength: number
  label: string
}

// Password strength calculator - memoized
const calculatePasswordStrength = (password: string): PasswordStrength => {
  if (password.length === 0) return { strength: 0, label: '' }
  if (password.length < 6) return { strength: 1, label: 'Weak' }
  if (password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
    return { strength: 2, label: 'Fair' }
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return { strength: 3, label: 'Good' }
  }
  return { strength: 4, label: 'Strong' }
}

// Loading display component
const LoadingDisplay = ({ message = "Setting up your account..." }: { message?: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <Loader2 className="h-8 w-8 text-brand-green animate-spin mx-auto mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
)

// Error display component
const ErrorDisplay = ({ error, onRetry, onRequestNew }: {
  error: string
  onRetry: () => void
  onRequestNew: () => void
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Setup Error</h1>
      <p className="text-gray-600 mb-6">{error}</p>
      <div className="space-y-3">
        <button
          onClick={onRetry}
          className="w-full bg-brand-green text-white py-3 rounded-lg font-medium hover:bg-brand-green/90 transition-colors"
        >
          Try Again
        </button>
        <button
          onClick={onRequestNew}
          className="block w-full py-3 text-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          Request New Invitation
        </button>
        <div className="text-xs text-gray-500 mt-4">
          Need help? Email{' '}
          <a href="mailto:partners@dailytidbit.org" className="text-brand-green hover:underline">
            partners@dailytidbit.org
          </a>
        </div>
      </div>
    </div>
  </div>
)

// Success display component
const SuccessDisplay = ({ companyInfo }: { companyInfo: CompanyInfo | null }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="h-8 w-8 text-brand-greenDark" />
      </div>
      
      <h1 className="text-2xl font-semibold text-gray-900 mb-4">
        {companyInfo?.isFirstUser ? '🎉 Welcome to Daily Tidbit!' : '👋 Account Setup Complete!'}
      </h1>
      
      <p className="text-gray-600 mb-6">
        {companyInfo?.isFirstUser 
          ? `you&apos;re the first person from ${companyInfo.name} to join our partner program. You have admin access to manage your company's presence.`
          : `You now have access to ${companyInfo?.name}'s partner dashboard and can start managing your AI tool listings.`
        }
      </p>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-2">
          <Loader2 className="h-4 w-4 text-brand-green animate-spin" />
          Redirecting to your dashboard...
        </div>
      </div>

      <Link
        href="/partners/dashboard"
        className="inline-flex items-center gap-2 text-brand-green hover:text-brand-green/80 font-medium text-sm"
      >
        Go to Dashboard Now →
      </Link>
    </div>
  </div>
)

// Password requirements component
const PasswordRequirements = ({ password }: { password: string }) => {
  const requirements = useMemo(() => [
    {
      text: "At least 8 characters",
      met: password.length >= 8
    },
    {
      text: "One uppercase letter (recommended)",
      met: /[A-Z]/.test(password)
    },
    {
      text: "One number (recommended)",
      met: /\d/.test(password)
    }
  ], [password])

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="text-sm text-gray-700">
        <div className="font-medium mb-2">Password Requirements:</div>
        <ul className="space-y-1 text-xs">
          {requirements.map((req, index) => (
            <li key={index} className={`flex items-center gap-2 ${req.met ? 'text-brand-greenDark' : 'text-gray-500'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${req.met ? 'bg-brand-green' : 'bg-gray-300'}`} />
              {req.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// Password strength indicator component
const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const { strength, label } = useMemo(() => calculatePasswordStrength(password), [password])

  if (!password) return null

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">Password strength</span>
        <span className={`text-xs font-medium ${
          strength === 1 ? 'text-red-600' :
          strength === 2 ? 'text-yellow-600' :
          strength === 3 ? 'text-brand-blueDark' :
          strength === 4 ? 'text-brand-greenDark' : 'text-gray-400'
        }`}>
          {label}
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${
            strength === 1 ? 'bg-red-500 w-1/4' :
            strength === 2 ? 'bg-yellow-500 w-2/4' :
            strength === 3 ? 'bg-brand-blue w-3/4' :
            strength === 4 ? 'bg-brand-green w-full' : 'w-0'
          }`}
        />
      </div>
    </div>
  )
}

export default function PartnerPasswordSetupPage() {
  const router = useRouter()
  
  // Hydration safety
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState<SetupStep>('loading')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)

  // Use the safe Supabase hook
  const { client: supabase, isReady } = useSupabaseBrowser()

  // Mount effect
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check user status on mount
  useEffect(() => {
    if (!mounted || !isReady || !supabase) return
    
    // Check if this is from a magic link
    const urlParams = new URLSearchParams(window.location.search)
    const accessToken = urlParams.get('access_token')
    const refreshToken = urlParams.get('refresh_token')
    
    if (accessToken && refreshToken) {
      // Set the session from magic link tokens
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      }).then(() => {
        checkUserStatus()
      })
    } else {
      checkUserStatus()
    }
  }, [mounted, isReady, supabase])

  // Memoized user status checker
  const checkUserStatus = useCallback(async () => {
    if (!mounted || !isReady || !supabase) return

    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        setStep('error')
        setError('Invalid or expired invitation link. Please request a new invitation.')
        return
      }

      setUser(user)

      // Check if user already has password set up
      if (user.user_metadata?.has_password) {
        // User already has password, redirect to dashboard
        router.push('/partners/dashboard')
        return
      }

      // Check if user is associated with a company
      const { data: membership, error: membershipError } = await supabase
        .from('company_users')
        .select(`
          company_id, 
          role,
          companies!inner(name)
        `)
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (membershipError) {
        console.error('Membership query error:', membershipError)
        setStep('error')
        setError('Unable to verify your account status. Please try again or contact support.')
        return
      }

      if (!membership?.company_id) {
        setStep('error')
        setError('Your account is not associated with any company. Please contact support at partners@dailytidbit.org')
        return
      }

      // Get company info and check if this is the first user
      const { count, error: countError } = await supabase
        .from('company_users')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', membership.company_id)

      if (countError) {
        console.error('Count query error:', countError)
        // Continue anyway, just without the first user check
      }

      const isFirstUser = membership.role === 'company_admin' && (count || 0) === 1

      setCompanyInfo({
        name: (membership.companies as any).name,
        isFirstUser
      })

      setStep('setup')
    } catch (err: any) {
      console.error('Setup check error:', err)
      setStep('error')
      setError('Unable to verify your account status. Please try again or contact support.')
    }
  }, [mounted, isReady, supabase, router])

  // Password setup handler
  const handlePasswordSetup = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mounted || !supabase) return

    setError(null)

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      // Update user password and mark as having password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
        data: { 
          has_password: true,
          setup_completed_at: new Date().toISOString()
        }
      })

      if (updateError) throw updateError

      setStep('success')
      
      // Auto-redirect after success
      setTimeout(() => {
        router.push('/partners/dashboard')
      }, 3000)

    } catch (err: any) {
      console.error('Password setup error:', err)
      setError(err.message || 'Failed to set up password. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [mounted, supabase, password, confirmPassword, router])

  // Navigation handlers
  const handleRetry = useCallback(() => {
    checkUserStatus()
  }, [checkUserStatus])

  const handleRequestNew = useCallback(() => {
    router.push('/partners/request-access')
  }, [router])

  // Toggle password visibility handlers
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword(prev => !prev)
  }, [])

  // Password change handlers
  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    setError(null)
  }, [])

  const handleConfirmPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value)
    setError(null)
  }, [])

  // Validation states
  const isFormValid = useMemo(() => {
    return password.length >= 8 && password === confirmPassword
  }, [password, confirmPassword])

  const isSubmitDisabled = useMemo(() => {
    return loading || !isFormValid || !mounted || !isReady || !supabase
  }, [loading, isFormValid, mounted, isReady, supabase])

  // Show loading during hydration
  if (!mounted || step === 'loading') {
    return <LoadingDisplay />
  }

  if (step === 'error') {
    return (
      <ErrorDisplay
        error={error || 'An unknown error occurred'}
        onRetry={handleRetry}
        onRequestNew={handleRequestNew}
      />
    )
  }

  if (step === 'success') {
    return <SuccessDisplay companyInfo={companyInfo} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-green rounded-lg"></div>
            <span className="font-bold text-xl text-gray-900">Daily Tidbit Partner Setup</span>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Welcome Message */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-brand-green/10 text-brand-green px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Shield className="h-4 w-4" />
              Secure Setup
            </div>
            
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">
              Set Up Your Password
            </h1>
            
            {companyInfo && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <Building2 className="h-5 w-5 text-brand-blueDark flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium text-blue-900 text-sm">
                    {companyInfo.name}
                  </div>
                  <div className="text-blue-700 text-xs">
                    {companyInfo.isFirstUser ? 'Company Admin Account' : 'Team Member Account'}
                  </div>
                </div>
              </div>
            )}
            
            <p className="text-gray-600">
              Create a secure password to access your partner dashboard and manage your AI tool listings.
            </p>
          </div>

          {/* Password Setup Form */}
          <form onSubmit={handlePasswordSetup} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              <PasswordStrengthIndicator password={password} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {confirmPassword && password && (
                <div className={`mt-2 text-sm flex items-center gap-2 ${
                  password === confirmPassword ? 'text-brand-greenDark' : 'text-red-600'
                }`}>
                  {password === confirmPassword ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Passwords match
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      Passwords don&apos;t match
                    </>
                  )}
                </div>
              )}
            </div>

            <PasswordRequirements password={password} />

            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="w-full flex items-center justify-center gap-2 bg-brand-green text-white py-3 rounded-lg font-semibold hover:bg-brand-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Setting up account...
                </>
              ) : (
                'Complete Setup'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              By setting up your password, you agree to Daily Tidbit's{' '}
              <Link href="/terms" className="text-brand-green hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-brand-green hover:underline">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
