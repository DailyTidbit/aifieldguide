// src/components/GoogleAnalytics.tsx - Hydration-safe
'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { pageview, GA_TRACKING_ID } from '../lib/analytics'

interface GoogleAnalyticsProps {
  hasConsent: boolean
}

export default function GoogleAnalytics({ hasConsent }: GoogleAnalyticsProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)

  // Hydration safety
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Only track pageviews if consent is given, mounted, and GA has loaded
    if (!mounted || !hasConsent || !pathname) return

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    pageview(url)
  }, [pathname, searchParams, hasConsent, mounted])

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) return null

  // Don't load analytics without consent
  if (!hasConsent) {
    return null
  }

  // Don't load if no tracking ID
  if (!GA_TRACKING_ID) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Google Analytics tracking ID not found')
    }
    return null
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
      />
      <Script
        id="ga-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            // Consent Mode v2 - Start with denied, update to granted
            gtag('consent', 'default', {
              analytics_storage: 'denied',
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied'
            });
            
            gtag('consent', 'update', { 
              analytics_storage: 'granted' 
            });

            gtag('config', '${GA_TRACKING_ID}', {
              send_page_view: false,
              anonymize_ip: true,
              allow_google_signals: false,
              cookie_flags: 'SameSite=None;Secure'${
                process.env.NODE_ENV !== 'production' ? ',\n              debug_mode: true' : ''
              }
            });
          `,
        }}
      />
    </>
  )
}