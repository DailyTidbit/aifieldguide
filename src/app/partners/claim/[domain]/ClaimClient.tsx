// src/app/partners/claim/[domain]/ClaimClient.tsx - Enhanced with Encouraging Messaging
'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/app/lib/supabaseClient'
import { 
  Building2, 
  Mail, 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Users,
  Settings,
  BarChart3,
  Loader2,
  ExternalLink,
  XCircle,
  HelpCircle,
  Crown,
  UserPlus,
  Clock,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'

interface ClaimResponse {
  ok?: boolean
  role?: string
  isFirstUser?: boolean
  isExistingMember?: boolean
  companyName?: string
  memberCount?: number
  memberSince?: string
  nextSteps?: string[]
  redirectUrl?: string
  error?: string
  code?: string
  suggestion?: string
  emailDomain?: string
  allowedDomains?: string[]
  manualVerificationLink?: string
  supportEmail?: string
}

type VerificationStep = 'email' | 'sending' | 'sent' | 'verify' | 'password-setup' | 'success' | 'error'

type MessageType = 'success' | 'error' | 'warning' | 'info'

interface StatusMessage {
  type: MessageType
  title: string
  description: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export default function EnhancedClaimClient(props: {
  isAuthed: boolean
  companyId: string
  companyName: string
  requestedDomain: string
  allowedDomains: string[]
}) {
  const { isAuthed, companyId, companyName, requestedDomain, allowedDomains } = props

  const router = useRouter()
  const [step, setStep] = useState<VerificationStep>('email')
  const [message, setMessage] = useState<StatusMessage | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [claimResponse, setClaimResponse] = useState<ClaimResponse | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [user, setUser] = useState<any>(null)
  const triedAutoVerify = useRef(false)

  // Handle auth state changes
  useEffect(() => {
    let subscription: { unsubscribe: () => void } | undefined

    // Check existing session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        setStep('verify')
        router.refresh()
      }
    })

    // Listen for auth state changes
    const { data } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        setStep('verify')
        router.refresh()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setStep('email')
        setMessage(null)
      }
    })
    subscription = data.subscription

    return () => subscription?.unsubscribe()
  }, [router])

  // Auto-verify when authenticated
  useEffect(() => {
    if (!isAuthed || triedAutoVerify.current || step !== 'verify') return
    triedAutoVerify.current = true
    handleVerification()
  }, [isAuthed, companyId, step])

  // Validate email domain in real-time
  const validateEmailDomain = (email: string): { isValid: boolean; domain: string | null } => {
    if (!email.includes('@')) return { isValid: false, domain: null }
    
    const emailDomain = email.split('@')[1]?.toLowerCase()
    if (!emailDomain) return { isValid: false, domain: null }

    const isValid = allowedDomains.some(domain => {
      const normalizedDomain = domain.toLowerCase()
      return emailDomain === normalizedDomain || 
             emailDomain.endsWith(`.${normalizedDomain}`) ||
             emailDomain === `www.${normalizedDomain}` ||
             normalizedDomain === `www.${emailDomain}`
    })

    return { isValid, domain: emailDomain }
  }

  const { isValid: isDomainValid, domain: emailDomain } = validateEmailDomain(email)

  // Send magic link with enhanced validation
  const sendMagicLink = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setMessage(null)

    // Client-side validation
    if (!isDomainValid) {
      setMessage({
        type: 'info',
        title: 'Email Domain Information',
        description: `Using an email ending in ${allowedDomains.map(d => `@${d}`).join(', ')} will allow for automatic verification. Manual verification is also available if you don't have access to these domains.`,
        action: {
          label: 'Request manual verification',
          href: '/partners/messages/new'
        }
      })
      return
    }

    setBusy(true)
    setStep('sending')

    try {
      const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/partners/claim/${requestedDomain}`
      
      const { error } = await supabaseClient.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo }
      })
      
      if (error) {
        throw error
      }

      setStep('sent')
      setMessage({
        type: 'success',
        title: 'Verification Email Sent',
        description: `Check your email (${email}) for a sign-in link. It may take a few minutes to arrive.`,
        action: {
          label: 'Resend email',
          onClick: () => {
            setStep('email')
            setMessage(null)
          }
        }
      })
    } catch (error: any) {
      console.error('Magic link error:', error)
      setStep('error')
      setMessage({
        type: 'error',
        title: 'Failed to Send Email',
        description: error.message || 'Unable to send verification email. Please try again.',
        action: {
          label: 'Try again',
          onClick: () => {
            setStep('email')
            setMessage(null)
          }
        }
      })
    } finally {
      setBusy(false)
    }
  }

  // Handle verification with enhanced error handling
  const handleVerification = async () => {
    setBusy(true)
    setStep('verify')
    setMessage(null)

    try {
      const response = await fetch('/api/partners/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId })
      })
      
      const data: ClaimResponse = await response.json()
      setClaimResponse(data)

      if (!response.ok || !data.ok) {
        handleVerificationError(data, response.status)
        return
      }

      // Check if user needs password setup
      if (user && !user.user_metadata?.has_password) {
        setStep('password-setup')
        setMessage({
          type: 'success',
          title: 'Verification Complete!',
          description: 'Would you like to set up a password for easier future logins?'
        })
      } else {
        handleVerificationSuccess(data)
      }
      
    } catch (error: any) {
      console.error('Verification error:', error)
      setStep('error')
      setMessage({
        type: 'error',
        title: 'Network Error',
        description: 'Unable to connect to our servers. Please check your internet connection and try again.',
        action: {
          label: 'Retry verification',
          onClick: () => handleVerification()
        }
      })
      setBusy(false)
    }
  }

  // Handle password setup
  const handlePasswordSetup = async () => {
    if (!user) return

    setBusy(true)
    setMessage(null)

    try {
      if (password) {
        const { error } = await supabaseClient.auth.updateUser({
          password: password,
          data: { has_password: true }
        })
        if (error) throw error
      }
      
      setStep('success')
      handleVerificationSuccess(claimResponse || {})
    } catch (err: any) {
      setMessage({
        type: 'error',
        title: 'Password Setup Failed',
        description: err.message || 'Failed to set password',
        action: {
          label: 'Try again',
          onClick: () => setMessage(null)
        }
      })
    } finally {
      setBusy(false)
    }
  }

  // Handle verification errors with specific messaging
  const handleVerificationError = (data: ClaimResponse, status: number) => {
    setStep('error')
    setBusy(false)

    switch (data.code) {
      case 'DOMAIN_NOT_ALLOWED':
        setMessage({
          type: 'info',
          title: 'Email Domain Information',
          description: `Using an email ending in ${allowedDomains.map(d => `@${d}`).join(', ')} allows for automatic verification. Manual verification is available for other domains.`,
          action: {
            label: 'Request manual verification',
            href: data.manualVerificationLink || '/partners/messages/new'
          }
        })
        break

      case 'COMPANY_NOT_FOUND':
        setMessage({
          type: 'error',
          title: 'Company Not Found',
          description: data.suggestion || 'This company is not in our partner program.',
          action: {
            label: 'Contact support',
            href: '/partners/messages/new'
          }
        })
        break

      case 'COMPANY_INACTIVE':
        setMessage({
          type: 'warning',
          title: 'Company Account Inactive',
          description: data.suggestion || 'This company account needs to be activated.',
          action: {
            label: 'Contact support',
            href: '/partners/messages/new'
          }
        })
        break

      case 'NOT_AUTHENTICATED':
        setMessage({
          type: 'warning',
          title: 'Authentication Required',
          description: data.suggestion || 'Please sign in with your work email first.',
          action: {
            label: 'Sign in again',
            onClick: () => {
              setStep('email')
              setMessage(null)
            }
          }
        })
        break

      case 'MEMBERSHIP_CREATION_FAILED':
        setMessage({
          type: 'error',
          title: 'Account Setup Failed',
          description: data.suggestion || 'We couldn\'t add you to the company account.',
          action: {
            label: 'Try again',
            onClick: () => handleVerification()
          }
        })
        break

      default:
        setMessage({
          type: 'error',
          title: 'Verification Failed',
          description: data.error || data.suggestion || 'An unexpected error occurred during verification.',
          action: {
            label: status >= 500 ? 'Try again' : 'Contact support',
            ...(status >= 500 ? 
              { onClick: () => handleVerification() } : 
              { href: '/partners/messages/new' }
            )
          }
        })
        break
    }
  }

  // Handle verification success
  const handleVerificationSuccess = (data: ClaimResponse) => {
    setStep('success')
    setBusy(false)

    if (data.isExistingMember) {
      setMessage({
        type: 'info',
        title: 'Welcome Back!',
        description: `You're already a ${data.role === 'company_admin' ? 'Company Admin' : 'Team Member'} for ${companyName}.`,
        action: {
          label: 'Go to dashboard',
          href: '/partners/dashboard'
        }
      })
    } else {
      setMessage({
        type: 'success',
        title: data.isFirstUser ? '🎉 Company Account Created!' : '👋 Welcome to the Team!',
        description: data.isFirstUser 
          ? `You're the first person from ${companyName} to join Daily Tidbit. You've been made Company Admin.`
          : `You've been added as a Team Member to ${companyName}. You can now manage listings and view analytics.`,
        action: {
          label: 'Go to dashboard',
          href: '/partners/dashboard'
        }
      })
    }

    // Auto-redirect after showing success message
    setTimeout(() => {
      window.location.href = data.redirectUrl || '/partners/dashboard'
    }, 3000)
  }

  // Get step indicator info
  const getStepInfo = () => {
    switch (step) {
      case 'email':
      case 'sending':
        return { current: 1, total: 4, label: 'Email Verification' }
      case 'sent':
        return { current: 2, total: 4, label: 'Check Your Email' }
      case 'verify':
        return { current: 3, total: 4, label: 'Verifying Access' }
      case 'password-setup':
        return { current: 3, total: 4, label: 'Password Setup' }
      case 'success':
        return { current: 4, total: 4, label: 'Success!' }
      case 'error':
        return { current: 0, total: 4, label: 'Error' }
      default:
        return { current: 1, total: 4, label: 'Getting Started' }
    }
  }

  const stepInfo = getStepInfo()

  const features = [
    { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Track impressions and clicks' },
    { icon: Settings, title: 'Listing Management', desc: 'Keep your info up to date' },
    { icon: Users, title: 'Team Access', desc: 'Add colleagues to your account' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#60A875]/10 text-[#60A875] px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Shield className="h-4 w-4" />
            Secure Partner Access
          </div>
          
          <h1 className="text-3xl md:text-4xl font-playfair font-semibold text-gray-900 mb-4">
            {step === 'success' ? 'Welcome aboard!' : 'Access Your Dashboard'}
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {step === 'success' 
              ? `You're now part of the ${companyName} team on Daily Tidbit`
              : `Join the ${companyName} partner program and reach 30,000+ AI learners`
            }
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Info */}
          <div className="space-y-8">
            {/* Company Info */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#60A875]/10 rounded-xl">
                  <Building2 className="h-6 w-6 text-[#60A875]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {companyName} Partner Access
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Sign in with your work email to automatically join your company's partner account.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Authorized email domains:</div>
                    <div className="flex flex-wrap gap-2">
                      {allowedDomains.map((domain) => (
                        <span 
                          key={domain} 
                          className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          @{domain}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Show member count if available */}
                  {claimResponse?.memberCount && (
                    <div className="mt-4 text-sm text-gray-600">
                      <Users className="inline h-4 w-4 mr-1" />
                      {claimResponse.memberCount} team member{claimResponse.memberCount !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">What you get access to:</h3>
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="p-2 bg-[#59B1E3]/10 rounded-lg">
                      <feature.icon className="h-5 w-5 text-[#59B1E3]" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{feature.title}</div>
                      <div className="text-sm text-gray-600">{feature.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Help Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-blue-900 mb-2">Need help?</div>
                  <div className="text-sm text-blue-800 space-y-2">
                    <div>
                      <strong>Don't have access to a work email?</strong><br />
                      <Link 
                        href="/partners/messages/new" 
                        className="text-blue-600 hover:text-blue-700 font-medium underline"
                      >
                        Request manual verification →
                      </Link>
                    </div>
                    {claimResponse?.supportEmail && (
                      <div>
                        <strong>Still having trouble?</strong><br />
                        <a 
                          href={`mailto:${claimResponse.supportEmail}`}
                          className="text-blue-600 hover:text-blue-700 font-medium underline"
                        >
                          Email our support team →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Process */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
            {/* Step Indicator */}
            {step !== 'error' && (
              <div className="flex items-center justify-center gap-4 mb-8">
                {Array.from({ length: stepInfo.total }, (_, i) => {
                  const stepNumber = i + 1
                  const isActive = stepNumber === stepInfo.current
                  const isCompleted = stepNumber < stepInfo.current

                  return (
                    <div key={i} className="flex items-center">
                      <div className={`flex items-center gap-2 ${
                        isActive ? 'text-[#60A875]' :
                        isCompleted ? 'text-green-600' :
                        'text-gray-400'
                      }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                          isActive ? 'bg-[#60A875] text-white border-[#60A875]' :
                          isCompleted ? 'bg-green-600 text-white border-green-600' :
                          'bg-gray-100 text-gray-600 border-gray-300'
                        }`}>
                          {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : stepNumber}
                        </div>
                        <span className="text-sm font-medium hidden sm:block">
                          {i === 0 ? 'Email' : i === 1 ? 'Verify' : i === 2 ? 'Setup' : 'Access'}
                        </span>
                      </div>
                      {i < stepInfo.total - 1 && (
                        <div className={`w-8 sm:w-12 h-px mx-2 ${
                          isCompleted ? 'bg-green-600' : 'bg-gray-300'
                        }`} />
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Status Message */}
            {message && (
              <div className={`p-4 rounded-xl mb-6 border ${
                message.type === 'success' ? 'bg-green-50 border-green-200' :
                message.type === 'error' ? 'bg-red-50 border-red-200' :
                message.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-start gap-3">
                  {message.type === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : message.type === 'error' ? (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  ) : message.type === 'warning' ? (
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className={`font-medium mb-1 ${
                      message.type === 'success' ? 'text-green-900' :
                      message.type === 'error' ? 'text-red-900' :
                      message.type === 'warning' ? 'text-amber-900' :
                      'text-blue-900'
                    }`}>
                      {message.title}
                    </div>
                    <div className={`text-sm ${
                      message.type === 'success' ? 'text-green-800' :
                      message.type === 'error' ? 'text-red-800' :
                      message.type === 'warning' ? 'text-amber-800' :
                      'text-blue-800'
                    }`}>
                      {message.description}
                    </div>
                    {message.action && (
                      <div className="mt-3">
                        {message.action.href ? (
                          <Link
                            href={message.action.href}
                            className={`inline-flex items-center gap-2 text-sm font-medium underline ${
                              message.type === 'success' ? 'text-green-700 hover:text-green-800' :
                              message.type === 'error' ? 'text-red-700 hover:text-red-800' :
                              message.type === 'warning' ? 'text-amber-700 hover:text-amber-800' :
                              'text-blue-700 hover:text-blue-800'
                            }`}
                          >
                            {message.action.label} <ArrowRight className="h-3 w-3" />
                          </Link>
                        ) : (
                          <button
                            onClick={message.action.onClick}
                            className={`inline-flex items-center gap-2 text-sm font-medium underline ${
                              message.type === 'success' ? 'text-green-700 hover:text-green-800' :
                              message.type === 'error' ? 'text-red-700 hover:text-red-800' :
                              message.type === 'warning' ? 'text-amber-700 hover:text-amber-800' :
                              'text-blue-700 hover:text-blue-800'
                            }`}
                          >
                            {message.action.label} <RefreshCw className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Email Form */}
            {(step === 'email') && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  Sign in with your work email
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Work email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          setMessage(null)
                        }}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-[#60A875] transition-colors text-sm ${
                          email && !isDomainValid
                            ? 'border-blue-300 focus:ring-blue-200'
                            : 'border-gray-300 focus:ring-[#60A875]/20'
                        }`}
                        placeholder={`name@${requestedDomain}`}
                        onKeyPress={(e) => e.key === 'Enter' && sendMagicLink()}
                      />
                      {email && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {isDomainValid ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                      )}
                    </div>
                    
                    {email && emailDomain && (
                      <div className={`mt-2 p-3 rounded-lg border ${
                        isDomainValid 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-blue-50 border-blue-200'
                      }`}>
                        <div className={`text-sm ${
                          isDomainValid ? 'text-green-800' : 'text-blue-800'
                        }`}>
                          {isDomainValid ? (
                            <>
                              <strong>Great!</strong> Using an email ending in <strong>@{emailDomain}</strong> allows for automatic verification and immediate access.
                            </>
                          ) : (
                            <>
                              <strong>Good to know!</strong> Using an email ending in <strong>@{emailDomain}</strong> will require manual verification. We can help verify your company access manually - just contact our team.
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => sendMagicLink()}
                    disabled={busy || !email}
                    className="w-full flex items-center justify-center gap-2 bg-[#60A875] text-white py-3 px-4 rounded-lg hover:bg-[#4f8f61] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {busy ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Send verification email
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    Don't have access to an authorized email?
                  </p>
                  <Link 
                    href="/partners/messages/new"
                    className="inline-flex items-center gap-2 text-[#60A875] hover:text-[#4f8f61] font-medium text-sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Request manual verification
                  </Link>
                </div>
              </div>
            )}

            {/* Sending State */}
            {step === 'sending' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-[#60A875]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Loader2 className="h-8 w-8 text-[#60A875] animate-spin" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Sending verification email...
                </h3>
                <p className="text-gray-600">
                  Please wait while we send a secure sign-in link to {email}.
                </p>
              </div>
            )}

            {/* Email Sent */}
            {step === 'sent' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Check your email
                </h3>
                <p className="text-gray-600 mb-4">
                  We sent a verification link to <strong>{email}</strong>
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-left">
                  <div className="text-sm text-gray-700 space-y-2">
                    <div>📧 Check your inbox (and spam folder)</div>
                    <div>🔗 Click the "Sign in to Daily Tidbit" link</div>
                    <div>⏰ Links expire after 1 hour</div>
                  </div>
                </div>
              </div>
            )}

            {/* Verification Step */}
            {step === 'verify' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-[#60A875]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Loader2 className="h-8 w-8 text-[#60A875] animate-spin" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Verifying your access...
                </h3>
                <p className="text-gray-600 mb-6">
                  Please wait while we confirm your email and set up your {companyName} account.
                </p>
                {retryCount > 0 && (
                  <div className="text-sm text-gray-500">
                    Attempt {retryCount + 1}
                  </div>
                )}
              </div>
            )}

            {/* Password Setup */}
            {step === 'password-setup' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Daily Tidbit!</h3>
                <p className="text-gray-600 mb-6">
                  Set up a password for easier future logins (optional)
                </p>

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
                    disabled={busy}
                    className="w-full bg-[#60A875] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#4f8f61] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {busy ? (
                      <>
                        <Loader2 className="w-4 w-4 animate-spin" />
                        {password ? 'Setting Password...' : 'Continuing...'}
                      </>
                    ) : (
                      password ? 'Set Password & Continue' : 'Continue Without Password'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Success */}
            {step === 'success' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  {claimResponse?.isFirstUser ? (
                    <Crown className="h-8 w-8 text-amber-600" />
                  ) : (
                    <UserPlus className="h-8 w-8 text-green-600" />
                  )}
                </div>
                
                {claimResponse?.nextSteps && (
                  <div className="mb-6 text-left">
                    <h4 className="font-semibold text-gray-900 mb-3">Next Steps:</h4>
                    <div className="space-y-2">
                      {claimResponse.nextSteps.map((step, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                          <div className="w-5 h-5 bg-[#60A875]/10 rounded-full flex items-center justify-center text-xs font-medium text-[#60A875]">
                            {index + 1}
                          </div>
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-2">
                    <Clock className="h-4 w-4" />
                    Redirecting to your dashboard...
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-[#60A875] h-2 rounded-full animate-pulse transition-all duration-3000" style={{ width: '70%' }}></div>
                  </div>
                </div>
              </div>
            )}

            {/* Error State */}
            {step === 'error' && !message && (
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Verification failed
                </h3>
                <p className="text-gray-600 mb-6">
                  We couldn't verify your access to the {companyName} partner account.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setRetryCount(prev => prev + 1)
                      handleVerification()
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-[#60A875] text-white py-3 px-4 rounded-lg hover:bg-[#4f8f61] transition-colors font-medium"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try again
                  </button>
                  <Link
                    href="/partners/messages/new"
                    className="block w-full text-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                  >
                    Request manual verification
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}