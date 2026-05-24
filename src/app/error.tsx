'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl" role="img" aria-label="Warning">⚠️</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3 font-serif">Something went wrong</h1>
        <p className="text-gray-600 mb-8">
          An unexpected error occurred. Try again or return to the Field Guide.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#60A875' }}
          >
            Try Again
          </button>
          <Link
            href="/field-guide"
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            Back to Field Guide
          </Link>
        </div>
      </div>
    </div>
  )
}
