// src/app/partners/ads/page.tsx - FULLY HYDRATION SAFE & BRAND CONSISTENT
'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useSupabaseBrowser } from '../../lib/supabaseClient'
import { ArrowLeft, Calendar, Clock, DollarSign, Users, TrendingUp, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, HelpCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

// Types
type Item = { 
  date: string
  status: 'open' | 'held' | 'booked' | 'blocked'
  priceCents: number
  holdExpiry?: string
}

type ProcessingState = 'idle' | 'selecting' | 'confirming' | 'payment-redirect'

type MonthData = {
  name: string
  year: number
  days: Array<{
    date: string | null
    isCurrentMonth: boolean
  }>
}

// Constants
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

// Hydration-safe date formatting utilities
const formatDateForDisplay = (dateString: string): { weekday: string; month: string; day: string } => {
  const date = new Date(dateString + 'T00:00:00-05:00') // Force Eastern Time
  return {
    weekday: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()],
    month: MONTHS[date.getMonth()],
    day: date.getDate().toString()
  }
}

const formatTimeForDisplay = (isoString: string): string => {
  const date = new Date(isoString)
  const hours = date.getHours()
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes} ${ampm}`
}

// Loading component
const LoadingDisplay = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="h-8 w-8 text-brand-green animate-spin mx-auto mb-4" />
      <p className="text-gray-600">Loading sponsorship calendar...</p>
    </div>
  </div>
)

// Calendar day component - memoized for performance
const CalendarDay = ({ 
  day, 
  item, 
  isSelected, 
  isDisabled, 
  processingState, 
  onSelect 
}: {
  day: { date: string | null; isCurrentMonth: boolean }
  item?: Item
  isSelected: boolean
  isDisabled: boolean
  processingState: ProcessingState
  onSelect: (date: string) => void
}) => {
  const handleClick = useCallback(() => {
    if (day.date && item?.status === 'open' && !isDisabled) {
      onSelect(day.date)
    }
  }, [day.date, item?.status, isDisabled, onSelect])

  if (!day.date) {
    return <div className="p-2"></div>
  }

  const isAvailable = item?.status === 'open'
  const isHeld = item?.status === 'held'
  const dayNumber = new Date(day.date + 'T00:00:00-05:00').getDate()
  
  return (
    <button
      onClick={handleClick}
      disabled={!isAvailable || isDisabled}
      className={`
        p-3 rounded-lg text-sm font-medium transition-all relative
        disabled:cursor-not-allowed
        ${isSelected 
          ? 'bg-brand-green text-white shadow-lg ring-2 ring-brand-green/30' 
          : isAvailable 
            ? 'bg-brand-green/10 text-brand-green hover:bg-brand-green/20 hover:shadow-sm disabled:opacity-50 disabled:hover:bg-brand-green/10' 
            : isHeld
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-400'
        }
      `}
    >
      <div>{dayNumber}</div>
      {item && (
        <div className="text-xs mt-1">
          {item.status === 'open' ? '$1' : 
           item.status === 'held' ? 'Hold' : 
           item.status}
        </div>
      )}
      
      {/* Processing indicator for selected date */}
      {isSelected && processingState === 'selecting' && (
        <div className="absolute inset-0 bg-brand-green/20 rounded-lg flex items-center justify-center">
          <Loader2 className="w-4 h-4 text-white animate-spin" />
        </div>
      )}
    </button>
  )
}

export default function SponsorAdsPage() {
  // Hydration safety
  const [mounted, setMounted] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [processingState, setProcessingState] = useState<ProcessingState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Use the safe Supabase hook
  const { client: supabase, isReady } = useSupabaseBrowser()

  // Mount effect
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load data when ready
  useEffect(() => {
    if (mounted && isReady && supabase) {
      loadAvailability()
    }
  }, [mounted, isReady, supabase])

  // Auto-refresh every 30 seconds to catch sold-out dates (only when mounted)
  useEffect(() => {
    if (!mounted) return

    const interval = setInterval(() => {
      if (isReady && supabase) {
        loadAvailability()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [mounted, isReady, supabase])

  // Memoized load availability function
  const loadAvailability = useCallback(async () => {
    if (!mounted || !isReady || !supabase) return

    try {
      // Require sign-in with clear error messaging
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { 
        window.location.href = `/auth?vendor=true&next=${encodeURIComponent('/partners/ads')}`
        return 
      }

      const start = new Date()
      const end = new Date()
      end.setMonth(end.getMonth() + 2) // Show 2 months
      
      const qs = new URLSearchParams({
        start: start.toISOString().slice(0,10),
        end: end.toISOString().slice(0,10)
      }).toString()
      
      const res = await fetch(`/api/sponsor/availability?${qs}`)
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }
      
      const data = await res.json()
      setItems(data.items ?? [])
      setError(null)
      setRetryCount(0)
    } catch (error: any) {
      console.error('Error loading availability:', error)
      setError(error.message || 'Failed to load available dates')
      
      // Clear any stale selected date on error
      setSelectedDate(null)
      setProcessingState('idle')
    } finally {
      setLoading(false)
    }
  }, [mounted, isReady, supabase])

  // Retry handler
  const retryLoad = useCallback(async () => {
    if (!mounted) return
    setRetryCount(prev => prev + 1)
    setLoading(true)
    await loadAvailability()
  }, [mounted, loadAvailability])

  // Memoized calendar data
  const calendar = useMemo((): MonthData[] => {
    if (!mounted) return []

    const start = new Date()
    const end = new Date()
    end.setMonth(end.getMonth() + 2)
    
    const months: MonthData[] = []
    const current = new Date(start)
    current.setDate(1)

    while (current <= end) {
      const monthStart = new Date(current)
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0)
      
      // Get first day of week for padding
      const firstDay = monthStart.getDay()
      const lastDate = monthEnd.getDate()
      
      const days = []
      
      // Add padding days from previous month
      for (let i = 0; i < firstDay; i++) {
        days.push({ date: null, isCurrentMonth: false })
      }
      
      // Add days of current month
      for (let day = 1; day <= lastDate; day++) {
        const date = new Date(current.getFullYear(), current.getMonth(), day)
        days.push({ 
          date: date.toISOString().slice(0, 10), 
          isCurrentMonth: true 
        })
      }
      
      months.push({
        name: MONTHS[current.getMonth()],
        year: current.getFullYear(),
        days
      })
      
      current.setMonth(current.getMonth() + 1)
    }
    
    return months
  }, [mounted])

  // Date selection handler
  const selectDate = useCallback(async (date: string) => {
    if (!mounted) return
    
    // Prevent selection during processing
    if (processingState !== 'idle') return
    
    const item = items.find(i => i.date === date)
    if (!item || item.status !== 'open') return
    
    setSelectedDate(date)
    setError(null)
    setProcessingState('selecting')
    
    try {
      // Optional: Create a hold on the selected date
      // This gives the user a few minutes to complete checkout
      const holdResponse = await fetch('/api/sponsor/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date })
      })
      
      if (holdResponse.ok) {
        const holdData = await holdResponse.json()
        
        // Update local state to show the hold
        setItems(prev => prev.map(item => 
          item.date === date 
            ? { ...item, status: 'held', holdExpiry: holdData.expiresAt }
            : item
        ))
      }
      // Note: We don't fail if hold creation fails, as it's optional
      
    } catch (holdError) {
      console.warn('Failed to create hold:', holdError)
      // Continue without hold - the server will validate at checkout
    } finally {
      setProcessingState('idle')
    }
  }, [mounted, processingState, items])

  // Purchase confirmation handler
  const confirmPurchase = useCallback(async () => {
    if (!mounted || !selectedDate || processingState !== 'idle') return
    
    setProcessingState('confirming')
    setError(null)
    
    try {
      // Server will re-validate availability and company eligibility
      const res = await fetch('/api/sponsor/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate })
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || `HTTP ${res.status}`)
      }
      
      const data = await res.json()
      
      if (data.url) {
        setProcessingState('payment-redirect')
        // Short delay to show redirect state, then navigate
        setTimeout(() => {
          window.location.href = data.url
        }, 500)
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error: any) {
      console.error('Checkout error:', error)
      setError(error.message || 'Unable to start checkout')
      setProcessingState('idle')
      
      // If the date is no longer available, refresh and clear selection
      if (error.message?.includes('no longer available') || error.message?.includes('sold out')) {
        setSelectedDate(null)
        loadAvailability()
      }
    }
  }, [mounted, selectedDate, processingState, loadAvailability])

  // Memoized computed values
  const byDate = useMemo(() => new Map(items.map(i => [i.date, i])), [items])
  const selectedItem = useMemo(() => selectedDate ? byDate.get(selectedDate) : null, [selectedDate, byDate])
  const availableCount = useMemo(() => items.filter(i => i.status === 'open').length, [items])
  const heldCount = useMemo(() => items.filter(i => i.status === 'held').length, [items])

  // Show different UI states based on processing
  const isDisabled = useMemo(() => processingState !== 'idle' || loading, [processingState, loading])

  // Hydration-safe formatted date display
  const formattedSelectedDate = useMemo(() => {
    if (!mounted || !selectedDate) return null
    return formatDateForDisplay(selectedDate)
  }, [mounted, selectedDate])

  // Hydration-safe formatted hold expiry time
  const formattedHoldExpiry = useMemo(() => {
    if (!mounted || !selectedItem?.holdExpiry) return null
    return formatTimeForDisplay(selectedItem.holdExpiry)
  }, [mounted, selectedItem?.holdExpiry])

  // Show loading during hydration
  if (!mounted || (loading && items.length === 0)) {
    return <LoadingDisplay />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/partners/dashboard"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <div className="h-4 w-px bg-gray-300" />
            <h1 className="text-xl font-semibold">Sponsor a Daily Tidbit</h1>
            
            {/* Processing state indicator */}
            {processingState !== 'idle' && (
              <div className="flex items-center gap-2 text-brand-green text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                {processingState === 'selecting' && 'Securing date...'}
                {processingState === 'confirming' && 'Processing...'}
                {processingState === 'payment-redirect' && 'Redirecting to payment...'}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-red-900 mb-1">Something went wrong</div>
              <div className="text-sm text-red-800 mb-3">{error}</div>
              <button
                onClick={retryLoad}
                disabled={loading}
                className="inline-flex items-center gap-2 text-red-700 hover:text-red-800 font-medium text-sm disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                Try again {retryCount > 0 && `(${retryCount + 1})`}
              </button>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-brand-green/10 via-brand-blue/10 to-brand-green/10 rounded-2xl p-8 mb-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-brand-green font-medium mb-2">
              <DollarSign className="h-5 w-5" />
              Limited Time: $1 Sponsorship Special
            </div>
            <h1 className="text-3xl font-playfair font-semibold text-gray-900 mb-4">
              Get your AI tool in front of 30,000+ learners
            </h1>
            <p className="text-gray-600 mb-6">
              Sponsor a Daily Tidbit lesson and reach engaged beginners at the perfect moment they're 
              learning about your tool category. Introductory pricing: just $1 per day this month.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-green">30K+</div>
                <div className="text-sm text-gray-600">Monthly learners</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-green">85%</div>
                <div className="text-sm text-gray-600">Beginners</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-green">{availableCount}</div>
                <div className="text-sm text-gray-600">Days available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-green">1</div>
                <div className="text-sm text-gray-600">Per company</div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur border border-brand-green/20 rounded-lg p-4">
              <div className="text-sm text-brand-green font-medium">What you get:</div>
              <div className="text-sm text-gray-700 mt-1">
                Your tool featured prominently in that day's lesson • Brand logo placement • 
                Direct link to your website • Analytics on impressions and clicks
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold mb-1">Select Your Date</h2>
                  <div className="text-sm text-gray-600">
                    All times Eastern • Updates every 30 seconds
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-brand-green rounded-full"></div>
                    <span>Available ($1)</span>
                  </div>
                  {heldCount > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <span>On hold</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <span>Unavailable</span>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {calendar.map((month, monthIndex) => (
                  <div key={`${month.name}-${month.year}`}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {month.name} {month.year}
                    </h3>
                    
                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {DAYS_OF_WEEK.map(day => (
                        <div key={day} className="p-2 text-center text-xs font-medium text-gray-500">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {month.days.map((day, dayIndex) => (
                        <CalendarDay
                          key={`${monthIndex}-${dayIndex}`}
                          day={day}
                          item={day.date ? byDate.get(day.date) : undefined}
                          isSelected={selectedDate === day.date}
                          isDisabled={isDisabled}
                          processingState={processingState}
                          onSelect={selectDate}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selection Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold mb-4">Your Selection</h3>
              
              {selectedDate && formattedSelectedDate ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-brand-green/5 rounded-lg border border-brand-green/20">
                    <Calendar className="h-8 w-8 text-brand-green" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {formattedSelectedDate.weekday}, {formattedSelectedDate.month} {formattedSelectedDate.day}
                      </div>
                      <div className="text-sm text-gray-600">Daily Tidbit Sponsorship</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span className="text-brand-green">${(selectedItem?.priceCents || 100) / 100}</span>
                  </div>
                  
                  <button
                    onClick={confirmPurchase}
                    disabled={isDisabled}
                    className="w-full bg-brand-green text-white py-3 rounded-lg font-medium hover:bg-brand-greenDark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {processingState === 'confirming' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : processingState === 'payment-redirect' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Redirecting...
                      </>
                    ) : (
                      'Continue to Checkout'
                    )}
                  </button>
                  
                  <div className="text-xs text-gray-500 text-center">
                    Secure checkout via Stripe • Date held during payment
                  </div>

                  {selectedItem?.holdExpiry && formattedHoldExpiry && (
                    <div className="text-xs text-amber-600 text-center bg-amber-50 rounded p-2">
                      Date reserved until {formattedHoldExpiry} ET
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <div className="mb-2">Select a date to continue</div>
                  <div className="text-xs">Dates update automatically</div>
                </div>
              )}
            </div>

            {/* What's Included */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold mb-4">What's Included</h3>
              <div className="space-y-3 text-sm">
                {[
                  {
                    title: "Featured placement",
                    description: "Your tool prominently displayed in the daily lesson"
                  },
                  {
                    title: "Brand visibility",
                    description: "Company logo and branding throughout the lesson"
                  },
                  {
                    title: "Direct traffic",
                    description: "Clickable links driving users to your website"
                  },
                  {
                    title: "Performance analytics",
                    description: "Detailed metrics on impressions and click-through rates"
                  },
                  {
                    title: "Email mention",
                    description: "Featured in that day's email to 15,000+ subscribers"
                  }
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-green flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">{feature.title}</div>
                      <div className="text-gray-600">{feature.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Support */}
            <div className="bg-brand-blue/5 border border-brand-blue/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-brand-blueDark flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-brand-blueDark text-sm">Need help choosing?</div>
                  <div className="text-sm text-brand-blueDark/80 mt-1 mb-3">
                    Our team can recommend the best dates based on your tool category and audience.
                  </div>
                  <Link 
                    href="/partners/messages"
                    className="inline-flex items-center gap-1 text-brand-blueDark font-medium text-sm hover:text-brand-blue transition-colors"
                  >
                    Contact our team <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="mt-12 bg-white rounded-xl border border-gray-200 p-8">
          <div className="max-w-4xl">
            <h3 className="text-xl font-semibold mb-4">Why sponsor a Daily Tidbit?</h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-brand-green/10 rounded-xl flex-shrink-0">
                  <Users className="h-6 w-6 text-brand-green" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Perfect timing</h4>
                  <p className="text-gray-600 text-sm">
                    Reach users exactly when they're learning about your tool's category. 
                    No cold outreach needed.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-3 bg-brand-blue/10 rounded-xl flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-brand-blue" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Engaged audience</h4>
                  <p className="text-gray-600 text-sm">
                    Our learners are actively trying new tools and building AI workflows. 
                    85% are beginners looking for guidance.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 rounded-xl flex-shrink-0">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Trusted context</h4>
                  <p className="text-gray-600 text-sm">
                    Your tool appears within educational content, not as an ad. 
                    This builds trust and drives higher-quality traffic.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timezone note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            <Clock className="inline h-4 w-4 mr-1" />
            All times shown in Eastern Time (US). Your sponsorship will go live at 6:00 AM ET on the selected date.
          </p>
        </div>
      </div>
    </div>
  )
}