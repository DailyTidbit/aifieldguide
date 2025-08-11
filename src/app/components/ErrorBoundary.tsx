// app/components/FieldGuideErrorBoundary.tsx - ENHANCED ERROR BOUNDARY
'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import Link from 'next/link'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  context?: string
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

class FieldGuideErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error for debugging (in development)
    if (process.env.NODE_ENV === 'development') {
      console.error('FieldGuide Error Boundary caught an error:', error, errorInfo)
    }

    // You could also send to error reporting service here
    // trackError(error, errorInfo, this.props.context)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 shadow-lg">
              {/* Error Icon */}
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-red-800 mb-3">
                Something went wrong
              </h3>
              
              <p className="text-red-600 mb-6 leading-relaxed">
                {this.props.context ? 
                  `There was an error loading the ${this.props.context}. This might be a temporary issue.` :
                  'There was an unexpected error. This might be a temporary issue.'
                }
              </p>

              {/* Action buttons */}
              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold"
                >
                  Try Again
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                >
                  Refresh Page
                </button>

                <Link
                  href="/field-guide"
                  className="block w-full px-6 py-3 bg-[#60A875] text-white rounded-xl hover:bg-green-600 transition-colors font-semibold text-center"
                >
                  Back to Field Guide
                </Link>
              </div>

              {/* Error details in development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                    Show error details (dev only)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                    <pre className="whitespace-pre-wrap">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// HOC for easier usage
export function withFieldGuideErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  context?: string
) {
  return function WrappedComponent(props: P) {
    return (
      <FieldGuideErrorBoundary context={context}>
        <Component {...props} />
      </FieldGuideErrorBoundary>
    )
  }
}

// Simplified error fallback components
export const FieldGuideErrorFallback = ({ 
  title = "Content Unavailable", 
  message = "We're having trouble loading this content.",
  showRetry = true,
  onRetry
}: {
  title?: string
  message?: string
  showRetry?: boolean
  onRetry?: () => void
}) => (
  <div className="text-center py-12">
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 max-w-md mx-auto">
      <div className="w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      
      <h3 className="text-lg font-semibold text-yellow-800 mb-2">{title}</h3>
      <p className="text-yellow-600 mb-4">{message}</p>
      
      {showRetry && (
        <button
          onClick={onRetry || (() => window.location.reload())}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
)

export default FieldGuideErrorBoundary