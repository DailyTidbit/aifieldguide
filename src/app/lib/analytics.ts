// lib/analytics.ts - OPTIMIZED VERSION with rate limiting and better error handling
'use client'

import { GA_TRACKING_ID, gtag as gtagFromLib } from './gtag'
import { useConsent } from './consent'

// Use the gtag function from gtag.ts instead of declaring our own
export const gtag = gtagFromLib

// Rate limiting for analytics events
const eventThrottleMap = new Map<string, number>()
const HIGH_FREQUENCY_EVENTS = ['scroll', 'mousemove', 'resize', 'video_interaction']
const THROTTLE_DELAY = 1000 // 1 second for high frequency events
const GENERAL_THROTTLE_DELAY = 100 // 100ms for general events

// Enhanced event logging with rate limiting and sanitization
export const logEvent = (name: string, params: Record<string, any> = {}) => {
  if (!GA_TRACKING_ID) return
  
  try {
    // Create throttle key from event name and critical params
    const criticalParams = ['tidbit_number', 'section_name', 'tool_id']
    const throttleParams = Object.keys(params)
      .filter(key => criticalParams.includes(key))
      .reduce((acc, key) => ({ ...acc, [key]: params[key] }), {})
    
    const throttleKey = `${name}_${JSON.stringify(throttleParams)}`
    const lastFired = eventThrottleMap.get(throttleKey)
    const now = Date.now()
    
    // Apply throttling based on event type
    const isHighFrequency = HIGH_FREQUENCY_EVENTS.some(event => name.includes(event))
    const throttleDelay = isHighFrequency ? THROTTLE_DELAY : GENERAL_THROTTLE_DELAY
    
    if (lastFired && (now - lastFired) < throttleDelay) {
      return // Skip if same event fired too recently
    }
    
    eventThrottleMap.set(throttleKey, now)
    
    // Clean up old throttle entries to prevent memory leaks
    if (eventThrottleMap.size > 1000) {
      const cutoff = now - (60 * 1000) // Remove entries older than 1 minute
      for (const [key, timestamp] of eventThrottleMap.entries()) {
        if (timestamp < cutoff) {
          eventThrottleMap.delete(key)
        }
      }
    }
    
    // Sanitize parameters to prevent injection and validate types
    const sanitizedParams = Object.keys(params).reduce((acc, key) => {
      const value = params[key]
      // Only allow safe data types and reasonable string lengths
      if (typeof value === 'string' && value.length <= 500) {
        acc[key] = value
      } else if (typeof value === 'number' && isFinite(value)) {
        acc[key] = value
      } else if (typeof value === 'boolean') {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, any>)
    
    // Add timestamp for debugging
    sanitizedParams.client_timestamp = now
    
    gtag('event', name, sanitizedParams)
  } catch (error) {
    console.warn('Analytics event failed:', error)
  }
}

// Enhanced page view tracking
export const pageview = (url: string) => {
  if (!GA_TRACKING_ID) return
  
  try {
    // Sanitize URL
    const sanitizedUrl = url.replace(/[<>'"&]/g, '').substring(0, 1000)
    gtag('config', GA_TRACKING_ID, { page_path: sanitizedUrl })
  } catch (error) {
    console.warn('Page view tracking failed:', error)
  }
}

// Enhanced tracking functions with better error handling
export const trackTidbitViewed = (tidbitNumber: number, referrer?: string) => {
  if (!Number.isInteger(tidbitNumber) || tidbitNumber < 1) return
  
  logEvent('tidbit_viewed', {
    tidbit_number: tidbitNumber,
    referrer: referrer || (typeof document !== 'undefined' ? document.referrer : ''),
    timestamp: Date.now(),
    page_url: typeof window !== 'undefined' ? window.location.href : ''
  })
}

export const trackTidbitCompleted = (tidbitNumber: number, timeSpent: number, stepsCompleted: number) => {
  if (!Number.isInteger(tidbitNumber) || tidbitNumber < 1) return
  if (!Number.isFinite(timeSpent) || timeSpent < 0) return
  if (!Number.isInteger(stepsCompleted) || stepsCompleted < 0) return
  
  logEvent('tidbit_completed', {
    tidbit_number: tidbitNumber,
    time_spent_seconds: Math.round(timeSpent),
    steps_completed: stepsCompleted,
    completion_rate: stepsCompleted > 0 ? Math.min(100, Math.round((stepsCompleted / 5) * 100)) : 0
  })
}

export const trackStepCompleted = (tidbitNumber: number, stepNumber: number, timeSpent?: number) => {
  if (!Number.isInteger(tidbitNumber) || tidbitNumber < 1) return
  if (!Number.isInteger(stepNumber) || stepNumber < 1) return
  
  const params: Record<string, any> = {
    tidbit_number: tidbitNumber,
    step_number: stepNumber
  }
  
  if (typeof timeSpent === 'number' && timeSpent >= 0) {
    params.time_spent_seconds = Math.round(timeSpent)
  }
  
  logEvent('step_completed', params)
}

export const trackVideoInteraction = (videoId: string, action: string, tidbitNumber?: number) => {
  if (!videoId || typeof videoId !== 'string') return
  if (!action || typeof action !== 'string') return
  
  const params: Record<string, any> = {
    video_id: videoId.substring(0, 100), // Limit length
    action: action.substring(0, 50),
    timestamp: Date.now()
  }
  
  if (typeof tidbitNumber === 'number' && tidbitNumber >= 1) {
    params.tidbit_number = tidbitNumber
  }
  
  logEvent('video_interaction', params)
}

export const trackAIPracticed = (tidbitNumber: number, messageCount: number, sessionDuration: number, provider?: string) => {
  if (!Number.isInteger(tidbitNumber) || tidbitNumber < 1) return
  if (!Number.isInteger(messageCount) || messageCount < 0) return
  if (!Number.isFinite(sessionDuration) || sessionDuration < 0) return
  
  const params: Record<string, any> = {
    tidbit_number: tidbitNumber,
    message_count: messageCount,
    session_duration_seconds: Math.round(sessionDuration)
  }
  
  if (provider && typeof provider === 'string') {
    params.ai_provider = provider.substring(0, 50)
  }
  
  logEvent('ai_tutor_used', params)
}

export const trackUserEngagement = (engagementType: string, target?: string, tidbitNumber?: number, additionalData?: Record<string, any>) => {
  if (!engagementType || typeof engagementType !== 'string') return
  
  const params: Record<string, any> = {
    engagement_type: engagementType.substring(0, 50)
  }
  
  if (target && typeof target === 'string') {
    params.target = target.substring(0, 100)
  }
  
  if (typeof tidbitNumber === 'number' && tidbitNumber >= 1) {
    params.tidbit_number = tidbitNumber
  }
  
  // Merge additional data safely
  if (additionalData && typeof additionalData === 'object') {
    Object.keys(additionalData).forEach(key => {
      const value = additionalData[key]
      if (typeof value === 'string' && value.length <= 200) {
        params[key] = value
      } else if (typeof value === 'number' && isFinite(value)) {
        params[key] = value
      } else if (typeof value === 'boolean') {
        params[key] = value
      }
    })
  }
  
  logEvent('user_engagement', params)
}

// Enhanced Field Guide tracking
export const trackSectionView = (sectionName: string, slug: string, toolsCount: number) => {
  if (!sectionName || !slug) return
  if (!Number.isInteger(toolsCount) || toolsCount < 0) return
  
  logEvent('field_guide_section_view', {
    section_name: sectionName.substring(0, 100),
    section_slug: slug.substring(0, 100),
    tools_count: toolsCount,
    page_url: typeof window !== 'undefined' ? window.location.href : ''
  })
}

export const trackSectionClick = (sectionName: string, slug: string, toolCount: number) => {
  if (!sectionName || !slug) return
  if (!Number.isInteger(toolCount) || toolCount < 0) return
  
  logEvent('field_guide_section_click', {
    section_name: sectionName.substring(0, 100),
    section_slug: slug.substring(0, 100),
    tool_count: toolCount
  })
}

export const trackToolInteraction = (
  toolName: string,
  toolId: string,
  action: 'modal' | 'website',
  sectionName: string
) => {
  if (!toolName || !toolId || !action || !sectionName) return
  
  logEvent('tool_interaction', {
    tool_name: toolName.substring(0, 100),
    tool_id: toolId.substring(0, 100),
    action: action,
    section_name: sectionName.substring(0, 100)
  })
}

export const trackSearch = (searchTerm: string, resultsCount: number, context: 'sections' | 'tools') => {
  if (!searchTerm || typeof searchTerm !== 'string') return
  if (!Number.isInteger(resultsCount) || resultsCount < 0) return
  if (!context || (context !== 'sections' && context !== 'tools')) return
  
  logEvent('field_guide_search', {
    search_term: searchTerm.substring(0, 100),
    results_count: resultsCount,
    search_context: context
  })
}

// Error tracking
export const trackError = (errorType: string, errorMessage: string, context?: string) => {
  if (!errorType || !errorMessage) return
  
  logEvent('application_error', {
    error_type: errorType.substring(0, 50),
    error_message: errorMessage.substring(0, 200),
    context: context ? context.substring(0, 100) : '',
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 200) : '',
    url: typeof window !== 'undefined' ? window.location.href : ''
  })
}

// Performance tracking
export const trackPerformance = (metricName: string, value: number, context?: string) => {
  if (!metricName || typeof metricName !== 'string') return
  if (!Number.isFinite(value)) return
  
  logEvent('performance_metric', {
    metric_name: metricName.substring(0, 50),
    metric_value: Math.round(value),
    context: context ? context.substring(0, 100) : ''
  })
}

// Export GA_TRACKING_ID for compatibility
export { GA_TRACKING_ID }

// Enhanced React hook for analytics with better error boundaries
export function useAnalytics() {
  const { mounted, consent, needsConsent } = useConsent()
  const hasConsent = mounted && consent === 'accepted' && !needsConsent
  
  // Create error-safe tracking wrapper
  const createSafeTracker = <T extends (...args: any[]) => void>(fn: T): T => {
    const wrappedFunction = (...args: Parameters<T>) => {
      if (!mounted) return
      if (!hasConsent) return
      
      try {
        return fn(...args)
      } catch (error) {
        console.warn('Analytics tracking error:', error)
        trackError('analytics_function', error instanceof Error ? error.message : 'Unknown error', fn.name)
      }
    }
    return wrappedFunction as T
  }
  
  const track = (eventName: string, params?: Record<string, any>) => {
    if (!mounted || !hasConsent) return
    logEvent(eventName, params)
  }
  
  const trackPageView = (path: string) => {
    if (!mounted || !hasConsent) return
    pageview(path)
  }
  
  return {
    mounted,
    hasConsent,
    needsConsent,
    track,
    trackPageView,
    // Safe tracking functions
    trackTidbitViewed: createSafeTracker(trackTidbitViewed),
    trackTidbitCompleted: createSafeTracker(trackTidbitCompleted),
    trackStepCompleted: createSafeTracker(trackStepCompleted),
    trackVideoInteraction: createSafeTracker(trackVideoInteraction),
    trackAIPracticed: createSafeTracker(trackAIPracticed),
    trackUserEngagement: createSafeTracker(trackUserEngagement),
    trackSectionView: createSafeTracker(trackSectionView),
    trackSectionClick: createSafeTracker(trackSectionClick),
    trackToolInteraction: createSafeTracker(trackToolInteraction),
    trackSearch: createSafeTracker(trackSearch),
    trackError: createSafeTracker(trackError),
    trackPerformance: createSafeTracker(trackPerformance)
  }
}