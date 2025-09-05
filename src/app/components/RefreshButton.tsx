// app/components/RefreshButton.tsx
'use client'

import { useMounted } from '../lib/clientUtils'
import { useAnalytics } from '../lib/analytics'
import { RefreshCw } from 'lucide-react'

// Skeleton component for hydration safety
function RefreshButtonSkeleton() {
  return (
    <button 
      className="px-6 py-3 bg-gray-200 text-gray-500 rounded-lg animate-pulse cursor-not-allowed"
      disabled
      aria-label="Loading refresh button"
    >
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>
        <span>Loading...</span>
      </div>
    </button>
  )
}

export default function RefreshButton() {
  // MANDATORY: First line in every client component
  const mounted = useMounted()
  const { track, hasConsent } = useAnalytics()

  // MANDATORY: Always show skeleton until mounted
  if (!mounted) {
    return <RefreshButtonSkeleton />
  }

  const handleRefresh = () => {
    // MANDATORY: Protect all browser interactions
    if (!mounted) return
    
    // Track error recovery if analytics consent given
    if (hasConsent && track) {
      try {
        track('error_recovery', { 
          action: 'manual_refresh',
          page: 'homepage',
          timestamp: Date.now()
        })
      } catch (error) {
        console.warn('Analytics tracking error:', error)
      }
    }
    
    // Safe window access after mount verification
    window.location.reload()
  }

  return (
    <button 
      onClick={handleRefresh}
      className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Refresh the page to try loading content again"
    >
      <RefreshCw className="w-4 h-4" />
      <span>Refresh Page</span>
    </button>
  )
}