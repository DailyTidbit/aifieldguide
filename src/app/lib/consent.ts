// lib/consent.ts - FIXED VERSION
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMounted } from './clientUtils'

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
    console.warn('Error reading consent (localStorage blocked?):', error)
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

export function storeConsent(consent: ConsentState): void {
  if (typeof window === 'undefined' || !consent) return
  
  try {
    localStorage.setItem(CONSENT_KEY, consent)
    localStorage.setItem(CONSENT_TIMESTAMP_KEY, Date.now().toString())
    
    // Update gtag if available (check for gtag from gtag.ts)
    if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
      try {
        (window as any).gtag('consent', 'update', {
          analytics_storage: consent === 'accepted' ? 'granted' : 'denied'
        })
      } catch (gtagError) {
        console.warn('Failed to update gtag consent:', gtagError)
      }
    }
  } catch (error) {
    console.warn('Error storing consent (localStorage blocked?):', error)
  }
}

export function clearConsent(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(CONSENT_KEY)
    localStorage.removeItem(CONSENT_TIMESTAMP_KEY)
    
    // Update gtag to deny consent if available
    if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
      try {
        (window as any).gtag('consent', 'update', {
          analytics_storage: 'denied'
        })
      } catch (gtagError) {
        console.warn('Failed to update gtag consent:', gtagError)
      }
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

  // FIXED: Critical bug fix - banner should show when consent is null OR expired
  // But NOT when user has made a recent decision (accepted or declined)
  const needsConsent = mounted ? (consent === null || isExpired) : false
  
  return {
    mounted,
    consent: mounted ? consent : null,
    isExpired: mounted ? isExpired : true,
    needsConsent, // Fixed logic: only show banner if no decision made or expired
    hasConsent: mounted ? consent === 'accepted' : false,
    setConsent,
    clearConsent: clearStoredConsent
  }
}