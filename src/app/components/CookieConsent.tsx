// components/CookieConsent.tsx - Complete fixed version
'use client'

import { useState, useCallback } from 'react'
import { useMounted } from '../lib/clientUtils'
import { useConsent } from '../lib/consent'

function CookieConsentSkeleton() {
  return null // Cookie banners should be invisible until ready
}

interface CookieConsentProps {
  onConsentChange?: (consented: boolean) => void
}

export default function CookieConsent({ onConsentChange }: CookieConsentProps = {}) {
  const mounted = useMounted()
  const { needsConsent, setConsent } = useConsent()
  const [showDetails, setShowDetails] = useState(false)
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  // ✅ FIXED: All hooks called at top level before any conditional logic
  const handleAccept = useCallback(async () => {
    if (isProcessing) return
    setIsProcessing(true)
    
    try {
      const consentValue = analyticsEnabled ? 'accepted' : 'declined'
      setConsent(consentValue)

      if (onConsentChange) {
        onConsentChange(consentValue === 'accepted')
      }
    } catch (error) {
      console.warn('Error accepting consent:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [analyticsEnabled, setConsent, onConsentChange, isProcessing])

  const handleDecline = useCallback(async () => {
    if (isProcessing) return
    setIsProcessing(true)
    
    try {
      setConsent('declined')

      if (onConsentChange) {
        onConsentChange(false)
      }
    } catch (error) {
      console.warn('Error declining consent:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [setConsent, onConsentChange, isProcessing])

  const toggleDetails = useCallback(() => {
    setShowDetails(prev => !prev)
  }, [])

  // MANDATORY: Show skeleton until mounted
  if (!mounted) {
    return <CookieConsentSkeleton />
  }

  // don't show banner if consent not needed
  if (!needsConsent) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998]" 
        aria-hidden="true"
      />

      {/* Banner */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6"
        role="dialog"
        aria-labelledby="cookie-banner-title"
        aria-describedby="cookie-banner-description"
      >
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border p-6 md:p-8">
          {!showDetails ? (
            /* Simple Banner */
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="text-3xl" role="img" aria-label="Cookie icon">🍪</div>
                <div className="flex-1">
                  <h3 
                    id="cookie-banner-title"
                    className="text-xl font-bold text-gray-900 mb-2 font-serif"
                  >
                    We use cookies to improve your experience
                  </h3>
                  <p 
                    id="cookie-banner-description"
                    className="text-gray-700"
                  >
                    We use analytics cookies to understand how you use AI Field Guide and improve our content.{' '}
                    <button
                      onClick={toggleDetails}
                      className="underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                      style={{ color: '#59B1E3' }}
                      type="button"
                    >
                      Learn more
                    </button>
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleAccept}
                  disabled={isProcessing}
                  className="text-white px-6 py-3 rounded-xl font-semibold transition-opacity hover:opacity-90 flex-1 sm:flex-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#60A875' }}
                  type="button"
                >
                  {isProcessing ? 'Processing...' : 'Accept All Cookies'}
                </button>

                <button
                  onClick={toggleDetails}
                  disabled={isProcessing}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-xl font-semibold transition-colors flex-1 sm:flex-none focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
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
                  id="cookie-settings-title"
                  className="text-2xl font-bold text-gray-900 font-serif"
                >
                  Cookie Settings
                </h3>
                <button
                  onClick={toggleDetails}
                  disabled={isProcessing}
                  className="text-gray-500 hover:text-gray-700 p-1 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded disabled:opacity-50"
                  aria-label="Close cookie settings"
                  type="button"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
                    Required for the website to function properly. These cannot be disabled and include session management and security features.
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
                        disabled={isProcessing}
                        className="sr-only peer"
                        aria-describedby="analytics-description"
                      />
                      <div
                        className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-disabled:opacity-50"
                        style={{
                          backgroundColor: analyticsEnabled ? '#59B1E3' : '',
                          ...(analyticsEnabled && { 
                            '--tw-ring-color': 'rgba(89, 177, 227, 0.3)' 
                          } as React.CSSProperties)
                        }}
                      />
                    </label>
                  </div>
                  <p 
                    id="analytics-description"
                    className="text-sm text-gray-600 mb-2"
                  >
                    Help us understand how visitors use AI Field Guide to improve the experience.
                  </p>
                  <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer hover:text-gray-700">View details</summary>
                    <div className="mt-2 pl-4 space-y-1">
                      <p>• Google Analytics 4 - Page views, user interactions</p>
                      <p>• No personally identifiable information collected</p>
                      <p>• Data is anonymized and aggregated</p>
                      <p>• Used to improve content and user experience</p>
                    </div>
                  </details>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleAccept}
                  disabled={isProcessing}
                  className="text-white px-6 py-3 rounded-xl font-semibold transition-opacity hover:opacity-90 flex-1 sm:flex-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#60A875' }}
                  type="button"
                >
                  {isProcessing ? 'Processing...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}