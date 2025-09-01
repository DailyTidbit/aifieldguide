// lib/enhancedAnalytics.ts - HYDRATION SAFE VERSION WITH FIXED TYPES
import React from 'react'
import { getSupabaseBrowserClientSafe, getSupabaseBrowserClient } from './supabaseClient'
import * as existingAnalytics from './analytics'

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

// Enhanced Analytics tracker with proper TypeScript types
export class EnhancedAnalyticsTracker {
  private sessionId: string
  private userId?: string
  private userAgent: string
  private mounted: boolean = false
  private isInitialized: boolean = false
  private clientReady: boolean = false

  constructor() {
    this.sessionId = this.generateSessionId()
    this.userAgent = ''
    
    // Only initialize in browser after component mount
    if (typeof window !== 'undefined') {
      Promise.resolve().then(() => this.initialize())
    }
  }

  // ✅ HYDRATION SAFE: Get Supabase client safely
  private getClient() {
    if (!this.mounted || !this.clientReady) {
      return null
    }
    
    try {
      return getSupabaseBrowserClientSafe()
    } catch (error) {
      console.warn('Failed to get Supabase client for analytics:', error)
      return null
    }
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return
    
    try {
      if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
        this.userAgent = navigator.userAgent
      }
      
      // Check if Supabase client is available
      const checkClient = () => {
        try {
          const client = getSupabaseBrowserClient()
          this.clientReady = !!client
        } catch (error) {
          console.warn('Supabase client not ready for analytics:', error)
          this.clientReady = false
        }
      }
      
      checkClient()
      
      // Recheck periodically in case client becomes available later
      const interval = setInterval(() => {
        if (!this.clientReady) {
          checkClient()
        } else {
          clearInterval(interval)
        }
      }, 1000)
      
      // Clear interval after 30 seconds to avoid indefinite checking
      setTimeout(() => clearInterval(interval), 30000)
      
      await this.initializeUser()
      this.mounted = true
      this.isInitialized = true
    } catch (error) {
      console.error('Enhanced analytics initialization failed:', error)
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async initializeUser(): Promise<void> {
    if (typeof window === 'undefined' || !this.clientReady) return
    
    const supabase = this.getClient()
    if (!supabase) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      this.userId = user?.id
    } catch (error) {
      console.error('Error getting user for analytics:', error)
    }
  }

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.mounted || typeof window === 'undefined' || !this.clientReady) {
      return
    }

    const supabase = this.getClient()
    if (!supabase) {
      console.warn('Analytics tracking skipped - Supabase client not available')
      return
    }

    try {
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

      await this.sendToExistingAnalytics(event)

    } catch (error) {
      console.error('Failed to track analytics event:', error)
    }
  }

  private async sendToExistingAnalytics(event: AnalyticsEvent): Promise<void> {
    if (!this.mounted) return
    
    try {
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
          await existingAnalytics.logEvent(event.event_type, {
            tidbit_number: event.tidbit_number,
            ...event.event_data
          })
      }
    } catch (error) {
      console.warn('Google Analytics tracking failed:', error)
    }
  }

  async trackTidbitViewed(tidbitNumber: number, referrer?: string): Promise<void> {
    if (!this.mounted || !this.clientReady) return
    
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
    if (!this.mounted || !this.clientReady) return
    
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
    if (!this.mounted || !this.clientReady) return
    
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
    if (!this.mounted || !this.clientReady) return
    
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
    if (!this.mounted || !this.clientReady) return
    
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
    if (!this.mounted || !this.clientReady) return
    
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
    if (!this.mounted || !this.clientReady) return
    
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
    if (!this.mounted || !this.clientReady || typeof window === 'undefined') return
    
    await this.trackEvent({
      event_type: 'performance_metrics',
      event_data: {
        ...metrics,
        timestamp: Date.now(),
        connection_type: (navigator as any)?.connection?.effectiveType || 'unknown'
      }
    })
  }

  // Batch processing
  private eventQueue: AnalyticsEvent[] = []
  private batchTimeout?: NodeJS.Timeout

  async trackEventBatched(event: AnalyticsEvent): Promise<void> {
    if (!this.mounted || !this.clientReady) return
    
    this.eventQueue.push(event)

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
    }

    this.batchTimeout = setTimeout(() => {
      this.flushEventQueue()
    }, 5000)

    if (this.eventQueue.length >= 10) {
      this.flushEventQueue()
    }
  }

  private async flushEventQueue(): Promise<void> {
    if (!this.mounted || !this.clientReady || this.eventQueue.length === 0) return

    const supabase = this.getClient()
    if (!supabase) {
      console.warn('Cannot flush analytics queue - Supabase client not available')
      return
    }

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
        this.eventQueue = []
      }
    } catch (error) {
      console.error('Failed to flush analytics queue:', error)
    }

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = undefined
    }
  }

  async cleanup(): Promise<void> {
    await this.flushEventQueue()
  }

  isReady(): boolean {
    return this.mounted && this.isInitialized && this.clientReady
  }
}

// Performance Monitor class
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private analytics: EnhancedAnalyticsTracker
  private observer?: PerformanceObserver
  private mounted: boolean = false

  private constructor(analytics: EnhancedAnalyticsTracker) {
    this.analytics = analytics
    
    if (typeof window !== 'undefined') {
      setTimeout(() => this.initialize(), 100)
    }
  }

  static getInstance(analytics: EnhancedAnalyticsTracker): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor(analytics)
    }
    return PerformanceMonitor.instance
  }

  private initialize(): void {
    if (this.mounted || typeof window === 'undefined') return
    
    this.mounted = true
    this.initializeObservers()
  }

  private initializeObservers(): void {
    if (!this.mounted || typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return
    }

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handlePerformanceEntry(entry)
        }
      })

      this.observer.observe({ 
        entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'layout-shift', 'first-input'] 
      })
    } catch (error) {
      console.error('Failed to initialize performance observer:', error)
    }
  }

  private async handlePerformanceEntry(entry: PerformanceEntry): Promise<void> {
    if (!this.mounted || !this.analytics.isReady()) return

    const metrics: Record<string, number> = {}

    try {
      switch (entry.entryType) {
        case 'navigation':
          const navEntry = entry as any
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
    this.mounted = false
  }
}

// Create no-op interface that matches EnhancedAnalyticsTracker
interface NoOpAnalyticsTracker {
  trackEvent(event: AnalyticsEvent): Promise<void>
  trackTidbitViewed(tidbitNumber: number, referrer?: string): Promise<void>
  trackTidbitCompleted(tidbitNumber: number, timeSpent: number, stepsCompleted: number): Promise<void>
  trackStepCompleted(analytics: StepAnalytics): Promise<void>
  trackVideoInteraction(analytics: VideoAnalytics): Promise<void>
  trackAIPracticed(tidbitNumber: number, analytics: TutorAnalytics): Promise<void>
  trackUserEngagement(engagementType: 'scroll' | 'click' | 'hover' | 'focus', target: string, duration?: number): Promise<void>
  trackError(errorType: string, errorMessage: string, context?: Record<string, any>): Promise<void>
  trackPerformance(metrics: any): Promise<void>
  trackEventBatched(event: AnalyticsEvent): Promise<void>
  cleanup(): Promise<void>
  isReady(): boolean
}

// Server-side no-op implementation
const createNoOpTracker = (): NoOpAnalyticsTracker => ({
  trackEvent: async () => {},
  trackTidbitViewed: async () => {},
  trackTidbitCompleted: async () => {},
  trackStepCompleted: async () => {},
  trackVideoInteraction: async () => {},
  trackAIPracticed: async () => {},
  trackUserEngagement: async () => {},
  trackError: async () => {},
  trackPerformance: async () => {},
  trackEventBatched: async () => {},
  cleanup: async () => {},
  isReady: () => false
})

// Global enhanced analytics instance
let enhancedAnalyticsInstance: EnhancedAnalyticsTracker | null = null

export const enhancedAnalytics: EnhancedAnalyticsTracker | NoOpAnalyticsTracker = (() => {
  if (typeof window === 'undefined') {
    return createNoOpTracker()
  }

  if (!enhancedAnalyticsInstance) {
    enhancedAnalyticsInstance = new EnhancedAnalyticsTracker()
  }
  
  return enhancedAnalyticsInstance
})()

// React hooks
export function useEnhancedAnalytics(): EnhancedAnalyticsTracker | NoOpAnalyticsTracker {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return createNoOpTracker()
  }

  return enhancedAnalytics
}

export function useEngagementTracking(elementRef: React.RefObject<HTMLElement>, eventType: string) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!mounted) return
    
    const element = elementRef.current
    if (!element || !enhancedAnalytics.isReady()) return

    const handleInteraction = () => {
      enhancedAnalytics.trackUserEngagement(eventType as any, element.tagName)
    }

    element.addEventListener('click', handleInteraction)
    element.addEventListener('focus', handleInteraction)

    return () => {
      element.removeEventListener('click', handleInteraction)
      element.removeEventListener('focus', handleInteraction)
    }
  }, [elementRef, eventType, mounted])
}

export function usePageTracking(tidbitNumber?: number) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!mounted || !enhancedAnalytics.isReady()) return
    
    if (tidbitNumber) {
      enhancedAnalytics.trackTidbitViewed(tidbitNumber)
    }

    if (typeof window !== 'undefined' && window.performance) {
      try {
        const navigationEntries = performance.getEntriesByType('navigation')
        if (navigationEntries.length > 0) {
          const navigationEntry = navigationEntries[0] as any
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
  }, [tidbitNumber, mounted])
}

// Initialize performance monitoring when module loads
if (typeof window !== 'undefined') {
  const initializeWhenReady = () => {
    if (document.readyState === 'complete') {
      const performanceMonitor = PerformanceMonitor.getInstance(enhancedAnalytics as EnhancedAnalyticsTracker)
      
      ;(window as any).dailyTidbitEnhancedAnalytics = {
        enhancedAnalytics,
        performanceMonitor
      }

      window.addEventListener('beforeunload', () => {
        performanceMonitor.cleanup()
        enhancedAnalytics.cleanup()
      })
    } else {
      setTimeout(initializeWhenReady, 100)
    }
  }

  initializeWhenReady()
}