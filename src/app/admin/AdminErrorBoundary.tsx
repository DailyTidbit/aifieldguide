// src/app/admin/AdminErrorBoundary.tsx - Client Component
'use client'

import { Component, ReactNode } from 'react'

interface AdminErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export default class AdminErrorBoundary extends Component<
  { children: ReactNode },
  AdminErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): AdminErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Admin dashboard error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    })

    // Report to analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: `Admin dashboard error: ${error.message}`,
        fatal: true
      })
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  private handleRefresh = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-lg mx-auto text-center p-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Dashboard Error</h1>
            <p className="text-gray-600 mb-6">
              The admin dashboard encountered an unexpected error. This has been logged and will be investigated.
            </p>
            
            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                <h3 className="font-semibold text-red-800 mb-2">Error Details:</h3>
                <pre className="text-xs text-red-700 overflow-auto">
                  {this.state.error.message}
                </pre>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Try Again
              </button>
              <button
                onClick={this.handleRefresh}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Refresh Page
              </button>
            </div>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
              <p className="text-sm text-blue-800">
                If this problem persists, please contact support at{' '}
                <a href="mailto:admin-support@dailytidbit.org" className="underline hover:no-underline">
                  admin-support@dailytidbit.org
                </a>
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}