// src/app/components/CookieConsent.tsx - Fixed hydration safety issues
'use client'

import { useState, useEffect } from 'react'
import { useConsentManagement } from '../lib/analytics'

interface CookieConsentProps {
  onConsentChange: (consented: boolean) => void
}

export default function CookieConsent({ onConsentChange }: CookieConsentProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Use the analytics consent management hook
  const { storeConsent, mounted: consentMounted } = useConsentManagement()

  // HYDRATION FIX: Wait for component to mount before any DOM operations
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleAccept = () => {
    if (!mounted || !consentMounted) return // HYDRATION FIX
    
    const consentGranted = analyticsEnabled
    storeConsent(consentGranted)
    onConsentChange(consentGranted)
  }

  const handleDecline = () => {
    if (!mounted || !consentMounted) return // HYDRATION FIX
    
    storeConsent(false)
    onConsentChange(false)
  }

  const handleCustomize = () => {
    setShowDetails(!showDetails)
  }

  // Handle escape key - HYDRATION FIX: Only after mounted
  useEffect(() => {
    if (!mounted) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showDetails) {
        setShowDetails(false)
      }
    }
    
    if (showDetails) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [showDetails, mounted])

  // HYDRATION FIX: Don't render until both mounted states are ready
  if (!mounted || !consentMounted) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        aria-hidden="true"
      />
      
      {/* Banner */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        role="dialog"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-description"
      >
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 md:p-8">
            {!showDetails ? (
              /* Simple Banner */
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="text-3xl" aria-hidden="true">🍪</div>
                  <div className="flex-1">
                    <h3 
                      id="cookie-consent-title"
                      className="text-xl font-bold text-gray-900 mb-2"
                      style={{fontFamily: "var(--font-playfair, 'Playfair Display'), serif"}}
                    >
                      We use cookies to improve your experience
                    </h3>
                    <p 
                      id="cookie-consent-description"
                      className="text-gray-700 leading-relaxed"
                      style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}
                    >
                      We use analytics cookies to understand how you interact with Daily Tidbit and improve our content. 
                      <button 
                        onClick={handleCustomize}
                        className="text-brand-blue underline hover:no-underline ml-1"
                        aria-label="Learn more about our cookies and customize settings"
                      >
                        Learn more about our cookies
                      </button>
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleAccept}
                    className="bg-brand-green text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-greenDark transition-colors flex-1 sm:flex-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2"
                    style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}
                    aria-label="Accept all cookies including analytics"
                  >
                    Accept All Cookies
                  </button>
                  
                  <button
                    onClick={handleDecline}
                    className="bg-gray-100 text-gray-800 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex-1 sm:flex-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                    style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}
                    aria-label="Accept only essential cookies"
                  >
                    Essential Only
                  </button>
                  
                  <button
                    onClick={handleCustomize}
                    className="text-gray-600 px-4 py-3 font-semibold hover:text-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                    style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}
                    aria-label="Customize cookie preferences"
                  >
                    Customize
                  </button>
                </div>
              </div>
            ) : (
              /* Detailed View */
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 
                    className="text-2xl font-bold text-gray-900"
                    style={{fontFamily: "var(--font-playfair, 'Playfair Display'), serif"}}
                  >
                    Cookie Settings
                  </h3>
                  <button
                    onClick={handleCustomize}
                    className="text-gray-500 hover:text-gray-700 p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                    aria-label="Close cookie settings"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Essential Cookies */}
                  <div className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">Essential Cookies</h4>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">Always On</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Required for the website to function properly. These cannot be disabled.
                    </p>
                  </div>
                  
                  {/* Analytics Cookies */}
                  <div className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">Analytics Cookies</h4>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={analyticsEnabled}
                          onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                          className="sr-only peer" 
                          aria-label="Enable analytics cookies"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blueDark"></div>
                      </label>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Help us understand how visitors use Daily Tidbit to improve the experience.
                    </p>
                    <details className="text-xs text-gray-500">
                      <summary className="cursor-pointer hover:text-gray-700">View details</summary>
                      <div className="mt-2 pl-4 space-y-1">
                        <p>• Google Analytics 4 - Page views, user interactions, device info</p>
                        <p>• Engagement tracking - Time on page, scroll depth, click patterns</p>
                        <p>• No personally identifiable information is collected</p>
                        <p>• Data is anonymized and aggregated</p>
                      </div>
                    </details>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleAccept}
                    className="bg-brand-green text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-greenDark transition-colors flex-1 sm:flex-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2"
                    aria-label={`Accept ${analyticsEnabled ? 'all cookies including analytics' : 'only essential cookies'}`}
                  >
                    Accept Selected
                  </button>
                  
                  <button
                    onClick={handleDecline}
                    className="bg-gray-100 text-gray-800 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex-1 sm:flex-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                    aria-label="Accept only essential cookies"
                  >
                    Essential Only
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}