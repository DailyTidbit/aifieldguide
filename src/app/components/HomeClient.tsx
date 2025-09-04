// app/components/HomeClient.tsx - Fixed runtime error in incognito mode
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import CTASection from './CTASection'
import { useMounted } from '../lib/clientUtils'
import { useAnalytics } from '../lib/analytics'

interface HomeClientProps {
  children: React.ReactNode
}

// Loading skeleton component
const HomeClientSkeleton = ({ children }: HomeClientProps) => (
  <>{children}</>
)

// Device type state management for hydration safety
type DeviceType = 'mobile' | 'tablet' | 'desktop'

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
  const mounted = useMounted()
  const analytics = useAnalytics()
  
  // State management for hydration safety
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop')
  const [interactions, setInteractions] = useState(0)
  
  // Refs for tracking (avoid state to prevent unnecessary re-renders)
  const pageStartTime = useRef<number>(0)
  const maxScrollDepth = useRef<number>(0)
  const scrollMilestones = useRef<Set<number>>(new Set())
  const cleanupFunctions = useRef<Array<() => void>>([])

  // Device type detection with hydration safety
  const updateDeviceType = useCallback(() => {
    if (typeof window === 'undefined') return
    
    const width = window.innerWidth
    let newDeviceType: DeviceType = 'desktop'
    
    if (width < 768) {
      newDeviceType = 'mobile'
    } else if (width < 1024) {
      newDeviceType = 'tablet'
    }
    
    setDeviceType(newDeviceType)
  }, [])

  // Initialize after mount - NO ANALYTICS DEPENDENCIES
  useEffect(() => {
    if (!mounted) return
    
    pageStartTime.current = Date.now()
    updateDeviceType()

    // Add resize listener for device type updates
    window.addEventListener('resize', updateDeviceType, { passive: true })
    cleanupFunctions.current.push(() => {
      window.removeEventListener('resize', updateDeviceType)
    })
  }, [mounted, updateDeviceType]) // Removed analytics dependencies

  // Track pageview and initial section view - SEPARATE EFFECT WITH SAFE CHECKS
  useEffect(() => {
    if (!mounted || !analytics.hasConsent) return
    
    // Double-check functions exist and are callable
    if (analytics.trackPageView && typeof analytics.trackPageView === 'function') {
      try {
        analytics.trackPageView('/')
      } catch (error) {
        console.warn('Page view tracking error:', error)
      }
    }
    
    // Track homepage hero section view with safety checks
    if (analytics.track && typeof analytics.track === 'function') {
      try {
        analytics.track('user_engagement', {
          engagement_type: 'section_view',
          section: 'homepage_hero',
          device_type: deviceType
        })
      } catch (error) {
        console.warn('Section view tracking error:', error)
      }
    }
  }, [mounted, analytics.hasConsent, analytics.trackPageView, analytics.track, deviceType])

  // Scroll depth tracking with memory management
  useEffect(() => {
    if (!mounted || !analytics.hasConsent || !analytics.track) return

    const milestones = [25, 50, 75, 90]
    let ticking = false

    const onScroll = () => {
      if (ticking) return
      ticking = true
      
      requestAnimationFrame(() => {
        try {
          const top = window.pageYOffset
          const docHeight = document.documentElement.scrollHeight - window.innerHeight
          
          if (docHeight <= 0) { 
            ticking = false
            return
          }
          
          const currentScrollPercent = Math.round((top / docHeight) * 100)
          
          // Update max scroll depth
          if (currentScrollPercent > maxScrollDepth.current) {
            maxScrollDepth.current = currentScrollPercent
          }
          
          // Check milestones
          for (const milestone of milestones) {
            if (currentScrollPercent >= milestone && !scrollMilestones.current.has(milestone)) {
              scrollMilestones.current.add(milestone)
              
              if (analytics.track && typeof analytics.track === 'function') {
                try {
                  analytics.track('user_engagement', {
                    engagement_type: 'scroll_depth',
                    scroll_depth_percent: milestone,
                    section_name: 'homepage',
                    device_type: deviceType
                  })
                } catch (error) {
                  console.warn('Scroll tracking error:', error)
                }
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
    cleanupFunctions.current.push(() => {
      window.removeEventListener('scroll', onScroll)
    })
  }, [mounted, analytics.hasConsent, analytics.track, deviceType])

  // Time on page tracking - log periodically if >= 1 minute
  useEffect(() => {
    if (!mounted || !analytics.hasConsent || pageStartTime.current === 0 || !analytics.track) return

    const trackTimeOnPage = () => {
      try {
        const currentTime = Date.now()
        const timeOnPage = currentTime - pageStartTime.current
        const minutes = Math.floor(timeOnPage / 60000)
        
        if (minutes >= 1 && analytics.track && typeof analytics.track === 'function') {
          analytics.track('user_engagement', {
            engagement_type: 'time_on_page',
            time_minutes: minutes,
            total_time_ms: timeOnPage,
            section_name: 'homepage',
            device_type: deviceType
          })
        }
      } catch (error) {
        console.warn('Time tracking error:', error)
      }
    }

    const interval = setInterval(trackTimeOnPage, 60000) // Every minute
    cleanupFunctions.current.push(() => clearInterval(interval))
  }, [mounted, analytics.hasConsent, analytics.track, deviceType])

  // Page engagement score tracking on visibility change
  useEffect(() => {
    if (!mounted || !analytics.hasConsent || pageStartTime.current === 0 || !analytics.track) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        try {
          const currentTime = Date.now()
          const timeOnPage = currentTime - pageStartTime.current
          const engagementScore = calculateEngagementScore(
            timeOnPage, 
            maxScrollDepth.current / 100, 
            interactions
          )
          
          // Track device-specific engagement with safety checks
          if (analytics.track && typeof analytics.track === 'function') {
            try {
              analytics.track('device_engagement', {
                device_type: deviceType,
                engagement_score: engagementScore,
                time_on_page_ms: timeOnPage,
                max_scroll_depth: maxScrollDepth.current,
                total_interactions: interactions,
                page: 'homepage'
              })

              // Track funnel progress based on engagement
              if (engagementScore >= 30) {
                analytics.track('conversion_funnel', {
                  funnel_step: 'interested',
                  engagement_score: engagementScore,
                  page: 'homepage',
                  engagement_type: 'high_engagement'
                })
              }
            } catch (error) {
              console.warn('Engagement tracking error:', error)
            }
          }
        } catch (error) {
          console.warn('Visibility tracking error:', error)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    cleanupFunctions.current.push(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    })
  }, [interactions, mounted, analytics.hasConsent, analytics.track, deviceType])

  // Track user interactions with throttling - NO ANALYTICS DEPENDENCIES
  useEffect(() => {
    if (!mounted) return

    let interactionCount = 0
    let lastUpdate = 0
    const THROTTLE_MS = 100 // Throttle to prevent excessive state updates

    const handleInteraction = () => {
      interactionCount++
      const now = Date.now()
      
      if (now - lastUpdate > THROTTLE_MS) {
        setInteractions(interactionCount)
        lastUpdate = now
      }
    }

    // Add event listeners for various interaction types
    const events = ['click', 'touchstart'] as const
    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { passive: true })
    })

    cleanupFunctions.current.push(() => {
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction)
      })
    })
  }, [mounted]) // Only depend on mounted, not analytics

  // Cleanup all event listeners on unmount
  useEffect(() => {
    return () => {
      cleanupFunctions.current.forEach(cleanup => {
        try {
          cleanup()
        } catch (error) {
          console.warn('Cleanup error:', error)
        }
      })
      cleanupFunctions.current = []
      
      // Reset tracking data
      scrollMilestones.current.clear()
      maxScrollDepth.current = 0
    }
  }, [])

  // Show skeleton during hydration
  if (!mounted) {
    return <HomeClientSkeleton>{children}</HomeClientSkeleton>
  }

  return (
    <>
      {/* Render the server-fetched content */}
      {children}
      
      {/* Client-side interactive sections */}
      <CTASection />
    </>
  )
}