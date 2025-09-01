// src/app/lib/env-check.ts - Environment validation for startup
import { validateEnvironment } from './validationSchemas'

export interface EnvCheckResult {
  valid: boolean
  missing: string[]
  invalid: string[]
  warnings: string[]
}

export function validateRequiredEnvironment(): EnvCheckResult {
  const { valid, missing, invalid } = validateEnvironment()
  
  const warnings: string[] = []
  
  // Check for optional but recommended variables
  const optional = [
    'RESEND_API_KEY',
    'ADMIN_API_KEY', 
    'JWT_SECRET',
    'NEXT_PUBLIC_GA_ID'
  ]
  
  optional.forEach(key => {
    if (!process.env[key]) {
      warnings.push(`${key} not set - some features may not work`)
    }
  })
  
  // Check URL formats
  if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.startsWith('http')) {
    invalid.push('NEXT_PUBLIC_SITE_URL must include protocol (https://)')
  }
  
  return {
    valid: valid && invalid.length === 0,
    missing,
    invalid,
    warnings
  }
}

export function logEnvironmentStatus(): void {
  const result = validateRequiredEnvironment()
  
  if (result.valid) {
    console.log('✅ Environment validation passed')
    if (result.warnings.length > 0) {
      console.warn('⚠️ Environment warnings:')
      result.warnings.forEach(warning => console.warn(`  - ${warning}`))
    }
  } else {
    console.error('❌ Environment validation failed')
    
    if (result.missing.length > 0) {
      console.error('Missing required variables:')
      result.missing.forEach(missing => console.error(`  - ${missing}`))
    }
    
    if (result.invalid.length > 0) {
      console.error('Invalid variables:')
      result.invalid.forEach(invalid => console.error(`  - ${invalid}`))
    }
    
    console.error('Application may not function correctly')
  }
}

// Run validation in development
if (process.env.NODE_ENV === 'development') {
  logEnvironmentStatus()
}