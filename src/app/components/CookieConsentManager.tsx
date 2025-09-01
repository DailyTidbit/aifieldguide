// src/components/CookieConsentManager.tsx - Hydration-safe
'use client'

import { useState, useEffect } from 'react'
import CookieConsent from './CookieConsent'
import GoogleAnalytics from './GoogleAnalytics'
import { getStoredConsent } from '../lib/gtag'

export default function CookieConsentManager() {
  const [hasConsent, setHasConsent] = useState(false)
  const [consentLoaded, setConsentLoaded] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Hydration safety
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Only access localStorage after mounted
    if (!mounted) return

    // Check existing consent on mount using unified keys
    const { consent, isExpired } = getStoredConsent()
    
    if (consent && !isExpired) {
      setHasConsent(consent === 'accepted')
      setShowBanner(false)
    } else {
      // No consent or expired - show banner
      setHasConsent(false)
      setShowBanner(true)
    }
    
    setConsentLoaded(true)
  }, [mounted])

  const handleConsentChange = (consented: boolean) => {
    setHasConsent(consented)
    setShowBanner(false)
  }

  // Don't render anything until mounted and consent checked
  if (!mounted || !consentLoaded) return null

  return (
    <>
      {/* Google Analytics - only loads if consent given */}
      <GoogleAnalytics hasConsent={hasConsent} />
      
      {/* Cookie Consent Banner - only show if needed */}
      {showBanner && (
        <CookieConsent onConsentChange={handleConsentChange} />
      )}
    </>
  )
}