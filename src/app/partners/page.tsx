// src/app/partners/page.tsx - FULLY HYDRATION SAFE & BRAND COLOR CONSISTENT
'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { ArrowRight, Building2, Shield, Settings, BarChart3, MessageSquare, Zap, Eye, Lock, ExternalLink, AlertCircle, Loader2 } from 'lucide-react'

// Loading skeleton component
const LoadingSkeleton = () => (
  <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
    <div className="text-center">
      <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse mx-auto mb-4" />
      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mx-auto mb-2" />
      <div className="h-3 w-48 bg-gray-200 rounded animate-pulse mx-auto" />
    </div>
  </main>
)

// Feature card component - memoized for performance
const FeatureCard = ({ feature, canAccess, onAuthRequired, mounted }: {
  feature: any
  canAccess: boolean
  onAuthRequired: () => void
  mounted: boolean
}) => {
  const handleClick = useCallback(() => {
    if (mounted && !canAccess) {
      onAuthRequired()
    }
  }, [mounted, canAccess, onAuthRequired])

  if (canAccess) {
    return (
      <Link
        href={feature.path}
        className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-brand-green/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2"
      >
        <FeatureCardContent feature={feature} canAccess={true} />
      </Link>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={!mounted}
      className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-brand-green/20 transition-all duration-200 cursor-pointer text-left w-full focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2 disabled:opacity-50"
    >
      <FeatureCardContent feature={feature} canAccess={false} />
    </button>
  )
}

const FeatureCardContent = ({ feature, canAccess }: { feature: any; canAccess: boolean }) => (
  <>
    <div className="w-12 h-12 bg-brand-green/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-green/20 transition-colors">
      <feature.icon className="h-6 w-6 text-brand-greenDark" />
    </div>
    <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
    <p className="text-sm text-gray-600 mb-4">{feature.description}</p>
    
    {!canAccess && (
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <p className="text-xs text-gray-700">{feature.preview}</p>
      </div>
    )}
    
    <div className="flex items-center text-brand-greenDark text-sm font-medium group-hover:gap-2 transition-all">
      <span>{canAccess ? 'Access now' : 'Explore feature'}</span>
      {canAccess ? (
        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform ml-1" />
      ) : (
        <Eye className="h-4 w-4 group-hover:translate-x-1 transition-transform ml-1" />
      )}
    </div>
  </>
)

// Status message component
const StatusMessage = ({ authState, company, mounted }: {
  authState: string
  company: any
  mounted: boolean
}) => {
  if (!mounted) return null

  const messages = {
    'logged-out': {
      icon: Eye,
      className: 'bg-green-50 border-green-200 text-green-800',
      title: 'Explore freely!',
      message: 'Browse our partner portal features. Contact us to request access when you\'re ready.'
    },
    'needs-password-setup': {
      icon: AlertCircle,
      className: 'bg-amber-50 border-amber-200 text-amber-800',
      title: 'Complete your setup!',
      message: 'You need to create a password to access your partner dashboard.'
    },
    'no-company': {
      icon: AlertCircle,
      className: 'bg-amber-50 border-amber-200 text-amber-800',
      title: 'Company access needed.',
      message: 'Contact support at partners@dailytidbit.org to be added to your company.'
    },
    'has-company-access': {
      icon: Building2,
      className: 'bg-green-50 border-green-200 text-green-800',
      title: 'Welcome back!',
      message: `you&apos;re part of the ${company?.name || 'company'} team on Daily Tidbit.`
    }
  }

  const message = messages[authState as keyof typeof messages]
  if (!message) return null

  const Icon = message.icon

  return (
    <div className={`border rounded-lg p-4 mb-8 inline-block ${message.className}`}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span className="text-sm">
          <strong>{message.title}</strong> {message.message}
        </span>
      </div>
    </div>
  )
}

// Main CTA buttons component
const CTAButtons = ({ authState, mounted }: { authState: string; mounted: boolean }) => {
  if (!mounted) return null

  const buttons = {
    'has-company-access': (
      <Link 
        href="/partners/dashboard"
        className="inline-flex items-center gap-2 bg-brand-greenDark text-white px-6 py-3 rounded-full font-medium hover:bg-green-700 transition-colors"
      >
        Go to Dashboard <ArrowRight className="h-4 w-4" />
      </Link>
    ),
    'needs-password-setup': (
      <Link 
        href="/partners/setup"
        className="inline-flex items-center gap-2 bg-brand-greenDark text-white px-6 py-3 rounded-full font-medium hover:bg-green-700 transition-colors"
      >
        Complete Setup <ArrowRight className="h-4 w-4" />
      </Link>
    ),
    'no-company': (
      <div className="text-center">
        <div className="bg-white border border-gray-200 rounded-xl p-6 inline-block">
          <h3 className="font-semibold text-gray-900 mb-2">Need Company Access</h3>
          <p className="text-gray-600 text-sm mb-4">
            Your account exists but isn't linked to a company. Contact our team to get added.
          </p>
          <a 
            href="mailto:partners@dailytidbit.org"
            className="inline-flex items-center gap-2 bg-brand-greenDark text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    ),
    'logged-out': (
      <>
        <Link 
          href="/partners/request-access"
          className="inline-flex items-center gap-2 bg-brand-greenDark text-white px-6 py-3 rounded-full font-medium hover:bg-green-700 transition-colors"
        >
          Request Partner Access <ArrowRight className="h-4 w-4" />
        </Link>
        <Link 
          href="#how-it-works"
          className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-full font-medium hover:bg-gray-50 transition-colors"
        >
          Learn More
        </Link>
      </>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
      {buttons[authState as keyof typeof buttons] || buttons['logged-out']}
    </div>
  )
}

// Auth required modal
const AuthRequiredModal = ({ show, onClose, mounted }: {
  show: boolean
  onClose: () => void
  mounted: boolean
}) => {
  if (!mounted || !show) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white rounded-2xl p-8 max-w-md w-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h3 id="auth-modal-title" className="text-xl font-semibold text-gray-900 mb-2">
            Partner Access Required
          </h3>
          <p className="text-gray-600 mb-6">
            To access the partner portal, you need to receive an invitation email with a secure login link from our team.
          </p>
          <div className="space-y-3">
            <Link
              href="/partners/request-access"
              className="block w-full bg-brand-greenDark text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Request Partner Access
            </Link>
            <button
              onClick={onClose}
              className="block w-full py-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              Continue Exploring
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PartnersLanding() {
  // Hydration safety - critical for SSR
  const [mounted, setMounted] = useState(false)
  const { authState, user, company, loading, signOut } = useAuth()
  const [showAuthRequired, setShowAuthRequired] = useState(false)

  // Handle mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle magic link redirect safely after mount
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return
    
    const urlParams = new URLSearchParams(window.location.search)
    const accessToken = urlParams.get('access_token')
    const refreshToken = urlParams.get('refresh_token')
    
    if (accessToken && refreshToken) {
      window.location.href = '/partners/setup'
    }
  }, [mounted])

  // Memoize features to prevent unnecessary re-renders
  const features = useMemo(() => [
    {
      icon: Building2,
      title: "Company Profile",
      description: "Manage your brand presence across Daily Tidbit",
      path: "/partners/settings",
      requiresAuth: true,
      preview: "Update logos, contact information, and brand assets. Customize how your company appears across our platform."
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard", 
      description: "Track impressions, clicks, and engagement metrics",
      path: "/partners/dashboard",
      requiresAuth: true,
      preview: "View real-time performance data, conversion rates, and detailed insights into how learners interact with your tools."
    },
    {
      icon: MessageSquare,
      title: "Direct Support",
      description: "Get help and request listing changes",
      path: "/partners/messages",
      requiresAuth: true,
      preview: "Communicate directly with our team for quick assistance, listing updates, and partnership opportunities."
    },
    {
      icon: Zap,
      title: "Sponsor Opportunities",
      description: "$1 intro special - sponsor a Daily Tidbit",
      path: "/partners/ads",
      requiresAuth: true,
      preview: "Book sponsorship slots in our daily lessons and reach 30K+ engaged learners at the perfect learning moment."
    }
  ], [])

  // Memoize handlers
  const handleAuthRequired = useCallback(() => {
    if (mounted) {
      setShowAuthRequired(true)
    }
  }, [mounted])

  const handleCloseModal = useCallback(() => {
    setShowAuthRequired(false)
  }, [])

  const canAccess = useMemo(() => mounted && authState === 'has-company-access', [mounted, authState])

  // Show loading state during hydration or auth loading
  if (!mounted || loading) {
    return <LoadingSkeleton />
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-greenDark rounded-lg"></div>
              <span className="font-bold text-xl text-gray-900">Daily Tidbit</span>
            </div>
            
            <div className="flex items-center gap-4">
              {authState === 'has-company-access' ? (
                <>
                  <Link 
                    href="/partners/dashboard"
                    className="text-brand-greenDark hover:text-brand-green font-medium transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={signOut}
                    className="text-gray-600 hover:text-gray-800 text-sm transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : authState === 'needs-password-setup' ? (
                <>
                  <Link
                    href="/partners/setup"
                    className="bg-brand-greenDark text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Complete Setup
                  </Link>
                  <button
                    onClick={signOut}
                    className="text-gray-600 hover:text-gray-800 text-sm transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : authState === 'no-company' ? (
                <>
                  <div className="text-sm text-amber-600">Account needs company access</div>
                  <button
                    onClick={signOut}
                    className="text-gray-600 hover:text-gray-800 text-sm transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link 
                  href="/partners/request-access"
                  className="text-brand-greenDark hover:text-brand-green font-medium transition-colors"
                >
                  Request Access
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-12">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-green/20 bg-brand-green/5 px-4 py-2 text-sm text-green-700 mb-6">
            <Shield className="h-4 w-4" />
            Daily Tidbit Partner Hub
          </div>
          
          <h1 className="text-4xl md:text-5xl font-playfair font-semibold text-gray-900 mb-4">
            Your AI Tool, <span className="text-brand-greenDark">Amplified</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Reach 30,000+ learners discovering AI tools through our beginner-friendly daily lessons. 
            Keep your listing accurate, track performance, and connect directly with our team.
          </p>

          <StatusMessage authState={authState} company={company} mounted={mounted} />
          <CTAButtons authState={authState} mounted={mounted} />
        </div>
      </section>

      {/* Features Grid */}
      <section className="pb-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-playfair font-semibold text-center mb-8">
            Everything you need to succeed
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                feature={feature}
                canAccess={canAccess}
                onAuthRequired={handleAuthRequired}
                mounted={mounted}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-gray-50 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-2xl font-playfair font-semibold text-center mb-12">
            How Daily Tidbit helps your tool get discovered
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                number: "1",
                title: "Daily Tidbit Integration",
                description: "Your tool appears in relevant daily lessons, reaching learners at the perfect moment"
              },
              {
                number: "2",
                title: "AI Field Guide Listing", 
                description: "Searchable tool directory organized by task and use case, not technical jargon"
              },
              {
                number: "3",
                title: "Direct Trial Integration",
                description: "Users can try your tool directly within our Tidbit Tutor for immediate engagement"
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-brand-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-playfair font-semibold text-brand-blueDark">{step.number}</span>
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats/Social Proof */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-2xl font-playfair font-semibold mb-8">
            Join the AI education revolution
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {[
              { value: "30K+", label: "Monthly learners" },
              { value: "85%", label: "Beginner audience" },
              { value: "30", label: "Days of content" },
              { value: "$1", label: "Intro sponsor rate" }
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-3xl font-playfair font-bold text-brand-greenDark">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
          
          <div className="bg-brand-green/5 border border-brand-green/20 rounded-2xl p-6 inline-block">
            <div className="text-brand-greenDark font-semibold mb-1">Limited Time: $1 Sponsorship</div>
            <div className="text-sm text-gray-600 mb-4">
              Sponsor a Daily Tidbit for just $1 this month. One day per company. All times Eastern.
            </div>
            {mounted && authState === 'has-company-access' ? (
              <Link 
                href="/partners/ads" 
                className="inline-flex items-center gap-1 text-brand-greenDark font-medium text-sm hover:gap-2 transition-all"
              >
                See available dates <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <button
                onClick={handleAuthRequired}
                disabled={!mounted}
                className="inline-flex items-center gap-1 text-brand-greenDark font-medium text-sm hover:gap-2 transition-all disabled:opacity-50"
              >
                Request access to book <Eye className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      {mounted && authState === 'logged-out' && (
        <section className="py-16 bg-gradient-to-r from-green-500/10 via-blue-500/10 to-green-500/10">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Ready to amplify your AI tool?
            </h3>
            <p className="text-gray-600 mb-8">
              Contact our team to get started with Daily Tidbit&apos;s partner program and reach thousands of engaged AI learners.
            </p>
            <Link
              href="/partners/request-access"
              className="inline-flex items-center gap-2 bg-brand-greenDark text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Request Partner Access <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              we&apos;ll send you a secure login link via email
            </p>
          </div>
        </section>
      )}

      <AuthRequiredModal 
        show={showAuthRequired} 
        onClose={handleCloseModal} 
        mounted={mounted} 
      />
    </main>
  )
}
