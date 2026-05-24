// src/app/lib/gtag.ts
// GA script loading and initialization is handled by GoogleAnalytics.tsx.
// This file only provides the tracking ID and a safe wrapper for analytics.ts.

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || ''

declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

// Safe wrapper — delegates to the real window.gtag set up by GoogleAnalytics.tsx
export const gtag = (...args: any[]) => {
  if (typeof window === 'undefined' || !GA_TRACKING_ID) return
  if (typeof window.gtag === 'function') {
    window.gtag(...args)
  }
}