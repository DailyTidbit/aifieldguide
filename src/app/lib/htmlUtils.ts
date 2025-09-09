// src/app/lib/htmlUtils.ts - HTML escaping for security
'use server'

/**
 * Escape HTML characters to prevent XSS attacks
 */
export function escapeHtml(unsafe: string): string {
  if (!unsafe || typeof unsafe !== 'string') return ''
  
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Escape HTML attributes specifically
 */
export function escapeHtmlAttribute(unsafe: string): string {
  if (!unsafe || typeof unsafe !== 'string') return ''
  
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '&#10;')
    .replace(/\r/g, '&#13;')
}

/**
 * Simple email validation
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Sanitize company name for safe display
 */
export function sanitizeCompanyName(name: string): string {
  if (!name || typeof name !== 'string') return 'Unknown Company'
  
  // Remove any HTML tags and escape remaining content
  const stripped = name.replace(/<[^>]*>/g, '')
  return escapeHtml(stripped.trim()).slice(0, 100) // Limit length
}

/**
 * Safe URL validation and escaping
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return ''
  
  try {
    const parsed = new URL(url)
    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return ''
    }
    return escapeHtmlAttribute(url)
  } catch {
    return ''
  }
}

/**
 * Template function for safe email HTML generation
 */
export function createSafeEmailTemplate(template: string, variables: Record<string, string>): string {
  let safeTemplate = template
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`
    const escapedValue = escapeHtml(value)
    safeTemplate = safeTemplate.replace(new RegExp(placeholder, 'g'), escapedValue)
  }
  
  return safeTemplate
}