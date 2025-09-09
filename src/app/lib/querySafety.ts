// src/app/lib/querySafety.ts - CRITICAL: Hard query limits and safety
'use server'

export interface SafePaginationParams {
  page: number
  limit: number
  offset: number
  maxOffset: number
  isValid: boolean
  errors: string[]
}

export interface QuerySafetyConfig {
  maxLimit?: number
  defaultLimit?: number
  maxOffset?: number
  maxPage?: number
  allowZeroResults?: boolean
}

// HARD LIMITS - These cannot be exceeded regardless of user input
const ABSOLUTE_MAX_LIMIT = 100
const ABSOLUTE_MAX_OFFSET = 50000 
const ABSOLUTE_MAX_PAGE = 1000
const DEFAULT_LIMIT = 20

// Security constants
const MAX_SEARCH_LENGTH = 200
const MAX_SORT_FIELDS = 5
const ALLOWED_SORT_ORDERS = ['asc', 'desc'] as const

/**
 * CRITICAL: Validate and sanitize pagination parameters with hard limits
 */
export function validatePagination(
  rawPage: string | number | null | undefined,
  rawLimit: string | number | null | undefined,
  config: QuerySafetyConfig = {}
): SafePaginationParams {
  const errors: string[] = []
  
  // Apply config with security defaults
  const maxLimit = Math.min(config.maxLimit || ABSOLUTE_MAX_LIMIT, ABSOLUTE_MAX_LIMIT)
  const defaultLimit = Math.min(config.defaultLimit || DEFAULT_LIMIT, maxLimit)
  const maxOffset = Math.min(config.maxOffset || ABSOLUTE_MAX_OFFSET, ABSOLUTE_MAX_OFFSET)
  const maxPage = Math.min(config.maxPage || ABSOLUTE_MAX_PAGE, ABSOLUTE_MAX_PAGE)
  
  // Parse and validate page
  let page = 1
  if (rawPage !== null && rawPage !== undefined) {
    const parsedPage = typeof rawPage === 'string' ? parseInt(rawPage, 10) : Number(rawPage)
    if (isNaN(parsedPage) || parsedPage < 1) {
      errors.push('Page must be a positive integer')
      page = 1
    } else if (parsedPage > maxPage) {
      errors.push(`Page cannot exceed ${maxPage}`)
      page = maxPage
    } else {
      page = parsedPage
    }
  }
  
  // Parse and validate limit
  let limit = defaultLimit
  if (rawLimit !== null && rawLimit !== undefined) {
    const parsedLimit = typeof rawLimit === 'string' ? parseInt(rawLimit, 10) : Number(rawLimit)
    if (isNaN(parsedLimit) || parsedLimit < 1) {
      errors.push('Limit must be a positive integer')
      limit = defaultLimit
    } else if (parsedLimit > maxLimit) {
      errors.push(`Limit cannot exceed ${maxLimit}`)
      limit = maxLimit
    } else {
      limit = parsedLimit
    }
  }
  
  // Calculate offset with safety checks
  const offset = (page - 1) * limit
  if (offset > maxOffset) {
    errors.push(`Offset cannot exceed ${maxOffset} (page ${page} with limit ${limit} = ${offset})`)
    // Adjust to maximum safe values
    const maxSafePage = Math.floor(maxOffset / limit) + 1
    page = maxSafePage
    const adjustedOffset = (page - 1) * limit
    
    return {
      page,
      limit,
      offset: adjustedOffset,
      maxOffset,
      isValid: false,
      errors: [...errors, `Adjusted to page ${page} (offset ${adjustedOffset})`]
    }
  }
  
  return {
    page,
    limit,
    offset,
    maxOffset,
    isValid: errors.length === 0,
    errors
  }
}

/**
 * CRITICAL: Validate search queries to prevent injection and abuse
 */
export function validateSearchQuery(
  query: string | null | undefined,
  maxLength: number = MAX_SEARCH_LENGTH
): { query: string; isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!query || typeof query !== 'string') {
    return { query: '', isValid: true, errors: [] }
  }
  
  // Length check
  if (query.length > maxLength) {
    errors.push(`Search query too long (max ${maxLength} characters)`)
    return { query: query.slice(0, maxLength), isValid: false, errors }
  }
  
  // Clean and validate the query
  const cleanQuery = query.trim()
  
  if (cleanQuery.length === 0) {
    return { query: '', isValid: true, errors: [] }
  }
  
  // Security patterns to block
  const dangerousPatterns = [
    /['"]/g,                    // Quotes (SQL injection)
    /;\s*$/,                    // Trailing semicolon
    /--/,                       // SQL comments
    /\/\*/,                     // Multi-line comments
    /\bunion\b/i,              // SQL UNION
    /\bselect\b/i,             // SQL SELECT
    /\binsert\b/i,             // SQL INSERT
    /\bupdate\b/i,             // SQL UPDATE
    /\bdelete\b/i,             // SQL DELETE
    /\bdrop\b/i,               // SQL DROP
    /<script/i,                 // XSS
    /javascript:/i,             // XSS
    /on\w+\s*=/i,              // Event handlers
  ]
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(cleanQuery)) {
      errors.push('Search query contains invalid characters')
      break
    }
  }
  
  // Additional validation for SQL-like patterns
  if (cleanQuery.includes('\\') || cleanQuery.includes('\x00')) {
    errors.push('Search query contains invalid escape sequences')
  }
  
  return {
    query: cleanQuery,
    isValid: errors.length === 0,
    errors
  }
}

/**
 * CRITICAL: Validate sort parameters to prevent injection
 */
export function validateSortParams(
  sortBy: string | string[] | null | undefined,
  sortOrder: string | null | undefined,
  allowedFields: string[] = []
): {
  sortBy: string | null
  sortOrder: 'asc' | 'desc'
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  let validSortBy: string | null = null
  let validSortOrder: 'asc' | 'desc' = 'desc'
  
  // Validate sort order
  if (sortOrder && typeof sortOrder === 'string') {
    const normalizedOrder = sortOrder.toLowerCase()
    if (ALLOWED_SORT_ORDERS.includes(normalizedOrder as 'asc' | 'desc')) {
      validSortOrder = normalizedOrder as 'asc' | 'desc'
    } else {
      errors.push('Invalid sort order. Must be "asc" or "desc"')
    }
  }
  
  // Validate sort field
  if (sortBy) {
    let fieldToValidate = ''
    
    if (Array.isArray(sortBy)) {
      if (sortBy.length > MAX_SORT_FIELDS) {
        errors.push(`Too many sort fields (max ${MAX_SORT_FIELDS})`)
        return { sortBy: null, sortOrder: validSortOrder, isValid: false, errors }
      }
      fieldToValidate = sortBy[0] // Use first field only for now
    } else if (typeof sortBy === 'string') {
      fieldToValidate = sortBy
    }
    
    if (fieldToValidate) {
      // Security check for field name
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fieldToValidate)) {
        errors.push('Invalid sort field format')
      } else if (allowedFields.length > 0 && !allowedFields.includes(fieldToValidate)) {
        errors.push(`Sort field "${fieldToValidate}" is not allowed`)
      } else {
        validSortBy = fieldToValidate
      }
    }
  }
  
  return {
    sortBy: validSortBy,
    sortOrder: validSortOrder,
    isValid: errors.length === 0,
    errors
  }
}

/**
 * CRITICAL: Create safe Supabase range query with absolute limits
 */
export function createSafeRange(pagination: SafePaginationParams): {
  from: number
  to: number
  isValid: boolean
} {
  if (!pagination.isValid) {
    // Return minimal safe range for invalid pagination
    return { from: 0, to: DEFAULT_LIMIT - 1, isValid: false }
  }
  
  const { offset, limit } = pagination
  
  // Double-check against absolute limits
  if (offset > ABSOLUTE_MAX_OFFSET) {
    console.error(`SECURITY: Offset ${offset} exceeds absolute maximum ${ABSOLUTE_MAX_OFFSET}`)
    return { from: 0, to: DEFAULT_LIMIT - 1, isValid: false }
  }
  
  if (limit > ABSOLUTE_MAX_LIMIT) {
    console.error(`SECURITY: Limit ${limit} exceeds absolute maximum ${ABSOLUTE_MAX_LIMIT}`)
    return { from: offset, to: offset + ABSOLUTE_MAX_LIMIT - 1, isValid: false }
  }
  
  return {
    from: offset,
    to: offset + limit - 1,
    isValid: true
  }
}

/**
 * CRITICAL: Validate and sanitize URL search parameters
 */
export function validateUrlSearchParams(
  searchParams: URLSearchParams,
  config: QuerySafetyConfig & {
    allowedSortFields?: string[]
    requireAuth?: boolean
  } = {}
): {
  pagination: SafePaginationParams
  search: { query: string; isValid: boolean; errors: string[] }
  sort: { sortBy: string | null; sortOrder: 'asc' | 'desc'; isValid: boolean; errors: string[] }
  isValid: boolean
  allErrors: string[]
} {
  const rawPage = searchParams.get('page')
  const rawLimit = searchParams.get('limit') || searchParams.get('perPage')
  const rawSearch = searchParams.get('search') || searchParams.get('q')
  const rawSortBy = searchParams.get('sortBy') || searchParams.get('sort')
  const rawSortOrder = searchParams.get('sortOrder') || searchParams.get('order')
  
  const pagination = validatePagination(rawPage, rawLimit, config)
  const search = validateSearchQuery(rawSearch)
  const sort = validateSortParams(rawSortBy, rawSortOrder, config.allowedSortFields)
  
  const allErrors = [
    ...pagination.errors,
    ...search.errors,
    ...sort.errors
  ]
  
  return {
    pagination,
    search,
    sort,
    isValid: pagination.isValid && search.isValid && sort.isValid,
    allErrors
  }
}

/**
 * CRITICAL: Log dangerous query attempts for security monitoring
 */
export function logDangerousQuery(
  type: 'pagination' | 'search' | 'sort',
  details: {
    originalInput: any
    sanitizedInput: any
    errors: string[]
    userId?: string
    ip?: string
    endpoint?: string
  }
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type: 'dangerous_query_attempt',
    queryType: type,
    details: {
      ...details,
      riskScore: calculateRiskScore(details.errors)
    }
  }
  
  // Log high-risk attempts
  if (logEntry.details.riskScore >= 75) {
    console.warn('HIGH RISK QUERY ATTEMPT:', logEntry)
  } else if (logEntry.details.riskScore >= 50) {
    console.warn('SUSPICIOUS QUERY ATTEMPT:', logEntry)
  }
  
  // In production, this should go to your security logging system
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to security monitoring service (Sentry, DataDog, etc.)
  }
}

function calculateRiskScore(errors: string[]): number {
  let score = 0
  
  for (const error of errors) {
    if (error.includes('SQL') || error.includes('injection')) score += 40
    if (error.includes('XSS') || error.includes('script')) score += 40
    if (error.includes('exceed') || error.includes('too large')) score += 20
    if (error.includes('invalid')) score += 10
  }
  
  return Math.min(score, 100)
}

/**
 * Helper: Create standardized error response for invalid queries
 */
export function createQueryErrorResponse(
  errors: string[],
  statusCode: number = 400
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Invalid query parameters',
      details: errors,
      timestamp: new Date().toISOString()
    }),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Query-Validation': 'failed'
      }
    }
  )
}

/**
 * Middleware helper: Apply query safety to any endpoint
 */
export function withQuerySafety<T extends any[]>(
  handler: (...args: T) => Promise<Response>,
  config: QuerySafetyConfig & { allowedSortFields?: string[] } = {}
) {
  return async (...args: T): Promise<Response> => {
    try {
      // Extract request from arguments (usually first argument)
      const request = args[0] as Request
      const url = new URL(request.url)
      const validation = validateUrlSearchParams(url.searchParams, config)
      
      if (!validation.isValid) {
        logDangerousQuery('pagination', {
          originalInput: Object.fromEntries(url.searchParams.entries()),
          sanitizedInput: {
            pagination: validation.pagination,
            search: validation.search.query,
            sort: validation.sort
          },
          errors: validation.allErrors,
          endpoint: url.pathname
        })
        
        return createQueryErrorResponse(validation.allErrors)
      }
      
      // Call original handler with validated parameters
      return await handler(...args)
    } catch (error) {
      console.error('Query safety middleware error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500 }
      )
    }
  }
}