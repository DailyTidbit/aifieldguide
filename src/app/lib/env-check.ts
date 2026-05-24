// src/app/lib/env-check.ts - FIXED: Safe environment validation without process.exit
import { validateEnvironment } from './validationSchemas'

export interface EnvCheckResult {
  valid: boolean
  missing: string[]
  invalid: string[]
  warnings: string[]
  critical: string[]
  degradedMode: boolean
  availableFeatures: string[]
  unavailableFeatures: string[]
}

export interface EnvironmentStatus {
  isHealthy: boolean
  canServeRequests: boolean
  degradedFeatures: string[]
  criticalIssues: string[]
  recommendedActions: string[]
}

// Feature flags based on environment availability
export const FEATURES = {
  EMAIL_NOTIFICATIONS: 'email_notifications',
  ADMIN_PANEL: 'admin_panel', 
  PARTNER_INVITES: 'partner_invites',
  PAYMENT_PROCESSING: 'payment_processing',
  ANALYTICS: 'analytics',
  FIELD_GUIDE: 'field_guide',
  AUTHENTICATION: 'authentication',
  DATABASE: 'database'
} as const

/**
 * SAFE environment validation that never crashes the application
 * Instead of exiting, it enables "degraded mode" with reduced functionality
 */
export function validateRequiredEnvironment(): EnvCheckResult {
  const { valid, missing, invalid } = validateEnvironment()
  
  const warnings: string[] = []
  const critical: string[] = []
  const availableFeatures: string[] = []
  const unavailableFeatures: string[] = []
  
  // Core required variables (app won't work without these)
  const coreRequired = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SITE_URL'
  ]
  
  // Service keys for specific features
  const serviceKeys = {
    [FEATURES.EMAIL_NOTIFICATIONS]: 'RESEND_API_KEY',
    [FEATURES.ADMIN_PANEL]: 'ADMIN_API_KEY',
    [FEATURES.PAYMENT_PROCESSING]: 'STRIPE_SECRET_KEY',
    [FEATURES.ANALYTICS]: 'NEXT_PUBLIC_GA_ID',
    [FEATURES.AUTHENTICATION]: 'SUPABASE_SERVICE_ROLE_KEY'
  }
  
  // Check core requirements
  const missingCore = coreRequired.filter(key => !process.env[key])
  if (missingCore.length > 0) {
    critical.push(...missingCore.map(key => `${key} is required for basic functionality`))
  } else {
    availableFeatures.push(FEATURES.DATABASE, FEATURES.FIELD_GUIDE)
  }
  
  // Check service-specific features
  Object.entries(serviceKeys).forEach(([feature, envVar]) => {
    if (process.env[envVar]) {
      availableFeatures.push(feature)
    } else {
      unavailableFeatures.push(feature)
      warnings.push(`${envVar} not set - ${feature} will be disabled`)
    }
  })
  
  // Production-specific validations (warnings, not critical)
  if (process.env.NODE_ENV === 'production') {
    // CHANGED: These are now warnings, not critical errors
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      warnings.push('SUPABASE_SERVICE_ROLE_KEY missing - admin features limited')
      unavailableFeatures.push(FEATURES.ADMIN_PANEL)
    }
    
    if (process.env.NEXT_PUBLIC_SITE_URL?.includes('localhost')) {
      warnings.push('NEXT_PUBLIC_SITE_URL uses localhost in production - some features may not work')
    }
    
    if (!process.env.ADMIN_API_KEY || process.env.ADMIN_API_KEY.length < 32) {
      warnings.push('ADMIN_API_KEY should be at least 32 characters in production')
    }
    
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      warnings.push('JWT_SECRET should be at least 32 characters in production')
    }
  }
  
  // URL format validation
  if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.startsWith('http')) {
    critical.push('NEXT_PUBLIC_SITE_URL must include protocol (https://)')
  }
  
  // Supabase URL validation
  if (process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('supabase.co') &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('localhost') &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('127.0.0.1')) {
    warnings.push('NEXT_PUBLIC_SUPABASE_URL does not appear to be a valid Supabase URL')
  }
  
  // Determine if we can operate in degraded mode
  const canRunInDegradedMode = critical.length === 0 && missingCore.length === 0
  
  return {
    valid: valid && invalid.length === 0 && critical.length === 0,
    missing,
    invalid: [...invalid, ...critical],
    warnings,
    critical,
    degradedMode: !valid && canRunInDegradedMode,
    availableFeatures,
    unavailableFeatures
  }
}

/**
 * SAFE logging that never crashes the application
 */
export function logEnvironmentStatus(): EnvCheckResult {
  const result = validateRequiredEnvironment()
  
  if (result.valid) {
    console.log('✅ Environment validation passed - all features available')
    if (result.warnings.length > 0) {
      console.warn('⚠️ Environment warnings:')
      result.warnings.forEach(warning => console.warn(`  - ${warning}`))
    }
  } else if (result.degradedMode) {
    console.warn('🔶 Running in DEGRADED MODE - some features disabled')
    console.warn('Available features:', result.availableFeatures.join(', '))
    console.warn('Disabled features:', result.unavailableFeatures.join(', '))
    
    if (result.warnings.length > 0) {
      console.warn('Warnings:')
      result.warnings.forEach(warning => console.warn(`  - ${warning}`))
    }
  } else {
    console.error('❌ Environment validation failed - critical issues detected')
    
    if (result.missing.length > 0) {
      console.error('Missing required variables:')
      result.missing.forEach(missing => console.error(`  - ${missing}`))
    }
    
    if (result.invalid.length > 0) {
      console.error('Invalid/Critical variables:')
      result.invalid.forEach(invalid => console.error(`  - ${invalid}`))
    }
    
    if (result.critical.length > 0) {
      console.error('🚨 CRITICAL ISSUES (app may not function):')
      result.critical.forEach(critical => console.error(`  - ${critical}`))
    }
  }
  
  return result
}

/**
 * SAFE startup validation that NEVER calls process.exit()
 * Instead returns status information for the application to handle
 */
export function validateEnvironmentSafely(): EnvironmentStatus {
  const result = logEnvironmentStatus()
  
  const status: EnvironmentStatus = {
    isHealthy: result.valid,
    canServeRequests: result.valid || result.degradedMode,
    degradedFeatures: result.unavailableFeatures,
    criticalIssues: result.critical,
    recommendedActions: []
  }
  
  // Generate actionable recommendations
  if (result.critical.length > 0) {
    status.recommendedActions.push('Fix critical environment variables before deploying to production')
  }
  
  if (result.warnings.length > 0) {
    status.recommendedActions.push('Review environment warnings to enable additional features')
  }
  
  if (result.unavailableFeatures.includes(FEATURES.EMAIL_NOTIFICATIONS)) {
    status.recommendedActions.push('Set RESEND_API_KEY to enable email notifications')
  }
  
  if (result.unavailableFeatures.includes(FEATURES.ADMIN_PANEL)) {
    status.recommendedActions.push('Set ADMIN_API_KEY to enable admin panel')
  }
  
  if (result.unavailableFeatures.includes(FEATURES.PAYMENT_PROCESSING)) {
    status.recommendedActions.push('Set STRIPE_SECRET_KEY to enable payment processing')
  }
  
  return status
}

/**
 * Feature availability checker - use throughout your app
 */
export function isFeatureAvailable(feature: string): boolean {
  const result = validateRequiredEnvironment()
  return result.availableFeatures.includes(feature)
}

/**
 * Safe feature guard for components/functions
 */
export function withFeatureGuard<T extends any[], R>(
  feature: string,
  operation: (...args: T) => R,
  fallback?: R
): (...args: T) => R {
  return (...args: T): R => {
    if (isFeatureAvailable(feature)) {
      try {
        return operation(...args)
      } catch (error) {
        console.error(`Feature ${feature} operation failed:`, error)
        return fallback as R
      }
    } else {
      console.warn(`Feature ${feature} is not available - using fallback`)
      return fallback as R
    }
  }
}

/**
 * Middleware-safe validation that returns appropriate responses
 */
export function validateEnvironmentForMiddleware(): { 
  valid: boolean; 
  errorResponse?: Response; 
  result: EnvCheckResult;
  canContinue: boolean;
} {
  const result = validateRequiredEnvironment()
  
  // CHANGED: Only return error response for truly critical issues
  if (!result.valid && !result.degradedMode && process.env.NODE_ENV === 'production') {
    const errorHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Service Temporarily Unavailable</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 40px; 
      background: #f8fafc; 
      color: #1a202c;
      line-height: 1.6;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white; 
      padding: 40px; 
      border-radius: 8px; 
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .error { 
      background: #fed7d7; 
      padding: 20px; 
      border-radius: 8px; 
      border-left: 4px solid #f56565; 
      margin: 20px 0;
    }
    .warning {
      background: #fefcbf;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #ecc94b;
      margin: 20px 0;
    }
    h1 { color: #1a202c; margin-bottom: 20px; }
    .status { font-weight: 600; color: #e53e3e; }
    .actions { margin-top: 30px; }
    .action-item { 
      background: #ebf8ff; 
      padding: 15px; 
      margin: 10px 0; 
      border-radius: 6px; 
      border-left: 3px solid #3182ce;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔧 Service Configuration Required</h1>
    <p>The application needs additional configuration before it can start properly.</p>
    
    ${result.critical.length > 0 ? `
    <div class="error">
      <div class="status">Critical Configuration Issues:</div>
      <ul>
        ${result.critical.map(issue => `<li>${issue}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
    
    ${result.missing.length > 0 ? `
    <div class="warning">
      <div class="status">Missing Required Configuration:</div>
      <ul>
        ${result.missing.map(missing => `<li>${missing}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
    
    <div class="actions">
      <h3>Recommended Actions:</h3>
      <div class="action-item">
        <strong>1.</strong> Review and set missing environment variables
      </div>
      <div class="action-item">
        <strong>2.</strong> Restart the application after configuration changes
      </div>
      <div class="action-item">
        <strong>3.</strong> Contact support if issues persist
      </div>
    </div>
    
    <p style="margin-top: 30px; font-size: 14px; color: #666;">
      <strong>Note:</strong> This is a configuration issue, not a service outage. 
      The application will work normally once properly configured.
    </p>
  </div>
</body>
</html>
    `
    
    return {
      valid: false,
      errorResponse: new Response(errorHtml, {
        status: 503,
        headers: {
          'Content-Type': 'text/html',
          'Retry-After': '300', // Suggest retry in 5 minutes
        },
      }),
      result,
      canContinue: false
    }
  }
  
  return { 
    valid: result.valid, 
    result, 
    canContinue: result.valid || result.degradedMode 
  }
}

/**
 * Development helper - shows environment status in development console
 */
export function showEnvironmentStatus(): void {
  if (process.env.NODE_ENV !== 'development') return
  
  const result = validateRequiredEnvironment()
  
  console.group('🔍 Environment Status')
  console.log('Mode:', result.valid ? '✅ Full' : result.degradedMode ? '🔶 Degraded' : '❌ Critical')
  console.log('Available Features:', result.availableFeatures)
  if (result.unavailableFeatures.length > 0) {
    console.log('Disabled Features:', result.unavailableFeatures)
  }
  if (result.warnings.length > 0) {
    console.warn('Warnings:', result.warnings)
  }
  console.groupEnd()
}

/**
 * Runtime feature check with caching
 */
let cachedFeatures: string[] | null = null
let cacheTimestamp = 0
const CACHE_TTL = 60000 // 1 minute

export function getAvailableFeatures(): string[] {
  const now = Date.now()
  
  if (cachedFeatures && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedFeatures
  }
  
  const result = validateRequiredEnvironment()
  cachedFeatures = result.availableFeatures
  cacheTimestamp = now
  
  return cachedFeatures
}

/**
 * Clear feature cache (call after environment changes)
 */
export function clearFeatureCache(): void {
  cachedFeatures = null
  cacheTimestamp = 0
}

// SAFE: Run validation in development (no process.exit)
if (process.env.NODE_ENV === 'development') {
  showEnvironmentStatus()
}