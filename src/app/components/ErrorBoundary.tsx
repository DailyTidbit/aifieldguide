// src/components/ErrorBoundary.tsx
'use client'

import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

// Default fallback component
export function DefaultErrorFallback({ 
  error, 
  resetErrorBoundary 
}: { 
  error: Error
  resetErrorBoundary: () => void 
}) {
  return (
    <div 
      className="bg-white p-8 rounded-xl border border-gray-200 text-center shadow-sm" 
      role="alert"
      aria-live="assertive"
    >
      <div className="text-4xl mb-4" aria-hidden="true">🔧</div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        Something went wrong
      </h3>
      <p className="text-gray-600 mb-4">
        We're having trouble loading this section.
      </p>
      <details className="text-sm text-gray-500 mb-4 text-left max-w-md mx-auto">
        <summary className="cursor-pointer hover:text-gray-700">
          Error details
        </summary>
        <pre className="mt-2 p-3 bg-gray-50 rounded overflow-auto">
          {error.message}
        </pre>
      </details>
      <button 
        onClick={resetErrorBoundary}
        className="bg-brand-green text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
        aria-label="Try loading the content again"
      >
        Try Again
      </button>
    </div>
  )
}

// Custom Error Boundary class component
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service (e.g., Sentry, LogRocket)
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // You can also log to an error reporting service here
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } })
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      
      return (
        <FallbackComponent 
          error={this.state.error} 
          resetErrorBoundary={this.resetErrorBoundary}
        />
      )
    }

    return this.props.children
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Hook for using error boundary in functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo)
    // Could dispatch to global error state or trigger error boundary
  }
}

// Specialized error boundaries for different use cases
export function CarouselErrorBoundary({ 
  children, 
  componentName = "carousel" 
}: { 
  children: ReactNode
  componentName?: string 
}) {
  const customFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
    <div className="bg-white p-8 rounded-xl border border-gray-200 text-center" role="alert">
      <div className="text-4xl mb-4" aria-hidden="true">🎠</div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        {componentName} temporarily unavailable
      </h3>
      <p className="text-gray-600 mb-4">
        We're having trouble loading the {componentName}. Please try again.
      </p>
      <button 
        onClick={resetErrorBoundary}
        className="bg-brand-green text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
        aria-label={`Retry loading ${componentName}`}
      >
        Reload {componentName}
      </button>
    </div>
  )

  return (
    <ErrorBoundary fallback={customFallback}>
      {children}
    </ErrorBoundary>
  )
}

export default ErrorBoundary