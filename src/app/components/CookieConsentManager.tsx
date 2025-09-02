// src/components/CookieConsentManager.tsx - Hydration-safe
'use client'

import { useState, useEffect } from 'react'
import CookieConsent from './CookieConsent'
import GoogleAnalytics from './GoogleAnalytics'
import { useConsentManagement } from '../lib/analytics'

export default function CookieConsentManager() {
  const [mounted, setMounted] = useState(false)
  
  // Use the analytics consent management hook
  const { consent, needsConsent, mounted: consentMounted } = useConsentManagement()

  // Hydration safety
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleConsentChange = () => {
    // The CookieConsent component handles the actual consent logic
    // This callback is just for any additional cleanup if needed
  }

  // Don't render anything until both this component and consent management are mounted
  if (!mounted || !consentMounted) return null

  const hasConsent = consent === 'accepted'
  const showBanner = needsConsent

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