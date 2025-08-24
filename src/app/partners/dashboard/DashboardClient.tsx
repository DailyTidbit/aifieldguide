// src/app/partners/dashboard/DashboardClient.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabaseClient } from '@/app/lib/supabaseClient'
import PartnerHubDemo from '../../components/partners/PartnerHubDemo'
import Link from 'next/link'
import { 
  ArrowRight, 
  Building2, 
  Settings, 
  BarChart3, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  Users,
  TrendingUp
} from 'lucide-react'

type DashboardData = {
  loading: boolean
  userName: string
  companyName: string
  companyId: string
  hasProfile: boolean
  hasListings: number
  recentActivity: any[]
  needsAttention: string[]
}

export default function DashboardClient() {
  const [state, setState] = useState<DashboardData>({ 
    loading: true,
    userName: '',
    companyName: '',
    companyId: '',
    hasProfile: false,
    hasListings: 0,
    recentActivity: [],
    needsAttention: []
  })
  const [view, setView] = useState<'overview' | 'demo'>('overview')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function loadDashboard() {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser()
        if (!user) { 
          window.location.href = '/auth'
          return 
        }

        // Get company membership
        const { data: cu } = await supabaseClient
          .from('company_users')
          .select('company_id, role')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle()

        if (!cu?.company_id) {
          if (mounted) {
            setState(prev => ({ 
              ...prev, 
              loading: false,
              userName: user.user_metadata?.full_name || user.email || 'User'
            }))
          }
          return
        }

        // Get company info
        const { data: company } = await supabaseClient
          .from('companies')
          .select('name')
          .eq('id', cu.company_id)
          .maybeSingle()

        // Check profile completeness
        const { data: profile } = await supabaseClient
          .from('company_profiles')
          .select('*')
          .eq('company_id', cu.company_id)
          .maybeSingle()

        // Get listing count
        const { count: listingCount } = await supabaseClient
          .from('tool_listings')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', cu.company_id)

        // Check what needs attention
        const needsAttention: string[] = []
        if (!profile?.logo_url) needsAttention.push('Add company logo')
        if (!profile?.support_email) needsAttention.push('Add support contact')
        if ((listingCount || 0) === 0) needsAttention.push('Create first tool listing')

        if (mounted) {
          setState({
            loading: false,
            userName: user.user_metadata?.full_name || user.email || 'User',
            companyName: company?.name || 'Your Company',
            companyId: cu.company_id,
            hasProfile: !!(profile?.logo_url && profile?.support_email),
            hasListings: listingCount || 0,
            recentActivity: [], // TODO: implement recent activity
            needsAttention
          })
        }
      } catch (err) {
        console.error('Error loading dashboard:', err)
        if (mounted) {
          setError('Failed to load dashboard data')
          setState(prev => ({ ...prev, loading: false }))
        }
      }
    }

    loadDashboard()
    return () => { mounted = false }
  }, [])

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-brand-green border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Error Loading Dashboard</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 bg-brand-green text-white px-6 py-3 rounded-full hover:bg-brand-green/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!state.companyId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Company Access Required</h1>
          <p className="text-gray-600 mb-6">You need to be linked to a company to access the partner dashboard.</p>
          <Link 
            href="/partners/claim" 
            className="inline-flex items-center gap-2 bg-brand-green text-white px-6 py-3 rounded-full hover:bg-brand-green/90 transition-colors"
          >
            Claim Your Company <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    )
  }

  if (view === 'demo') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <button 
              onClick={() => setView('overview')}
              className="text-brand-green hover:text-brand-green/80 font-medium"
            >
              ← Back to Dashboard
            </button>
            <div className="h-4 w-px bg-gray-300" />
            <h1 className="font-semibold">Interactive Demo</h1>
          </div>
        </div>
        <PartnerHubDemo
          userName={state.userName}
          companyName={state.companyName}
          toolName="Your Tool"
          companyId={state.companyId}
        />
      </div>
    )
  }

  const isOnboarded = state.hasProfile && state.hasListings > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-playfair font-semibold text-gray-900">
                Welcome back, {state.userName.split(' ')[0]}
              </h1>
              <p className="text-gray-600 mt-1">{state.companyName} • Partner Dashboard</p>
            </div>
            <button 
              onClick={() => setView('demo')}
              className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              View Interactive Demo <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Needs Attention Alert */}
        {state.needsAttention.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 mb-2">Complete Your Setup</h3>
                <ul className="space-y-2 text-sm text-amber-800">
                  {state.needsAttention.map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-amber-600 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link 
                  href="/partners/settings"
                  className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium mt-4 hover:bg-amber-700 transition-colors"
                >
                  Complete Setup <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-green/10 rounded-lg">
                <Building2 className="h-5 w-5 text-brand-green" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{state.hasListings}</div>
                <div className="text-sm text-gray-600">Tool Listings</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-blue/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-brand-blue" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">2.4K</div>
                <div className="text-sm text-gray-600">Monthly Views</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">156</div>
                <div className="text-sm text-gray-600">Click-throughs</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">6.2%</div>
                <div className="text-sm text-gray-600">Conversion Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Actions Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link 
            href="/partners/settings"
            className="group bg-white rounded-xl p-6 border border-gray-200 hover:border-brand-green/20 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-brand-green/10 rounded-xl group-hover:bg-brand-green/20 transition-colors">
                <Settings className="h-6 w-6 text-brand-green" />
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-brand-green group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Company Settings</h3>
            <p className="text-sm text-gray-600 mb-4">
              Update company profile, contact info, and member preferences
            </p>
            <div className="flex items-center gap-2 text-sm">
              {state.hasProfile ? (
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Complete
                </span>
              ) : (
                <span className="text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> Needs attention
                </span>
              )}
            </div>
          </Link>

          <Link 
            href="/partners/listings"
            className="group bg-white rounded-xl p-6 border border-gray-200 hover:border-brand-green/20 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-brand-blue/10 rounded-xl group-hover:bg-brand-blue/20 transition-colors">
                <BarChart3 className="h-6 w-6 text-brand-blue" />
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-brand-blue group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Tool Listings</h3>
            <p className="text-sm text-gray-600 mb-4">
              Manage your AI tool listings and track performance metrics
            </p>
            <div className="text-sm text-gray-600">
              {state.hasListings} active listing{state.hasListings !== 1 ? 's' : ''}
            </div>
          </Link>

          <Link 
            href="/partners/messages"
            className="group bg-white rounded-xl p-6 border border-gray-200 hover:border-brand-green/20 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Support & Messages</h3>
            <p className="text-sm text-gray-600 mb-4">
              Get help and communicate directly with the Daily Tidbit team
            </p>
            <div className="text-sm text-green-600">
              No unread messages
            </div>
          </Link>
        </div>

        {/* Sponsor CTA */}
        <div className="bg-gradient-to-r from-brand-green/10 via-brand-blue/10 to-brand-green/10 border border-brand-green/20 rounded-xl p-8 text-center">
          <h3 className="text-xl font-playfair font-semibold text-gray-900 mb-2">
            Limited Time: $1 Sponsorship Opportunity
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Get your tool featured in a Daily Tidbit lesson for just $1. Perfect for launching new features 
            or reaching our audience of 30,000+ AI beginners. One day per company this month.
          </p>
          <Link 
            href="/partners/ads"
            className="inline-flex items-center gap-2 bg-brand-green text-white px-6 py-3 rounded-full font-medium hover:bg-brand-green/90 transition-colors"
          >
            View Available Dates <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}