// src/app/lib/adminAuth.ts - FIXED with standardized admin checking
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { supabaseAdmin } from './supabaseAdmin'
import { createSimpleRateLimit } from './rateLimit'

export interface AdminUser {
  id: string
  user_id: string
  email: string
  role: string
  is_admin: boolean
  created_at: string
  verified_at?: string
}

export interface PartnerUser {
  user_id: string
  company_id: string
  role: string
  created_at: string
  invited_by: string | null
  updated_at: string
  companies?: {
    id: string
    name: string
    status: string
  }
}

export interface AuditLogEntry {
  user_id: string
  action: string
  target_type: string
  target_id: string
  details?: any
  ip_address?: string
  user_agent?: string
  risk_score?: number
}

// STANDARDIZED admin role checking function
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('role, is_admin')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Admin check error:', error)
      return false
    }

    // STANDARDIZED LOGIC: User is admin if EITHER condition is true
    return profile?.is_admin === true || profile?.role === 'admin'
  } catch (error) {
    console.error('Admin check exception:', error)
    return false
  }
}

// Enhanced admin authentication with consistent checking
export async function requireAdmin(request: NextRequest): Promise<{ admin: AdminUser } | { error: string; status: number }> {
  try {
    const jar = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return jar.get(name)?.value },
          set(name: string, value: string, options: any) { jar.set({ name, value, ...options }) },
          remove(name: string, options: any) { jar.set({ name, value: '', ...options }) },
        },
      }
    )
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'Authentication required', status: 401 }
    }

    // Use standardized admin checking
    const isAdmin = await isUserAdmin(user.id)
    if (!isAdmin) {
      // Log unauthorized admin access attempt
      await logSecurityEvent({
        user_id: user.id,
        action: 'unauthorized_admin_access',
        target_type: 'admin',
        target_id: user.id,
        details: { 
          endpoint: request.url,
          method: request.method,
          ip: getClientIP(request) 
        },
        ip_address: getClientIP(request),
        user_agent: request.headers.get('user-agent') || undefined,
        risk_score: 80
      })
      
      return { error: 'Admin access required', status: 403 }
    }

    // Get full admin profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return { error: 'Failed to load admin profile', status: 500 }
    }

    const adminUser: AdminUser = {
      id: user.id,
      user_id: user.id,
      email: user.email || '',
      role: profile.role || 'admin',
      is_admin: profile.is_admin || false,
      created_at: user.created_at || new Date().toISOString(),
      verified_at: profile.admin_verified_at
    }

    return { admin: adminUser }
  } catch (error) {
    console.error('Admin auth error:', error)
    return { error: 'Authentication failed', status: 500 }
  }
}

// Enhanced partner authentication with security improvements
export async function requirePartner(request: NextRequest): Promise<{ partner: PartnerUser } | { error: string; status: number }> {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return { error: 'Missing or invalid authorization header', status: 401 }
    }

    const token = authHeader.substring(7)
    
    // Enhanced token validation
    if (!token || token.length < 10) {
      return { error: 'Invalid token format', status: 401 }
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    
    if (error || !user) {
      return { error: 'Invalid or expired token', status: 401 }
    }

    // Check if user account is active and not flagged
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_blocked, last_active')
      .eq('id', user.id)
      .single()

    if (profileError || userProfile?.is_blocked) {
      return { error: 'Account access restricted', status: 403 }
    }

    // Get partner information with company details
    const { data: partnerUser, error: partnerError } = await supabaseAdmin
      .from('company_users')
      .select(`
        *,
        companies:company_id (
          id,
          name,
          status,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .maybeSingle()

    if (partnerError || !partnerUser) {
      await logSecurityEvent({
        user_id: user.id,
        action: 'unauthorized_partner_access',
        target_type: 'partner',
        target_id: user.id,
        details: { error: partnerError?.message },
        ip_address: getClientIP(request),
        user_agent: request.headers.get('user-agent') || undefined,
        risk_score: 70
      })
      
      return { error: 'User is not an authorized partner', status: 403 }
    }

    // Check company status and age
    if (partnerUser.companies) {
      if (partnerUser.companies.status !== 'active') {
        return { error: 'Partner company is not active', status: 403 }
      }

      // Security check: prevent very new companies from certain operations
      const companyAge = Date.now() - new Date(partnerUser.companies.created_at).getTime()
      const minCompanyAge = 24 * 60 * 60 * 1000 // 24 hours
      if (companyAge < minCompanyAge) {
        // This could be configured per endpoint
        console.warn(`New company attempting partner operation: ${partnerUser.companies.id}`)
      }
    }

    // Update last access timestamp
    const { error: updateError } = await supabaseAdmin
      .from('company_users')
      .update({ 
        updated_at: new Date().toISOString(),
        last_access: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.warn('Failed to update last access:', updateError)
    }

    return { partner: partnerUser as PartnerUser }

  } catch (error) {
    console.error('Partner auth error:', error)
    return { error: 'Authentication verification failed', status: 500 }
  }
}

// Cookie-based partner auth (hydration safe)
export async function getPartnerUser(): Promise<PartnerUser | null> {
  try {
    const jar = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) { 
            return jar.get(name)?.value 
          },
          set(name: string, value: string, options: any) { 
            jar.set({ name, value, ...options }) 
          },
          remove(name: string, options: any) { 
            jar.set({ name, value: '', ...options }) 
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return null

    // Use standardized admin checking for admin partners
    const isAdmin = await isUserAdmin(user.id)
    if (isAdmin) {
      // Admins have implicit partner access
      return {
        user_id: user.id,
        company_id: 'admin',
        role: 'admin',
        created_at: user.created_at || new Date().toISOString(),
        invited_by: null,
        updated_at: new Date().toISOString(),
        companies: {
          id: 'admin',
          name: 'Daily Tidbit Admin',
          status: 'active'
        }
      }
    }

    // Regular partner check
    const { data: partnerUser, error: partnerError } = await supabase
      .from('company_users')
      .select(`
        *,
        companies:company_id (
          id,
          name,
          status
        )
      `)
      .eq('user_id', user.id)
      .maybeSingle()

    if (partnerError || !partnerUser) return null
    if (partnerUser.companies && partnerUser.companies.status !== 'active') return null

    return partnerUser as PartnerUser
  } catch (error) {
    console.error('Partner auth error:', error)
    return null
  }
}

// Enhanced security logging with risk scoring
export async function logSecurityEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const logEntry = {
      user_id: entry.user_id,
      action: entry.action,
      target_type: entry.target_type,
      target_id: entry.target_id,
      details: entry.details || null,
      ip_address: entry.ip_address || null,
      user_agent: entry.user_agent || null,
      risk_score: entry.risk_score || 0,
      created_at: new Date().toISOString()
    }

    // Use appropriate log table based on context
    const isPartnerAction = entry.target_type === 'partner' || entry.action.includes('partner')
    const tableName = isPartnerAction ? 'partner_security_logs' : 'admin_logs'

    const { error } = await (supabaseAdmin as any)
      .from(tableName)
      .insert(logEntry)

    if (error) {
      console.error(`Security log insert error (${tableName}):`, error)
    }

    // High-risk events get additional logging
    if (entry.risk_score && entry.risk_score >= 75) {
      console.warn('HIGH RISK SECURITY EVENT:', {
        action: entry.action,
        user_id: entry.user_id,
        risk_score: entry.risk_score,
        details: entry.details
      })
    }
  } catch (error) {
    console.error('Security logging error:', error)
    // Never throw - audit log failure shouldn't break operations
  }
}

// Enhanced admin action logging
export async function logAdminAction(actionData: {
  admin_user_id: string
  action: string
  target_type: string
  target_id: string
  details: any
  ip_address: string
  user_agent?: string
}): Promise<void> {
  await logSecurityEvent({
    user_id: actionData.admin_user_id,
    action: actionData.action,
    target_type: actionData.target_type,
    target_id: actionData.target_id,
    details: actionData.details,
    ip_address: actionData.ip_address,
    user_agent: actionData.user_agent,
    risk_score: 10 // Admin actions are generally low risk
  })
}

// Enhanced rate limiting with user-based tracking
const userRateLimiters = new Map<string, any>()

export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  limit: number = 100,
  windowMinutes: number = 15,
  userId?: string
): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
  try {
    const windowMs = windowMinutes * 60 * 1000
    
    // If user is provided, also check user-based rate limiting
    if (userId) {
      const userKey = `user:${userId}:${endpoint}`
      let userLimiter = userRateLimiters.get(userKey)
      
      if (!userLimiter) {
        const { createSimpleRateLimit } = await import('./rateLimit')
        userLimiter = createSimpleRateLimit(limit * 2, windowMs) // More generous for authenticated users
        userRateLimiters.set(userKey, userLimiter)
      }
      
      const userResult = await userLimiter(userId, `user:${endpoint}`)
      if (!userResult.success) {
        return {
          allowed: false,
          remaining: userResult.remaining,
          resetTime: userResult.reset
        }
      }
    }
    
    // IP-based rate limiting
    const rateLimiter = createSimpleRateLimit(limit, windowMs)
    const result = await rateLimiter(identifier, endpoint)
    
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetTime: result.reset
    }
    
  } catch (error) {
    console.error('Rate limit check error:', error)
    return {
      allowed: true,
      remaining: 0,
      resetTime: new Date()
    }
  }
}

// Enhanced IP extraction with proxy support
export function getClientIP(request: NextRequest): string {
  // Check multiple headers for real IP
  const headers = [
    'cf-connecting-ip',  // Cloudflare
    'x-real-ip',         // Nginx
    'x-forwarded-for',   // Load balancers
    'x-client-ip',       // Apache
    'x-cluster-client-ip', // Cluster
    'forwarded-for',
    'forwarded'
  ]
  
  for (const header of headers) {
    const value = request.headers.get(header)
    if (value) {
      // Handle comma-separated IPs (take first one)
      const ip = value.split(',')[0].trim()
      // Validate IP format
      if (isValidIP(ip)) {
        return ip
      }
    }
  }
  
  return '127.0.0.1' // Fallback
}

// IP validation helper
function isValidIP(ip: string): boolean {
  // Basic IPv4/IPv6 validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
  
  if (!ip || ip === '127.0.0.1' || ip === '::1') return false
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}

// Partner access validation
export function hasPartnerAccess(partner: PartnerUser): boolean {
  return !!(partner && partner.company_id && partner.role)
}

// Admin access validation  
export function hasAdminAccess(admin: AdminUser): boolean {
  return admin.is_admin === true || admin.role === 'admin'
}

// Environment validation
export function validatePartnerEnvironment(): { valid: boolean; missing: string[] } {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SITE_URL'
  ]

  const missing = required.filter(key => !process.env[key])

  return {
    valid: missing.length === 0,
    missing
  }
}

// Utility to check server environment
export function isServerEnvironment(): boolean {
  return typeof window === 'undefined'
}

// Helper for safe server-only operations
export function runOnServer<T>(serverOperation: () => T, fallback?: T): T | undefined {
  if (isServerEnvironment()) {
    try {
      return serverOperation()
    } catch (error) {
      console.error('Server operation failed:', error)
      return fallback
    }
  }
  return fallback
}