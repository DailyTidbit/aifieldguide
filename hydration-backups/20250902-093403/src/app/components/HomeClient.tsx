// app/components/HomeClient.tsx - COMPLETE HYDRATION SAFE FIX
'use client'

import { useEffect, useRef, useState } from 'react'
import CTASection from './CTASection'
import { 
  pageview,
  trackSectionView, 
  trackUserEngagement, 
  trackDeviceEngagement,
  trackConversionFunnel,
  getDeviceType,
  calculateEngagementScore,
} from '../lib/gtag'

interface HomeClientProps {
  children: React.ReactNode
}

// ✅ HYDRATION SAFE: Loading skeleton component
const HomeClientSkeleton = ({ children }: HomeClientProps) => (
  <>{children}</>
)

// Client Component wrapper for homepage analytics and interactive elements
export default function HomeClient({ children }: HomeClientProps) {
  // ✅ HYDRATION SAFETY: Component-level mounted state
  const [mounted, setMounted] = useState(false)
  
  const pageStartTime = useRef<number>(0) // Will be set after mount
  const scrollDepthTracked = useRef<Set<number>>(new Set())
  const [interactions, setInteractions] = useState(0)

  // ✅ HYDRATION SAFETY: Wait for mount before any browser-dependent operations
  useEffect(() => {
    setMounted(true)
    pageStartTime.current = Date.now() // Set start time after mount
  }, [])

  // ✅ HYDRATION SAFE: Track pageview on mount - only after mounted
  useEffect(() => {
    if (!mounted) return
    
    // Guard against missing analytics functions
    try {
      pageview('/')
      trackSectionView('homepage_hero')
    } catch (error) {
      console.warn('Analytics tracking failed:', error)
    }
  }, [mounted])

  // ✅ HYDRATION SAFE: Scroll depth tracking - only after mounted
  useEffect(() => {
    if (!mounted) return

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
                trackUserEngagement('scroll_depth', m, {
                  section_name: 'homepage',
                  device_type: getDeviceType(),
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
  }, [mounted])

  // ✅ HYDRATION SAFE: Time on page tracking - only log if >= 1 minute and only after mounted
  useEffect(() => {
    if (!mounted || pageStartTime.current === 0) return

    const trackTimeOnPage = () => {
      try {
        const timeOnPage = Date.now() - pageStartTime.current
        const minutes = Math.floor(timeOnPage / 60000)
        
        if (minutes >= 1) {
          trackUserEngagement('time_on_page', minutes, {
            total_time_ms: timeOnPage,
            section_name: 'homepage',
            device_type: getDeviceType()
          })
        }
      } catch (error) {
        console.warn('Time tracking error:', error)
      }
    }

    const interval = setInterval(trackTimeOnPage, 60000) // Every minute
    return () => clearInterval(interval)
  }, [mounted])

  // ✅ HYDRATION SAFE: Page engagement score tracking on visibility change - only after mounted
  useEffect(() => {
    if (!mounted || pageStartTime.current === 0) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        try {
          const timeOnPage = Date.now() - pageStartTime.current
          const maxScrollDepth = Math.max(...Array.from(scrollDepthTracked.current), 0)
          const engagementScore = calculateEngagementScore(timeOnPage, maxScrollDepth / 100, interactions)
          
          trackDeviceEngagement(getDeviceType(), engagementScore, {
            time_on_page_ms: timeOnPage,
            max_scroll_depth: maxScrollDepth,
            total_interactions: interactions,
            page: 'homepage'
          })

          // Track funnel progress based on engagement
          if (engagementScore >= 30) {
            trackConversionFunnel('interested', engagementScore, {
              page: 'homepage',
              engagement_type: 'high_engagement'
            })
          }
        } catch (error) {
          console.warn('Visibility tracking error:', error)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [interactions, mounted])

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