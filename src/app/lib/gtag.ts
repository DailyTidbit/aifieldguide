// src/lib/gtag.ts - HYDRATION SAFE VERSION
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

// ✅ HYDRATION SAFE: Enhanced browser checking
const isBrowser = () => typeof window !== 'undefined'
const isGtagAvailable = () => isBrowser() && typeof window.gtag === 'function'
const isDataLayerAvailable = () => isBrowser() && Array.isArray(window.dataLayer)

// ✅ HYDRATION SAFE: Core gtag function with proper guards
const gtag = (...args: any[]) => {
  // ✅ Guard against server-side execution
  if (!isBrowser()) return
  
  // Don't run if no tracking ID
  if (!GA_TRACKING_ID) return
  
  // Initialize dataLayer if it doesn't exist
  if (!window.dataLayer) {
    window.dataLayer = []
  }
  
  // If gtag function exists, use it. Otherwise push to dataLayer directly
  if (isGtagAvailable()) {
    window.gtag(...args)
  } else if (isDataLayerAvailable()) {
    window.dataLayer.push(args)
  }
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

// ✅ HYDRATION SAFE: Consent management with browser checks
export const getStoredConsent = (): { consent: string | null; isExpired: boolean } => {
  // ✅ Guard against server-side execution
  if (!isBrowser()) {
    return { consent: null, isExpired: true }
  }
  
  try {
    const consent = localStorage.getItem(CONSENT_KEYS.CONSENT)
    const timestamp = localStorage.getItem(CONSENT_KEYS.TIMESTAMP)
    
    if (!consent || !timestamp) {
      return { consent: null, isExpired: true }
    }
    
    const consentAge = Date.now() - parseInt(timestamp)
    const maxAge = CONSENT_KEYS.EXPIRY_DAYS * 24 * 60 * 60 * 1000 // 180 days in ms
    const isExpired = consentAge > maxAge
    
    return { consent: isExpired ? null : consent, isExpired }
  } catch (error) {
    // localStorage might not be available
    console.warn('Error accessing localStorage for consent:', error)
    return { consent: null, isExpired: true }
  }
}

export const storeConsent = (accepted: boolean): void => {
  // ✅ Guard against server-side execution
  if (!isBrowser()) return
  
  try {
    const consentValue = accepted ? 'accepted' : 'declined'
    localStorage.setItem(CONSENT_KEYS.CONSENT, consentValue)
    localStorage.setItem(CONSENT_KEYS.TIMESTAMP, Date.now().toString())
  } catch (error) {
    // localStorage might not be available (private browsing, etc.)
    console.warn('Error storing consent in localStorage:', error)
  }
}

// ✅ HYDRATION SAFE: React Hook for analytics usage
import { useState, useEffect } from 'react'

export function useGoogleAnalytics() {
  const [mounted, setMounted] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Check if Google Analytics is loaded
    const checkGAReady = () => {
      if (isGtagAvailable() || isDataLayerAvailable()) {
        setIsReady(true)
      } else {
        // Check again in 100ms
        setTimeout(checkGAReady, 100)
      }
    }
    
    checkGAReady()
  }, [])

  return {
    mounted,
    isReady,
    trackEvent: mounted ? logEvent : () => {},
    trackPageView: mounted ? pageview : () => {},
    trackCTAClick: mounted ? trackCTAClick : () => {},
    trackSectionView: mounted ? trackSectionView : () => {},
    trackUserEngagement: mounted ? trackUserEngagement : () => {},
    getDeviceType: mounted ? getDeviceType : () => 'unknown',
    calculateEngagementScore: mounted ? calculateEngagementScore : () => 0
  }
}

// ✅ HYDRATION SAFE: Consent management hook
export function useConsentManagement() {
  const [mounted, setMounted] = useState(false)
  const [consent, setConsent] = useState<{ consent: string | null; isExpired: boolean }>({
    consent: null,
    isExpired: true
  })

  useEffect(() => {
    setMounted(true)
    
    // Only check consent after mounting
    if (isBrowser()) {
      setConsent(getStoredConsent())
    }
  }, [])

  const updateConsent = (accepted: boolean) => {
    if (!mounted) return
    
    storeConsent(accepted)
    setConsent({
      consent: accepted ? 'accepted' : 'declined',
      isExpired: false
    })
  }

  return {
    mounted,
    consent: mounted ? consent.consent : null,
    isExpired: mounted ? consent.isExpired : true,
    storeConsent: updateConsent,
    needsConsent: mounted ? consent.consent === null || consent.isExpired : true
  }
}

// ✅ HYDRATION SAFE: Initialize analytics when ready
let analyticsInitialized = false

export const initializeAnalytics = () => {
  if (!isBrowser() || analyticsInitialized || !GA_TRACKING_ID) return
  
  try {
    // Initialize Google Analytics
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

// ✅ Utility to check if analytics is initialized
export const isAnalyticsInitialized = (): boolean => {
  return isBrowser() && analyticsInitialized && (isGtagAvailable() || isDataLayerAvailable())
}