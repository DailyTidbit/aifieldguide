// src/app/api/partners/request-access/route.ts - FIXED with hard query limits and enhanced security
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/app/lib/supabaseServer'
import { supabaseAdmin } from '@/app/lib/supabaseAdmin'
import { validateInput } from '@/app/lib/validationSchemas'
import { requireAdmin, getClientIP } from '@/app/lib/adminAuth'
import { 
  validateUrlSearchParams,
  createSafeRange,
  logDangerousQuery,
  createQueryErrorResponse
} from '@/app/lib/querySafety'

// SECURITY: Hard limits for partner requests
const PARTNER_REQUESTS_CONFIG = {
  maxLimit: 25,         // Reduced limit for sensitive data
  defaultLimit: 10,     // Conservative default
  maxOffset: 5000,      // Hard limit on total results
  maxPage: 200,         // Maximum page number
  allowedSortFields: ['created_at', 'status', 'company_name']
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    
    // SECURITY: Enhanced request size validation
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 5000) { // 5KB limit for partner requests
      return NextResponse.json(
        { success: false, message: 'Request too large' },
        { status: 413 }
      )
    }

    // Parse and validate request body with size limits
    let body
    try {
      const rawBody = await request.text()
      if (rawBody.length > 5000) {
        return NextResponse.json(
          { success: false, message: 'Request body too large' },
          { status: 413 }
        )
      }
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // Enhanced validation with our secure schemas
    const { accessRequestSchema } = await import('@/app/lib/validationSchemas')
    const validation = validateInput(accessRequestSchema, body)
    
    if (!validation.success) {
      // Log suspicious validation failures
      if (validation.errors.some(error => 
        error.includes('XSS') || 
        error.includes('SQL') || 
        error.includes('injection')
      )) {
        console.warn('SECURITY: Suspicious partner request validation failure:', {
          ip: clientIP,
          errors: validation.errors,
          userAgent: request.headers.get('user-agent')
        })
      }
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid input data',
          errors: validation.errors 
        },
        { status: 400 }
      )
    }

    const { email, companyName, message } = validation.data

    // SECURITY: Additional business logic validation
    if (!email || !companyName) {
      return NextResponse.json(
        { success: false, message: 'Email and company name are required' },
        { status: 400 }
      )
    }

    // SECURITY: Check for duplicate recent requests from same IP/email
    const recentTimeLimit = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours
    
    const { data: recentRequests, error: recentError } = await (supabaseAdmin as any)
      .from('partner_requests')
      .select('id, created_at')
      .or(`email.eq.${email},ip_address.eq.${clientIP}`)
      .gte('created_at', recentTimeLimit.toISOString())
      .limit(5) // Hard limit on check

    if (recentError && recentError.code !== 'PGRST116') {
      console.error('Error checking recent requests:', recentError)
    } else if (recentRequests && recentRequests.length >= 3) {
      // Too many recent requests from this email/IP
      return NextResponse.json({
        success: true, // Still return success to prevent enumeration
        message: "Thanks! If eligible, we'll review and reach out via email."
      })
    }

    // Insert partner request with enhanced security fields
    const insertData = {
      email,
      company_name: companyName,
      message: message || null,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Enhanced security tracking
      ip_address: clientIP,
      user_agent: request.headers.get('user-agent')?.slice(0, 500) || null, // Limit length
      request_source: 'api',
      validation_passed: true
    }

    const { error: insertError } = await (supabaseAdmin as any)
      .from('partner_requests')
      .insert(insertData)

    // Enhanced logging (success or failure)
    const logData = {
      user_id: null,
      action: insertError ? 'access_request_failed' : 'access_request_submitted',
      target_type: 'partner_request',
      target_id: email,
      details: { 
        companyName,
        hasMessage: !!message,
        ip: clientIP,
        error: insertError?.message || null,
        userAgent: request.headers.get('user-agent')
      },
      ip_address: clientIP,
      user_agent: request.headers.get('user-agent') || null,
      created_at: new Date().toISOString()
    }

    try {
      await (supabaseAdmin as any)
        .from('partner_security_logs')
        .insert(logData)
    } catch (logError) {
      console.error('Security log failed:', logError)
    }

    if (insertError) {
      console.error('Partner request insert failed:', insertError)
      // Still return success to prevent enumeration
    }

    // Always return generic success message
    return NextResponse.json({
      success: true,
      message: "Thanks! If eligible, we'll review and reach out via email."
    })

  } catch (error) {
    console.error('Partner request error:', error)
    // Always return success to prevent information leakage
    return NextResponse.json({
      success: true,
      message: "Thanks! If eligible, we'll review and reach out via email."
    })
  }
}

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    const url = new URL(request.url)
    
    // SECURITY: Validate all query parameters with hard limits
    const validation = validateUrlSearchParams(url.searchParams, PARTNER_REQUESTS_CONFIG)
    
    if (!validation.isValid) {
      logDangerousQuery('pagination', {
        originalInput: Object.fromEntries(url.searchParams.entries()),
        sanitizedInput: {
          pagination: validation.pagination,
          search: validation.search.query
        },
        errors: validation.allErrors,
        ip: clientIP,
        endpoint: '/api/partners/request-access'
      })
      
      return createQueryErrorResponse(validation.allErrors)
    }

    // Enhanced admin authentication
    const authResult = await requireAdmin(request)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const { admin } = authResult
    
    // Use validated parameters
    const { pagination, search } = validation
    const range = createSafeRange(pagination)
    
    if (!range.isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    // SECURITY: Validate status filter with whitelist
    const status = url.searchParams.get('status') || 'pending'
    const allowedStatuses = ['pending', 'approved', 'rejected', 'under_review']
    
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status filter' },
        { status: 400 }
      )
    }

    // Build secure query
    let query = (supabaseAdmin as any)
      .from('partner_requests')
      .select(`
        id,
        email,
        company_name,
        message,
        status,
        created_at,
        updated_at,
        ip_address,
        reviewed_at,
        invited_user_id
      `, { count: 'exact' })
      .eq('status', status)
      .range(range.from, range.to)

    // Apply search if provided and valid
    if (search.query && search.isValid) {
      query = query.or(`email.ilike.%${search.query}%,company_name.ilike.%${search.query}%`)
    }

    // Apply sorting (default to newest first)
    query = query.order('created_at', { ascending: false })

    const { data: requests, error, count } = await query

    if (error) {
      console.error('Partner requests query error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch partner requests' },
        { status: 500 }
      )
    }

    // SECURITY: Sanitize sensitive data in response
    const sanitizedRequests = (requests || []).map((req: any) => ({
      id: req.id,
      email: req.email,
      company_name: req.company_name,
      message: req.message,
      status: req.status,
      created_at: req.created_at,
      updated_at: req.updated_at,
      reviewed_at: req.reviewed_at,
      // Only include IP for admin security purposes (truncated)
      ip_address: req.ip_address ? req.ip_address.split('.').slice(0, 2).join('.') + '.xxx.xxx' : null
    }))

    // SECURITY: Limit total count disclosure
    const safeCount = Math.min(count || 0, PARTNER_REQUESTS_CONFIG.maxOffset)

    // Log admin access
    try {
      await (supabaseAdmin as any)
        .from('admin_logs')
        .insert({
          admin_user_id: admin.user_id,
          action: 'view_partner_requests',
          target_type: 'partner_requests',
          target_id: status,
          details: {
            status,
            resultsCount: sanitizedRequests.length,
            pagination,
            search: search.query
          },
          ip_address: clientIP,
          user_agent: request.headers.get('user-agent') || null,
          created_at: new Date().toISOString()
        })
    } catch (logError) {
      console.error('Admin log failed:', logError)
    }

    return NextResponse.json({
      success: true,
      requests: sanitizedRequests,
      pagination: {
        total: safeCount,
        page: pagination.page,
        limit: pagination.limit,
        offset: pagination.offset,
        hasMore: safeCount > pagination.offset + pagination.limit,
        maxReached: safeCount >= PARTNER_REQUESTS_CONFIG.maxOffset
      },
      filters: {
        status,
        search: search.query || null
      }
    })

  } catch (error) {
    console.error('Partner requests GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}