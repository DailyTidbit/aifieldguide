// app/components/HomeClient.tsx - UPDATED WITH ANALYTICS SYSTEM
'use client'

import { useEffect, useRef, useState } from 'react'
import CTASection from './CTASection'
import { 
  analytics,
  pageview,
  logEvent,
  useAnalytics
} from '../lib/analytics'

interface HomeClientProps {
  children: React.ReactNode
}

// ✅ HYDRATION SAFE: Loading skeleton component
const HomeClientSkeleton = ({ children }: HomeClientProps) => (
  <>{children}</>
)

// ✅ HYDRATION SAFE: Generate stable timestamp after mount
const getStableStartTime = (): number => {
  if (typeof window === 'undefined') return 0
  return Date.now()
}

// Helper function to detect device type
const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop'
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

// Helper function to calculate engagement score
const calculateEngagementScore = (
  timeOnPageMs: number, 
  scrollDepthPercent: number, 
  interactions: number
): number => {
  const timeScore = Math.min(timeOnPageMs / 60000, 10) * 3 // Max 30 points for 10+ minutes
  const scrollScore = scrollDepthPercent * 40 // Max 40 points for 100% scroll
  const interactionScore = Math.min(interactions, 10) * 3 // Max 30 points for 10+ interactions
  
  return Math.round(timeScore + scrollScore + interactionScore)
}

// Client Component wrapper for homepage analytics and interactive elements
export default function HomeClient({ children }: HomeClientProps) {
  // ✅ HYDRATION SAFETY: Component-level mounted state
  const [mounted, setMounted] = useState(false)
  const { analytics: analyticsInstance, trackPageView } = useAnalytics()
  
  const pageStartTime = useRef<number>(0) // Will be set after mount
  const scrollDepthTracked = useRef<Set<number>>(new Set())
  const [interactions, setInteractions] = useState(0)

  // ✅ HYDRATION SAFETY: Wait for mount before any browser-dependent operations
  useEffect(() => {
    setMounted(true)
    pageStartTime.current = getStableStartTime() // Set start time after mount
  }, [])

  // ✅ HYDRATION SAFE: Track pageview on mount - only after mounted
  useEffect(() => {
    if (!mounted || !analyticsInstance) return
    
    // Guard against missing analytics functions
    try {
      trackPageView('/')
      
      // Track homepage hero section view
      analyticsInstance.trackEvent({
        event_type: 'user_engagement',
        event_data: {
          engagement_type: 'section_view',
          section: 'homepage_hero',
          device_type: getDeviceType()
        }
      })
    } catch (error) {
      console.warn('Analytics tracking failed:', error)
    }
  }, [mounted, analyticsInstance, trackPageView])

  // ✅ HYDRATION SAFE: Scroll depth tracking - only after mounted
  useEffect(() => {
    if (!mounted || !analyticsInstance) return

    const milestones = [25, 50, 75, 90]
    const fired = scrollDepthTracked.current
    let ticking = false

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        try {
          const top = window.pageYOffset
          const doc = document.documentElement.scrollHeight - window.innerHeight
          if (doc <= 0) { 
            ticking = false
            return
          }
          const pct = Math.round((top / doc) * 100)
          
          for (const m of milestones) {
            if (pct >= m && !fired.has(m)) {
              fired.add(m)
              try {
                analyticsInstance.trackEvent({
                  event_type: 'user_engagement',
                  event_data: {
                    engagement_type: 'scroll_depth',
                    scroll_depth_percent: m,
                    section_name: 'homepage',
                    device_type: getDeviceType()
                  }
                })
              } catch (error) {
                console.warn('Analytics tracking failed:', error)
              }
            }
          }
        } catch (error) {
          console.warn('Scroll tracking error:', error)
        }
        ticking = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [mounted, analyticsInstance])

  // ✅ HYDRATION SAFE: Time on page tracking - only log if >= 1 minute and only after mounted
  useEffect(() => {
    if (!mounted || !analyticsInstance || pageStartTime.current === 0) return

    const trackTimeOnPage = () => {
      try {
        // ✅ FIXED: Use stable time calculation
        const currentTime = Date.now()
        const timeOnPage = currentTime - pageStartTime.current
        const minutes = Math.floor(timeOnPage / 60000)
        
        if (minutes >= 1) {
          analyticsInstance.trackEvent({
            event_type: 'user_engagement',
            event_data: {
              engagement_type: 'time_on_page',
              time_minutes: minutes,
              total_time_ms: timeOnPage,
              section_name: 'homepage',
              device_type: getDeviceType()
            }
          })
        }
      } catch (error) {
        console.warn('Time tracking error:', error)
      }
    }

    const interval = setInterval(trackTimeOnPage, 60000) // Every minute
    return () => clearInterval(interval)
  }, [mounted, analyticsInstance])

  // ✅ HYDRATION SAFE: Page engagement score tracking on visibility change - only after mounted
  useEffect(() => {
    if (!mounted || !analyticsInstance || pageStartTime.current === 0) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        try {
          // ✅ FIXED: Use stable time calculation
          const currentTime = Date.now()
          const timeOnPage = currentTime - pageStartTime.current
          const maxScrollDepth = Math.max(...Array.from(scrollDepthTracked.current), 0)
          const engagementScore = calculateEngagementScore(timeOnPage, maxScrollDepth / 100, interactions)
          
          // Track device-specific engagement
          analyticsInstance.trackEvent({
            event_type: 'device_engagement',
            event_data: {
              device_type: getDeviceType(),
              engagement_score: engagementScore,
              time_on_page_ms: timeOnPage,
              max_scroll_depth: maxScrollDepth,
              total_interactions: interactions,
              page: 'homepage'
            }
          })

          // Track funnel progress based on engagement
          if (engagementScore >= 30) {
            analyticsInstance.trackEvent({
              event_type: 'conversion_funnel',
              event_data: {
                funnel_step: 'interested',
                engagement_score: engagementScore,
                page: 'homepage',
                engagement_type: 'high_engagement'
              }
            })
          }
        } catch (error) {
          console.warn('Visibility tracking error:', error)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [interactions, mounted, analyticsInstance])

  // Track user interactions (clicks, hovers, etc.)
  useEffect(() => {
    if (!mounted) return

    const handleInteraction = () => {
      setInteractions(prev => prev + 1)
    }

    // Add event listeners for various interaction types
    document.addEventListener('click', handleInteraction, { passive: true })
    document.addEventListener('touchstart', handleInteraction, { passive: true })
    
    return () => {
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('touchstart', handleInteraction)
    }
  }, [mounted])

  // ✅ HYDRATION SAFETY: Show skeleton during SSR
  if (!mounted) {
    return <HomeClientSkeleton>{children}</HomeClientSkeleton>
  }

  return (
    <>
      {/* Render the server-fetched content */}
      {children}
      
      {/* Client-side interactive sections - only after mounted */}
      <CTASection />
    </>
  )
}