// src/app/lib/gtag.ts - GOOGLE TAG MANAGER SETUP ONLY
// Note: Event tracking is now handled by analytics.ts

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || ''

declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

// Core gtag function for Google Tag Manager setup
export const gtag = (...args: any[]) => {
  if (typeof window === 'undefined' || !GA_TRACKING_ID) return
  
  if (typeof window.gtag === 'function') {
    window.gtag(...args)
  }
}

// Initialize Google Analytics/Tag Manager
let gtagInitialized = false

export const initializeGoogleAnalytics = () => {
  if (typeof window === 'undefined' || gtagInitialized || !GA_TRACKING_ID) return
  
  try {
    // Initialize dataLayer if it doesn't exist
    window.dataLayer = window.dataLayer || []
    
    // Set up gtag function
    function gtagFunction(...args: any[]) {
      window.dataLayer.push(args)
    }
    window.gtag = gtagFunction
    
    // Initialize Google Analytics
    gtag('js', new Date())
    gtag('config', GA_TRACKING_ID, {
      page_title: document.title,
      page_location: window.location.href,
      send_page_view: false // We'll handle page views through analytics.ts
    })
    
    gtagInitialized = true
    console.log('Google Analytics initialized')
  } catch (error) {
    console.warn('Failed to initialize Google Analytics:', error)
  }
}

// Auto-initialize when document is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    setTimeout(initializeGoogleAnalytics, 50)
  } else {
    window.addEventListener('load', () => {
      setTimeout(initializeGoogleAnalytics, 50)
    })
  }
}

// Utility to check if Google Analytics is loaded
export const isGoogleAnalyticsLoaded = (): boolean => {
  return typeof window !== 'undefined' && 
         gtagInitialized && 
         typeof window.gtag === 'function' && 
         Array.isArray(window.dataLayer)
}

// Script tag for Google Analytics (for use in layout.tsx if needed)
export const getGoogleAnalyticsScript = () => {
  if (!GA_TRACKING_ID) return null
  
  return `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_TRACKING_ID}', {
      page_title: document.title,
      page_location: window.location.href,
      send_page_view: false
    });
  `
}