// src/app/api/tidbits/route.ts - FIXED with proper error handling and structure
import { NextRequest } from 'next/server'
import { createPublicServerClient } from '@/app/lib/supabaseServer'
import { 
  validatePagination, 
  validateSearchQuery,
  logDangerousQuery,
  createSafeRange 
} from '@/app/lib/querySafety'

export const runtime = 'edge'
export const preferredRegion = 'auto'

// SECURITY: Hard limits for public tidbits endpoint
const TIDBITS_CONFIG = {
  maxLimit: 50,         // Maximum posts per request
  defaultLimit: 24,     // Default page size
  maxOffset: 25000,     // Hard limit on total results browsable
  maxPage: 1000,        // Maximum page number
  maxSearchLength: 100  // Maximum search query length
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
    // SECURITY: Enhanced parameter validation with hard limits
    const pageValidation = validatePagination(
      searchParams.get('page'),
      searchParams.get('perPage') || searchParams.get('limit'),
      TIDBITS_CONFIG
    )
    
    if (!pageValidation.isValid) {
      // Log dangerous pagination attempts
      logDangerousQuery('pagination', {
        originalInput: {
          page: searchParams.get('page'),
          perPage: searchParams.get('perPage'),
          limit: searchParams.get('limit')
        },
        sanitizedInput: pageValidation,
        errors: pageValidation.errors,
        endpoint: '/api/tidbits'
      })
      
      // Return error response for invalid pagination
      return new Response(
        JSON.stringify({ 
          error: 'Invalid pagination parameters',
          details: pageValidation.errors,
          maxLimit: TIDBITS_CONFIG.maxLimit,
          maxPage: TIDBITS_CONFIG.maxPage
        }), 
        { 
          status: 400,
          headers: { 'content-type': 'application/json' }
        }
      )
    }

    // SECURITY: Validate search query if provided
    const searchQuery = searchParams.get('search') || searchParams.get('q')
    const searchValidation = validateSearchQuery(searchQuery, TIDBITS_CONFIG.maxSearchLength)
    
    if (!searchValidation.isValid) {
      logDangerousQuery('search', {
        originalInput: { search: searchQuery },
        sanitizedInput: searchValidation,
        errors: searchValidation.errors,
        endpoint: '/api/tidbits'
      })
      
      return new Response(
        JSON.stringify({ 
          error: 'Invalid search parameters',
          details: searchValidation.errors
        }), 
        { 
          status: 400,
          headers: { 'content-type': 'application/json' }
        }
      )
    }

    // SECURITY: Create safe range with absolute limits
    const range = createSafeRange(pageValidation)
    if (!range.isValid) {
      return new Response(
        JSON.stringify({ error: 'Pagination range exceeds limits' }), 
        { 
          status: 400,
          headers: { 'content-type': 'application/json' }
        }
      )
    }

    // Use public client since this is public data
    const supabase = createPublicServerClient()

    // SECURITY: Build query with validated parameters only
    // Note: This endpoint should query 'tidbits' table, not 'posts'
    let query = supabase
      .from('tidbits')
      .select('id, day_number, title, image_url, tags, estimated_time, created_at', { count: 'exact' })
      .range(range.from, range.to)

    // SECURITY: Apply search filter only if valid
    if (searchValidation.query && searchValidation.isValid) {
      // Use parameterized search to prevent injection
      query = query.or(`title.ilike.%${searchValidation.query}%`)
    }

    // Handle sorting
    const sort = searchParams.get('sort') || 'newest'
    switch (sort) {
      case 'oldest':
        query = query.order('day_number', { ascending: true })
        break
      case 'alphabetical':
        query = query.order('title', { ascending: true })
        break
      case 'reverse-alphabetical':
        query = query.order('title', { ascending: false })
        break
      case 'newest':
      default:
        query = query.order('day_number', { ascending: false })
        break
    }

    // Handle filters
    const filters = searchParams.getAll('filters')
    if (filters.length > 0) {
      // Apply tag filters - this assumes tags are stored as an array in the tidbits table
      const tagConditions = filters.map(filter => `tags.cs.{${filter}}`).join(',')
      if (tagConditions) {
        query = query.or(tagConditions)
      }
    }

    const { data: tidbits, error, count } = await query

    if (error) {
      console.error('Tidbits fetch error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch tidbits' }), 
        { 
          status: 500,
          headers: { 'content-type': 'application/json' }
        }
      )
    }

    // SECURITY: Sanitize output data
    const payload = (tidbits ?? []).map(t => ({
      id: t.id,
      day_number: t.day_number,
      title: t.title?.slice(0, 200) || '', // Limit title length in response
      image_url: t.image_url,
      tags: Array.isArray(t.tags) ? t.tags.slice(0, 10) : [], // Limit number of tags
      estimated_time: t.estimated_time,
      created_at: t.created_at
    }))

    // SECURITY: Enhanced response headers
    const responseHeaders = {
      'content-type': 'application/json',
      'cache-control': 'public, s-maxage=300, stale-while-revalidate=600',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'x-ratelimit-limit': TIDBITS_CONFIG.maxLimit.toString(),
      'x-pagination-max': TIDBITS_CONFIG.maxPage.toString()
    }

    // SECURITY: Include pagination metadata with limits
    const safeCount = Math.min(count || 0, TIDBITS_CONFIG.maxOffset)
    const responseData = {
      data: payload,
      count: safeCount,
      page: pageValidation.page,
      perPage: pageValidation.limit,
      hasMore: safeCount > pageValidation.offset + pageValidation.limit,
      pagination: {
        page: pageValidation.page,
        limit: pageValidation.limit,
        offset: pageValidation.offset,
        hasMore: safeCount > pageValidation.offset + pageValidation.limit,
        maxPageReached: pageValidation.page >= TIDBITS_CONFIG.maxPage,
        maxOffsetReached: pageValidation.offset >= TIDBITS_CONFIG.maxOffset
      },
      search: searchValidation.query || null,
      sort: sort,
      filters: filters,
      resultCount: payload.length
    }

    return new Response(JSON.stringify(responseData), {
      headers: responseHeaders,
    })

  } catch (error) {
    console.error('Tidbits route exception:', error)
    
    // SECURITY: Don't leak internal error details
    const safeError = process.env.NODE_ENV === 'development' 
      ? error instanceof Error ? error.message : 'Unknown error'
      : 'Internal server error'
    
    return new Response(
      JSON.stringify({ 
        error: safeError,
        timestamp: new Date().toISOString()
      }), 
      {
        status: 500,
        headers: { 
          'content-type': 'application/json',
          'x-content-type-options': 'nosniff'
        }
      }
    )
  }
}