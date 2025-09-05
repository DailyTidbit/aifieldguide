// components/GoogleAnalytics.tsx - Enhanced Google Analytics with validation
'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useMounted } from '../lib/clientUtils'
import { useConsent } from '../lib/consent'

// Environment variable validation
const GA_ID = process.env.NEXT_PUBLIC_GA_ID?.trim()
const isValidGAID = GA_ID && GA_ID.startsWith('G-') && GA_ID.length > 10

function GoogleAnalyticsSkeleton() {
  return null // Analytics should be invisible
}

interface GoogleAnalyticsProps {
  hasConsent?: boolean
}

export default function GoogleAnalytics({ hasConsent }: GoogleAnalyticsProps = {}) {
  const mounted = useMounted()
  const { consent } = useConsent()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [scriptLoaded, setScriptLoaded] = useState(false)

  // Use either the prop or the consent hook
  const actualConsent = hasConsent !== undefined ? hasConsent : consent === 'accepted'

  // Track page views when consent is given and script is loaded
  useEffect(() => {
    if (!mounted || !actualConsent || !isValidGAID || !pathname || !scriptLoaded) return
    
    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : '')
    
    if (typeof window !== 'undefined' && window.gtag) {
      try {
        window.gtag('config', GA_ID, { 
          page_path: url,
          send_page_view: true 
        })
      } catch (error) {
        console.warn('GA page view error:', error)
      }
    }
  }, [pathname, searchParams, actualConsent, mounted, scriptLoaded])

  // Update consent when it changes
  useEffect(() => {
    if (!mounted || !scriptLoaded || !isValidGAID) return
    
    if (typeof window !== 'undefined' && window.gtag) {
      try {
        window.gtag('consent', 'update', {
          analytics_storage: actualConsent ? 'granted' : 'denied'
        })
      } catch (error) {
        console.warn('GA consent update error:', error)
      }
    }
  }, [actualConsent, mounted, scriptLoaded])

  // MANDATORY: Show skeleton until mounted
  if (!mounted) {
    return <GoogleAnalyticsSkeleton />
  }

  // don't load if no consent or invalid GA ID
  if (!actualConsent || !isValidGAID) {
    return null
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
        onError={(e) => {
          console.warn('Failed to load Google Analytics:', e)
        }}
      />
      <Script 
        id="google-analytics" 
        strategy="afterInteractive"
        onError={(e) => {
          console.warn('Failed to initialize Google Analytics:', e)
        }}
      >
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          
          // Start with consent denied by default
          gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
          });
          
          // Grant analytics consent since user accepted
          gtag('consent', 'update', {
            analytics_storage: 'granted'
          });

          gtag('config', '${GA_ID}', {
            send_page_view: false,
            anonymize_ip: true,
            allow_google_signals: false,
            cookie_flags: 'SameSite=Lax;Secure',
            custom_map: {
              'custom_parameter_1': 'tidbit_number',
              'custom_parameter_2': 'engagement_type'
            }
          });
        `}
      </Script>
    </>
  )
}