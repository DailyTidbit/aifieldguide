// lib/consent.ts - Simple, reliable consent management (compatible with gtag.ts)
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMounted } from './clientUtils'
import { isGoogleAnalyticsLoaded } from './gtag'

const CONSENT_KEY = 'dt_cookie_consent'
const CONSENT_TIMESTAMP_KEY = 'dt_cookie_consent_ts'
const EXPIRY_DAYS = 180

export type ConsentState = 'accepted' | 'declined' | null

// Enhanced consent retrieval with better error handling
export function getStoredConsent(): { consent: ConsentState; isExpired: boolean } {
  if (typeof window === 'undefined') {
    return { consent: null, isExpired: true }
  }

  try {
    const consent = localStorage.getItem(CONSENT_KEY) as ConsentState
    const timestamp = localStorage.getItem(CONSENT_TIMESTAMP_KEY)
    
    if (!consent || !timestamp) {
      return { consent: null, isExpired: true }
    }
    
    // Validate timestamp is a valid number
    const parsedTimestamp = parseInt(timestamp, 10)
    if (isNaN(parsedTimestamp)) {
      return { consent: null, isExpired: true }
    }
    
    const age = Date.now() - parsedTimestamp
    const maxAge = EXPIRY_DAYS * 24 * 60 * 60 * 1000
    const isExpired = age > maxAge
    
    // Validate consent value
    if (consent !== 'accepted' && consent !== 'declined') {
      return { consent: null, isExpired: true }
    }
    
    return { consent: isExpired ? null : consent, isExpired }
  } catch (error) {
    console.warn('Error reading consent:', error)
    // Clean up corrupted data
    try {
      localStorage.removeItem(CONSENT_KEY)
      localStorage.removeItem(CONSENT_TIMESTAMP_KEY)
    } catch {
      // Silent fail if can't clean up
    }
    return { consent: null, isExpired: true }
  }
}

// Queued consent updates to handle gtag loading delays
let consentUpdateQueue: ConsentState[] = []
let gtagCheckInterval: NodeJS.Timeout | null = null

const processConsentQueue = () => {
  // Use the gtag checker from gtag.ts
  if (isGoogleAnalyticsLoaded() && consentUpdateQueue.length > 0) {
    const latestConsent = consentUpdateQueue[consentUpdateQueue.length - 1]
    consentUpdateQueue = []
    
    try {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('consent', 'update', {
          analytics_storage: latestConsent === 'accepted' ? 'granted' : 'denied'
        })
      }
    } catch (error) {
      console.warn('Failed to update gtag consent:', error)
    }
    
    // Clear interval once processed
    if (gtagCheckInterval) {
      clearInterval(gtagCheckInterval)
      gtagCheckInterval = null
    }
  }
}

export function storeConsent(consent: ConsentState): void {
  if (typeof window === 'undefined' || !consent) return
  
  try {
    localStorage.setItem(CONSENT_KEY, consent)
    localStorage.setItem(CONSENT_TIMESTAMP_KEY, Date.now().toString())
    
    // Queue consent update for when gtag is available
    consentUpdateQueue.push(consent)
    
    if (isGoogleAnalyticsLoaded()) {
      // gtag is available now, process immediately
      processConsentQueue()
    } else {
      // gtag not available yet, check periodically
      if (!gtagCheckInterval) {
        gtagCheckInterval = setInterval(processConsentQueue, 100)
        
        // Stop checking after 10 seconds to prevent infinite intervals
        setTimeout(() => {
          if (gtagCheckInterval) {
            clearInterval(gtagCheckInterval)
            gtagCheckInterval = null
            consentUpdateQueue = [] // Clear queue if gtag never loads
          }
        }, 10000)
      }
    }
  } catch (error) {
    console.warn('Error storing consent:', error)
  }
}

export function clearConsent(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(CONSENT_KEY)
    localStorage.removeItem(CONSENT_TIMESTAMP_KEY)
    
    // Update gtag to deny consent if available
    if (isGoogleAnalyticsLoaded() && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied'
      })
    }
  } catch (error) {
    console.warn('Error clearing consent:', error)
  }
}

export function useConsent() {
  const mounted = useMounted()
  const [consent, setConsentState] = useState<ConsentState>(null)
  const [isExpired, setIsExpired] = useState(true)

  // Load initial consent state
  useEffect(() => {
    if (!mounted) return
    
    const { consent: storedConsent, isExpired: expired } = getStoredConsent()
    setConsentState(storedConsent)
    setIsExpired(expired)
  }, [mounted])

  // Memoized consent setter to prevent unnecessary re-renders
  const setConsent = useCallback((newConsent: ConsentState) => {
    if (!mounted) return
    
    storeConsent(newConsent)
    setConsentState(newConsent)
    setIsExpired(false)
  }, [mounted])

  // Memoized clear function
  const clearStoredConsent = useCallback(() => {
    if (!mounted) return
    
    clearConsent()
    setConsentState(null)
    setIsExpired(true)
  }, [mounted])

  return {
    mounted,
    consent: mounted ? consent : null,
    isExpired: mounted ? isExpired : true,
    needsConsent: mounted ? (!consent || isExpired) : false,
    hasConsent: mounted ? consent === 'accepted' : false,
    setConsent,
    clearConsent: clearStoredConsent
  }
}