// src/app/partners/preview/[token]/PreviewClient.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Building2, 
  BarChart3, 
  Users, 
  TrendingUp, 
  Settings,
  MessageSquare,
  Zap,
  ArrowRight,
  Lock,
  Eye,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle2,
  Calendar
} from 'lucide-react'

interface PreviewData {
  isValid: boolean
  company?: {
    id: string
    name: string
    domain: string
    domains: string[]
    company_profiles: {
      logo_url?: string
      support_email?: string
      billing_email?: string
      marketing_email?: string
    }[]
  }
  preview?: {
    toolListingsCount: number
    toolListings: any[]
    memberCount: number
    analytics: {
      monthlyViews: number
      clickThroughs: number
      conversionRate: string
      totalImpressions: number
    }
    expiresAt: string
  }
  error?: string
  isExpired?: boolean
}

export default function PreviewClient({ token }: { token: string }) {
  const [data, setData] = useState<PreviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSignupPrompt, setShowSignupPrompt] = useState(false)

  useEffect(() => {
    async function validateToken() {
      try {
        const response = await fetch('/api/partners/preview/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })
        
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error('Preview validation error:', error)
        setData({ isValid: false, error: 'Failed to load preview' })
      } finally {
        setLoading(false)
      }
    }

    validateToken()
  }, [token])

  const handleLockedFeatureClick = () => {
    setShowSignupPrompt(true)
  }

  const PreviewBanner = () => (
    <div className="bg-gradient-to-r from-[#60A875] to-[#59B1E3] text-white px-6 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5" />
          <span className="font-medium">Preview Mode - {data?.company?.name} Partner Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm opacity-90">
            <Clock className="w-4 h-4" />
            <span>Expires {data?.preview?.expiresAt ? new Date(data.preview.expiresAt).toLocaleDateString() : 'soon'}</span>
          </div>
          <Link
            href={`/auth?vendor=true&company=${encodeURIComponent(data?.company?.name || '')}&domain=${data?.company?.domain || ''}`}
            className="bg-white text-[#60A875] px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
          >
            Sign Up to Manage
          </Link>
        </div>
      </div>
    </div>
  )

  const SignupPromptModal = () => {
    if (!showSignupPrompt) return null

    const primaryDomain = data?.company?.domain || ''
    const allDomains = data?.company?.domains || []
    const availableDomains = Array.from(new Set([primaryDomain, ...allDomains])).filter(Boolean)

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign Up Required</h3>
            <p className="text-gray-600 mb-6">
              You're previewing the <strong>{data?.company?.name}</strong> partner portal. Sign up with your work email to access all features and manage your listings.
            </p>
            
            {availableDomains.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-green-900 mb-1">Authorized Email Domains:</p>
                    <div className="flex flex-wrap gap-1">
                      {availableDomains.map(domain => (
                        <span key={domain} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          @{domain}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Link
                href={`/auth?vendor=true&company=${encodeURIComponent(data?.company?.name || '')}&domain=${primaryDomain}`}
                className="block w-full bg-[#60A875] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#4f8f61] transition-colors"
              >
                Sign Up with Work Email
              </Link>
              <button
                onClick={() => setShowSignupPrompt(false)}
                className="block w-full py-2 text-gray-500 hover:text-gray-700"
              >
                Continue Previewing
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-[#60A875] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading preview...</p>
        </div>
      </div>
    )
  }

  if (!data?.isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            {data?.isExpired ? 'Preview Expired' : 'Invalid Preview Link'}
          </h1>
          <p className="text-gray-600 mb-6">
            {data?.isExpired 
              ? 'This preview link has expired. Please request a new one.'
              : 'This preview link is invalid or has been used. Please check the link or request a new one.'
            }
          </p>
          <Link
            href="/partners"
            className="inline-flex items-center gap-2 bg-[#60A875] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#4f8f61] transition-colors"
          >
            Visit Partner Hub <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  const company = data.company!
  const preview = data.preview!

  return (
    <div className="min-h-screen bg-gray-50">
      <PreviewBanner />

      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {company.company_profiles?.[0]?.logo_url ? (
                <img 
                  src={company.company_profiles[0].logo_url} 
                  alt={`${company.name} logo`}
                  className="w-12 h-12 rounded-lg object-contain bg-gray-100"
                />
              ) : (
                <div className="w-12 h-12 bg-[#60A875] rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  {company.name} Partner Dashboard
                </h1>
                <p className="text-gray-600">Daily Tidbit Partner Portal Preview</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">Preview Mode</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200 relative overflow-hidden">
            <div className="absolute top-2 right-2">
              <Lock className="w-4 h-4 text-gray-300" />
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#60A875]/10 rounded-lg">
                <Building2 className="h-5 w-5 text-[#60A875]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{preview.toolListingsCount}</div>
                <div className="text-sm text-gray-600">Tool Listings</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200 relative overflow-hidden">
            <div className="absolute top-2 right-2">
              <Lock className="w-4 h-4 text-gray-300" />
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#59B1E3]/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-[#59B1E3]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{preview.analytics.monthlyViews.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Monthly Views</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200 relative overflow-hidden">
            <div className="absolute top-2 right-2">
              <Lock className="w-4 h-4 text-gray-300" />
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{preview.analytics.clickThroughs}</div>
                <div className="text-sm text-gray-600">Click-throughs</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200 relative overflow-hidden">
            <div className="absolute top-2 right-2">
              <Lock className="w-4 h-4 text-gray-300" />
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{preview.analytics.conversionRate}%</div>
                <div className="text-sm text-gray-600">Conversion Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Actions Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div 
            onClick={handleLockedFeatureClick}
            className="group bg-white rounded-xl p-6 border border-gray-200 hover:border-[#60A875]/20 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-4 right-4">
              <Lock className="w-5 h-5 text-gray-300 group-hover:text-[#60A875] transition-colors" />
            </div>
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-[#60A875]/10 rounded-xl group-hover:bg-[#60A875]/20 transition-colors">
                <Settings className="h-6 w-6 text-[#60A875]" />
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Company Settings</h3>
            <p className="text-sm text-gray-600 mb-4">
              Update company profile, contact info, and branding
            </p>
            <div className="flex items-center gap-2 text-sm text-[#60A875]">
              <span>Click to unlock</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div 
            onClick={handleLockedFeatureClick}
            className="group bg-white rounded-xl p-6 border border-gray-200 hover:border-[#59B1E3]/20 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-4 right-4">
              <Lock className="w-5 h-5 text-gray-300 group-hover:text-[#59B1E3] transition-colors" />
            </div>
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-[#59B1E3]/10 rounded-xl group-hover:bg-[#59B1E3]/20 transition-colors">
                <BarChart3 className="h-6 w-6 text-[#59B1E3]" />
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Analytics & Insights</h3>
            <p className="text-sm text-gray-600 mb-4">
              View detailed performance metrics and user engagement data
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="text-xs text-gray-600">Sample metrics shown above ↑</div>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#59B1E3]">
              <span>Click to unlock</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div 
            onClick={handleLockedFeatureClick}
            className="group bg-white rounded-xl p-6 border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-4 right-4">
              <Lock className="w-5 h-5 text-gray-300 group-hover:text-green-600 transition-colors" />
            </div>
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Direct Support</h3>
            <p className="text-sm text-gray-600 mb-4">
              Get help and communicate with the Daily Tidbit team
            </p>
            <div className="flex items-center gap-2 text-sm text-green-600">
              <span>Click to unlock</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Tool Listings Preview */}
        {preview.toolListingsCount > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 mb-8">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Your Tool Listings</h3>
                <p className="text-sm text-gray-600">Manage and update your AI tool information</p>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-300" />
                <span className="text-sm text-gray-500">Preview Mode</span>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  You have {preview.toolListingsCount} tool listing{preview.toolListingsCount !== 1 ? 's' : ''} in your account
                </p>
                <button
                  onClick={handleLockedFeatureClick}
                  className="inline-flex items-center gap-2 bg-[#60A875] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#4f8f61] transition-colors"
                >
                  Sign Up to View & Edit <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sponsor CTA */}
        <div className="bg-gradient-to-r from-[#60A875]/10 via-[#59B1E3]/10 to-[#60A875]/10 border border-[#60A875]/20 rounded-xl p-8 text-center relative overflow-hidden">
          <div className="absolute top-4 right-4">
            <Lock className="w-5 h-5 text-gray-300" />
          </div>
          <Zap className="w-12 h-12 text-[#60A875] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Limited Time: $1 Sponsorship Opportunity
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Get your tool featured in a Daily Tidbit lesson for just $1. Perfect for launching new features 
            or reaching our audience of 30,000+ AI beginners.
          </p>
          <button
            onClick={handleLockedFeatureClick}
            className="inline-flex items-center gap-2 bg-[#60A875] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#4f8f61] transition-colors"
          >
            Sign Up to Book Sponsorship <ArrowRight className="w-4 w-4" />
          </button>
        </div>

        {/* Team Info */}
        {preview.memberCount > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Users className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Team Access Ready</h4>
                <p className="text-sm text-blue-800">
                  You have {preview.memberCount} team member{preview.memberCount !== 1 ? 's' : ''} who can access this portal once you complete signup.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <SignupPromptModal />
    </div>
  )
}