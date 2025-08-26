// src/app/partners/ads/page.tsx - Complete Fixed Version
'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabaseClient } from '@/app/lib/supabaseClient'
import { ArrowLeft, Calendar, Clock, DollarSign, Users, TrendingUp, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, HelpCircle } from 'lucide-react'
import Link from 'next/link'

type Item = { 
  date: string; 
  status: 'open' | 'held' | 'booked' | 'blocked'; 
  priceCents: number;
  holdExpiry?: string; // ISO timestamp when hold expires
}

type ProcessingState = 'idle' | 'selecting' | 'confirming' | 'payment-redirect'

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function SponsorAdsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [processingState, setProcessingState] = useState<ProcessingState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    loadAvailability()
  }, [])

  // Auto-refresh every 30 seconds to catch sold-out dates
  useEffect(() => {
    const interval = setInterval(loadAvailability, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadAvailability() {
    try {
      // Require sign-in with clear error messaging
      const { data: { user } } = await supabaseClient.auth.getUser()
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
  }

  async function retryLoad() {
    setRetryCount(prev => prev + 1)
    setLoading(true)
    await loadAvailability()
  }

  const calendar = useMemo(() => {
    const start = new Date()
    const end = new Date()
    end.setMonth(end.getMonth() + 2)
    
    const months = []
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
  }, [])

  async function selectDate(date: string) {
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
  }

  async function confirmPurchase() {
    if (!selectedDate || processingState !== 'idle') return
    
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
  }

  const byDate = new Map(items.map(i => [i.date, i]))
  const selectedItem = selectedDate ? byDate.get(selectedDate) : null
  const availableCount = items.filter(i => i.status === 'open').length
  const heldCount = items.filter(i => i.status === 'held').length

  // Show different UI states based on processing
  const isDisabled = processingState !== 'idle' || loading

  if (loading && items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-brand-green border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sponsorship calendar...</p>
        </div>
      </div>
    )
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
                <div className="animate-spin h-4 w-4 border-2 border-brand-green border-t-transparent rounded-full"></div>
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
                  <div key={monthIndex}>
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
                      {month.days.map((day, dayIndex) => {
                        if (!day.date) {
                          return <div key={dayIndex} className="p-2"></div>
                        }
                        
                        const item = byDate.get(day.date)
                        const isAvailable = item?.status === 'open'
                        const isHeld = item?.status === 'held'
                        const isSelected = selectedDate === day.date
                        const dayNumber = new Date(day.date).getDate()
                        
                        return (
                          <button
                            key={day.date}
                            onClick={() => selectDate(day.date)}
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
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              </div>
                            )}
                          </button>
                        )
                      })}
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
              
              {selectedDate ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-brand-green/5 rounded-lg border border-brand-green/20">
                    <Calendar className="h-8 w-8 text-brand-green" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {new Date(selectedDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
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
                    className="w-full bg-brand-green text-white py-3 rounded-lg font-medium hover:bg-brand-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {processingState === 'confirming' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : processingState === 'payment-redirect' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Redirecting...
                      </>
                    ) : (
                      'Continue to Checkout'
                    )}
                  </button>
                  
                  <div className="text-xs text-gray-500 text-center">
                    Secure checkout via Stripe • Date held during payment
                  </div>

                  {selectedItem?.holdExpiry && (
                    <div className="text-xs text-amber-600 text-center bg-amber-50 rounded p-2">
                      Date reserved until {new Date(selectedItem.holdExpiry).toLocaleTimeString()} ET
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
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">Featured placement</div>
                    <div className="text-gray-600">Your tool prominently displayed in the daily lesson</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">Brand visibility</div>
                    <div className="text-gray-600">Company logo and branding throughout the lesson</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">Direct traffic</div>
                    <div className="text-gray-600">Clickable links driving users to your website</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">Performance analytics</div>
                    <div className="text-gray-600">Detailed metrics on impressions and click-through rates</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">Email mention</div>
                    <div className="text-gray-600">Featured in that day's email to 15,000+ subscribers</div>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold mb-4">Common Questions</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="font-medium text-gray-900 mb-1">How quickly will this go live?</div>
                  <div className="text-gray-600">Your sponsorship will appear on the selected date. We'll coordinate with you on messaging and creative assets.</div>
                </div>
                
                <div>
                  <div className="font-medium text-gray-900 mb-1">Can I change my selected date?</div>
                  <div className="text-gray-600">Yes, contact our team within 24 hours of purchase and we can help you reschedule if slots are available.</div>
                </div>
                
                <div>
                  <div className="font-medium text-gray-900 mb-1">What creative assets do I need?</div>
                  <div className="text-gray-600">We'll use your existing company logo and messaging. Our team will create the integration copy to match our editorial style.</div>
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-blue-900 text-sm">Need help choosing?</div>
                  <div className="text-sm text-blue-800 mt-1 mb-3">
                    Our team can recommend the best dates based on your tool category and audience.
                  </div>
                  <Link 
                    href="/partners/messages"
                    className="inline-flex items-center gap-1 text-blue-600 font-medium text-sm hover:text-blue-700 transition-colors"
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