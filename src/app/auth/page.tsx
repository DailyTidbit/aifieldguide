// src/app/auth/page.tsx (Updated for preview context)
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowRight, 
  Building2, 
  BarChart3, 
  MessageSquare, 
  Zap,
  Shield,
  Users,
  TrendingUp,
  CheckCircle2,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ExternalLink
} from 'lucide-react'

export default function AuthPage() {
  const [mode, setMode] = useState<'explore' | 'signin' | 'password-setup'>('explore')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const isVendorFlow = searchParams.get('vendor') === 'true'
  const companyName = searchParams.get('company')
  const suggestedDomain = searchParams.get('domain')

  useEffect(() => {
    // Pre-fill email if domain is suggested
    if (suggestedDomain && !email) {
      setEmail(`@${suggestedDomain}`)
    }

    // Check if user is already logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
        // If logged in, check if they need password setup
        if (!user.user_metadata?.has_password && isVendorFlow) {
          setMode('password-setup')
        } else {
          // Redirect to appropriate dashboard
          if (isVendorFlow) {
            router.push('/partners/dashboard')
          } else {
            router.push('/')
          }
        }
      } else if (isVendorFlow) {
        // Start with signin for vendor flow
        setMode('signin')
      } else {
        // Regular flow can explore
        setMode('explore')
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        if (isVendorFlow && !session.user.user_metadata?.has_password) {
          setMode('password-setup')
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [router, isVendorFlow, suggestedDomain, email])

  const features = [
    {
      icon: Building2,
      title: "Company Profile",
      description: "Manage your brand presence across Daily Tidbit",
      demo: "Update logos, contact info, and company details"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard", 
      description: "Track impressions, clicks, and engagement metrics",
      demo: "See real-time performance data and conversion rates"
    },
    {
      icon: MessageSquare,
      title: "Direct Support",
      description: "Get help and request listing changes",
      demo: "Chat directly with our team for quick assistance"
    },
    {
      icon: Zap,
      title: "Sponsor Opportunities",
      description: "$1 intro special - sponsor a Daily Tidbit",
      demo: "Book sponsorship slots and reach 30K+ learners"
    }
  ]

  const getCompanyFromEmail = (email: string) => {
    const domain = email.split('@')[1]
    if (!domain) return null
    return {
      name: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
      domain: domain,
      isVerified: ['microsoft.com', 'google.com', 'stripe.com', 'anthropic.com'].includes(domain)
    }
  }

  const company = getCompanyFromEmail(email)

  const handleEmailAuth = async () => {
    if (!email) return
    
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}${isVendorFlow ? '/auth?vendor=true' : '/auth'}`,
          data: {
            vendor_flow: isVendorFlow,
            company_name: companyName,
            suggested_domain: suggestedDomain
          }
        }
      })
      
      if (error) throw error
      
      setMessage(`📧 Check your email! We sent a sign-in link to ${email}`)
    } catch (err: any) {
      setError(err.message || 'Failed to send email')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSetup = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      if (password) {
        const { error } = await supabase.auth.updateUser({
          password: password,
          data: { has_password: true }
        })
        if (error) throw error
        setMessage('✅ Password set successfully!')
      }
      
      // Redirect to vendor dashboard
      setTimeout(() => {
        router.push('/partners/dashboard')
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Failed to set password')
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'explore') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        {/* Navigation */}
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#60A875] rounded-lg"></div>
                <span className="font-bold text-xl text-gray-900">Daily Tidbit</span>
              </div>
              <button 
                onClick={() => setMode('signin')}
                className="text-[#60A875] hover:text-[#4f8f61] font-medium"
              >
                Sign In
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#60A875]/20 bg-[#60A875]/5 px-4 py-2 text-sm text-[#60A875] mb-6">
              <Shield className="h-4 w-4" />
              Daily Tidbit Vendor Portal
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Your AI Tool, <span className="text-[#60A875]">Amplified</span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Explore our vendor portal and see how you can reach 30,000+ AI learners. 
              Take a look around - no signup required yet!
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 inline-block">
              <div className="flex items-center gap-2 text-blue-800">
                <Eye className="w-4 h-4" />
                <span className="text-sm">
                  <strong>Want a personalized preview?</strong> We can show you exactly how your company would look in our portal - with your real data and branding.
                </span>
              </div>
            </div>
          </div>

          {/* Demo Features Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-[#60A875]/10 rounded-xl">
                    <feature.icon className="h-6 w-6 text-[#60A875]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{feature.description}</p>
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-xs text-gray-700">{feature.demo}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats Preview */}
          <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm mb-12">
            <h3 className="text-xl font-semibold text-center mb-6">Join 100+ AI tools already growing with us</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#60A875]">30K+</div>
                <div className="text-sm text-gray-600">Monthly learners</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#60A875]">85%</div>
                <div className="text-sm text-gray-600">Beginner audience</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#60A875]">$1</div>
                <div className="text-sm text-gray-600">Intro sponsor rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#60A875]">6.2%</div>
                <div className="text-sm text-gray-600">Avg. conversion</div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <button 
              onClick={() => setMode('signin')}
              className="bg-[#60A875] text-white px-8 py-4 rounded-lg font-semibold hover:bg-[#4f8f61] transition-colors inline-flex items-center gap-2 text-lg"
            >
              Ready to Get Started <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-sm text-gray-500 mt-4">
              Quick setup • Domain verification • Start in minutes
            </p>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link 
                href="/partners"
                className="text-gray-600 hover:text-gray-800 text-sm underline"
              >
                ← Explore the full vendor portal
              </Link>
            </div>
          </div>
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
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Daily Tidbit!</h2>
            <p className="text-gray-600">
              {companyName && `Welcome to the ${companyName} partner portal! `}
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
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#60A875] focus:border-[#60A875] outline-none"
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
              className="w-full bg-[#60A875] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#4f8f61] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

  // Sign In Mode (enhanced for vendor flow)
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#60A875] to-[#59B1E3] rounded-full mx-auto mb-4 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {companyName ? `Join ${companyName}` : 'Join the Vendor Portal'}
          </h2>
          <p className="text-gray-600">
            {companyName 
              ? `Enter your work email to access the ${companyName} partner portal`
              : 'Enter your work email to get started'
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

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#60A875] focus:border-[#60A875] transition-colors"
                placeholder={suggestedDomain ? `you@${suggestedDomain}` : "you@yourcompany.com"}
                disabled={loading}
                onKeyPress={(e) => e.key === 'Enter' && handleEmailAuth()}
              />
            </div>
            
            {company && (
              <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-start gap-3">
                  {company.isVerified ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="text-sm">
                    {company.isVerified ? (
                      <p className="text-green-800">
                        <strong>Great!</strong> Using an email ending in <strong>@{company.domain}</strong> allows for automatic verification and immediate access.
                      </p>
                    ) : (
                      <p className="text-blue-800">
                        <strong>Perfect!</strong> Using an email ending in <strong>@{company.domain}</strong> will help us verify your company. Manual verification is also available if needed.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleEmailAuth}
            disabled={!email || loading}
            className="w-full bg-[#60A875] text-white py-3 rounded-lg hover:bg-green-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        </div>

        {/* OAuth Options */}
        <div className="mt-6">
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or continue with</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => supabase.auth.signInWithOAuth({ 
                provider: 'google',
                options: {
                  queryParams: {
                    vendor_flow: 'true',
                    company: companyName || '',
                    domain: suggestedDomain || ''
                  }
                }
              })}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
        </div>

        {companyName && (
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-3">
              Don't have access to a {companyName} email?
            </p>
            <Link 
              href="/partners/messages/new"
              className="inline-flex items-center gap-2 text-[#60A875] hover:text-[#4f8f61] font-medium text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              Request manual verification
            </Link>
          </div>
        )}

        {!isVendorFlow && (
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <button 
              onClick={() => setMode('explore')}
              className="text-gray-500 hover:text-gray-700 text-sm underline"
            >
              ← Back to exploring
            </button>
          </div>
        )}

        {/* Trust indicators */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Secure signup
            </div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <span>No spam, ever</span>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>
    </div>
  )
}