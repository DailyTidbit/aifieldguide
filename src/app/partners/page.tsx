// src/app/partners/page.tsx
'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabaseClient } from '@/app/lib/supabaseClient'
import { ArrowRight, Building2, Shield, Settings, BarChart3, MessageSquare, Zap, Eye, Lock } from 'lucide-react'

export default function PartnersLanding() {
  const [user, setUser] = useState<any>(null)
  const [hasCompany, setHasCompany] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showAuthRequired, setShowAuthRequired] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabaseClient.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data: company } = await supabaseClient
          .from('company_users')
          .select('company_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle()
        setHasCompany(!!company)
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  const features = [
    {
      icon: Building2,
      title: "Company Profile",
      description: "Manage your brand presence across Daily Tidbit",
      action: hasCompany ? "/partners/settings" : "/partners/claim",
      authRequired: true,
      preview: "Update logos, contact information, and brand assets. Customize how your company appears across our platform."
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard", 
      description: "Track impressions, clicks, and engagement metrics",
      action: "/partners/dashboard",
      authRequired: true,
      preview: "View real-time performance data, conversion rates, and detailed insights into how learners interact with your tools."
    },
    {
      icon: MessageSquare,
      title: "Direct Support",
      description: "Get help and request listing changes",
      action: "/partners/messages",
      authRequired: true,
      preview: "Communicate directly with our team for quick assistance, listing updates, and partnership opportunities."
    },
    {
      icon: Zap,
      title: "Sponsor Opportunities",
      description: "$1 intro special - sponsor a Daily Tidbit",
      action: "/partners/ads",
      authRequired: true,
      preview: "Book sponsorship slots in our daily lessons and reach 30K+ engaged learners at the perfect learning moment."
    }
  ]

  const handleFeatureClick = (feature: any, e: React.MouseEvent) => {
    if (feature.authRequired && !user) {
      e.preventDefault()
      setShowAuthRequired(true)
      return
    }
  }

  const AuthRequiredModal = () => {
    if (!showAuthRequired) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign In Required</h3>
            <p className="text-gray-600 mb-6">
              You've explored the vendor portal - ready to join? Sign in with your work email to access all features.
            </p>
            <div className="space-y-3">
              <Link
                href="/auth?vendor=true"
                className="block w-full bg-[#60A875] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#4f8f61] transition-colors"
              >
                Sign In to Get Started
              </Link>
              <button
                onClick={() => setShowAuthRequired(false)}
                className="block w-full py-2 text-gray-500 hover:text-gray-700"
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
        <div className="animate-spin h-8 w-8 border-2 border-[#60A875] border-t-transparent rounded-full"></div>
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
              <div className="w-8 h-8 bg-[#60A875] rounded-lg"></div>
              <span className="font-bold text-xl text-gray-900">Daily Tidbit</span>
            </div>
            {user ? (
              <Link 
                href={hasCompany ? "/partners/dashboard" : "/partners/claim"}
                className="text-[#60A875] hover:text-[#4f8f61] font-medium"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link 
                href="/auth?vendor=true"
                className="text-[#60A875] hover:text-[#4f8f61] font-medium"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-12">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#60A875]/20 bg-[#60A875]/5 px-4 py-2 text-sm text-[#60A875] mb-6">
            <Shield className="h-4 w-4" />
            Daily Tidbit Partner Hub
          </div>
          
          <h1 className="text-4xl md:text-5xl font-playfair font-semibold text-gray-900 mb-4">
            Your AI Tool, <span className="text-[#60A875]">Amplified</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Reach 30,000+ learners discovering AI tools through our beginner-friendly daily lessons. 
            Keep your listing accurate, track performance, and connect directly with our team.
          </p>

          {!user && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 inline-block">
              <div className="flex items-center gap-2 text-green-800">
                <Eye className="w-4 h-4" />
                <span className="text-sm">
                  <strong>Explore freely!</strong> Click around and see everything our vendor portal offers. No signup required to browse.
                </span>
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {user ? (
              <Link 
                href={hasCompany ? "/partners/dashboard" : "/partners/claim"}
                className="inline-flex items-center gap-2 bg-[#60A875] text-white px-6 py-3 rounded-full font-medium hover:bg-[#4f8f61] transition-colors"
              >
                {hasCompany ? "Go to Dashboard" : "Access Your Company"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link 
                  href="/auth?vendor=true"
                  className="inline-flex items-center gap-2 bg-[#60A875] text-white px-6 py-3 rounded-full font-medium hover:bg-[#4f8f61] transition-colors"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
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
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-[#60A875]/20 transition-all duration-200 cursor-pointer"
                onClick={(e) => handleFeatureClick(feature, e)}
              >
                <div className="w-12 h-12 bg-[#60A875]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#60A875]/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-[#60A875]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{feature.description}</p>
                
                {/* Preview for non-authenticated users */}
                {!user && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-gray-700">{feature.preview}</p>
                  </div>
                )}
                
                <div className="flex items-center text-[#60A875] text-sm font-medium group-hover:gap-2 transition-all">
                  {user ? (
                    <>
                      Get started <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  ) : (
                    <>
                      Explore feature <Eye className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </div>
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
            <div className="text-center">
              <div className="w-16 h-16 bg-[#59B1E3]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-playfair font-semibold text-[#59B1E3]">1</span>
              </div>
              <h3 className="font-semibold mb-2">Daily Tidbit Integration</h3>
              <p className="text-sm text-gray-600">Your tool appears in relevant daily lessons, reaching learners at the perfect moment</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[#59B1E3]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-playfair font-semibold text-[#59B1E3]">2</span>
              </div>
              <h3 className="font-semibold mb-2">AI Field Guide Listing</h3>
              <p className="text-sm text-gray-600">Searchable tool directory organized by task and use case, not technical jargon</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[#59B1E3]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-playfair font-semibold text-[#59B1E3]">3</span>
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
              <div className="text-3xl font-playfair font-bold text-[#60A875]">30K+</div>
              <div className="text-sm text-gray-600">Monthly learners</div>
            </div>
            <div>
              <div className="text-3xl font-playfair font-bold text-[#60A875]">85%</div>
              <div className="text-sm text-gray-600">Beginner audience</div>
            </div>
            <div>
              <div className="text-3xl font-playfair font-bold text-[#60A875]">30</div>
              <div className="text-sm text-gray-600">Days of content</div>
            </div>
            <div>
              <div className="text-3xl font-playfair font-bold text-[#60A875]">$1</div>
              <div className="text-sm text-gray-600">Intro sponsor rate</div>
            </div>
          </div>
          
          <div className="bg-[#60A875]/5 border border-[#60A875]/20 rounded-2xl p-6 inline-block">
            <div className="text-[#60A875] font-semibold mb-1">Limited Time: $1 Sponsorship</div>
            <div className="text-sm text-gray-600 mb-4">
              Sponsor a Daily Tidbit for just $1 this month. One day per company.
            </div>
            {user ? (
              <Link 
                href="/partners/ads" 
                className="inline-flex items-center gap-1 text-[#60A875] font-medium text-sm hover:gap-2 transition-all"
              >
                See available dates <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <button
                onClick={() => setShowAuthRequired(true)}
                className="inline-flex items-center gap-1 text-[#60A875] font-medium text-sm hover:gap-2 transition-all"
              >
                Explore sponsorship <Eye className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      {!user && (
        <section className="py-16 bg-gradient-to-r from-[#60A875]/10 via-[#59B1E3]/10 to-[#60A875]/10">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Ready to amplify your AI tool?
            </h3>
            <p className="text-gray-600 mb-8">
              You've seen what our vendor portal offers. Join 100+ AI tools already growing with Daily Tidbit.
            </p>
            <Link
              href="/auth?vendor=true"
              className="inline-flex items-center gap-2 bg-[#60A875] text-white px-8 py-4 rounded-lg font-semibold hover:bg-[#4f8f61] transition-colors"
            >
              Get Started Now <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              Quick setup • Domain verification • Start in minutes
            </p>
          </div>
        </section>
      )}

      <AuthRequiredModal />
    </main>
  )
}