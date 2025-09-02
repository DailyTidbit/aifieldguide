// src/app/partners/dashboard/DashboardClient.tsx - ALL ISSUES FIXED
'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSupabaseBrowser } from '../../lib/supabaseClient'
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
  TrendingUp,
  Lock,
  ExternalLink,
  Loader2,
  RefreshCw
} from 'lucide-react'

type DashboardData = {
  loading: boolean
  userName: string
  companyName: string
  companyId: string
  userRole: 'company_admin' | 'company_member'
  hasProfile: boolean
  hasListings: number
  recentActivity: any[]
  needsAttention: string[]
  needsPasswordSetup: boolean
}

type StatusType = 'complete' | 'needs-attention' | 'neutral'

// Loading skeleton
const LoadingDisplay = ({ message = "Loading your dashboard..." }: { message?: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <Loader2 className="h-8 w-8 text-brand-greenDark animate-spin mx-auto mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
)

// Error display
const ErrorDisplay = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md text-center">
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h1 className="text-xl font-semibold mb-2">Error Loading Dashboard</h1>
      <p className="text-gray-600 mb-6">{error}</p>
      <div className="space-y-3">
        <button 
          onClick={onRetry}
          className="inline-flex items-center gap-2 bg-brand-greenDark text-white px-6 py-3 rounded-full hover:bg-green-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
        <div className="text-sm text-gray-500">
          Need help? Contact <a href="mailto:partners@dailytidbit.org" className="text-brand-greenDark hover:underline">partners@dailytidbit.org</a>
        </div>
      </div>
    </div>
  </div>
)

// Company access required
const CompanyAccessRequired = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md text-center">
      <Lock className="h-12 w-12 text-amber-500 mx-auto mb-4" />
      <h1 className="text-xl font-semibold mb-2">Company Access Required</h1>
      <p className="text-gray-600 mb-6">
        You need to be associated with a company to access the partner dashboard. 
        Please contact our team to get added to your company's account.
      </p>
      <div className="space-y-3">
        <Link 
          href="/partners/request-access"
          className="inline-flex items-center gap-2 bg-brand-greenDark text-white px-6 py-3 rounded-full hover:bg-green-700 transition-colors"
        >
          Request Access
        </Link>
        <div className="text-sm text-gray-500">
          Or contact <a href="mailto:partners@dailytidbit.org" className="text-brand-greenDark hover:underline">partners@dailytidbit.org</a>
        </div>
      </div>
    </div>
  </div>
)

// Stat card component
const StatCard = ({ icon: Icon, value, label, color }: {
  icon: React.ComponentType<{ className?: string }>
  value: string | number
  label: string
  color: string
}) => (
  <div className="bg-white rounded-xl p-6 border border-gray-200">
    <div className="flex items-center gap-3">
      <div className={`p-2 ${color} rounded-lg`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-600">{label}</div>
      </div>
    </div>
  </div>
)

// Action card component  
const ActionCard = ({ href, icon: Icon, title, description, status, color }: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  status: StatusType
  color: string
}) => (
  <Link 
    href={href}
    className="group bg-white rounded-xl p-6 border border-gray-200 hover:border-brand-green/20 hover:shadow-lg transition-all"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 ${color} rounded-xl group-hover:brightness-110 transition-all`}>
        <Icon className="h-6 w-6" />
      </div>
      <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-brand-greenDark group-hover:translate-x-1 transition-all" />
    </div>
    <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-600 mb-4">{description}</p>
    <div className="flex items-center gap-2 text-sm">
      {status === 'complete' ? (
        <span className="text-brand-greenDark flex items-center gap-1">
          <CheckCircle2 className="h-4 w-4" /> Complete
        </span>
      ) : status === 'needs-attention' ? (
        <span className="text-amber-600 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" /> Needs attention
        </span>
      ) : null}
    </div>
  </Link>
)

export default function DashboardClient() {
  // Hydration safety
  const [mounted, setMounted] = useState(false)
  const [state, setState] = useState<DashboardData>({ 
    loading: true,
    userName: '',
    companyName: '',
    companyId: '',
    userRole: 'company_member',
    hasProfile: false,
    hasListings: 0,
    recentActivity: [],
    needsAttention: [],
    needsPasswordSetup: false
  })
  const [view, setView] = useState<'overview' | 'demo'>('overview')
  const [error, setError] = useState<string | null>(null)

  // Use the safe Supabase hook
  const { client: supabase, isReady } = useSupabaseBrowser()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Dashboard loader
  const loadDashboard = useCallback(async () => {
    if (!mounted || !isReady || !supabase) return

    try {
      setError(null)
      setState(prev => ({ ...prev, loading: true }))

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) { 
        window.location.href = '/partners'
        return 
      }

      if (!user.user_metadata?.has_password) {
        window.location.href = '/partners/setup'
        return
      }

      // Get company membership with company details
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

      if (membershipError) throw membershipError

      if (!membership?.company_id) {
        setState(prev => ({ 
          ...prev, 
          loading: false,
          userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
        }))
        setError('You are not associated with any company. Please contact support at partners@dailytidbit.org')
        return
      }

      const companyId = membership.company_id
      const companyName = (membership.companies as any).name
      const userRole = membership.role as 'company_admin' | 'company_member'

      // Get profile completeness data in parallel
      const [companyProfileResponse, memberProfileResponse, listingCountResponse] = await Promise.all([
        supabase
          .from('company_profiles')
          .select('*')
          .eq('company_id', companyId)
          .maybeSingle(),
        supabase
          .from('company_member_profiles')
          .select('*')
          .eq('company_id', companyId)
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('tool_listings')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
      ])

      // Check for errors in parallel requests
      if (companyProfileResponse.error) console.warn('Company profile error:', companyProfileResponse.error)
      if (memberProfileResponse.error) console.warn('Member profile error:', memberProfileResponse.error)
      if (listingCountResponse.error) console.warn('Listing count error:', listingCountResponse.error)

      const companyProfile = companyProfileResponse.data
      const memberProfile = memberProfileResponse.data
      const listingCount = listingCountResponse.count || 0

      // Determine what needs attention
      const needsAttention: string[] = []
      
      if (userRole === 'company_admin') {
        if (!companyProfile?.logo_url) needsAttention.push('Add company logo')
        if (!companyProfile?.support_email) needsAttention.push('Add support contact')
      }
      
      if (!memberProfile?.title) needsAttention.push('Add your job title')
      if (listingCount === 0) needsAttention.push('Create first tool listing')

      setState({
        loading: false,
        userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        companyName,
        companyId,
        userRole,
        hasProfile: !!(
          (userRole === 'company_admin' ? companyProfile?.logo_url && companyProfile?.support_email : true) && 
          memberProfile?.title
        ),
        hasListings: listingCount,
        recentActivity: [],
        needsAttention,
        needsPasswordSetup: false
      })
    } catch (err: any) {
      console.error('Error loading dashboard:', err)
      setError(err.message || 'Failed to load dashboard data. Please try refreshing the page.')
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [mounted, isReady, supabase])

  // Load dashboard on mount
  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  // Memoized handlers
  const handleRetry = useCallback(() => {
    loadDashboard()
  }, [loadDashboard])

  const handleViewDemo = useCallback(() => {
    setView('demo')
  }, [])

  const handleBackToDashboard = useCallback(() => {
    setView('overview')
  }, [])

  // Memoized stats
  const stats = useMemo(() => [
    {
      icon: Building2,
      value: state.hasListings,
      label: "Tool Listings",
      color: "bg-brand-green/10 text-brand-greenDark"
    },
    {
      icon: TrendingUp,
      value: "2.4K",
      label: "Monthly Views",
      color: "bg-brand-blue/10 text-brand-blueDark"
    },
    {
      icon: Users,
      value: "156",
      label: "Click-throughs",
      color: "bg-green-100 text-brand-greenDark"
    },
    {
      icon: Calendar,
      value: "6.2%",
      label: "Conversion Rate",
      color: "bg-purple-100 text-purple-600"
    }
  ], [state.hasListings])

  // Memoized action cards
  const actionCards = useMemo(() => [
    {
      href: "/partners/settings",
      icon: Settings,
      title: state.userRole === 'company_admin' ? 'Company Settings' : 'Profile Settings',
      description: state.userRole === 'company_admin' 
        ? 'Update company profile, contact info, and member preferences'
        : 'Update your personal profile and notification preferences',
      status: (state.hasProfile ? 'complete' : 'needs-attention') as StatusType,
      color: "bg-brand-green/10 text-brand-greenDark"
    },
    {
      href: "/partners/listings",
      icon: BarChart3,
      title: "Tool Listings",
      description: "Manage your AI tool listings and track performance metrics",
      status: 'neutral' as StatusType,
      color: "bg-brand-blue/10 text-brand-blueDark"
    },
    {
      href: "/partners/messages",
      icon: MessageSquare,
      title: "Support & Messages",
      description: "Get help and communicate directly with the Daily Tidbit team",
      status: 'neutral' as StatusType,
      color: "bg-green-100 text-brand-greenDark"
    }
  ], [state.userRole, state.hasProfile])

  // Show loading during hydration
  if (!mounted || state.loading) {
    return <LoadingDisplay />
  }

  // Show error state
  if (error) {
    return <ErrorDisplay error={error} onRetry={handleRetry} />
  }

  // Show company access required
  if (!state.companyId) {
    return <CompanyAccessRequired />
  }

  // Show demo view
  if (view === 'demo') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <button 
              onClick={handleBackToDashboard}
              className="text-brand-greenDark hover:text-brand-green font-medium"
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-playfair font-semibold text-gray-900">
                Welcome back, {state.userName}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-gray-600">{state.companyName}</p>
                <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  {state.userRole === 'company_admin' ? (
                    <>
                      <Building2 className="w-3 h-3" />
                      Admin
                    </>
                  ) : (
                    <>
                      <Users className="w-3 h-3" />
                      Member
                    </>
                  )}
                </div>
              </div>
            </div>
            <button 
              onClick={handleViewDemo}
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
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Main Actions Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {actionCards.map((card, index) => (
            <ActionCard key={index} {...card} />
          ))}
        </div>

        {/* Sponsor CTA */}
        <div className="bg-gradient-to-r from-green-500/10 via-blue-500/10 to-green-500/10 border border-brand-green/20 rounded-xl p-8 text-center">
          <h3 className="text-xl font-playfair font-semibold text-gray-900 mb-2">
            Limited Time: $1 Sponsorship Opportunity
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Get your tool featured in a Daily Tidbit lesson for just $1. Perfect for launching new features 
            or reaching our audience of 30,000+ AI beginners. One day per company this month.
          </p>
          <Link 
            href="/partners/ads"
            className="inline-flex items-center gap-2 bg-brand-greenDark text-white px-6 py-3 rounded-full font-medium hover:bg-green-700 transition-colors"
          >
            View Available Dates <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Quick Links */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                href: "https://dailytidbit.org/field-guide",
                icon: ExternalLink,
                label: "AI Field Guide",
                external: true
              },
              {
                href: "https://dailytidbit.org",
                icon: ExternalLink,
                label: "Daily Tidbit",
                external: true
              },
              {
                href: "mailto:partners@dailytidbit.org",
                icon: MessageSquare,
                label: "Contact Support",
                external: false
              },
              {
                href: "/partners",
                icon: Building2,
                label: "Partner Hub",
                external: false
              }
            ].map((link, index) => (
              <a
                key={index}
                href={link.href}
                {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <link.icon className="h-4 w-4 text-gray-400" />
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
