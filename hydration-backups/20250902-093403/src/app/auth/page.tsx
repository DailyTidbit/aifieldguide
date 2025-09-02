// src/app/auth/page.tsx - Streamlined Auth Flow with Suspense
'use client'

import { Suspense, useState, useEffect } from 'react'
import { getSupabaseBrowserClient } from '../lib/supabaseClient' // ✅ UPDATED: Use consolidated client
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowRight, 
  Building2, 
  Shield,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'

type AuthMode = 'signin' | 'password-setup' | 'redirecting'

function AuthContent() {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // ✅ UPDATED: Add mounted state for hydration safety
  const [mounted, setMounted] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  // ✅ UPDATED: Use hydration-safe client getter
  const supabase = getSupabaseBrowserClient()
  
  const isVendorFlow = searchParams.get('vendor') === 'true'
  const returnTo = searchParams.get('next') || (isVendorFlow ? '/partners/dashboard' : '/')
  const companyName = searchParams.get('company')
  const suggestedDomain = searchParams.get('domain')

  // ✅ HYDRATION SAFETY: Set mounted state
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // ✅ HYDRATION SAFETY: Only run after mounted and if supabase client is available
    if (!mounted || !supabase) return

    // Pre-fill email if domain suggested
    if (suggestedDomain && !email) {
      setEmail(`@${suggestedDomain}`)
    }

    // Check existing auth state
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: any } }) => {
      if (user) {
        // User is authenticated
        if (isVendorFlow && !user.user_metadata?.has_password) {
          setMode('password-setup')
        } else {
          setMode('redirecting')
          router.replace(returnTo)
        }
      }
      // If no user, stay in signin mode (default)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (event === 'SIGNED_IN' && session?.user) {
        if (isVendorFlow && !session.user.user_metadata?.has_password) {
          setMode('password-setup')
        } else {
          setMode('redirecting')
          // Use replace to avoid back button issues
          router.replace(returnTo)
        }
      } else if (event === 'SIGNED_OUT') {
        setMode('signin')
        setError(null)
        setMessage(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [router, isVendorFlow, returnTo, suggestedDomain, email, supabase, mounted])

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !supabase) return
    
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth?vendor=${isVendorFlow}&next=${encodeURIComponent(returnTo)}`,
          data: {
            vendor_flow: isVendorFlow,
            company_name: companyName,
            suggested_domain: suggestedDomain
          }
        }
      })
      
      if (error) throw error
      
      setMessage(`Check your email! We sent a sign-in link to ${email}`)
    } catch (err: any) {
      setError(err.message || 'Failed to send email')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSetup = async () => {
    if (!supabase) return
    
    setLoading(true)
    setError(null)

    try {
      if (password) {
        const { error } = await supabase.auth.updateUser({
          password: password,
          data: { has_password: true }
        })
        if (error) throw error
      }
      
      setMode('redirecting')
      router.replace(returnTo)
    } catch (err: any) {
      setError(err.message || 'Failed to set password')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'google') => {
    if (!supabase) return
    
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth?vendor=${isVendorFlow}&next=${encodeURIComponent(returnTo)}`,
        queryParams: {
          vendor_flow: isVendorFlow ? 'true' : 'false',
          company: companyName || '',
          domain: suggestedDomain || ''
        }
      }
    })
    
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  // Enhanced domain validation
  const getEmailDomainInfo = (email: string) => {
    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain) return null
    
    const knownDomains = {
      'gmail.com': { trusted: false, type: 'personal' },
      'outlook.com': { trusted: false, type: 'personal' },
      'microsoft.com': { trusted: true, type: 'corporate' },
      'google.com': { trusted: true, type: 'corporate' },
      'anthropic.com': { trusted: true, type: 'corporate' },
      'openai.com': { trusted: true, type: 'corporate' }
    }
    
    const info = knownDomains[domain as keyof typeof knownDomains]
    return {
      domain,
      ...info,
      companyName: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)
    }
  }

  const emailInfo = getEmailDomainInfo(email)

  // ✅ HYDRATION SAFETY: Show loading state during hydration
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-brand-green" />
      </div>
    )
  }

  if (mode === 'redirecting') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-green mx-auto mb-4" />
          <p className="text-gray-600">Taking you to your dashboard...</p>
        </div>
      </div>
    )
  }

  if (mode === 'password-setup') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-brand-greenDark" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {companyName ? `Welcome to ${companyName}` : 'Welcome to Daily Tidbit'}
            </h2>
            <p className="text-gray-600">
              Set up a password for easier future logins (optional)
            </p>
          </div>

          {message && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 text-sm">{message}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Create Password (Optional)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choose a secure password"
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none"
                  onKeyPress={(e) => e.key === 'Enter' && handlePasswordSetup()}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                You can always login via email link if you prefer
              </p>
            </div>

            <button
              onClick={handlePasswordSetup}
              disabled={loading}
              className="w-full bg-brand-green text-white py-3 px-4 rounded-lg font-semibold hover:bg-brand-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {password ? 'Setting Password...' : 'Continuing...'}
                </>
              ) : (
                password ? 'Set Password & Continue' : 'Continue Without Password'
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Default: Sign In Mode
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-green to-brand-blue rounded-full mx-auto mb-4 flex items-center justify-center">
            {isVendorFlow ? (
              <Building2 className="w-8 h-8 text-white" />
            ) : (
              <Shield className="w-8 h-8 text-white" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {companyName ? `Access ${companyName}` : 'Sign In'}
          </h2>
          <p className="text-gray-600">
            {isVendorFlow 
              ? 'Enter your work email to access the partner portal'
              : 'Enter your email to continue'
            }
          </p>
        </div>

        {message && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">{message}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-brand-green transition-colors"
                placeholder={suggestedDomain ? `you@${suggestedDomain}` : "you@example.com"}
                disabled={loading}
                required
              />
            </div>
            
            {emailInfo && (
              <div className={`mt-3 p-3 rounded-lg border ${
                emailInfo.trusted && emailInfo.type === 'corporate'
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-start gap-3">
                  {emailInfo.trusted && emailInfo.type === 'corporate' ? (
                    <CheckCircle2 className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-brand-blue mt-0.5 flex-shrink-0" />
                  )}
                  <div className="text-sm">
                    {emailInfo.trusted && emailInfo.type === 'corporate' ? (
                      <p className="text-green-800">
                        <strong>Corporate email detected.</strong> Using @{emailInfo.domain} allows for automatic verification.
                      </p>
                    ) : emailInfo.type === 'personal' ? (
                      <p className="text-blue-800">
                        <strong>Personal email detected.</strong> For business accounts, consider using your work email for easier verification.
                      </p>
                    ) : (
                      <p className="text-blue-800">
                        <strong>Work email from {emailInfo.companyName}.</strong> This will help us verify your company access.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!email || loading}
            className="w-full bg-brand-green text-white py-3 rounded-lg hover:bg-brand-green/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Send sign-in email
              </>
            )}
          </button>
        </form>

        {/* OAuth Options */}
        <div className="mt-6">
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          <button
            onClick={() => handleOAuthSignIn('google')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="font-medium text-gray-700">Continue with Google</span>
          </button>
        </div>

        {/* Help Links */}
        {isVendorFlow && (
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <Link 
              href="/partners"
              className="text-gray-500 hover:text-gray-700 text-sm underline"
            >
              Back to Partner Hub
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-brand-green" />
      </div>
    }>
      <AuthContent />
    </Suspense>
  )
}
