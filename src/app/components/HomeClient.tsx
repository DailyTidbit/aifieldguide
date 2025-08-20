// app/components/HomeClient.tsx
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

// Client Component wrapper for homepage analytics and interactive elements
export default function HomeClient({ children }: HomeClientProps) {
  const pageStartTime = useRef<number>(Date.now())
  const scrollDepthTracked = useRef<Set<number>>(new Set())
  const [interactions, setInteractions] = useState(0)

  // Track pageview on mount
  useEffect(() => {
    pageview('/')
    trackSectionView('homepage_hero')
  }, [])

  // Scroll depth tracking
  useEffect(() => {
    const milestones = [25, 50, 75, 90]
    const fired = scrollDepthTracked.current
    let ticking = false

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
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
            trackUserEngagement('scroll_depth', m, {
              section_name: 'homepage',
              device_type: getDeviceType(),
            })
          }
        }
        ticking = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Time on page tracking - only log if >= 1 minute
  useEffect(() => {
    const trackTimeOnPage = () => {
      const timeOnPage = Date.now() - pageStartTime.current
      const minutes = Math.floor(timeOnPage / 60000)
      
      if (minutes >= 1) {
        trackUserEngagement('time_on_page', minutes, {
          total_time_ms: timeOnPage,
          section_name: 'homepage',
          device_type: getDeviceType()
        })
      }
    }

    const interval = setInterval(trackTimeOnPage, 60000) // Every minute
    return () => clearInterval(interval)
  }, [])

  // Page engagement score tracking on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
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
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [interactions])

  return (
    <>
      {/* Render the server-fetched content */}
      {children}
      
      {/* Client-side interactive sections */}
      <CTASection />
    </>
  )
}