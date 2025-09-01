// src/app/api/partners/request-access/route.ts - Updated for SSR Cookie Auth
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/app/lib/supabaseServer'
import { supabaseAdmin } from '@/app/lib/supabaseAdmin'
import { accessRequestSchema, validateInput } from '@/app/lib/validationSchemas'
import { checkRateLimit, getClientIP } from '@/app/lib/adminAuth'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 3 requests per hour per IP
    const clientIP = getClientIP(request)
    const rateLimit = await checkRateLimit(clientIP, 'request-access', 3, 60)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Too many requests. Please try again later.',
          resetTime: rateLimit.resetTime.toISOString()
        }, 
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '3',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.floor(rateLimit.resetTime.getTime() / 1000).toString()
          }
        }
      )
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // Validate with Zod schema
    const validation = validateInput(accessRequestSchema, body)
    if (!validation.success) {
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

    // Insert partner request - using type assertion for missing table types
    const { error: insertError } = await (supabaseAdmin as any)
      .from('partner_requests')
      .insert({
        email,
        company_name: companyName,
        message: message || null,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Track request metadata for security
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent') || null
      })

    if (insertError) {
      console.error('Partner request insert failed:', insertError)
      // Log the failure but still return success to prevent enumeration
      try {
        await (supabaseAdmin as any)
          .from('partner_security_logs')
          .insert({
            user_id: null, // No user for access requests
            action: 'access_request_failed',
            target_type: 'partner_request',
            target_id: email,
            details: { 
              error: insertError.message, 
              companyName,
              ip: clientIP 
            },
            ip_address: clientIP,
            user_agent: request.headers.get('user-agent') || null,
            created_at: new Date().toISOString()
          })
      } catch (logError) {
        console.error('Security log failed:', logError)
      }
    } else {
      // Log successful request
      try {
        await (supabaseAdmin as any)
          .from('partner_security_logs')
          .insert({
            user_id: null,
            action: 'access_request_submitted',
            target_type: 'partner_request',
            target_id: email,
            details: { 
              companyName,
              hasMessage: !!message,
              ip: clientIP 
            },
            ip_address: clientIP,
            user_agent: request.headers.get('user-agent') || null,
            created_at: new Date().toISOString()
          })
      } catch (logError) {
        console.error('Security log failed:', logError)
      }
    }

    // Always return generic success message to prevent enumeration
    return NextResponse.json({
      success: true,
      message: "Thanks! If eligible, we'll review and reach out via email."
    }, {
      headers: {
        'X-RateLimit-Limit': '3',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': Math.floor(rateLimit.resetTime.getTime() / 1000).toString()
      }
    })

  } catch (error) {
    console.error('Access request error:', error)
    // Return generic success even on errors to prevent information leakage
    return NextResponse.json({
      success: true,
      message: "Thanks! If eligible, we'll review and reach out via email."
    })
  }
}

export async function GET(request: NextRequest) {
  // Admin-only endpoint to list access requests - Updated to use cookie auth
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get user from cookie-based auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status filter' },
        { status: 400 }
      )
    }

    const { data: requests, error, count } = await (supabaseAdmin as any)
      .from('partner_requests')
      .select('*', { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      requests: requests || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('Error fetching partner requests:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch partner requests' },
      { status: 500 }
    )
  }
}