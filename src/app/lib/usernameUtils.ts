// src/app/lib/usernameUtils.ts - FIXED VERSION with race condition protection
import { getSupabaseBrowserClient } from './supabaseClient'
import { supabaseAdmin } from './supabaseAdmin'

export interface UsernameValidationResult {
  isValid: boolean
  error?: string
  suggestions?: string[]
}

export interface UsernameAssignmentResult {
  success: boolean
  username?: string
  error?: string
  retryAfter?: number
  suggestions?: string[]
}

// FIXED: Enhanced format validation with reserved word checking
const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'root', 'user', 'test', 'guest', 'null', 'undefined',
  'api', 'www', 'mail', 'email', 'support', 'help', 'info', 'contact',
  'about', 'privacy', 'terms', 'legal', 'blog', 'news', 'home', 'login',
  'signup', 'register', 'auth', 'account', 'profile', 'settings', 'config',
  'dashboard', 'panel', 'console', 'system', 'service', 'official',
  'dailytidbit', 'daily-tidbit', 'tidbit', 'ai', 'artificial', 'intelligence'
])

/**
 * FIXED: Enhanced username format validation
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

  // FIXED: More comprehensive regex
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

  // FIXED: Check for consecutive special characters
  if (/[-_]{2,}/.test(username)) {
    return { isValid: false, error: 'Username cannot contain consecutive hyphens or underscores' }
  }

  // FIXED: Check reserved usernames
  if (RESERVED_USERNAMES.has(username.toLowerCase())) {
    return { 
      isValid: false, 
      error: 'This username is reserved and cannot be used',
      suggestions: generateUsernameSuggestions(username)
    }
  }

  return { isValid: true }
}

/**
 * FIXED: Enhanced availability check with better error handling
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

    // FIXED: Check reserved usernames table with proper error handling
    const { data: reserved, error: reservedError } = await supabase
      .from('reserved_usernames')
      .select('username')
      .eq('username', username.toLowerCase())
      .maybeSingle()

    // FIXED: Only treat actual database errors as failures
    if (reservedError && reservedError.code !== 'PGRST116') {
      console.error('Reserved username check failed:', reservedError)
      return { isValid: false, error: 'Unable to validate username' }
    }

    if (reserved) {
      return { 
        isValid: false, 
        error: 'This username is reserved and cannot be used',
        suggestions: generateUsernameSuggestions(username)
      }
    }

    // FIXED: Check existing users with proper exclusion
    let query = supabase
      .from('profiles')
      .select('id')
      .eq('username', username)

    if (currentUserId) {
      query = query.neq('id', currentUserId)
    }

    const { data: existing, error: existingError } = await query.maybeSingle()

    // FIXED: Only treat actual database errors as failures
    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Username availability check failed:', existingError)
      return { isValid: false, error: 'Unable to validate username' }
    }

    if (existing) {
      return { 
        isValid: false, 
        error: 'This username is already taken',
        suggestions: generateUsernameSuggestions(username)
      }
    }

    return { isValid: true }
  } catch (error) {
    console.error('Username availability check exception:', error)
    return { isValid: false, error: 'Username validation service temporarily unavailable' }
  }
}

/**
 * FIXED: Auto-assign username with race condition protection
 */
export async function autoAssignUsername(
  userId: string,
  baseUsername?: string,
  maxRetries: number = 5
): Promise<UsernameAssignmentResult> {
  if (!userId) {
    return { success: false, error: 'User ID is required' }
  }

  // Generate base username from email or use provided base
  let username = baseUsername || generateRandomUsername()
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // FIXED: Use server-side admin client for atomic operations
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          username: username,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select('username')
        .single()

      if (!error && profile?.username) {
        return { 
          success: true, 
          username: profile.username 
        }
      }

      // FIXED: Handle constraint violations specifically
      if (error?.code === '23505') { // Unique constraint violation
        console.log(`Username ${username} taken, generating new one (attempt ${attempt})`)
        username = generateUniqueUsername(username, attempt)
        
        // FIXED: Add exponential backoff for race conditions
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100))
        }
        continue
      }

      // FIXED: Handle other database errors
      console.error(`Username assignment failed (attempt ${attempt}):`, error)
      
      if (attempt === maxRetries) {
        return { 
          success: false, 
          error: 'Failed to assign username after multiple attempts',
          retryAfter: 5000 // 5 seconds
        }
      }

      // Try with a new username on next attempt
      username = generateUniqueUsername(username, attempt)
      
    } catch (exception) {
      console.error(`Username assignment exception (attempt ${attempt}):`, exception)
      
      if (attempt === maxRetries) {
        return { 
          success: false, 
          error: 'Username assignment service temporarily unavailable',
          retryAfter: 10000 // 10 seconds
        }
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 200))
    }
  }

  return { 
    success: false, 
    error: 'Username assignment failed after all retry attempts',
    retryAfter: 30000 // 30 seconds
  }
}

/**
 * FIXED: Generate unique username variants to avoid collisions
 */
function generateUniqueUsername(baseUsername: string, attempt: number): string {
  const cleanBase = baseUsername.replace(/\d+$/, '') // Remove trailing numbers
  
  // Strategy varies by attempt number
  switch (attempt % 4) {
    case 1:
      return `${cleanBase}${Math.floor(Math.random() * 1000)}`
    case 2:
      return `${cleanBase}_${Math.floor(Math.random() * 100)}`
    case 3:
      return `${cleanBase}${Date.now().toString().slice(-4)}`
    default:
      return generateRandomUsername()
  }
}

/**
 * FIXED: Enhanced username suggestions with better variety
 */
export function generateUsernameSuggestions(baseUsername: string): string[] {
  const suggestions: string[] = []
  const base = baseUsername.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)
  
  if (!base) {
    // If base is empty, return random suggestions
    return Array.from({ length: 5 }, () => generateRandomUsername())
  }
  
  // Add numbers
  for (let i = 1; i <= 3; i++) {
    suggestions.push(`${base}${Math.floor(Math.random() * 1000)}`)
  }
  
  // Add suffixes
  const suffixes = ['_ai', '_pro', '_user', '_x', '_dev']
  suffixes.slice(0, 2).forEach(suffix => {
    const suggestion = `${base}${suffix}`
    if (suggestion.length <= 30) {
      suggestions.push(suggestion)
    }
  })
  
  return suggestions.slice(0, 5)
}

/**
 * FIXED: Enhanced random username generation
 */
export function generateRandomUsername(): string {
  const adjectives = [
    'quick', 'bright', 'clever', 'swift', 'bold', 'calm', 'wise', 'keen',
    'smart', 'cool', 'fast', 'sharp', 'light', 'strong', 'clear', 'deep'
  ]
  const nouns = [
    'fox', 'wolf', 'eagle', 'deer', 'bear', 'lion', 'owl', 'hawk',
    'cat', 'dog', 'fish', 'bird', 'star', 'moon', 'sun', 'wave'
  ]
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const number = Math.floor(Math.random() * 1000)
  
  return `${adjective}${noun}${number}`
}

/**
 * FIXED: Server-side username validation for auth actions
 */
export async function validateAndAssignUsername(
  userId: string, 
  preferredUsername?: string
): Promise<UsernameAssignmentResult> {
  // If preferred username provided, try it first
  if (preferredUsername) {
    const validation = validateUsernameFormat(preferredUsername)
    if (!validation.isValid) {
      return { 
        success: false, 
        error: validation.error 
      }
    }

    // Try to assign the preferred username
    const result = await autoAssignUsername(userId, preferredUsername, 1)
    if (result.success) {
      return result
    }
  }

  // Fall back to auto-generated username
  return autoAssignUsername(userId)
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
    .replace(/[-_]{2,}/g, '-') // Replace consecutive special chars
    .slice(0, 30)
}

/**
 * FIXED: Update username with proper validation and constraints
 */
export async function updateUsername(
  userId: string,
  newUsername: string
): Promise<UsernameAssignmentResult> {
  // Validate format
  const validation = validateUsernameFormat(newUsername)
  if (!validation.isValid) {
    return { success: false, error: validation.error }
  }

  // Check if user can change username
  try {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('username_changed')
      .eq('id', userId)
      .single()

    if (profileError) {
      return { success: false, error: 'Unable to verify username change eligibility' }
    }

    if (profile?.username_changed) {
      return { success: false, error: 'Username has already been changed and cannot be modified again' }
    }

    // FIXED: Atomic update with constraint handling
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        username: newUsername,
        username_changed: true,
        username_changed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .eq('username_changed', false) // Additional safety check
      .select('username')
      .single()

    if (updateError) {
      if (updateError.code === '23505') {
        return { 
          success: false, 
          error: 'This username is already taken',
          suggestions: generateUsernameSuggestions(newUsername)
        }
      }
      
      console.error('Username update error:', updateError)
      return { success: false, error: 'Failed to update username' }
    }

    return { success: true, username: updatedProfile.username }

  } catch (error) {
    console.error('Username update exception:', error)
    return { success: false, error: 'Username update service temporarily unavailable' }
  }
}