// src/components/CookieDebug.tsx - Fixed debugging component
'use client'

import { useMounted } from '../lib/clientUtils'
import { useConsent } from '../lib/consent'

export default function CookieDebug() {
  const mounted = useMounted()
  const consentState = useConsent()

  if (!mounted) {
    return (
      <div className="fixed top-4 right-4 bg-red-100 border border-red-400 p-4 rounded text-xs z-[10000]">
        <strong>DEBUG: Not Mounted</strong>
      </div>
    )
  }

  return (
    <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 p-4 rounded text-xs z-[10000] max-w-xs">
      <strong>Cookie Debug Info:</strong>
      <div>Mounted: {mounted ? '✓' : '✗'}</div>
      <div>Consent Mounted: {consentState.mounted ? '✓' : '✗'}</div>
      <div>Consent: {consentState.consent || 'null'}</div>
      <div>Is Expired: {consentState.isExpired ? '✓' : '✗'}</div>
      <div>Needs Consent: {consentState.needsConsent ? '✓' : '✗'}</div>
      <div>Has Consent: {consentState.hasConsent ? '✓' : '✗'}</div>
      <div>Browser: {typeof window !== 'undefined' ? 'client' : 'server'}</div>
      <div>LocalStorage Works: {
        (() => {
          try {
            return typeof localStorage !== 'undefined' ? 'yes' : 'no'
          } catch {
            return 'no'
          }
        })()
      }</div>
      <div>GA_ID Set: {process.env.NEXT_PUBLIC_GA_ID ? 'yes' : 'no'}</div>
      <div>gtag Available: {
        (() => {
          try {
            return typeof window !== 'undefined' && 
                   typeof window.gtag === 'function' ? 'yes' : 'no'
          } catch {
            return 'no'
          }
        })()
      }</div>
    </div>
  )
}