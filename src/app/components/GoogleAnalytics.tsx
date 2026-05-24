'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useMounted } from '../lib/clientUtils'
import { useConsent } from '../lib/consent'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID?.trim()
const isValidGAID = GA_ID && GA_ID.startsWith('G-') && GA_ID.length > 10

export default function GoogleAnalytics() {
  const mounted = useMounted()
  const { consent } = useConsent()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [scriptLoaded, setScriptLoaded] = useState(false)

  const hasConsent = consent === 'accepted'

  // Keep GA consent state in sync whenever the user changes their choice
  useEffect(() => {
    if (!mounted || !scriptLoaded || !isValidGAID) return
    if (typeof window === 'undefined' || !window.gtag) return
    try {
      window.gtag('consent', 'update', {
        analytics_storage: hasConsent ? 'granted' : 'denied'
      })
    } catch (e) {
      console.warn('GA consent update error:', e)
    }
  }, [hasConsent, mounted, scriptLoaded])

  // Fire page views only when consent is granted
  useEffect(() => {
    if (!mounted || !hasConsent || !isValidGAID || !scriptLoaded || !pathname) return
    if (typeof window === 'undefined' || !window.gtag) return
    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : '')
    try {
      window.gtag('config', GA_ID, { page_path: url, send_page_view: true })
    } catch (e) {
      console.warn('GA page view error:', e)
    }
  }, [pathname, searchParams, hasConsent, mounted, scriptLoaded])

  if (!isValidGAID) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
        onError={(e) => console.warn('Failed to load Google Analytics:', e)}
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            send_page_view: false,
            allow_google_signals: false,
            cookie_flags: 'SameSite=Lax;Secure'
          });
        `}
      </Script>
    </>
  )
}
