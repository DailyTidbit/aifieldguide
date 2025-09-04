// components/CookieConsentManager.tsx - Compatibility wrapper
'use client'

import { useMounted } from '../lib/clientUtils'
import CookieConsent from './CookieConsent'
import GoogleAnalytics from './GoogleAnalytics'
import { useConsent } from '../lib/consent'

// Keep the same interface for backward compatibility
interface CookieConsentManagerProps {
  onConsentChange?: (consented: boolean) => void
}

function CookieConsentManagerSkeleton() {
  return null
}

export default function CookieConsentManager({ onConsentChange }: CookieConsentManagerProps = {}) {
  const mounted = useMounted()
  const { consent, needsConsent } = useConsent()

  if (!mounted) {
    return <CookieConsentManagerSkeleton />
  }

  const hasConsent = consent === 'accepted'
  const showBanner = needsConsent

  const handleConsentChange = () => {
    // Call the optional callback if provided
    if (onConsentChange) {
      onConsentChange(hasConsent)
    }
  }

  return (
    <>
      <GoogleAnalytics hasConsent={hasConsent} />
      {showBanner && (
        <CookieConsent onConsentChange={handleConsentChange} />
      )}
    </>
  )
}