// src/app/lib/usernameUtils.ts - Username utility functions
import { getSupabaseBrowserClient } from './supabaseClient'

export interface UsernameValidationResult {
  isValid: boolean
  error?: string
  suggestions?: string[]
}

/**
 * Validate username format
 */
export function validateUsernameFormat(username: string): UsernameValidationResult {
  if (!username) {
    return { isValid: false, error: 'Username is required' }
  }

  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long' }
  }

  if (username.length > 30) {
    return { isValid: false, error: 'Username must be 30 characters or less' }
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { 
      isValid: false, 
      error: 'Username can only contain letters, numbers, underscores, and hyphens' 
    }
  }

  if (username.startsWith('-') || username.endsWith('-')) {
    return { isValid: false, error: 'Username cannot start or end with a hyphen' }
  }

  if (username.startsWith('_') || username.endsWith('_')) {
    return { isValid: false, error: 'Username cannot start or end with an underscore' }
  }

  return { isValid: true }
}

/**
 * Check if username is available
 */
export async function checkUsernameAvailability(
  username: string, 
  currentUserId?: string
): Promise<UsernameValidationResult> {
  const formatResult = validateUsernameFormat(username)
  if (!formatResult.isValid) {
    return formatResult
  }

  try {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      return { isValid: false, error: 'Authentication service unavailable' }
    }

    // Check if reserved
    const { data: reserved } = await supabase
      .from('reserved_usernames')
      .select('username')
      .eq('username', username.toLowerCase())
      .single()

    if (reserved) {
      return { 
        isValid: false, 
        error: 'This username is reserved and cannot be used',
        suggestions: generateUsernameSuggestions(username)
      }
    }

    // Check if taken by another user
    let query = supabase
      .from('profiles')
      .select('id')
      .eq('username', username)

    if (currentUserId) {
      query = query.neq('id', currentUserId)
    }

    const { data: existing } = await query.single()

    if (existing) {
      return { 
        isValid: false, 
        error: 'This username is already taken',
        suggestions: generateUsernameSuggestions(username)
      }
    }

    return { isValid: true }
  } catch (error) {
    // If we get here, likely means no match found (username available)
    return { isValid: true }
  }
}

/**
 * Generate username suggestions
 */
export function generateUsernameSuggestions(baseUsername: string): string[] {
  const suggestions: string[] = []
  const base = baseUsername.toLowerCase().replace(/[^a-z0-9]/g, '')
  
  // Add numbers
  for (let i = 1; i <= 5; i++) {
    suggestions.push(`${base}${i}`)
  }
  
  // Add random suffixes
  const suffixes = ['_dev', '_pro', '_2024', '_x', '_official']
  suffixes.forEach(suffix => {
    suggestions.push(`${base}${suffix}`)
  })
  
  // Add prefixes
  const prefixes = ['the_', 'real_', 'official_']
  prefixes.forEach(prefix => {
    if ((prefix + base).length <= 30) {
      suggestions.push(`${prefix}${base}`)
    }
  })
  
  return suggestions.slice(0, 5) // Return max 5 suggestions
}

/**
 * Format username for display
 */
export function formatUsername(username: string | null): string {
  if (!username) return ''
  return `@${username}`
}

/**
 * Create user profile URL
 */
export function createUserProfileUrl(username: string | null): string {
  if (!username) return '/profile'
  return `/user/${username}`
}

/**
 * Extract username from profile URL
 */
export function extractUsernameFromUrl(url: string): string | null {
  const match = url.match(/\/user\/([a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}

/**
 * Check if user can change username
 */
export function canChangeUsername(profile: { username_changed?: boolean }): boolean {
  return !profile.username_changed
}

/**
 * Get username change status message
 */
export function getUsernameChangeStatus(profile: { 
  username_changed?: boolean
  username_changed_at?: string | null 
}): string {
  if (!profile.username_changed) {
    return 'You can change your username one time'
  }
  
  if (profile.username_changed_at) {
    const changeDate = new Date(profile.username_changed_at)
    return `Username was changed on ${changeDate.toLocaleDateString()}`
  }
  
  return 'Username has been changed and cannot be modified again'
}

/**
 * Sanitize username input
 */
export function sanitizeUsername(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 30)
}

/**
 * Generate random username
 */
export function generateRandomUsername(): string {
  const adjectives = ['quick', 'bright', 'clever', 'swift', 'bold', 'calm', 'wise', 'keen']
  const nouns = ['fox', 'wolf', 'eagle', 'deer', 'bear', 'lion', 'owl', 'hawk']
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const number = Math.floor(Math.random() * 1000)
  
  return `${adjective}${noun}${number}`
}