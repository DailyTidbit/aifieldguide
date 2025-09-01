// src/app/api/companies/route.ts - Updated for SSR Cookie Auth
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/app/lib/supabaseServer'
import { supabaseAdmin } from '@/app/lib/supabaseAdmin'
import { checkRateLimit, getClientIP } from '@/app/lib/adminAuth'

// Helper function to check admin status using cookie-based auth
async function requireAdmin(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'Authentication required', status: 401 }
    }

    // Get user profile to check admin status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return { error: 'Admin access required', status: 403 }
    }

    return { admin: { id: user.id, user_id: user.id } }
  } catch (error) {
    console.error('Admin auth error:', error)
    return { error: 'Authentication failed', status: 500 }
  }
}

// Helper function to log admin actions
async function logAdminAction(actionData: {
  admin_user_id: string
  action: string
  target_type: string
  target_id: string
  details: any
  ip_address: string
  user_agent?: string
}) {
  try {
    await supabaseAdmin
      .from('admin_logs')
      .insert({
        ...actionData,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Failed to log admin action:', error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    const rateLimit = await checkRateLimit(clientIP, 'list-companies', 100, 15)
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const authResult = await requireAdmin(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { admin } = authResult
    const { searchParams } = new URL(request.url)
    
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search')?.trim()

    let query = supabaseAdmin
      .from('companies')
      .select('id, name, website, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data: companies, error, count } = await query

    if (error) {
      throw error
    }

    await logAdminAction({
      admin_user_id: admin.id,
      action: 'list_companies',
      target_type: 'companies',
      target_id: 'list',
      details: { limit, offset, search, count },
      ip_address: clientIP,
      user_agent: request.headers.get('user-agent') || undefined
    })

    return NextResponse.json({
      companies: companies || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    const rateLimit = await checkRateLimit(clientIP, 'create-company', 20, 60) // 20 per hour
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const authResult = await requireAdmin(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { admin } = authResult
    
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { name, website } = body

    // Input validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    if (name.trim().length > 100) {
      return NextResponse.json({ error: 'Company name too long (max 100 characters)' }, { status: 400 })
    }

    if (website) {
      const urlRegex = /^https?:\/\/.+/
      if (!urlRegex.test(website)) {
        return NextResponse.json({ error: 'Invalid website URL format' }, { status: 400 })
      }
    }

    // Check if company name already exists
    const { data: existingCompany } = await supabaseAdmin
      .from('companies')
      .select('id')
      .ilike('name', name.trim())
      .single()

    if (existingCompany) {
      return NextResponse.json({ error: 'Company name already exists' }, { status: 409 })
    }

    // Create company
    const { data: newCompany, error: createError } = await supabaseAdmin
      .from('companies')
      .insert({
        name: name.trim(),
        website: website?.trim() || null,
        created_by: admin.user_id,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError || !newCompany) {
      console.error('Error creating company:', createError)
      
      await logAdminAction({
        admin_user_id: admin.id,
        action: 'company_creation_failed',
        target_type: 'company',
        target_id: name,
        details: { error: createError?.message, name, website },
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent') || undefined
      })

      return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
    }

    // Create default company profile
    await supabaseAdmin
      .from('company_profiles')
      .insert({
        company_id: newCompany.id,
        created_at: new Date().toISOString()
      })

    await logAdminAction({
      admin_user_id: admin.id,
      action: 'company_created',
      target_type: 'company',
      target_id: newCompany.id,
      details: { name: newCompany.name, website: newCompany.website },
      ip_address: clientIP,
      user_agent: request.headers.get('user-agent') || undefined
    })

    return NextResponse.json({
      success: true,
      company: newCompany,
      message: 'Company created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating company:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}