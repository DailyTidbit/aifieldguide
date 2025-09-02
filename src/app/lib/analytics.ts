// app/lib/analytics.ts - CONSOLIDATED ANALYTICS SYSTEM
'use client'

import { useState, useEffect } from 'react'
import { getSupabaseBrowserClient } from './supabaseClient'
import { safeWindow, useIsMounted, getCurrentYear } from './clientUtils'

// =============================================================================
// Configuration
// =============================================================================

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || ''

export const CONSENT_KEYS = {
  CONSENT: 'dt_cookie_consent',
  TIMESTAMP: 'dt_cookie_consent_ts',
  EXPIRY_DAYS: 180
}

declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

// =============================================================================
// Core Analytics Types
// =============================================================================

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

// =============================================================================
// Core Google Analytics Functions
// =============================================================================

const gtag = (...args: any[]) => {
  if (typeof window === 'undefined' || !GA_TRACKING_ID) return
  safeWindow.gtag(...args)
}

export const pageview = (url: string) => {
  if (typeof window === 'undefined' || !GA_TRACKING_ID) return
  gtag("config", GA_TRACKING_ID, { page_path: url })
}

export const logEvent = (name: string, params: Record<string, any> = {}) => {
  if (typeof window === 'undefined' || !GA_TRACKING_ID) return
  gtag("event", name, params)
}

// =============================================================================
// Enhanced Analytics Tracker
// =============================================================================

class AnalyticsTracker {
  private sessionId: string
  private userId?: string
  private userAgent: string
  private mounted: boolean = false
  private isInitialized: boolean = false
  private clientReady: boolean = false
  private eventQueue: AnalyticsEvent[] = []
  private batchTimeout?: NodeJS.Timeout

  constructor() {
    this.sessionId = 'pending'
    this.userAgent = ''
    
    if (typeof window !== 'undefined') {
      Promise.resolve().then(() => this.initialize())
    }
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return
    
    try {
      this.sessionId = this.generateSessionId()
      
      if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
        this.userAgent = safeWindow.navigator.userAgent()
      }
      
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
      
      const interval = setInterval(() => {
        if (!this.clientReady) {
          checkClient()
        } else {
          clearInterval(interval)
        }
      }, 1000)
      
      setTimeout(() => clearInterval(interval), 30000)
      
      await this.initializeUser()
      this.mounted = true
      this.isInitialized = true
    } catch (error) {
      console.error('Analytics initialization failed:', error)
    }
  }

  private generateSessionId(): string {
    if (typeof window === 'undefined') {
      return 'ssr_placeholder'
    }
    
    const timestamp = getCurrentYear() * 1000000 + Math.floor((new Date().getMonth() + 1) * 100000) + new Date().getDate() * 1000
    const randomPart = Math.random().toString(36).substr(2, 9)
    return `session_${timestamp}_${randomPart}`
  }

  private async initializeUser(): Promise<void> {
    if (typeof window === 'undefined' || !this.clientReady) return
    
    const client = getSupabaseBrowserClient()
    if (!client) return
    
    try {
      const { data: { user } } = await client.auth.getUser()
      this.userId = user?.id
    } catch (error) {
      console.error('Error getting user for analytics:', error)
    }
  }

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.mounted || typeof window === 'undefined' || !this.clientReady) {
      return
    }

    const client = getSupabaseBrowserClient()
    if (!client) {
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

      const { error } = await client
        .from('user_analytics_events')
        .insert(eventData)

      if (error) {
        console.error('Supabase analytics tracking error:', error)
      }

      await this.sendToGoogleAnalytics(event)

    } catch (error) {
      console.error('Failed to track analytics event:', error)
    }
  }

  private async sendToGoogleAnalytics(event: AnalyticsEvent): Promise<void> {
    if (!this.mounted) return
    
    try {
      switch (event.event_type) {
        case 'tidbit_viewed':
          if (typeof window !== 'undefined') {
            pageview(window.location.href)
            logEvent('tidbit_viewed', {
              tidbit_number: event.tidbit_number,
              ...event.event_data
            })
          }
          break

        case 'step_completed':
          logEvent('step_completed', {
            tidbit_number: event.tidbit_number,
            ...event.event_data
          })
          break

        case 'tidbit_completed':
          logEvent('tidbit_completed', {
            tidbit_number: event.tidbit_number,
            ...event.event_data
          })
          break

        case 'ai_practiced':
          logEvent('ai_tutor_used', {
            tidbit_number: event.tidbit_number,
            ...event.event_data
          })
          break

        case 'video_interaction':
          logEvent('video_interaction', {
            video_action: event.event_data?.action,
            tidbit_number: event.tidbit_number,
            ...event.event_data
          })
          break

        case 'user_engagement':
          logEvent('user_engagement', {
            engagement_type: event.event_data?.engagement_type,
            ...event.event_data
          })
          break

        case 'field_guide_section_view':
          logEvent('field_guide_section_view', event.event_data)
          break

        case 'field_guide_section_click':
          logEvent('field_guide_section_click', event.event_data)
          break

        case 'tool_interaction':
          logEvent('tool_interaction', event.event_data)
          break

        case 'field_guide_search':
          logEvent('field_guide_search', event.event_data)
          break

        default:
          logEvent(event.event_type, {
            tidbit_number: event.tidbit_number,
            ...event.event_data
          })
      }
    } catch (error) {
      console.warn('Google Analytics tracking failed:', error)
    }
  }

  // High-level tracking methods
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
        quality: analytics.quality
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

  // Field Guide specific tracking
  async trackSectionView(sectionName: string, slug: string, toolsCount: number): Promise<void> {
    await this.trackEvent({
      event_type: 'field_guide_section_view',
      event_data: {
        section_name: sectionName,
        section_slug: slug,
        tools_count: toolsCount
      }
    })
  }

  async trackSectionClick(sectionName: string, slug: string, toolCount: number): Promise<void> {
    await this.trackEvent({
      event_type: 'field_guide_section_click',
      event_data: {
        section_name: sectionName,
        section_slug: slug,
        tool_count: toolCount
      }
    })
  }

  async trackToolInteraction(
    tool: { id: string; name: string; free_tier: boolean; login_required: boolean },
    action: 'modal' | 'website',
    sectionName: string
  ): Promise<void> {
    await this.trackEvent({
      event_type: 'tool_interaction',
      event_data: {
        tool_name: tool.name,
        tool_id: tool.id,
        action,
        section_name: sectionName,
        has_free_tier: tool.free_tier,
        requires_login: tool.login_required
      }
    })
  }

  async trackSearch(searchTerm: string, resultsCount: number, context: 'sections' | 'tools'): Promise<void> {
    await this.trackEvent({
      event_type: 'field_guide_search',
      event_data: {
        search_term: searchTerm,
        results_count: resultsCount,
        search_context: context
      }
    })
  }

  // Batch processing
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

    const client = getSupabaseBrowserClient()
    if (!client) {
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

      const { error } = await client
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

// =============================================================================
// Consent Management
// =============================================================================

export const getStoredConsent = (): { consent: string | null; isExpired: boolean } => {
  const consent = safeWindow.localStorage.getItem(CONSENT_KEYS.CONSENT)
  const timestamp = safeWindow.localStorage.getItem(CONSENT_KEYS.TIMESTAMP)
  
  if (!consent || !timestamp) {
    return { consent: null, isExpired: true }
  }
  
  const now = typeof window !== 'undefined' ? Date.now() : getCurrentYear() * 365.25 * 24 * 60 * 60 * 1000
  const consentAge = now - parseInt(timestamp)
  const maxAge = CONSENT_KEYS.EXPIRY_DAYS * 24 * 60 * 60 * 1000
  const isExpired = consentAge > maxAge
  
  return { consent: isExpired ? null : consent, isExpired }
}

export const storeConsent = (accepted: boolean): void => {
  const consentValue = accepted ? 'accepted' : 'declined'
  safeWindow.localStorage.setItem(CONSENT_KEYS.CONSENT, consentValue)
  const timestamp = typeof window !== 'undefined' ? Date.now().toString() : '0'
  safeWindow.localStorage.setItem(CONSENT_KEYS.TIMESTAMP, timestamp)
}

// =============================================================================
// Analytics Initialization
// =============================================================================

let analyticsInitialized = false

export const initializeAnalytics = () => {
  if (typeof window === 'undefined' || analyticsInitialized || !GA_TRACKING_ID) return
  
  try {
    gtag('js', new Date())
    gtag('config', GA_TRACKING_ID, {
      page_title: document.title,
      page_location: window.location.href
    })
    
    analyticsInitialized = true
  } catch (error) {
    console.warn('Failed to initialize Google Analytics:', error)
  }
}

// Auto-initialize when document is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    setTimeout(initializeAnalytics, 100)
  } else {
    window.addEventListener('load', () => {
      setTimeout(initializeAnalytics, 100)
    })
  }
}

// =============================================================================
// Global Analytics Instance
// =============================================================================

let analyticsTrackerInstance: AnalyticsTracker | null = null

export const analytics = (() => {
  if (typeof window === 'undefined') {
    // Server-side no-op
    return {
      trackEvent: async () => {},
      trackTidbitViewed: async () => {},
      trackTidbitCompleted: async () => {},
      trackStepCompleted: async () => {},
      trackVideoInteraction: async () => {},
      trackAIPracticed: async () => {},
      trackSectionView: async () => {},
      trackSectionClick: async () => {},
      trackToolInteraction: async () => {},
      trackSearch: async () => {},
      trackEventBatched: async () => {},
      cleanup: async () => {},
      isReady: () => false
    }
  }

  if (!analyticsTrackerInstance) {
    analyticsTrackerInstance = new AnalyticsTracker()
  }
  
  return analyticsTrackerInstance
})()

// =============================================================================
// React Hooks
// =============================================================================

export function useAnalytics() {
  const isMounted = useIsMounted()

  return {
    mounted: isMounted,
    analytics: isMounted ? analytics : null,
    trackEvent: isMounted ? analytics.trackEvent.bind(analytics) : async () => {},
    trackPageView: isMounted ? pageview : () => {},
    logEvent: isMounted ? logEvent : () => {},
  }
}

export function useConsentManagement() {
  const isMounted = useIsMounted()
  const [consent, setConsent] = useState<{ consent: string | null; isExpired: boolean }>({
    consent: null,
    isExpired: true
  })

  useEffect(() => {
    if (!isMounted) return
    setConsent(getStoredConsent())
  }, [isMounted])

  const updateConsent = (accepted: boolean) => {
    if (!isMounted) return
    
    storeConsent(accepted)
    setConsent({
      consent: accepted ? 'accepted' : 'declined',
      isExpired: false
    })
  }

  return {
    mounted: isMounted,
    consent: isMounted ? consent.consent : null,
    isExpired: isMounted ? consent.isExpired : true,
    storeConsent: updateConsent,
    needsConsent: isMounted ? consent.consent === null || consent.isExpired : true
  }
}

// =============================================================================
// Legacy Exports (for backward compatibility)
// =============================================================================

// Field Guide specific functions
export const trackSectionView = analytics.trackSectionView.bind(analytics)
export const trackSectionClick = analytics.trackSectionClick.bind(analytics)
export const trackToolInteraction = analytics.trackToolInteraction.bind(analytics)
export const trackSearch = analytics.trackSearch.bind(analytics)

// Utility to check if analytics is ready
export const isAnalyticsInitialized = (): boolean => {
  return typeof window !== 'undefined' && analyticsInitialized && (typeof window?.gtag === 'function' || Array.isArray(window?.dataLayer))
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    analytics.cleanup()
  })
}