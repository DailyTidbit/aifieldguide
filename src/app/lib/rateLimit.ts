// src/app/lib/rateLimit.ts - ENHANCED with user-based limiting and memory management
import { NextRequest } from 'next/server'

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  skipSuccessfulRequests?: boolean
  userMultiplier?: number // Multiplier for authenticated users
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: Date
  error?: string
  isUserLimit?: boolean
}

interface RateLimitEntry {
  count: number
  resetTime: number
  lastAccessed: number
  userId?: string
}

// Enhanced in-memory store with strict memory management
const requestCounts = new Map<string, RateLimitEntry>()
const userCounts = new Map<string, RateLimitEntry>()

// Memory management configuration
const MAX_ENTRIES = 50000 // Hard limit
const MAX_MEMORY_MB = 100 // Estimated memory limit
const CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes
const ENTRY_MAX_AGE = 2 * 60 * 60 * 1000 // 2 hours

let cleanupInterval: NodeJS.Timeout | null = null
let memoryWarningLogged = false

interface MemoryStats {
  ipEntries: number
  userEntries: number
  estimatedMemoryKB: number
  oldestEntryAge: number
  memoryWarningThreshold: boolean
}

function getMemoryStats(): MemoryStats {
  const ipEntries = requestCounts.size
  const userEntries = userCounts.size
  const totalEntries = ipEntries + userEntries
  const estimatedMemoryKB = Math.round(totalEntries * 0.15) // Rough estimate per entry
  
  let oldestEntryAge = 0
  const now = Date.now()
  
  for (const entry of [...requestCounts.values(), ...userCounts.values()]) {
    const age = now - entry.lastAccessed
    oldestEntryAge = Math.max(oldestEntryAge, age)
  }
  
  return {
    ipEntries,
    userEntries,
    estimatedMemoryKB,
    oldestEntryAge,
    memoryWarningThreshold: estimatedMemoryKB > (MAX_MEMORY_MB * 1024 * 0.8) // 80% threshold
  }
}

function startCleanupInterval() {
  if (cleanupInterval) return
  
  cleanupInterval = setInterval(() => {
    performCleanup()
  }, CLEANUP_INTERVAL)
  
  cleanupInterval.unref()
}

function performCleanup() {
  const now = Date.now()
  const stats = getMemoryStats()
  
  // Log memory warning once
  if (stats.memoryWarningThreshold && !memoryWarningLogged) {
    console.warn(`[RateLimit] High memory usage: ${stats.estimatedMemoryKB}KB (${stats.ipEntries + stats.userEntries} entries)`)
    memoryWarningLogged = true
  } else if (!stats.memoryWarningThreshold) {
    memoryWarningLogged = false
  }
  
  let removedIP = 0
  let removedUser = 0
  
  // Clean up IP-based entries
  for (const [key, entry] of requestCounts.entries()) {
    const age = now - entry.lastAccessed
    if (now > entry.resetTime || age > ENTRY_MAX_AGE) {
      requestCounts.delete(key)
      removedIP++
    }
  }
  
  // Clean up user-based entries
  for (const [key, entry] of userCounts.entries()) {
    const age = now - entry.lastAccessed
    if (now > entry.resetTime || age > ENTRY_MAX_AGE) {
      userCounts.delete(key)
      removedUser++
    }
  }
  
  // Emergency cleanup if still over limits
  if (requestCounts.size + userCounts.size > MAX_ENTRIES) {
    emergencyCleanup()
  }
  
  if (removedIP > 0 || removedUser > 0) {
    console.log(`[RateLimit] Cleanup: removed ${removedIP} IP entries, ${removedUser} user entries. Active: ${requestCounts.size + userCounts.size}`)
  }
}

function emergencyCleanup() {
  console.warn('[RateLimit] Emergency cleanup triggered')
  
  const now = Date.now()
  const allEntries: Array<[string, RateLimitEntry, 'ip' | 'user']> = []
  
  // Collect all entries with their ages
  for (const [key, entry] of requestCounts.entries()) {
    allEntries.push([key, entry, 'ip'])
  }
  for (const [key, entry] of userCounts.entries()) {
    allEntries.push([key, entry, 'user'])
  }
  
  // Sort by last accessed (oldest first)
  allEntries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
  
  // Remove oldest entries until under limit
  const targetSize = Math.floor(MAX_ENTRIES * 0.7) // Remove to 70% of max
  const toRemove = allEntries.length - targetSize
  
  for (let i = 0; i < toRemove && i < allEntries.length; i++) {
    const [key, , type] = allEntries[i]
    if (type === 'ip') {
      requestCounts.delete(key)
    } else {
      userCounts.delete(key)
    }
  }
  
  console.warn(`[RateLimit] Emergency cleanup removed ${toRemove} entries`)
}

export function createRateLimit(config: RateLimitConfig) {
  startCleanupInterval()
  
  return async (
    request: NextRequest, 
    keyPrefix: string = '',
    userId?: string
  ): Promise<RateLimitResult> => {
    const ip = getClientIP(request)
    const now = Date.now()
    
    // User-based rate limiting (more generous for authenticated users)
    if (userId) {
      const userKey = `user:${userId}:${keyPrefix}`
      const userLimit = Math.floor(config.maxRequests * (config.userMultiplier || 2))
      
      let userEntry = userCounts.get(userKey)
      
      if (!userEntry || userEntry.resetTime < now) {
        userEntry = {
          count: 0,
          resetTime: now + config.windowMs,
          lastAccessed: now,
          userId
        }
      }
      
      userEntry.lastAccessed = now
      
      if (userEntry.count >= userLimit) {
        userCounts.set(userKey, userEntry)
        return {
          success: false,
          limit: userLimit,
          remaining: 0,
          reset: new Date(userEntry.resetTime),
          error: 'User rate limit exceeded',
          isUserLimit: true
        }
      }
      
      userEntry.count++
      userCounts.set(userKey, userEntry)
      
      return {
        success: true,
        limit: userLimit,
        remaining: userLimit - userEntry.count,
        reset: new Date(userEntry.resetTime),
        isUserLimit: true
      }
    }
    
    // IP-based rate limiting (fallback or for unauthenticated users)
    const ipKey = keyPrefix ? `${keyPrefix}:${ip}` : ip
    let ipEntry = requestCounts.get(ipKey)
    
    if (!ipEntry || ipEntry.resetTime < now) {
      ipEntry = {
        count: 0,
        resetTime: now + config.windowMs,
        lastAccessed: now
      }
    }
    
    ipEntry.lastAccessed = now
    
    if (ipEntry.count >= config.maxRequests) {
      requestCounts.set(ipKey, ipEntry)
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        reset: new Date(ipEntry.resetTime),
        error: 'IP rate limit exceeded',
        isUserLimit: false
      }
    }
    
    ipEntry.count++
    requestCounts.set(ipKey, ipEntry)
    
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - ipEntry.count,
      reset: new Date(ipEntry.resetTime),
      isUserLimit: false
    }
  }
}

export function createSimpleRateLimit(
  maxRequests: number, 
  windowMs: number,
  userMultiplier: number = 2
): (identifier: string, keyPrefix?: string, userId?: string) => Promise<RateLimitResult> {
  
  startCleanupInterval()
  
  return async (identifier: string, keyPrefix: string = '', userId?: string): Promise<RateLimitResult> => {
    const now = Date.now()
    
    // User-based limiting if userId provided
    if (userId) {
      const userKey = `user:${userId}:${keyPrefix}`
      const userLimit = Math.floor(maxRequests * userMultiplier)
      
      let userEntry = userCounts.get(userKey)
      
      if (!userEntry || userEntry.resetTime < now) {
        userEntry = {
          count: 0,
          resetTime: now + windowMs,
          lastAccessed: now,
          userId
        }
      }
      
      userEntry.lastAccessed = now
      
      if (userEntry.count >= userLimit) {
        userCounts.set(userKey, userEntry)
        return {
          success: false,
          limit: userLimit,
          remaining: 0,
          reset: new Date(userEntry.resetTime),
          error: 'User rate limit exceeded',
          isUserLimit: true
        }
      }
      
      userEntry.count++
      userCounts.set(userKey, userEntry)
      
      return {
        success: true,
        limit: userLimit,
        remaining: userLimit - userEntry.count,
        reset: new Date(userEntry.resetTime),
        isUserLimit: true
      }
    }
    
    // IP-based limiting
    const key = keyPrefix ? `${keyPrefix}:${identifier}` : identifier
    let entry = requestCounts.get(key)
    
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
        lastAccessed: now
      }
    }
    
    entry.lastAccessed = now
    
    if (entry.count >= maxRequests) {
      requestCounts.set(key, entry)
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        reset: new Date(entry.resetTime),
        error: 'Rate limit exceeded',
        isUserLimit: false
      }
    }
    
    entry.count++
    requestCounts.set(key, entry)
    
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - entry.count,
      reset: new Date(entry.resetTime),
      isUserLimit: false
    }
  }
}

// Enhanced IP extraction with security checks
export function getClientIP(request: NextRequest): string {
  const headers = [
    'cf-connecting-ip',
    'x-real-ip', 
    'x-forwarded-for',
    'x-client-ip',
    'x-cluster-client-ip'
  ]
  
  for (const header of headers) {
    const value = request.headers.get(header)
    if (value) {
      const ip = value.split(',')[0].trim()
      if (isValidIP(ip)) {
        return ip
      }
    }
  }
  
  return '127.0.0.1'
}

function isValidIP(ip: string): boolean {
  if (!ip) return false
  
  // Block localhost and private ranges in production
  if (process.env.NODE_ENV === 'production') {
    const privateRanges = [
      /^127\./,
      /^192\.168\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^169\.254\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/
    ]
    
    if (privateRanges.some(range => range.test(ip))) {
      return false
    }
  }
  
  // Basic IPv4/IPv6 validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}

// Pre-configured rate limiters with user support
export const partnerInviteRateLimit = createRateLimit({
  maxRequests: 3, // Reduced from 5
  windowMs: 60 * 60 * 1000, // 1 hour
  userMultiplier: 2 // Authenticated users get 6 per hour
})

export const accessRequestRateLimit = createRateLimit({
  maxRequests: 2, // Reduced from 3
  windowMs: 24 * 60 * 60 * 1000, // 24 hours  
  userMultiplier: 1.5 // Authenticated users get 3 per day
})

export const generalApiRateLimit = createRateLimit({
  maxRequests: 60, // Reduced from 100
  windowMs: 60 * 60 * 1000, // 1 hour
  userMultiplier: 3 // Authenticated users get 180 per hour
})

export const adminApiRateLimit = createRateLimit({
  maxRequests: 200,
  windowMs: 60 * 60 * 1000, // 1 hour
  userMultiplier: 5 // Admins get 1000 per hour
})

// Monitoring and management functions
export function getRateLimitStats(): MemoryStats & { 
  cleanupIntervalActive: boolean
  recentCleanups: number 
} {
  const stats = getMemoryStats()
  return {
    ...stats,
    cleanupIntervalActive: !!cleanupInterval,
    recentCleanups: 0 // Could track this if needed
  }
}

export function clearRateLimitCache(): { cleared: number; memoryFreed: string } {
  const totalCleared = requestCounts.size + userCounts.size
  const memoryFreed = `~${Math.round(totalCleared * 0.15)}KB`
  
  requestCounts.clear()
  userCounts.clear()
  memoryWarningLogged = false
  
  console.log(`[RateLimit] Manually cleared ${totalCleared} entries, freed ${memoryFreed}`)
  
  return { cleared: totalCleared, memoryFreed }
}

export function forceCleanup(): { removed: number; remaining: number } {
  const before = requestCounts.size + userCounts.size
  performCleanup()
  const after = requestCounts.size + userCounts.size
  
  return {
    removed: before - after,
    remaining: after
  }
}

export function getTopRateLimitedIPs(limit: number = 10): Array<{
  ip: string
  count: number
  resetTime: Date
  type: 'ip' | 'user'
}> {
  const entries: Array<{
    ip: string
    count: number  
    resetTime: Date
    type: 'ip' | 'user'
  }> = []
  
  for (const [key, entry] of requestCounts.entries()) {
    entries.push({
      ip: key,
      count: entry.count,
      resetTime: new Date(entry.resetTime),
      type: 'ip'
    })
  }
  
  for (const [key, entry] of userCounts.entries()) {
    entries.push({
      ip: key,
      count: entry.count,
      resetTime: new Date(entry.resetTime), 
      type: 'user'
    })
  }
  
  return entries
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

// Graceful shutdown
export function stopRateLimit(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
    cleanupInterval = null
  }
  
  const stats = getMemoryStats()
  console.log(`[RateLimit] Shutdown - clearing ${stats.ipEntries + stats.userEntries} entries`)
  
  requestCounts.clear()
  userCounts.clear()
  memoryWarningLogged = false
}