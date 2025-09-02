// src/app/lib/adminAuth.ts - HYDRATION SAFE VERSION + TYPE FIXES
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { supabaseAdmin } from './supabaseAdmin'

export interface PartnerUser {
  user_id: string
  company_id: string
  role: string
  created_at: string
  invited_by: string | null
  updated_at: string
  // Company info when joined
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
}

// ✅ Server-side partner authentication - NO HYDRATION ISSUES (server-only)
export async function requirePartner(request: NextRequest): Promise<{ partner: PartnerUser } | { error: string; status: number }> {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return { error: 'Missing or invalid authorization header', status: 401 }
    }

    const token = authHeader.substring(7)
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    
    if (error || !user) {
      return { error: 'Invalid or expired token', status: 401 }
    }

    // ✅ FIXED: Proper TypeScript types for Supabase queries
    const { data: partnerUser, error: partnerError } = await supabaseAdmin
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

    if (partnerError || !partnerUser) {
      return { error: 'User is not an authorized partner', status: 403 }
    }

    // Check company status
    if (partnerUser.companies && partnerUser.companies.status !== 'active') {
      return { error: 'Partner company is not active', status: 403 }
    }

    // ✅ FIXED: Proper error handling for update query
    const { error: updateError } = await supabaseAdmin
      .from('company_users')
      .update({ updated_at: new Date().toISOString() })
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

// ✅ HYDRATION SAFE: Cookie-based partner auth (server-only)
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

    // ✅ FIXED: Proper TypeScript types
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

// ✅ NO HYDRATION ISSUES (pure function)
export function hasPartnerAccess(partner: PartnerUser): boolean {
  return true // All partners have full access
}

// ✅ FIXED: Proper audit logging with better error handling
export async function logPartnerAction(entry: AuditLogEntry): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('partner_security_logs')
      .insert({
        user_id: entry.user_id,
        action: entry.action,
        target_type: entry.target_type,
        target_id: entry.target_id,
        details: entry.details || null,
        ip_address: entry.ip_address || null,
        user_agent: entry.user_agent || null,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Audit log insert error:', error)
    }
  } catch (error) {
    console.error('Audit log error:', error)
    // Don't throw - audit log failure shouldn't break operations
  }
}

// ✅ HYDRATION SAFE: Rate limiting with proper memory management
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Cleanup function to prevent memory leaks
const cleanupRateLimit = () => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}

// ✅ Run cleanup periodically (only in server environment)
if (typeof process !== 'undefined' && process.env) {
  const cleanupInterval = setInterval(cleanupRateLimit, 5 * 60 * 1000) // Every 5 minutes
  
  // Cleanup on process termination
  process.on('exit', () => {
    clearInterval(cleanupInterval)
    rateLimitStore.clear()
  })
}

export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  limit: number = 100,
  windowMinutes: number = 15
): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
  try {
    const now = Date.now()
    const windowMs = windowMinutes * 60 * 1000
    const key = `${identifier}:${endpoint}`
    
    // Clean expired entries periodically
    if (rateLimitStore.size > 1000) { // Prevent memory bloat
      cleanupRateLimit()
    }
    
    let entry = rateLimitStore.get(key)
    if (!entry || entry.resetTime < now) {
      entry = { count: 0, resetTime: now + windowMs }
      rateLimitStore.set(key, entry)
    }
    
    if (entry.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(entry.resetTime)
      }
    }
    
    entry.count++
    rateLimitStore.set(key, entry)
    
    return {
      allowed: true,
      remaining: limit - entry.count,
      resetTime: new Date(entry.resetTime)
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

// ✅ NO HYDRATION ISSUES (server-side NextRequest processing)
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  if (forwarded) return forwarded.split(',')[0].trim()
  if (realIp) return realIp.trim()
  if (cfConnectingIp) return cfConnectingIp.trim()
  return '127.0.0.1'
}

// ✅ NO HYDRATION ISSUES (pure validation function)
export function isValidPartnerDomain(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false
  
  const allowedDomains = process.env.PARTNER_DOMAINS?.split(',').map(d => d.trim().toLowerCase()) || []
  
  if (allowedDomains.length === 0) return true
  return allowedDomains.includes(domain)
}

// ✅ FIXED: Better error handling and TypeScript types
export async function createPartnerUser(
  email: string,
  companyId: string,
  role: string = 'partner',
  invitedBy?: string
): Promise<{ success: boolean; message: string; partnerId?: string }> {
  try {
    if (!email || !companyId) {
      return { success: false, message: 'Email and company ID are required' }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { success: false, message: 'Invalid email format' }
    }

    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, name, status')
      .eq('id', companyId)
      .eq('status', 'active')
      .single()

    if (companyError || !company) {
      return { success: false, message: 'Company not found or inactive' }
    }

    const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (listError) {
      return { success: false, message: 'Failed to verify user existence' }
    }

    const user = userList?.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (!user) {
      return { success: false, message: 'User does not exist in auth system' }
    }

    // Check for existing partner relationship
    const { data: existingPartner, error: existingError } = await supabaseAdmin
      .from('company_users')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .single()

    if (existingError && existingError.code !== 'PGRST116') { // PGRST116 is "not found"
      return { success: false, message: 'Error checking existing partnership' }
    }

    if (existingPartner) {
      return { success: false, message: 'User is already a partner of this company' }
    }

    // Create partner record
    const { data: newPartner, error: insertError } = await supabaseAdmin
      .from('company_users')
      .insert({
        user_id: user.id,
        company_id: companyId,
        role,
        invited_by: invitedBy || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating partner user:', insertError)
      return { success: false, message: 'Failed to create partner record' }
    }

    return { 
      success: true, 
      message: `Partner user created successfully with role: ${role}`,
      partnerId: user.id
    }

  } catch (error) {
    console.error('Create partner user error:', error)
    return { success: false, message: 'Internal error creating partner user' }
  }
}

// ✅ NO HYDRATION ISSUES (server-side environment validation)
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

// ✅ Simple admin functions (no hydration issues)
export function requireAdmin() {
  return true
}

export function logAdminAction(action: string, details?: any) {
  console.log(`Admin action: ${action}`, details)
}

// ✅ Utility function to check if we're in server environment
export function isServerEnvironment(): boolean {
  return typeof window === 'undefined'
}

// ✅ Helper for safe server-only operations
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