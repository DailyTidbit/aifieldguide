// src/app/lib/adminAuth.ts - TypeScript errors fixed with type assertions
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

// Server-side partner authentication using Bearer token
export async function requirePartner(request: NextRequest): Promise<{ partner: PartnerUser } | { error: string; status: number }> {
  try {
    // Check for Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return { error: 'Missing or invalid authorization header', status: 401 }
    }

    const token = authHeader.substring(7)

    // Verify the token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    
    if (error || !user) {
      return { error: 'Invalid or expired token', status: 401 }
    }

    // Check if user is a partner in company_users table - TYPE ASSERTION FIX
    const { data: partnerUser, error: partnerError } = await (supabaseAdmin as any)
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

    // Check if their company is active
    if (partnerUser.companies && partnerUser.companies.status !== 'active') {
      return { error: 'Partner company is not active', status: 403 }
    }

    // Update last access time - TYPE ASSERTION FIX
    await (supabaseAdmin as any)
      .from('company_users')
      .update({ updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .then(({ error }: any) => {
        if (error) console.warn('Failed to update last access:', error)
      })

    return { partner: partnerUser as PartnerUser }

  } catch (error) {
    console.error('Partner auth error:', error)
    return { error: 'Authentication verification failed', status: 500 }
  }
}

// Alternative cookie-based partner auth for pages
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

    // Check if user is a partner - TYPE ASSERTION FIX
    const { data: partnerUser, error: partnerError } = await (supabase as any)
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

// Check if user has partner access (simplified - everyone with company_users record has full access)
export function hasPartnerAccess(partner: PartnerUser): boolean {
  return true // All partners have full access
}

// Audit logging function - TYPE ASSERTION FIX for partner_security_logs table
export async function logPartnerAction(entry: AuditLogEntry): Promise<void> {
  try {
    await (supabaseAdmin as any)
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
  } catch (error) {
    console.error('Audit log error:', error)
    // Don't throw - audit log failure shouldn't break the operation
  }
}

// Rate limiting helper with in-memory fallback
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

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
    
    // Clean expired entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k)
      }
    }
    
    // Get or create entry
    let entry = rateLimitStore.get(key)
    if (!entry || entry.resetTime < now) {
      entry = { count: 0, resetTime: now + windowMs }
      rateLimitStore.set(key, entry)
    }
    
    // Check limit
    if (entry.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(entry.resetTime)
      }
    }
    
    // Increment and store
    entry.count++
    rateLimitStore.set(key, entry)
    
    return {
      allowed: true,
      remaining: limit - entry.count,
      resetTime: new Date(entry.resetTime)
    }
    
  } catch (error) {
    console.error('Rate limit check error:', error)
    // Default to allowing on error
    return {
      allowed: true,
      remaining: 0,
      resetTime: new Date()
    }
  }
}

// Get client IP address from NextRequest
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  if (forwarded) return forwarded.split(',')[0].trim()
  if (realIp) return realIp.trim()
  if (cfConnectingIp) return cfConnectingIp.trim()
  return '127.0.0.1'
}

// Helper to validate partner email addresses (from environment)
export function isValidPartnerDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  const allowedDomains = process.env.PARTNER_DOMAINS?.split(',').map(d => d.trim().toLowerCase()) || []
  
  // If no domains specified, allow all
  if (allowedDomains.length === 0) return true
  
  return allowedDomains.includes(domain)
}

// Helper to create partner user (for bootstrapping)
export async function createPartnerUser(
  email: string,
  companyId: string,
  role: string = 'partner',
  invitedBy?: string
): Promise<{ success: boolean; message: string; partnerId?: string }> {
  try {
    // Check if company exists and is active
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('id, name, status')
      .eq('id', companyId)
      .eq('status', 'active')
      .single()

    if (!company) {
      return { success: false, message: 'Company not found or inactive' }
    }

    // Check if user exists in auth
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers()
    const user = userList?.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!user) {
      return { success: false, message: 'User does not exist in auth system' }
    }

    // Check if already a partner - TYPE ASSERTION FIX
    const { data: existingPartner } = await (supabaseAdmin as any)
      .from('company_users')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .single()

    if (existingPartner) {
      return { success: false, message: 'User is already a partner of this company' }
    }

    // Create partner record - TYPE ASSERTION FIX
    const { data: newPartner, error } = await (supabaseAdmin as any)
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

    if (error || !newPartner) {
      console.error('Error creating partner user:', error)
      return { success: false, message: 'Failed to create partner record' }
    }

    return { 
      success: true, 
      message: `Partner user created successfully with role: ${role}`,
      partnerId: newPartner.user_id
    }

  } catch (error) {
    console.error('Create partner user error:', error)
    return { success: false, message: 'Internal error creating partner user' }
  }
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