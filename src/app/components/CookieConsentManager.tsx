'use client'

import { useMounted } from '../lib/clientUtils'
import CookieConsent from './CookieConsent'
import GoogleAnalytics from './GoogleAnalytics'
import { useConsent } from '../lib/consent'

interface CookieConsentManagerProps {
  onConsentChange?: (consented: boolean) => void
}

export default function CookieConsentManager({ onConsentChange }: CookieConsentManagerProps = {}) {
  const mounted = useMounted()
  const { needsConsent } = useConsent()

  if (!mounted) return null

  return (
    <>
      <GoogleAnalytics />
      {needsConsent && (
        <CookieConsent onConsentChange={onConsentChange} />
      )}
    </>
  )
}
