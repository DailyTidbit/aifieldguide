// lib/analytics.ts - Simple analytics tracking functions (works with existing gtag.ts)
'use client'

import { GA_TRACKING_ID, gtag as gtagFromLib } from './gtag'

// Use the gtag function from gtag.ts instead of declaring our own
export const gtag = gtagFromLib

export const pageview = (url: string) => {
  if (!GA_TRACKING_ID) return
  gtag('config', GA_TRACKING_ID, { page_path: url })
}

export const logEvent = (name: string, params: Record<string, any> = {}) => {
  if (!GA_TRACKING_ID) return
  
  // Sanitize parameters to prevent injection
  const sanitizedParams = Object.keys(params).reduce((acc, key) => {
    const value = params[key]
    // Only allow safe data types
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      acc[key] = value
    }
    return acc
  }, {} as Record<string, any>)
  
  gtag('event', name, sanitizedParams)
}

// High-level tracking functions for your specific needs
export const trackTidbitViewed = (tidbitNumber: number, referrer?: string) => {
  logEvent('tidbit_viewed', {
    tidbit_number: tidbitNumber,
    referrer: referrer || (typeof document !== 'undefined' ? document.referrer : ''),
    timestamp: Date.now()
  })
}

export const trackTidbitCompleted = (tidbitNumber: number, timeSpent: number, stepsCompleted: number) => {
  logEvent('tidbit_completed', {
    tidbit_number: tidbitNumber,
    time_spent_seconds: Math.round(timeSpent),
    steps_completed: stepsCompleted
  })
}

export const trackStepCompleted = (tidbitNumber: number, stepNumber: number, timeSpent?: number) => {
  logEvent('step_completed', {
    tidbit_number: tidbitNumber,
    step_number: stepNumber,
    time_spent_seconds: timeSpent ? Math.round(timeSpent) : 0
  })
}

export const trackVideoInteraction = (videoId: string, action: string, tidbitNumber?: number) => {
  const params: Record<string, any> = {
    video_id: videoId,
    action: action,
    timestamp: Date.now()
  }
  
  if (tidbitNumber !== undefined) {
    params.tidbit_number = tidbitNumber
  }
  
  logEvent('video_interaction', params)
}

export const trackAIPracticed = (tidbitNumber: number, messageCount: number, sessionDuration: number) => {
  logEvent('ai_tutor_used', {
    tidbit_number: tidbitNumber,
    message_count: messageCount,
    session_duration_seconds: Math.round(sessionDuration)
  })
}

export const trackUserEngagement = (engagementType: string, target?: string, tidbitNumber?: number) => {
  const params: Record<string, any> = {
    engagement_type: engagementType
  }
  
  if (target) params.target = target
  if (tidbitNumber !== undefined) params.tidbit_number = tidbitNumber
  
  logEvent('user_engagement', params)
}

// Field Guide tracking
export const trackSectionView = (sectionName: string, slug: string, toolsCount: number) => {
  logEvent('field_guide_section_view', {
    section_name: sectionName,
    section_slug: slug,
    tools_count: toolsCount
  })
}

export const trackSectionClick = (sectionName: string, slug: string, toolCount: number) => {
  logEvent('field_guide_section_click', {
    section_name: sectionName,
    section_slug: slug,
    tool_count: toolCount
  })
}

export const trackToolInteraction = (
  toolName: string,
  toolId: string,
  action: 'modal' | 'website',
  sectionName: string
) => {
  logEvent('tool_interaction', {
    tool_name: toolName,
    tool_id: toolId,
    action: action,
    section_name: sectionName
  })
}

export const trackSearch = (searchTerm: string, resultsCount: number, context: 'sections' | 'tools') => {
  logEvent('field_guide_search', {
    search_term: searchTerm,
    results_count: resultsCount,
    search_context: context
  })
}

// Export GA_TRACKING_ID for compatibility
export { GA_TRACKING_ID }

// React hook for easy analytics access
import { useConsent } from './consent'

export function useAnalytics() {
  const { mounted, consent } = useConsent()
  const hasConsent = consent === 'accepted'
  
  const track = (eventName: string, params?: Record<string, any>) => {
    if (!mounted || !hasConsent) return
    logEvent(eventName, params)
  }
  
  const trackPageView = (path: string) => {
    if (!mounted || !hasConsent) return
    pageview(path)
  }
  
  // Create consent-aware tracking functions that always exist
  const createTracker = <T extends (...args: any[]) => void>(fn: T): T => {
    const wrappedFunction = (...args: Parameters<T>) => {
      if (mounted && hasConsent) {
        try {
          return fn(...args)
        } catch (error) {
          console.warn('Analytics tracking error:', error)
        }
      }
    }
    return wrappedFunction as T
  }
  
  // Ensure all functions are always defined, even if they don&apos;t do anything
  return {
    mounted,
    hasConsent,
    track,
    trackPageView,
    // Specific tracking functions - always defined but only work if consent given
    trackTidbitViewed: createTracker(trackTidbitViewed),
    trackTidbitCompleted: createTracker(trackTidbitCompleted),
    trackStepCompleted: createTracker(trackStepCompleted),
    trackVideoInteraction: createTracker(trackVideoInteraction),
    trackAIPracticed: createTracker(trackAIPracticed),
    trackUserEngagement: createTracker(trackUserEngagement),
    trackSectionView: createTracker(trackSectionView),
    trackSectionClick: createTracker(trackSectionClick),
    trackToolInteraction: createTracker(trackToolInteraction),
    trackSearch: createTracker(trackSearch),
  }
}