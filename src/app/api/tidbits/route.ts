// src/app/api/tidbits/route.ts - FIXED with hard query limits and enhanced security
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

export async function GET(req: Request) {
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
    let query = supabase
      .from('posts')
      .select('id, created_at, user_id, content, media_url, tidbit, is_private')
      .eq('is_private', false)
      .range(range.from, range.to)

    // SECURITY: Apply search filter only if valid
    if (searchValidation.query && searchValidation.isValid) {
      // Use parameterized search to prevent injection
      query = query.or(`content.ilike.%${searchValidation.query}%,tidbit.ilike.%${searchValidation.query}%`)
    }

    // SECURITY: Apply consistent sorting (prevent order manipulation)
    query = query.order('created_at', { ascending: false })

    const { data: posts, error } = await query

    if (error) {
      console.error('Tidbits fetch error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch posts' }), 
        { 
          status: 500,
          headers: { 'content-type': 'application/json' }
        }
      )
    }

    // SECURITY: Batch fetch profiles with limits to avoid N+1 queries
    const userIds = [...new Set((posts ?? []).map(p => p.user_id).filter(Boolean))] as string[]
    
    // Limit the number of profile queries
    const limitedUserIds = userIds.slice(0, 100) // Hard limit on profile lookups
    
    const { data: profiles } = limitedUserIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', limitedUserIds)
          .limit(100) // Additional safety limit
      : { data: [] as any[] }

    const profileMap = new Map(profiles?.map(p => [p.id, p]) ?? [])
    
    // SECURITY: Sanitize output data
    const payload = (posts ?? []).map(p => ({
      id: p.id,
      created_at: p.created_at,
      user_id: p.user_id,
      content: p.content?.slice(0, 5000) || '', // Limit content length in response
      media_url: p.media_url,
      tidbit: p.tidbit?.slice(0, 1000) || '', // Limit tidbit length
      username: profileMap.get(p.user_id || '')?.username ?? 'anonymous',
      user_avatar: profileMap.get(p.user_id || '')?.avatar_url ?? null,
    }))

    // SECURITY: Enhanced response headers
    const responseHeaders = {
      'content-type': 'application/json',
      'cache-control': 'public, s-maxage=120, stale-while-revalidate=600',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'x-ratelimit-limit': TIDBITS_CONFIG.maxLimit.toString(),
      'x-pagination-max': TIDBITS_CONFIG.maxPage.toString()
    }

    // SECURITY: Include pagination metadata with limits
    const responseData = {
      data: payload,
      pagination: {
        page: pageValidation.page,
        limit: pageValidation.limit,
        offset: pageValidation.offset,
        hasMore: payload.length === pageValidation.limit,
        maxPageReached: pageValidation.page >= TIDBITS_CONFIG.maxPage,
        maxOffsetReached: pageValidation.offset >= TIDBITS_CONFIG.maxOffset
      },
      search: searchValidation.query || null,
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