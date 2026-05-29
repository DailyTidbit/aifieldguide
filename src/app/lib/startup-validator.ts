// src/app/lib/startup-validator.ts - SAFE startup validation without process.exit
import { validateEnvironmentSafely, showEnvironmentStatus, EnvironmentStatus } from './env-check'

let hasValidated = false
let validationResult: EnvironmentStatus | null = null

/**
 * SAFE startup validation that never crashes the application
 * Returns status information instead of exiting
 */
export function runStartupValidation(): EnvironmentStatus {
  if (hasValidated && validationResult) {
    return validationResult
  }
  
  console.log('🚀 Starting AI Field Guide application...')
  console.log(`📦 Environment: ${process.env.NODE_ENV}`)
  console.log(`🌐 Node Version: ${process.version}`)
  
  try {
    console.log('\n🔍 Validating environment configuration...')
    validationResult = validateEnvironmentSafely()
    hasValidated = true
    
    if (validationResult.isHealthy) {
      console.log('✅ Startup validation completed successfully - all features available')
    } else if (validationResult.canServeRequests) {
      console.warn('🔶 Startup validation completed with degraded functionality')
      console.warn('Available features limited. Check environment configuration.')
      
      if (validationResult.degradedFeatures.length > 0) {
        console.warn('Disabled features:', validationResult.degradedFeatures.join(', '))
      }
      
      if (validationResult.recommendedActions.length > 0) {
        console.warn('Recommended actions:')
        validationResult.recommendedActions.forEach(action => 
          console.warn(`  - ${action}`)
        )
      }
    } else {
      console.error('❌ Startup validation failed - critical configuration issues')
      console.error('Application may not function properly!')
      
      if (validationResult.criticalIssues.length > 0) {
        console.error('Critical issues:')
        validationResult.criticalIssues.forEach(issue => 
          console.error(`  - ${issue}`)
        )
      }
      
      // CHANGED: Don't exit, just warn
      console.error('⚠️ Continuing startup despite issues - some features may not work')
    }
    
    return validationResult
    
  } catch (error) {
    console.error('❌ Startup validation exception:', error)
    
    // CHANGED: Don't exit on validation errors
    const fallbackResult: EnvironmentStatus = {
      isHealthy: false,
      canServeRequests: true, // Assume we can serve basic requests
      degradedFeatures: ['all'],
      criticalIssues: ['Validation system failed'],
      recommendedActions: ['Check environment configuration manually']
    }
    
    validationResult = fallbackResult
    hasValidated = true
    
    console.warn('⚠️ Using fallback configuration - limited functionality available')
    return fallbackResult
  }
}

/**
 * Get the current validation result without re-running validation
 */
export function getValidationResult(): EnvironmentStatus | null {
  return validationResult
}

/**
 * Check if the application is healthy (all features available)
 */
export function isApplicationHealthy(): boolean {
  const result = getValidationResult()
  return result?.isHealthy ?? false
}

/**
 * Check if the application can serve requests (healthy or degraded mode)
 */
export function canServeRequests(): boolean {
  const result = getValidationResult()
  return result?.canServeRequests ?? true // Default to true for safety
}

/**
 * Get list of unavailable features
 */
export function getUnavailableFeatures(): string[] {
  const result = getValidationResult()
  return result?.degradedFeatures ?? []
}

/**
 * Check if a specific feature is available
 */
export function isFeatureAvailable(feature: string): boolean {
  const result = getValidationResult()
  if (!result) return true // Default to available if not validated yet
  
  return !result.degradedFeatures.includes(feature)
}

/**
 * Get recommended actions for fixing configuration issues
 */
export function getRecommendedActions(): string[] {
  const result = getValidationResult()
  return result?.recommendedActions ?? []
}

/**
 * Reset validation state (useful for testing or config reloads)
 */
export function resetValidation(): void {
  hasValidated = false
  validationResult = null
}

/**
 * Safe middleware helper for checking application health
 */
export function createHealthCheckResponse(): Response {
  const result = getValidationResult() || runStartupValidation()
  
  const healthData = {
    status: result.isHealthy ? 'healthy' : result.canServeRequests ? 'degraded' : 'unhealthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    features: {
      available: result.isHealthy,
      degraded: result.degradedFeatures,
      canServeRequests: result.canServeRequests
    },
    issues: {
      critical: result.criticalIssues,
      recommended: result.recommendedActions
    }
  }
  
  const statusCode = result.canServeRequests ? 200 : 503
  
  return new Response(JSON.stringify(healthData, null, 2), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'X-Health-Status': healthData.status,
      'Cache-Control': 'no-cache'
    }
  })
}

/**
 * Express/Next.js middleware for health checks
 */
export function healthCheckMiddleware(req: any, res: any, next?: any) {
  if (req.url === '/health' || req.url === '/_health') {
    const response = createHealthCheckResponse()
    
    response.headers.forEach((value, key) => {
      res.setHeader(key, value)
    })
    
    res.status(response.status)
    return response.text().then(body => res.send(body))
  }
  
  if (next) next()
}

/**
 * Development helper - run validation and show detailed status
 */
export function runDevelopmentValidation(): void {
  if (process.env.NODE_ENV !== 'development') return
  
  const result = runStartupValidation()
  showEnvironmentStatus()
  
  if (!result.isHealthy) {
    console.group('🔧 Development Recommendations')
    
    if (!isFeatureAvailable('email_notifications')) {
      console.log('📧 To enable email notifications: Set RESEND_API_KEY')
    }
    
    if (!isFeatureAvailable('admin_panel')) {
      console.log('👑 To enable admin panel: Set ADMIN_API_KEY (min 32 chars)')
    }
    
    if (!isFeatureAvailable('payment_processing')) {
      console.log('💳 To enable payments: Set STRIPE_SECRET_KEY')
    }
    
    if (!isFeatureAvailable('analytics')) {
      console.log('📊 To enable analytics: Set NEXT_PUBLIC_GA_ID')
    }
    
    console.log('🔄 Restart the development server after adding environment variables')
    console.groupEnd()
  }
}

/**
 * Production startup with graceful degradation
 */
export function runProductionStartup(): EnvironmentStatus {
  const result = runStartupValidation()
  
  if (result.isHealthy) {
    console.log('🟢 Production startup complete - all systems operational')
  } else if (result.canServeRequests) {
    console.warn('🟡 Production startup complete - running with limited features')
    console.warn('Some functionality may be unavailable until configuration is updated')
  } else {
    console.error('🔴 Production startup complete - critical issues detected')
    console.error('Application functionality severely limited')
    console.error('Immediate attention required!')
  }
  
  return result
}

// SAFE: Auto-run validation based on environment
if (typeof window === 'undefined') { // Server-side only
  if (process.env.NODE_ENV === 'development') {
    // Run detailed validation in development
    setTimeout(runDevelopmentValidation, 100)
  } else {
    // Run basic validation in production
    setTimeout(runProductionStartup, 100)
  }
}