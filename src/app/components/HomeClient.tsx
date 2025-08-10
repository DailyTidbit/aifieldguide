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
      
      {/* Footer - You can move your existing footer here or create a separate component */}
      <footer className="relative z-10 bg-gradient-to-br from-gray-200 via-gray-100 to-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
            {/* Left Side - Tagline, Copyright, Email */}
            <div className="space-y-4">
              <p className="text-lg sm:text-xl font-medium text-gray-800">
                Come for the tips. Stay for the community. ✨
              </p>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h5 className="text-sm font-bold text-gray-800">Get In Touch</h5>
                  <a 
                    href="mailto:mike@dailytidbit.org" 
                    className="text-sm sm:text-base transition-colors duration-200 hover:underline footer-link"
                  >
                    mike@dailytidbit.org
                  </a>
                </div>
                <p className="text-sm sm:text-base text-gray-700">
                  © {new Date().getFullYear()} Daily Tidbit. All rights reserved.
                </p>
              </div>
            </div>
            
            {/* Right Side - Legal Links */}
            <div className="text-left md:text-right">
              <div className="space-y-3">
                <div>
                  <a 
                    href="/privacy" 
                    className="text-sm sm:text-base transition-colors duration-200 hover:underline footer-link"
                  >
                    Privacy Policy
                  </a>
                </div>
                <div>
                  <a 
                    href="/accessibility" 
                    className="text-sm sm:text-base transition-colors duration-200 hover:underline footer-link"
                  >
                    Accessibility Statement
                  </a>
                </div>
                <div>
                  <a 
                    href="/terms" 
                    className="text-sm sm:text-base transition-colors duration-200 hover:underline footer-link"
                  >
                    Terms & Conditions
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}