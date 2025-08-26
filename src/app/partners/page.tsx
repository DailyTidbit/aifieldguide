// src/app/partners/page.tsx - Refactored to use useAuth hook
'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth } from '@/app/hooks/useAuth'
import { ArrowRight, Building2, Shield, Settings, BarChart3, MessageSquare, Zap, Eye, Lock, ExternalLink, AlertCircle } from 'lucide-react'

export default function PartnersLanding() {
  const { authState, user, company, loading, signOut } = useAuth()
  const [showAuthRequired, setShowAuthRequired] = useState(false)

  // Handle magic link redirect on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const accessToken = urlParams.get('access_token')
    const refreshToken = urlParams.get('refresh_token')
    
    if (accessToken && refreshToken) {
      // Magic link detected - redirect to setup page
      window.location.href = '/partners/setup'
    }
  }, [])

  const features = [
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
  ]

  const AuthRequiredModal = () => {
    if (!showAuthRequired) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-amber-600" />
            </div>
            <h3 id="auth-modal-title" className="text-xl font-semibold text-gray-900 mb-2">Partner Access Required</h3>
            <p className="text-gray-600 mb-6">
              To access the partner portal, you need to receive an invitation email with a secure login link from our team.
            </p>
            <div className="space-y-3">
              <Link
                href="/partners/request-access"
                className="block w-full bg-brand-green text-white py-3 px-4 rounded-lg font-semibold hover:bg-brand-green/90 transition-colors"
              >
                Request Partner Access
              </Link>
              <button
                onClick={() => setShowAuthRequired(false)}
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

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-brand-green border-t-transparent rounded-full"></div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-green rounded-lg"></div>
              <span className="font-bold text-xl text-gray-900">Daily Tidbit</span>
            </div>
            
            <div className="flex items-center gap-4">
              {authState === 'has-company-access' ? (
                <>
                  <Link 
                    href="/partners/dashboard"
                    className="text-brand-green hover:text-brand-green/80 font-medium transition-colors"
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
                    className="bg-brand-green text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-green/90 transition-colors"
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
                  className="text-brand-green hover:text-brand-green/80 font-medium transition-colors"
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
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-green/20 bg-brand-green/5 px-4 py-2 text-sm text-brand-green mb-6">
            <Shield className="h-4 w-4" />
            Daily Tidbit Partner Hub
          </div>
          
          <h1 className="text-4xl md:text-5xl font-playfair font-semibold text-gray-900 mb-4">
            Your AI Tool, <span className="text-brand-green">Amplified</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Reach 30,000+ learners discovering AI tools through our beginner-friendly daily lessons. 
            Keep your listing accurate, track performance, and connect directly with our team.
          </p>

          {/* Status Messages */}
          {authState === 'logged-out' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 inline-block">
              <div className="flex items-center gap-2 text-green-800">
                <Eye className="w-4 h-4" />
                <span className="text-sm">
                  <strong>Explore freely!</strong> Browse our partner portal features. Contact us to request access when you're ready.
                </span>
              </div>
            </div>
          )}

          {authState === 'needs-password-setup' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 inline-block">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="w-4 w-4" />
                <span className="text-sm">
                  <strong>Complete your setup!</strong> You need to create a password to access your partner dashboard.
                </span>
              </div>
            </div>
          )}

          {authState === 'no-company' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 inline-block">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">
                  <strong>Company access needed.</strong> Contact support at partners@dailytidbit.org to be added to your company.
                </span>
              </div>
            </div>
          )}

          {authState === 'has-company-access' && company && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 inline-block">
              <div className="flex items-center gap-2 text-green-800">
                <Building2 className="w-4 h-4" />
                <span className="text-sm">
                  <strong>Welcome back!</strong> You're part of the {company.name} team on Daily Tidbit.
                </span>
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {authState === 'has-company-access' ? (
              <Link 
                href="/partners/dashboard"
                className="inline-flex items-center gap-2 bg-brand-green text-white px-6 py-3 rounded-full font-medium hover:bg-brand-green/90 transition-colors"
              >
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : authState === 'needs-password-setup' ? (
              <Link 
                href="/partners/setup"
                className="inline-flex items-center gap-2 bg-brand-green text-white px-6 py-3 rounded-full font-medium hover:bg-brand-green/90 transition-colors"
              >
                Complete Setup <ArrowRight className="h-4 w-4" />
              </Link>
            ) : authState === 'no-company' ? (
              <div className="text-center">
                <div className="bg-white border border-gray-200 rounded-xl p-6 inline-block">
                  <h3 className="font-semibold text-gray-900 mb-2">Need Company Access</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Your account exists but isn't linked to a company. Contact our team to get added.
                  </p>
                  <a 
                    href="mailto:partners@dailytidbit.org"
                    className="inline-flex items-center gap-2 bg-brand-green text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-green/90 transition-colors"
                  >
                    Contact Support
                  </a>
                </div>
              </div>
            ) : (
              <>
                <Link 
                  href="/partners/request-access"
                  className="inline-flex items-center gap-2 bg-brand-green text-white px-6 py-3 rounded-full font-medium hover:bg-brand-green/90 transition-colors"
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
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="pb-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-playfair font-semibold text-center mb-8">
            Everything you need to succeed
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const canAccess = authState === 'has-company-access'
              
              if (canAccess) {
                return (
                  <Link
                    key={index}
                    href={feature.path}
                    className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-brand-green/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2"
                  >
                    <div className="w-12 h-12 bg-brand-green/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-green/20 transition-colors">
                      <feature.icon className="h-6 w-6 text-brand-green" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{feature.description}</p>
                    
                    <div className="flex items-center text-brand-green text-sm font-medium group-hover:gap-2 transition-all">
                      <span>Access now</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform ml-1" />
                    </div>
                  </Link>
                )
              } else {
                return (
                  <button
                    key={index}
                    onClick={() => setShowAuthRequired(true)}
                    className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-brand-green/20 transition-all duration-200 cursor-pointer text-left w-full focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2"
                  >
                    <div className="w-12 h-12 bg-brand-green/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-green/20 transition-colors">
                      <feature.icon className="h-6 w-6 text-brand-green" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{feature.description}</p>
                    
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-xs text-gray-700">{feature.preview}</p>
                    </div>
                    
                    <div className="flex items-center text-brand-green text-sm font-medium group-hover:gap-2 transition-all">
                      <span>Explore feature</span>
                      <Eye className="h-4 w-4 group-hover:translate-x-1 transition-transform ml-1" />
                    </div>
                  </button>
                )
              }
            })}
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
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-playfair font-semibold text-brand-blue">1</span>
              </div>
              <h3 className="font-semibold mb-2">Daily Tidbit Integration</h3>
              <p className="text-sm text-gray-600">Your tool appears in relevant daily lessons, reaching learners at the perfect moment</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-playfair font-semibold text-brand-blue">2</span>
              </div>
              <h3 className="font-semibold mb-2">AI Field Guide Listing</h3>
              <p className="text-sm text-gray-600">Searchable tool directory organized by task and use case, not technical jargon</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-playfair font-semibold text-brand-blue">3</span>
              </div>
              <h3 className="font-semibold mb-2">Direct Trial Integration</h3>
              <p className="text-sm text-gray-600">Users can try your tool directly within our Tidbit Tutor for immediate engagement</p>
            </div>
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
            <div>
              <div className="text-3xl font-playfair font-bold text-brand-green">30K+</div>
              <div className="text-sm text-gray-600">Monthly learners</div>
            </div>
            <div>
              <div className="text-3xl font-playfair font-bold text-brand-green">85%</div>
              <div className="text-sm text-gray-600">Beginner audience</div>
            </div>
            <div>
              <div className="text-3xl font-playfair font-bold text-brand-green">30</div>
              <div className="text-sm text-gray-600">Days of content</div>
            </div>
            <div>
              <div className="text-3xl font-playfair font-bold text-brand-green">$1</div>
              <div className="text-sm text-gray-600">Intro sponsor rate</div>
            </div>
          </div>
          
          <div className="bg-brand-green/5 border border-brand-green/20 rounded-2xl p-6 inline-block">
            <div className="text-brand-green font-semibold mb-1">Limited Time: $1 Sponsorship</div>
            <div className="text-sm text-gray-600 mb-4">
              Sponsor a Daily Tidbit for just $1 this month. One day per company. All times Eastern.
            </div>
            {authState === 'has-company-access' ? (
              <Link 
                href="/partners/ads" 
                className="inline-flex items-center gap-1 text-brand-green font-medium text-sm hover:gap-2 transition-all"
              >
                See available dates <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <button
                onClick={() => setShowAuthRequired(true)}
                className="inline-flex items-center gap-1 text-brand-green font-medium text-sm hover:gap-2 transition-all"
              >
                Request access to book <Eye className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      {authState === 'logged-out' && (
        <section className="py-16 bg-gradient-to-r from-brand-green/10 via-brand-blue/10 to-brand-green/10">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Ready to amplify your AI tool?
            </h3>
            <p className="text-gray-600 mb-8">
              Contact our team to get started with Daily Tidbit's partner program and reach thousands of engaged AI learners.
            </p>
            <Link
              href="/partners/request-access"
              className="inline-flex items-center gap-2 bg-brand-green text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-green/90 transition-colors"
            >
              Request Partner Access <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              We'll send you a secure login link via email
            </p>
          </div>
        </section>
      )}

      <AuthRequiredModal />
    </main>
  )
}