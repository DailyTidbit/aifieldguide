// src/app/lib/validationSchemas.ts - ENHANCED with security validation
import { z } from 'zod'

// Enhanced email validation with security checks
const secureEmailSchema = z
  .string()
  .email('Invalid email format')
  .min(3, 'Email too short')
  .max(254, 'Email too long')
  .toLowerCase()
  .transform(email => email.trim())
  .refine(email => {
    // Block common test/temp email patterns
    const suspiciousPatterns = [
      /test|temp|fake|spam|noreply|donotreply/i,
      /\d{8,}@/, // Long numeric sequences
      /\.{2,}/, // Multiple consecutive dots
      /@\./, // Dot immediately after @
    ]
    return !suspiciousPatterns.some(pattern => pattern.test(email))
  }, 'Email appears to be invalid or temporary')

// Enhanced company name validation
const secureCompanyNameSchema = z
  .string()
  .min(1, 'Company name is required')
  .max(100, 'Company name too long')
  .transform(name => name.trim())
  .refine(name => {
    // Block HTML/script injection attempts
    const dangerousPatterns = [
      /<script/i,
      /<iframe/i, 
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /on\w+\s*=/i, // Event handlers like onclick=
    ]
    return !dangerousPatterns.some(pattern => pattern.test(name))
  }, 'Company name contains invalid characters')
  .refine(name => {
    // Ensure reasonable character set
    return /^[\w\s\-.,&()]+$/.test(name)
  }, 'Company name contains invalid characters')

// Enhanced search validation with length and injection protection
const secureSearchSchema = z
  .string()
  .min(1, 'Search query is required') 
  .max(200, 'Search query too long') // Reduced from 100
  .transform(query => query.trim())
  .refine(query => {
    // Block SQL injection attempts
    const sqlPatterns = [
      /['"]/g, // Quotes
      /;/g, // Semicolons
      /--/g, // SQL comments
      /\/\*/g, // Multi-line comments
      /\bunion\b/i,
      /\bselect\b/i,
      /\binsert\b/i,
      /\bupdate\b/i,
      /\bdelete\b/i,
      /\bdrop\b/i,
    ]
    return !sqlPatterns.some(pattern => pattern.test(query))
  }, 'Search query contains invalid characters')

// Enhanced URL validation 
const secureUrlSchema = z
  .string()
  .url('Invalid URL format')
  .max(2000, 'URL too long')
  .refine(url => {
    try {
      const parsed = new URL(url)
      // Only allow http/https
      return ['http:', 'https:'].includes(parsed.protocol)
    } catch {
      return false
    }
  }, 'URL must use HTTP or HTTPS protocol')
  .refine(url => {
    try {
      const parsed = new URL(url)
      // Block suspicious domains
      const blockedDomains = [
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        '10.',
        '192.168.',
        '172.16.',
        'bit.ly', // Could be used for suspicious redirects
        'tinyurl.com',
      ]
      return !blockedDomains.some(domain => 
        parsed.hostname.includes(domain)
      )
    } catch {
      return false
    }
  }, 'URL contains blocked domain')

// Enhanced message validation
const secureMessageSchema = z
  .string()
  .max(2000, 'Message too long') // Reduced from 1000
  .optional()
  .transform(msg => msg?.trim())
  .refine(msg => {
    if (!msg) return true
    // Block potential XSS/injection
    const dangerousPatterns = [
      /<script/i,
      /<iframe/i,
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /on\w+\s*=/i,
    ]
    return !dangerousPatterns.some(pattern => pattern.test(msg))
  }, 'Message contains invalid content')

// UPDATED SCHEMAS using secure validation

export const partnerInviteSchema = z.object({
  email: secureEmailSchema,
  role: z
    .enum(['partner', 'company_editor'], {
      errorMap: () => ({ message: 'Role must be partner or company_editor' })
    })
    .optional()
    .default('partner'),
  requestId: z
    .string()
    .uuid('Invalid request ID format')
    .optional()
})

export const accessRequestSchema = z.object({
  email: secureEmailSchema,
  companyName: secureCompanyNameSchema,
  message: secureMessageSchema
})

export const companySchema = z.object({
  name: secureCompanyNameSchema,
  website: secureUrlSchema
    .optional()
    .or(z.literal(''))
    .transform(url => url === '' ? null : url),
  domain: z
    .string()
    .regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid domain format')
    .max(253, 'Domain too long')
    .optional()
    .or(z.literal(''))
    .transform(domain => domain === '' ? null : domain)
})

// Enhanced search with security
export const searchSchema = z.object({
  query: secureSearchSchema,
  page: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0 && val <= 1000, 'Page must be between 1 and 1000') // Hard limit
    .default('1'),
  limit: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100')
    .default('20')
})

// Enhanced pagination with hard limits
export const paginationSchema = z.object({
  page: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0 && val <= 1000, 'Page must be between 1 and 1000')
    .default('1'),
  limit: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100')
    .default('20'),
  offset: z
    .number()
    .min(0)
    .max(100000) // Hard limit on offset
    .optional()
    .default(0)
})

// Enhanced admin authentication
export const adminApiKeySchema = z.object({
  authorization: z
    .string()
    .startsWith('Bearer ', 'Must start with Bearer ')
    .min(40, 'API key too short') // Minimum 32 char key + "Bearer "
    .max(200, 'API key too long')
})

// Enhanced password validation
export const passwordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .refine(password => {
      // Block common weak passwords
      const weakPatterns = [
        /^password/i,
        /^123456/,
        /^qwerty/i,
        /^admin/i,
        /^letmein/i,
      ]
      return !weakPatterns.some(pattern => pattern.test(password))
    }, 'Password is too common')
})

// Rate limiting validation
export const rateLimitRequestSchema = z.object({
  identifier: z.string().min(1).max(100),
  action: z.string().min(1).max(50),
  maxRequests: z.number().min(1).max(10000),
  windowMs: z.number().min(1000).max(24 * 60 * 60 * 1000) // Max 24 hours
})

// Request size validation middleware schema
export const requestSizeSchema = z.object({
  maxSizeBytes: z.number().min(1).max(50 * 1024 * 1024), // Max 50MB
  contentType: z.string().optional()
})

// Environment validation with security focus
export const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  ADMIN_API_KEY: z.string().min(32).optional(),
  RESEND_API_KEY: z.string().min(10).optional(),
  JWT_SECRET: z.string().min(32).optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional()
})

// Security headers validation
export const securityHeadersSchema = z.object({
  'content-security-policy': z.string().optional(),
  'x-frame-options': z.enum(['DENY', 'SAMEORIGIN']).optional(),
  'x-content-type-options': z.literal('nosniff').optional(),
  'referrer-policy': z.enum(['strict-origin-when-cross-origin', 'no-referrer']).optional(),
  'permissions-policy': z.string().optional()
})

// Enhanced validation helper with detailed error reporting
export function validateInput<T>(
  schema: z.ZodSchema<T>, 
  data: unknown,
  context?: string
): { success: true; data: T } | { success: false; errors: string[]; details?: any } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  const errors = result.error.errors.map(err => {
    const path = err.path.length > 0 ? `${err.path.join('.')}: ` : ''
    return `${path}${err.message}`
  })

  // Log validation failures for security monitoring
  if (context) {
    console.warn(`Validation failed for ${context}:`, {
      errors,
      inputType: typeof data,
      hasData: !!data
    })
  }
  
  return { 
    success: false, 
    errors,
    details: process.env.NODE_ENV === 'development' ? result.error.errors : undefined
  }
}

// Enhanced environment validation with security checks
export function validateEnvironment(): { 
  valid: boolean; 
  missing: string[]; 
  invalid: string[];
  security: string[]
} {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    ADMIN_API_KEY: process.env.ADMIN_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV
  }

  const result = envSchema.safeParse(env)
  
  const missing: string[] = []
  const invalid: string[] = []
  const security: string[] = []

  if (!result.success) {
    result.error.errors.forEach(err => {
      const field = err.path.join('.')
      if (err.code === 'invalid_type' && err.received === 'undefined') {
        missing.push(field)
      } else {
        invalid.push(`${field}: ${err.message}`)
      }
    })
  }

  // Additional security checks
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.ADMIN_API_KEY || process.env.ADMIN_API_KEY.length < 32) {
      security.push('ADMIN_API_KEY must be at least 32 characters in production')
    }
    
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      security.push('JWT_SECRET must be at least 32 characters in production')
    }
    
    if (process.env.NEXT_PUBLIC_SITE_URL?.includes('localhost')) {
      security.push('NEXT_PUBLIC_SITE_URL cannot use localhost in production')
    }
  }

  return { 
    valid: result.success && invalid.length === 0 && security.length === 0, 
    missing, 
    invalid: [...invalid, ...security],
    security 
  }
}

// Export types for TypeScript
export type PartnerInviteInput = z.infer<typeof partnerInviteSchema>
export type AccessRequestInput = z.infer<typeof accessRequestSchema>
export type CompanyInput = z.infer<typeof companySchema>
export type SearchInput = z.infer<typeof searchSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type SecurityHeadersInput = z.infer<typeof securityHeadersSchema>