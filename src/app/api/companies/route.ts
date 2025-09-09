// src/app/api/companies/route.ts - FIXED with hard query limits and security
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/app/lib/supabaseServer'
import { supabaseAdmin } from '@/app/lib/supabaseAdmin'
import { requireAdmin, logAdminAction, getClientIP } from '@/app/lib/adminAuth'
import { 
  validateUrlSearchParams, 
  createSafeRange, 
  logDangerousQuery,
  createQueryErrorResponse 
} from '@/app/lib/querySafety'

// SECURITY: Hard limits for companies endpoint
const COMPANIES_CONFIG = {
  maxLimit: 50,        // Reduced from 100
  defaultLimit: 20,    // Reduced from 50  
  maxOffset: 10000,    // Hard limit on total results
  maxPage: 500,        // Maximum page number
  allowedSortFields: ['name', 'created_at', 'website', 'status']
}

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    const url = new URL(request.url)
    
    // SECURITY: Validate all query parameters with hard limits
    const validation = validateUrlSearchParams(url.searchParams, COMPANIES_CONFIG)
    
    if (!validation.isValid) {
      // Log dangerous query attempt
      logDangerousQuery('pagination', {
        originalInput: Object.fromEntries(url.searchParams.entries()),
        sanitizedInput: {
          pagination: validation.pagination,
          search: validation.search.query
        },
        errors: validation.allErrors,
        ip: clientIP,
        endpoint: '/api/companies'
      })
      
      return createQueryErrorResponse(validation.allErrors)
    }

    // Enhanced rate limiting with user context  
    const authResult = await requireAdmin(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { admin } = authResult
    
    // Use validated and sanitized parameters
    const { pagination, search, sort } = validation
    const range = createSafeRange(pagination)
    
    if (!range.isValid) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' }, 
        { status: 400 }
      )
    }

    // Build secure query with validated parameters
    let query = supabaseAdmin
      .from('companies')
      .select('id, name, website, created_at, status', { count: 'exact' })
      .range(range.from, range.to)

    // Apply validated search if provided
    if (search.query && search.isValid) {
      // SECURITY: Use parameterized search to prevent injection
      query = query.ilike('name', `%${search.query}%`)
    }

    // Apply validated sorting
    if (sort.sortBy && sort.isValid) {
      query = query.order(sort.sortBy, { ascending: sort.sortOrder === 'asc' })
    } else {
      // Default safe sorting
      query = query.order('created_at', { ascending: false })
    }

    const { data: companies, error, count } = await query

    if (error) {
      console.error('Companies query error:', error)
      
      // Log the database error for monitoring
      await logAdminAction({
        admin_user_id: admin.id,
        action: 'companies_query_failed',
        target_type: 'companies',
        target_id: 'query',
        details: { 
          error: error.message,
          pagination,
          search: search.query,
          sort 
        },
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent') || undefined
      })
      
      return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
    }

    // SECURITY: Validate count to prevent information leakage
    const safeCount = Math.min(count || 0, COMPANIES_CONFIG.maxOffset)

    // Log successful admin action
    await logAdminAction({
      admin_user_id: admin.id,
      action: 'list_companies',
      target_type: 'companies',
      target_id: 'list',
      details: { 
        limit: pagination.limit, 
        offset: pagination.offset, 
        search: search.query,
        resultsCount: companies?.length || 0,
        totalCount: safeCount
      },
      ip_address: clientIP,
      user_agent: request.headers.get('user-agent') || undefined
    })

    return NextResponse.json({
      companies: companies || [],
      pagination: {
        total: safeCount,
        page: pagination.page,
        limit: pagination.limit,
        offset: pagination.offset,
        hasMore: safeCount > pagination.offset + pagination.limit,
        maxReached: safeCount >= COMPANIES_CONFIG.maxOffset
      },
      search: search.query || null,
      sort: sort.sortBy ? { field: sort.sortBy, order: sort.sortOrder } : null
    })

  } catch (error) {
    console.error('Companies GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    
    // Enhanced admin authentication
    const authResult = await requireAdmin(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { admin } = authResult
    
    // SECURITY: Validate request body size (prevents DoS)
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 10000) { // 10KB limit
      return NextResponse.json({ error: 'Request too large' }, { status: 413 })
    }
    
    let body
    try {
      const rawBody = await request.text()
      if (rawBody.length > 10000) {
        return NextResponse.json({ error: 'Request body too large' }, { status: 413 })
      }
      body = JSON.parse(rawBody)
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    // Enhanced input validation using our secure schemas
    const { validateInput, companySchema } = await import('@/app/lib/validationSchemas')
    const validation = validateInput(companySchema, body)
    
    if (!validation.success) {
      await logAdminAction({
        admin_user_id: admin.id,
        action: 'company_creation_validation_failed',
        target_type: 'company',
        target_id: 'validation',
        details: { 
          errors: validation.errors,
          input: body
        },
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent') || undefined
      })
      
      return NextResponse.json({ 
        error: 'Invalid input data',
        details: validation.errors 
      }, { status: 400 })
    }

    const { name, website } = validation.data

    // SECURITY: Check if company name already exists (prevent duplicates)
    const { data: existingCompany, error: existingError } = await supabaseAdmin
      .from('companies')
      .select('id')
      .ilike('name', name)
      .maybeSingle()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing company:', existingError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (existingCompany) {
      await logAdminAction({
        admin_user_id: admin.id,
        action: 'company_creation_duplicate_attempted',
        target_type: 'company',
        target_id: name,
        details: { name, existingId: existingCompany.id },
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent') || undefined
      })
      
      return NextResponse.json({ error: 'Company name already exists' }, { status: 409 })
    }

    // Create company with transaction safety
    const { createUserWithTransaction } = await import('@/app/lib/transactionUtils')
    
    try {
      const { data: newCompany, error: createError } = await supabaseAdmin
        .from('companies')
        .insert({
          name,
          website: website || null,
          created_by: admin.user_id,
          status: 'active', // Explicit status
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
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

      // Create default company profile (with error handling)
      try {
        await supabaseAdmin
          .from('company_profiles')
          .insert({
            company_id: newCompany.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
      } catch (profileError) {
        console.warn('Failed to create company profile:', profileError)
        // Continue - profile can be created later
      }

      // Log successful creation
      await logAdminAction({
        admin_user_id: admin.id,
        action: 'company_created',
        target_type: 'company',
        target_id: newCompany.id,
        details: { 
          name: newCompany.name, 
          website: newCompany.website,
          companyId: newCompany.id
        },
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent') || undefined
      })

      return NextResponse.json({
        success: true,
        company: {
          id: newCompany.id,
          name: newCompany.name,
          website: newCompany.website,
          status: newCompany.status,
          created_at: newCompany.created_at
        },
        message: 'Company created successfully'
      }, { status: 201 })

    } catch (error) {
      console.error('Company creation transaction error:', error)
      
      await logAdminAction({
        admin_user_id: admin.id,
        action: 'company_creation_transaction_failed',
        target_type: 'company',
        target_id: name,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent') || undefined
      })
      
      return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
    }

  } catch (error) {
    console.error('Companies POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}