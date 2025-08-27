// src/app/lib/rateLimit.ts - Rate limiting implementation
import { NextRequest } from 'next/server'

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  skipSuccessfulRequests?: boolean
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: Date
  error?: string
}

// In-memory store for development (replace with Redis for production)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function createRateLimit(config: RateLimitConfig) {
  return async (request: NextRequest, keyPrefix: string = ''): Promise<RateLimitResult> => {
    // Create rate limit key from IP and optional prefix
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    const key = `${keyPrefix}:${ip}`
    
    const now = Date.now()
    const windowStart = now - config.windowMs
    
    // Clean up expired entries
    for (const [k, v] of requestCounts.entries()) {
      if (v.resetTime < now) {
        requestCounts.delete(k)
      }
    }
    
    // Get current count for this key
    const current = requestCounts.get(key) || { count: 0, resetTime: now + config.windowMs }
    
    // Reset if window has expired
    if (current.resetTime < now) {
      current.count = 0
      current.resetTime = now + config.windowMs
    }
    
    // Check if limit exceeded
    if (current.count >= config.maxRequests) {
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        reset: new Date(current.resetTime),
        error: 'Rate limit exceeded'
      }
    }
    
    // Increment count
    current.count++
    requestCounts.set(key, current)
    
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - current.count,
      reset: new Date(current.resetTime)
    }
  }
}

// Pre-configured rate limiters
export const partnerInviteRateLimit = createRateLimit({
  maxRequests: 5, // 5 invites per hour per IP
  windowMs: 60 * 60 * 1000 // 1 hour
})

export const accessRequestRateLimit = createRateLimit({
  maxRequests: 3, // 3 requests per day per IP  
  windowMs: 24 * 60 * 60 * 1000 // 24 hours
})

export const generalApiRateLimit = createRateLimit({
  maxRequests: 100, // 100 requests per hour per IP
  windowMs: 60 * 60 * 1000 // 1 hour
})