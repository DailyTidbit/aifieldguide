// src/lib/gtag.ts - FULLY HYDRATION SAFE VERSION
import { safeWindow } from './clientUtils'

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || ''

// Unified consent keys (180-day expiry)
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

// ✅ HYDRATION SAFE: Use consistent browser checking from clientUtils
const isBrowser = () => typeof window !== 'undefined'

// ✅ HYDRATION SAFE: Core gtag function using safeWindow
const gtag = (...args: any[]) => {
  // Don't run if no tracking ID or not in browser
  if (!isBrowser() || !GA_TRACKING_ID) return
  
  // Use safeWindow.gtag instead of direct window access
  safeWindow.gtag(...args)
}

// ✅ HYDRATION SAFE: Manual pageview tracking
export const pageview = (url: string) => {
  if (!isBrowser() || !GA_TRACKING_ID) return
  gtag("config", GA_TRACKING_ID, { page_path: url })
}

// ✅ HYDRATION SAFE: Universal event logger
export const logEvent = (name: string, params: Record<string, any> = {}) => {
  if (!isBrowser() || !GA_TRACKING_ID) return
  gtag("event", name, params)
}

/* ---- Daily Tidbit Event Helpers (All Hydration Safe) ---- */
export const trackCTAClick = (label: string, location: string, target: string) => {
  if (!isBrowser()) return
  logEvent("cta_click", { label, location, target })
}

export const trackSectionView = (section_name: string) => {
  if (!isBrowser()) return
  logEvent("section_view", { section_name })
}

export const trackUserEngagement = (metric: "scroll_depth" | "time_on_page", value: number, extra: Record<string, any> = {}) => {
  if (!isBrowser()) return
  logEvent(metric, { value, ...extra })
}

export const trackImageInteraction = (image_id: string, action: "click" | "hover", extra: Record<string, any> = {}) => {
  if (!isBrowser()) return
  logEvent("image_interaction", { image_id, action, ...extra })
}

export const trackStepInteraction = (step: "watch" | "try" | "share", step_number: number, action: "click" | "view") => {
  if (!isBrowser()) return
  logEvent("step_interaction", { step, step_number, action })
}

export const trackReadingBehavior = (type: "reader" | "skimmer" | "scanner", time_spent_s: number, scroll_depth_pct: number) => {
  if (!isBrowser()) return
  logEvent("reading_behavior", { type, time_spent_s, scroll_depth_pct })
}

export const trackDeviceEngagement = (device_type: string, engagement_score: number, extra: Record<string, any> = {}) => {
  if (!isBrowser()) return
  logEvent("device_engagement", { device_type, engagement_score, ...extra })
}

export const trackConversionFunnel = (stage: "interested" | "engaged", score: number, extra: Record<string, any> = {}) => {
  if (!isBrowser()) return
  logEvent("funnel_progress", { stage, score, ...extra })
}

// ✅ HYDRATION SAFE: Value prop and carousel tracking
export const trackValuePropInteraction = (
  cardTitle: string,
  interactionType: 'view' | 'click' | 'auto_advance',
  cardIndex: number
) => {
  if (!isBrowser()) return
  logEvent('value_prop_interaction', {
    card_title: cardTitle,
    interaction_type: interactionType,
    card_index: cardIndex,
  })
}

export const trackCarouselInteraction = (
  carouselType: 'value_prop' | 'ai_explanation' | 'use_cases',
  action: 'next' | 'prev' | 'dot_click' | 'auto_advance',
  currentSlide: number
) => {
  if (!isBrowser()) return
  logEvent('carousel_interaction', {
    carousel_type: carouselType,
    action,
    slide_index: currentSlide,
  })
}

// ✅ HYDRATION SAFE: Utility functions with proper guards
export const getDeviceType = (): string => {
  if (!isBrowser()) return "unknown"
  
  const w = window.innerWidth
  if (w < 640) return "mobile"
  if (w < 1024) return "tablet"
  return "desktop"
}

export const calculateEngagementScore = (time_ms: number, scroll_ratio: number, interactions: number): number => {
  const t = Math.min(time_ms / 60000, 3) // cap at 3 minutes
  const s = Math.min(scroll_ratio, 1)
  const i = Math.min(interactions, 10) / 10
  // weighted score 0–100
  return Math.round((t * 0.45 + s * 0.4 + i * 0.15) * 100)
}

// ✅ HYDRATION SAFE: Consent management using safeWindow.localStorage
export const getStoredConsent = (): { consent: string | null; isExpired: boolean } => {
  // Use safeWindow.localStorage instead of direct access
  const consent = safeWindow.localStorage.getItem(CONSENT_KEYS.CONSENT)
  const timestamp = safeWindow.localStorage.getItem(CONSENT_KEYS.TIMESTAMP)
  
  if (!consent || !timestamp) {
    return { consent: null, isExpired: true }
  }
  
  const consentAge = Date.now() - parseInt(timestamp)
  const maxAge = CONSENT_KEYS.EXPIRY_DAYS * 24 * 60 * 60 * 1000 // 180 days in ms
  const isExpired = consentAge > maxAge
  
  return { consent: isExpired ? null : consent, isExpired }
}

export const storeConsent = (accepted: boolean): void => {
  const consentValue = accepted ? 'accepted' : 'declined'
  // Use safeWindow.localStorage instead of direct access
  safeWindow.localStorage.setItem(CONSENT_KEYS.CONSENT, consentValue)
  safeWindow.localStorage.setItem(CONSENT_KEYS.TIMESTAMP, Date.now().toString())
}

// ✅ HYDRATION SAFE: React Hook for analytics usage
import { useState, useEffect } from 'react'
import { useIsMounted } from './clientUtils'

export function useGoogleAnalytics() {
  const isMounted = useIsMounted()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!isMounted) return
    
    // ✅ FIXED: Check if Google Analytics is loaded with optional chaining
    const checkGAReady = () => {
      if (isBrowser() && (typeof window?.gtag === 'function' || Array.isArray(window?.dataLayer))) {
        setIsReady(true)
      } else {
        // Check again in 100ms
        setTimeout(checkGAReady, 100)
      }
    }
    
    checkGAReady()
  }, [isMounted])

  return {
    mounted: isMounted,
    isReady: isMounted && isReady,
    trackEvent: isMounted ? logEvent : () => {},
    trackPageView: isMounted ? pageview : () => {},
    trackCTAClick: isMounted ? trackCTAClick : () => {},
    trackSectionView: isMounted ? trackSectionView : () => {},
    trackUserEngagement: isMounted ? trackUserEngagement : () => {},
    getDeviceType: isMounted ? getDeviceType : () => 'unknown',
    calculateEngagementScore: isMounted ? calculateEngagementScore : () => 0
  }
}

// ✅ HYDRATION SAFE: Consent management hook
export function useConsentManagement() {
  const isMounted = useIsMounted()
  const [consent, setConsent] = useState<{ consent: string | null; isExpired: boolean }>({
    consent: null,
    isExpired: true
  })

  useEffect(() => {
    if (!isMounted) return
    
    // Only check consent after mounting
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

// ✅ HYDRATION SAFE: Initialize analytics when ready
let analyticsInitialized = false

export const initializeAnalytics = () => {
  if (!isBrowser() || analyticsInitialized || !GA_TRACKING_ID) return
  
  try {
    // Initialize Google Analytics using safeWindow
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

// ✅ Auto-initialize when document is ready (browser only)
if (isBrowser()) {
  if (document.readyState === 'complete') {
    // Wait a bit for other scripts to load
    setTimeout(initializeAnalytics, 100)
  } else {
    window.addEventListener('load', () => {
      setTimeout(initializeAnalytics, 100)
    })
  }
}

// ✅ FIXED: Utility to check if analytics is initialized with optional chaining
export const isAnalyticsInitialized = (): boolean => {
  return isBrowser() && analyticsInitialized && (typeof window?.gtag === 'function' || Array.isArray(window?.dataLayer))
}