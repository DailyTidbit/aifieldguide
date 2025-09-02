// src/app/lib/validationSchemas.ts - Complete validation schemas for partner system
import { z } from 'zod'

// Partner invite validation schema - simplified for single-tier system
export const partnerInviteSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(254, 'Email too long')
    .toLowerCase()
    .transform(email => email.trim()),
  
  // Simplified role - single partner role with full access
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

// Access request validation schema
export const accessRequestSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(254, 'Email too long')
    .toLowerCase()
    .transform(email => email.trim()),
    
  companyName: z
    .string()
    .min(1, 'Company name is required')
    .max(100, 'Company name too long')
    .transform(name => name.trim()),
    
  message: z
    .string()
    .max(1000, 'Message too long')
    .optional()
    .transform(msg => msg?.trim())
})

// Company creation validation
export const companySchema = z.object({
  name: z
    .string()
    .min(1, 'Company name is required')
    .max(100, 'Company name too long')
    .transform(name => name.trim()),
    
  website: z
    .string()
    .url('Invalid website URL')
    .optional()
    .or(z.literal(''))
    .transform(url => url === '' ? null : url),
    
  domain: z
    .string()
    .regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid domain format')
    .optional()
    .or(z.literal(''))
    .transform(domain => domain === '' ? null : domain)
})

// Partner update validation schema
export const partnerUpdateSchema = z.object({
  id: z.string().uuid('Invalid partner ID format'),
  
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(254, 'Email too long')
    .toLowerCase()
    .transform(email => email.trim())
    .optional(),
    
  status: z
    .enum(['active', 'inactive'], {
      errorMap: () => ({ message: 'Status must be active or inactive' })
    })
    .optional(),
    
  role: z
    .enum(['partner', 'company_editor'], {
      errorMap: () => ({ message: 'Role must be partner or company_editor' })
    })
    .optional()
})

// Generic email validation
export const emailSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(254, 'Email too long')
    .toLowerCase()
    .transform(email => email.trim())
})

// General ID validation
export const idSchema = z.object({
  id: z.string().uuid('Invalid ID format')
})

// Pagination schema
export const paginationSchema = z.object({
  page: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'Page must be greater than 0')
    .default('1'),
    
  limit: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100')
    .default('20')
})

// Search schema
export const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Search query too long')
    .transform(query => query.trim()),
    
  ...paginationSchema.shape
})

// Status filter schema - simplified for partner system
export const statusFilterSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected'], {
    errorMap: () => ({ message: 'Status must be pending, approved, or rejected' })
  }).optional().default('pending')
})

// Partner authentication validation
export const partnerAuthSchema = z.object({
  token: z.string().min(1, 'Authentication token is required')
})

// Company member profile validation (for your existing table)
export const companyMemberProfileSchema = z.object({
  user_id: z.string().uuid('Invalid user ID format'),
  company_id: z.string().uuid('Invalid company ID format'),
  title: z.string().max(100, 'Title too long').optional(),
  phone: z.string().max(20, 'Phone number too long').optional()
})

// Partner security log validation
export const partnerSecurityLogSchema = z.object({
  user_id: z.string().uuid('Invalid user ID format').nullable(),
  action: z.string().min(1, 'Action is required').max(100, 'Action too long'),
  target_type: z.string().min(1, 'Target type is required').max(50, 'Target type too long'),
  target_id: z.string().min(1, 'Target ID is required').max(100, 'Target ID too long'),
  details: z.any().optional(),
  ip_address: z.string().ip().optional(),
  user_agent: z.string().max(500, 'User agent too long').optional()
})

// Admin API validation
export const adminApiKeySchema = z.object({
  authorization: z.string().startsWith('Bearer ', 'Must start with Bearer ')
})

// Password validation
export const passwordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
})

// Sign in validation
export const signInSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z.string().min(1, 'Password is required')
})

// Sign up validation
export const signUpSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  password: passwordSchema.shape.password
})

// Magic link validation
export const magicLinkSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  redirectTo: z.string().url('Invalid redirect URL').optional()
})

// Password reset validation
export const passwordResetSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase()
})

// Environment variable validation schema
export const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  ADMIN_API_KEY: z.string().min(32).optional(),
  RESEND_API_KEY: z.string().optional(),
  JWT_SECRET: z.string().min(32).optional()
})

// Validation helper function with better error formatting
export function validateInput<T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  const errors = result.error.errors.map(err => {
    const path = err.path.length > 0 ? `${err.path.join('.')}: ` : ''
    return `${path}${err.message}`
  })
  
  return { success: false, errors }
}

// Safe validate function (alternative name for consistency)
export const safeValidate = validateInput

// Environment validation helper
export function validateEnvironment(): { valid: boolean; missing: string[]; invalid: string[] } {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    ADMIN_API_KEY: process.env.ADMIN_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    JWT_SECRET: process.env.JWT_SECRET
  }

  const result = envSchema.safeParse(env)
  
  if (result.success) {
    return { valid: true, missing: [], invalid: [] }
  }

  const missing: string[] = []
  const invalid: string[] = []

  result.error.errors.forEach(err => {
    const field = err.path.join('.')
    if (err.code === 'invalid_type' && err.received === 'undefined') {
      missing.push(field)
    } else {
      invalid.push(`${field}: ${err.message}`)
    }
  })

  return { valid: false, missing, invalid }
}

// Type exports for TypeScript convenience
export type PartnerInviteInput = z.infer<typeof partnerInviteSchema>
export type AccessRequestInput = z.infer<typeof accessRequestSchema>
export type CompanyInput = z.infer<typeof companySchema>
export type PartnerUpdateInput = z.infer<typeof partnerUpdateSchema>
export type EmailInput = z.infer<typeof emailSchema>
export type IdInput = z.infer<typeof idSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type SearchInput = z.infer<typeof searchSchema>
export type StatusFilterInput = z.infer<typeof statusFilterSchema>
export type PartnerAuthInput = z.infer<typeof partnerAuthSchema>
export type CompanyMemberProfileInput = z.infer<typeof companyMemberProfileSchema>
export type PartnerSecurityLogInput = z.infer<typeof partnerSecurityLogSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type MagicLinkInput = z.infer<typeof magicLinkSchema>
export type PasswordResetInput = z.infer<typeof passwordResetSchema>