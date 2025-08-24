// src/app/partners/page.tsx
'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabaseClient } from '@/app/lib/supabaseClient'
import { ArrowRight, Building2, Shield, Settings, BarChart3, MessageSquare, Zap } from 'lucide-react'

export default function PartnersLanding() {
  const [user, setUser] = useState<any>(null)
  const [hasCompany, setHasCompany] = useState(false)
  const [loading, setLoading] = useState(true)

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
      action: hasCompany ? "/partners/settings" : "/partners/claim"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard", 
      description: "Track impressions, clicks, and engagement metrics",
      action: "/partners/dashboard"
    },
    {
      icon: MessageSquare,
      title: "Direct Support",
      description: "Get help and request listing changes",
      action: "/partners/messages"
    },
    {
      icon: Zap,
      title: "Sponsor Opportunities",
      description: "$1 intro special - sponsor a Daily Tidbit",
      action: "/partners/ads"
    }
  ]

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-brand-green border-t-transparent rounded-full"></div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
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

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {user ? (
              <Link 
                href={hasCompany ? "/partners/dashboard" : "/partners/claim"}
                className="inline-flex items-center gap-2 bg-brand-green text-white px-6 py-3 rounded-full font-medium hover:bg-brand-green/90 transition-colors"
              >
                {hasCompany ? "Go to Dashboard" : "Access Your Company"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link 
                  href="/auth"
                  className="inline-flex items-center gap-2 bg-brand-green text-white px-6 py-3 rounded-full font-medium hover:bg-brand-green/90 transition-colors"
                >
                  Sign In
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
              <Link
                key={index}
                href={user ? feature.action : "/auth"}
                className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-brand-green/20 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-brand-green/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-green/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-brand-green" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{feature.description}</p>
                <div className="flex items-center text-brand-green text-sm font-medium group-hover:gap-2 transition-all">
                  Get started <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
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
            <div className="text-sm text-gray-600">
              Sponsor a Daily Tidbit for just $1 this month. One day per company.
            </div>
            <Link 
              href="/partners/ads" 
              className="inline-flex items-center gap-1 text-brand-green font-medium text-sm mt-2 hover:gap-2 transition-all"
            >
              See available dates <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}