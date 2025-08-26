// src/app/lib/adminAuth.ts - Complete Secure Admin Authentication
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

export interface AdminUser {
  id: string
  user_id: string
  role: 'admin' | 'super_admin'
  permissions: string[]
  is_active: boolean
}

export interface AuditLogEntry {
  admin_user_id: string
  action: string
  target_type: string
  target_id: string
  details?: any
  ip_address?: string
  user_agent?: string
}

// Server-side admin authentication
export async function getAdminUser(): Promise<AdminUser | null> {
  try {
    const jar = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key for admin operations
      {
        cookies: {
          get(n: string) { return jar.get(n)?.value },
          set(n: string, v: string, o: any) { jar.set({ name: n, value: v, ...o }) },
          remove(n: string, o: any) { jar.set({ name: n, value: '', ...o }) },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return null

    // Check if user is an admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (adminError || !adminUser) return null

    // Update last login
    await supabase
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', adminUser.id)

    return adminUser
  } catch (error) {
    console.error('Admin auth error:', error)
    return null
  }
}

// Middleware for admin route protection
export async function requireAdmin(request: NextRequest): Promise<{ admin: AdminUser } | { error: string; status: number }> {
  const admin = await getAdminUser()
  
  if (!admin) {
    return { error: 'Admin authentication required', status: 401 }
  }

  return { admin }
}

// Check specific admin permissions
export function hasPermission(admin: AdminUser, permission: string): boolean {
  if (admin.role === 'super_admin') return true
  return admin.permissions.includes(permission)
}

// Audit logging function
export async function logAdminAction(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get: () => undefined,
          set: () => {},
          remove: () => {},
        },
      }
    )

    await supabase.rpc('log_admin_action', {
      p_admin_user_id: entry.admin_user_id,
      p_action: entry.action,
      p_target_type: entry.target_type,
      p_target_id: entry.target_id,
      p_details: entry.details || null,
      p_ip_address: entry.ip_address || null,
      p_user_agent: entry.user_agent || null
    })
  } catch (error) {
    console.error('Audit log error:', error)
    // Don't throw - audit log failure shouldn't break the operation
  }
}

// Rate limiting helper
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  limit: number = 100,
  windowMinutes: number = 15
): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get: () => undefined,
          set: () => {},
          remove: () => {},
        },
      }
    )

    const windowStart = new Date()
    windowStart.setMinutes(windowStart.getMinutes() - windowMinutes)

    // Clean old entries
    await supabase
      .from('rate_limits')
      .delete()
      .lt('window_start', windowStart.toISOString())

    // Get current count for this identifier/endpoint
    const { data: existing } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString())
      .single()

    const now = new Date()
    let requestCount = 1

    if (existing) {
      requestCount = existing.requests_count + 1
      
      if (requestCount > limit) {
        const resetTime = new Date(existing.window_start)
        resetTime.setMinutes(resetTime.getMinutes() + windowMinutes)
        
        return {
          allowed: false,
          remaining: 0,
          resetTime
        }
      }

      // Update count
      await supabase
        .from('rate_limits')
        .update({ requests_count: requestCount })
        .eq('id', existing.id)
    } else {
      // Create new entry
      await supabase
        .from('rate_limits')
        .insert({
          identifier,
          endpoint,
          requests_count: 1,
          window_start: now.toISOString()
        })
    }

    const resetTime = new Date(existing?.window_start || now)
    resetTime.setMinutes(resetTime.getMinutes() + windowMinutes)

    return {
      allowed: true,
      remaining: limit - requestCount,
      resetTime
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

// Get client IP address from NextRequest - FIXED
export function getClientIP(request: NextRequest): string {
  // Check forwarded headers first (most common in production)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip') // Cloudflare
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, get the first one
    return forwarded.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp.trim()
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp.trim()
  }
  
  // For development/local testing, you can extract from request.url
  // but this won't give you the actual client IP
  try {
    const url = new URL(request.url)
    // In development, this will likely be localhost
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      return '127.0.0.1'
    }
    return url.hostname
  } catch {
    // Fallback
    return 'unknown'
  }
}

// Helper to validate admin email addresses
export function isValidAdminEmail(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || []
  return adminEmails.includes(email)
}

// Helper to create admin user (use this for bootstrapping)
export async function createAdminUser(
  email: string,
  role: 'admin' | 'super_admin' = 'admin',
  permissions: string[] = []
): Promise<{ success: boolean; message: string; adminId?: string }> {
  try {
    if (!isValidAdminEmail(email)) {
      return { success: false, message: 'Email not in admin whitelist' }
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get: () => undefined,
          set: () => {},
          remove: () => {},
        },
      }
    )

    // Check if user exists in auth
    const { data: userList } = await supabase.auth.admin.listUsers()
    const user = userList?.users.find(u => u.email === email)

    if (!user) {
      return { success: false, message: 'User does not exist in auth system' }
    }

    // Check if already an admin
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingAdmin) {
      return { success: false, message: 'User is already an admin' }
    }

    // Create admin record
    const { data: newAdmin, error } = await supabase
      .from('admin_users')
      .insert({
        user_id: user.id,
        role,
        permissions,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error || !newAdmin) {
      console.error('Error creating admin user:', error)
      return { success: false, message: 'Failed to create admin record' }
    }

    return { 
      success: true, 
      message: `Admin user created successfully with role: ${role}`,
      adminId: newAdmin.id
    }

  } catch (error) {
    console.error('Create admin user error:', error)
    return { success: false, message: 'Internal error creating admin user' }
  }
}

// Environment validation
export function validateAdminEnvironment(): { valid: boolean; missing: string[] } {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SITE_URL',
    'ADMIN_EMAILS'
  ]

  const missing = required.filter(key => !process.env[key])

  return {
    valid: missing.length === 0,
    missing
  }
}