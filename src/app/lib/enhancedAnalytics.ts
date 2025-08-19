// lib/enhancedAnalytics.ts - Enhanced analytics that works WITH your existing analytics.ts
import React from 'react'
import { supabase } from './supabaseClient'
import * as existingAnalytics from './analytics' // Your existing Google Analytics

// Types for analytics events
export interface AnalyticsEvent {
  event_type: string
  event_data?: Record<string, any>
  tidbit_number?: number
  session_id?: string
  user_agent?: string
  ip_address?: string
}

export interface VideoAnalytics {
  video_id: string
  action: 'play' | 'pause' | 'complete' | 'seek'
  timestamp: number
  duration?: number
  quality?: string
}

export interface StepAnalytics {
  step_id: string
  step_number: number
  tidbit_number: number
  time_spent?: number
  completion_method?: 'button' | 'auto'
}

export interface TutorAnalytics {
  conversation_id: string
  message_count: number
  session_duration: number
  topics_discussed: string[]
  satisfaction_rating?: number
}

// Enhanced Analytics tracker that integrates with your existing system
export class EnhancedAnalyticsTracker {
  private sessionId: string
  private userId?: string
  private userAgent: string

  constructor() {
    this.sessionId = this.generateSessionId()
    this.userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''
    this.initializeUser()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async initializeUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      this.userId = user?.id
    } catch (error) {
      console.error('Error getting user for analytics:', error)
    }
  }

  // Enhanced event tracking that ALSO sends to your existing Google Analytics
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // 1. Store in Supabase for detailed tracking
      const eventData = {
        ...event,
        user_id: this.userId,
        session_id: this.sessionId,
        user_agent: this.userAgent,
        created_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('user_analytics_events')
        .insert(eventData)

      if (error) {
        console.error('Supabase analytics tracking error:', error)
      }

      // 2. ALSO send to your existing Google Analytics system
      await this.sendToExistingAnalytics(event)

    } catch (error) {
      console.error('Failed to track analytics event:', error)
    }
  }

  // Bridge to your existing analytics system
  private async sendToExistingAnalytics(event: AnalyticsEvent): Promise<void> {
    try {
      // Convert our events to your existing analytics format
      switch (event.event_type) {
        case 'tidbit_viewed':
          if (typeof window !== 'undefined') {
            await existingAnalytics.trackPageView(
              `Day ${event.tidbit_number} Tidbit`,
              window.location.href,
              { tidbit_number: event.tidbit_number, ...event.event_data }
            )
          }
          break

        case 'step_completed':
          await existingAnalytics.logEvent('step_completed', {
            tidbit_number: event.tidbit_number,
            ...event.event_data
          })
          break

        case 'tidbit_completed':
          await existingAnalytics.logEvent('tidbit_completed', {
            tidbit_number: event.tidbit_number,
            ...event.event_data
          })
          break

        case 'ai_practiced':
          await existingAnalytics.logEvent('ai_tutor_used', {
            tidbit_number: event.tidbit_number,
            ...event.event_data
          })
          break

        case 'video_interaction':
          await existingAnalytics.logEvent('video_interaction', {
            video_action: event.event_data?.action,
            tidbit_number: event.tidbit_number,
            ...event.event_data
          })
          break

        case 'user_engagement':
          await existingAnalytics.logEvent('user_engagement', {
            engagement_type: event.event_data?.engagement_type,
            ...event.event_data
          })
          break

        default:
          // For any other events, send as generic custom event
          await existingAnalytics.logEvent(event.event_type, {
            tidbit_number: event.tidbit_number,
            ...event.event_data
          })
      }
    } catch (error) {
      // Don't fail if GA tracking fails
      console.warn('Google Analytics tracking failed:', error)
    }
  }

  // Specific tracking methods (these will send to BOTH systems)
  async trackTidbitViewed(tidbitNumber: number, referrer?: string): Promise<void> {
    await this.trackEvent({
      event_type: 'tidbit_viewed',
      tidbit_number: tidbitNumber,
      event_data: {
        referrer: referrer || (typeof document !== 'undefined' ? document.referrer : ''),
        timestamp: Date.now(),
        viewport: typeof window !== 'undefined' ? {
          width: window.innerWidth,
          height: window.innerHeight
        } : null
      }
    })
  }

  async trackTidbitCompleted(tidbitNumber: number, timeSpent: number, stepsCompleted: number): Promise<void> {
    await this.trackEvent({
      event_type: 'tidbit_completed',
      tidbit_number: tidbitNumber,
      event_data: {
        time_spent_seconds: timeSpent,
        steps_completed: stepsCompleted,
        completion_timestamp: Date.now()
      }
    })
  }

  async trackStepCompleted(analytics: StepAnalytics): Promise<void> {
    await this.trackEvent({
      event_type: 'step_completed',
      tidbit_number: analytics.tidbit_number,
      event_data: {
        step_id: analytics.step_id,
        step_number: analytics.step_number,
        time_spent_seconds: analytics.time_spent || 0,
        completion_method: analytics.completion_method || 'button'
      }
    })
  }

  async trackVideoInteraction(analytics: VideoAnalytics): Promise<void> {
    await this.trackEvent({
      event_type: 'video_interaction',
      event_data: {
        video_id: analytics.video_id,
        action: analytics.action,
        timestamp: analytics.timestamp,
        duration: analytics.duration,
        quality: analytics.quality,
        playback_rate: 1.0
      }
    })
  }

  async trackAIPracticed(tidbitNumber: number, analytics: TutorAnalytics): Promise<void> {
    await this.trackEvent({
      event_type: 'ai_practiced',
      tidbit_number: tidbitNumber,
      event_data: {
        conversation_id: analytics.conversation_id,
        message_count: analytics.message_count,
        session_duration_seconds: analytics.session_duration,
        topics_discussed: analytics.topics_discussed,
        satisfaction_rating: analytics.satisfaction_rating
      }
    })
  }

  async trackUserEngagement(engagementType: 'scroll' | 'click' | 'hover' | 'focus', target: string, duration?: number): Promise<void> {
    await this.trackEvent({
      event_type: 'user_engagement',
      event_data: {
        engagement_type: engagementType,
        target_element: target,
        duration_ms: duration,
        timestamp: Date.now()
      }
    })
  }

  async trackError(errorType: string, errorMessage: string, context?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      event_type: 'error_occurred',
      event_data: {
        error_type: errorType,
        error_message: errorMessage,
        context: context,
        stack_trace: context?.stack,
        user_agent: this.userAgent
      }
    })
  }

  async trackPerformance(metrics: {
    page_load_time?: number
    first_contentful_paint?: number
    largest_contentful_paint?: number
    cumulative_layout_shift?: number
    first_input_delay?: number
  }): Promise<void> {
    await this.trackEvent({
      event_type: 'performance_metrics',
      event_data: {
        ...metrics,
        timestamp: Date.now(),
        connection_type: (navigator as any)?.connection?.effectiveType || 'unknown'
      }
    })
  }

  // Batch tracking for efficiency
  private eventQueue: AnalyticsEvent[] = []
  private batchTimeout?: NodeJS.Timeout

  async trackEventBatched(event: AnalyticsEvent): Promise<void> {
    this.eventQueue.push(event)

    // Clear existing timeout
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
    }

    // Set new timeout to flush queue
    this.batchTimeout = setTimeout(() => {
      this.flushEventQueue()
    }, 5000) // Flush every 5 seconds

    // Flush immediately if queue is full
    if (this.eventQueue.length >= 10) {
      this.flushEventQueue()
    }
  }

  private async flushEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return

    try {
      const eventsToSend = this.eventQueue.map(event => ({
        ...event,
        user_id: this.userId,
        session_id: this.sessionId,
        user_agent: this.userAgent,
        created_at: new Date().toISOString()
      }))

      const { error } = await supabase
        .from('user_analytics_events')
        .insert(eventsToSend)

      if (error) {
        console.error('Batch analytics tracking error:', error)
      } else {
        this.eventQueue = [] // Clear queue on success
      }
    } catch (error) {
      console.error('Failed to flush analytics queue:', error)
    }

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = undefined
    }
  }

  // Clean up on page unload
  async cleanup(): Promise<void> {
    await this.flushEventQueue()
  }
}

// Performance monitoring utilities (simplified to work with your existing system)
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private analytics: EnhancedAnalyticsTracker
  private observer?: PerformanceObserver

  private constructor(analytics: EnhancedAnalyticsTracker) {
    this.analytics = analytics
    this.initializeObservers()
  }

  static getInstance(analytics: EnhancedAnalyticsTracker): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor(analytics)
    }
    return PerformanceMonitor.instance
  }

  private initializeObservers(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handlePerformanceEntry(entry)
        }
      })

      this.observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'layout-shift', 'first-input'] })
    } catch (error) {
      console.error('Failed to initialize performance observer:', error)
    }
  }

  private async handlePerformanceEntry(entry: PerformanceEntry): Promise<void> {
    const metrics: Record<string, number> = {}

    try {
      switch (entry.entryType) {
        case 'navigation':
          const navEntry = entry as any // Use any to avoid TypeScript strict typing issues
          const loadEnd = navEntry.loadEventEnd || 0
          const domLoaded = navEntry.domContentLoadedEventEnd || 0
          const responseStart = navEntry.responseStart || 0
          const navigationStart = navEntry.navigationStart || 0
          
          if (loadEnd && navigationStart) {
            metrics.page_load_time = loadEnd - navigationStart
          }
          if (domLoaded && navigationStart) {
            metrics.dom_content_loaded = domLoaded - navigationStart
          }
          if (responseStart && navigationStart) {
            metrics.first_byte = responseStart - navigationStart
          }
          break

        case 'paint':
          if (entry.name === 'first-contentful-paint') {
            metrics.first_contentful_paint = entry.startTime
          }
          break

        case 'largest-contentful-paint':
          metrics.largest_contentful_paint = entry.startTime
          break

        case 'layout-shift':
          const layoutEntry = entry as any
          if (!layoutEntry.hadRecentInput && typeof layoutEntry.value === 'number') {
            metrics.cumulative_layout_shift = layoutEntry.value
          }
          break

        case 'first-input':
          const inputEntry = entry as any
          if (typeof inputEntry.processingStart === 'number') {
            metrics.first_input_delay = inputEntry.processingStart - entry.startTime
          }
          break
      }

      if (Object.keys(metrics).length > 0) {
        await this.analytics.trackPerformance(metrics)
      }
    } catch (error) {
      console.warn('Performance entry processing failed:', error)
    }
  }

  cleanup(): void {
    if (this.observer) {
      this.observer.disconnect()
    }
  }
}

// Global enhanced analytics instance
export const enhancedAnalytics = new EnhancedAnalyticsTracker()

// Hook for React components
export function useEnhancedAnalytics() {
  return enhancedAnalytics
}

// React hooks for easy component integration
export function useEngagementTracking(elementRef: React.RefObject<HTMLElement>, eventType: string) {
  React.useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleInteraction = () => {
      enhancedAnalytics.trackUserEngagement(eventType as any, element.tagName)
    }

    element.addEventListener('click', handleInteraction)
    element.addEventListener('focus', handleInteraction)

    return () => {
      element.removeEventListener('click', handleInteraction)
      element.removeEventListener('focus', handleInteraction)
    }
  }, [elementRef, eventType])
}

export function usePageTracking(tidbitNumber?: number) {
  React.useEffect(() => {
    if (tidbitNumber) {
      enhancedAnalytics.trackTidbitViewed(tidbitNumber)
    }

    // Track page load performance
    if (typeof window !== 'undefined' && window.performance) {
      try {
        const navigationEntries = performance.getEntriesByType('navigation')
        if (navigationEntries.length > 0) {
          const navigationEntry = navigationEntries[0] as any // Use any to avoid TypeScript issues
          const loadEnd = navigationEntry.loadEventEnd || 0
          const navigationStart = navigationEntry.navigationStart || 0
          
          if (loadEnd && navigationStart) {
            enhancedAnalytics.trackPerformance({
              page_load_time: loadEnd - navigationStart
            })
          }
        }
      } catch (error) {
        console.warn('Performance tracking failed:', error)
      }
    }
  }, [tidbitNumber])
}

// Initialize performance monitoring when module loads
if (typeof window !== 'undefined') {
  const performanceMonitor = PerformanceMonitor.getInstance(enhancedAnalytics)

  // Export for global access
  ;(window as any).dailyTidbitEnhancedAnalytics = {
    enhancedAnalytics,
    performanceMonitor
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    performanceMonitor.cleanup()
    enhancedAnalytics.cleanup()
  })
}