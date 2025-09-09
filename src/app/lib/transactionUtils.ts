// src/app/lib/transactionUtils.ts - Transaction safety and race condition protection
'use server'

import { supabaseAdmin } from './supabaseAdmin'

export interface TransactionResult<T = any> {
  success: boolean
  data?: T
  error?: string
  retryable?: boolean
  rollbackPerformed?: boolean
}

export interface CreateUserTransactionData {
  email: string
  password?: string
  fullName?: string
  companyId?: string
  role?: string
  invitedBy?: string
  metadata?: Record<string, any>
}

export interface UserCreationResult {
  success: boolean
  userId?: string
  profileCreated?: boolean
  usernameAssigned?: boolean
  companyMembershipCreated?: boolean
  error?: string
  retryable?: boolean
  rollbackPerformed?: boolean
  rollbackErrors?: string[]
}

/**
 * Safely create a user with profile and company membership in a coordinated transaction
 * Handles rollback if any step fails
 */
export async function createUserWithTransaction(
  data: CreateUserTransactionData,
  maxRetries: number = 3
): Promise<UserCreationResult> {
  let attempt = 0
  let lastError: string = ''

  while (attempt < maxRetries) {
    attempt++
    
    try {
      const result = await executeUserCreationTransaction(data)
      
      if (result.success) {
        return result
      }
      
      // If not retryable, return immediately
      if (!result.retryable) {
        return result
      }
      
      lastError = result.error || 'Unknown error'
      
      // Exponential backoff for retries
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      }
      
    } catch (error) {
      console.error(`User creation attempt ${attempt} failed:`, error)
      lastError = error instanceof Error ? error.message : 'Transaction failed'
      
      // Wait before retry
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      }
    }
  }

  return {
    success: false,
    error: `Failed after ${maxRetries} attempts. Last error: ${lastError}`,
    rollbackPerformed: false
  }
}

/**
 * Execute the actual user creation transaction
 */
async function executeUserCreationTransaction(
  data: CreateUserTransactionData
): Promise<UserCreationResult> {
  const createdResources: {
    userId?: string
    profileCreated?: boolean
    usernameAssigned?: boolean
    companyMembershipCreated?: boolean
  } = {}

  const rollbackErrors: string[] = []

  try {
    // Step 1: Create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.fullName || '',
        has_password: !!data.password,
        created_via: 'transaction',
        invited_by: data.invitedBy,
        ...data.metadata
      }
    })

    if (authError || !authUser.user) {
      return {
        success: false,
        error: `Auth user creation failed: ${authError?.message}`,
        retryable: authError?.message?.includes('rate_limit') || false
      }
    }

    createdResources.userId = authUser.user.id

    // Step 2: Generate unique username
    let username: string | null = null
    try {
      const { autoAssignUsername } = await import('./usernameUtils')
      const usernameResult = await autoAssignUsername(
        authUser.user.id,
        data.fullName ? generateUsernameFromName(data.fullName) : undefined
      )
      
      if (usernameResult.success) {
        username = usernameResult.username || null
        createdResources.usernameAssigned = true
      }
    } catch (usernameError) {
      console.warn('Username assignment failed during user creation:', usernameError)
      // Continue without username - can be assigned later
    }

    // Step 3: Create profile with atomic upsert
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authUser.user.id,
        full_name: data.fullName?.trim() || null,
        username: username,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      })

    if (profileError) {
      // Rollback auth user
      await rollbackAuthUser(authUser.user.id, rollbackErrors)
      return {
        success: false,
        error: `Profile creation failed: ${profileError.message}`,
        retryable: profileError.code === '23505', // Unique constraint violation
        rollbackPerformed: true,
        rollbackErrors
      }
    }

    createdResources.profileCreated = true

    // Step 4: Create company membership if requested
    if (data.companyId && data.role) {
      const { error: membershipError } = await supabaseAdmin
        .from('company_users')
        .insert({
          user_id: authUser.user.id,
          company_id: data.companyId,
          role: data.role,
          invited_by: data.invitedBy || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (membershipError) {
        // Rollback profile and auth user
        await rollbackProfile(authUser.user.id, rollbackErrors)
        await rollbackAuthUser(authUser.user.id, rollbackErrors)
        
        return {
          success: false,
          error: `Company membership creation failed: ${membershipError.message}`,
          retryable: membershipError.code === '23505', // Unique constraint violation
          rollbackPerformed: true,
          rollbackErrors
        }
      }

      createdResources.companyMembershipCreated = true
    }

    // Success - all steps completed
    return {
      success: true,
      userId: authUser.user.id,
      profileCreated: createdResources.profileCreated,
      usernameAssigned: createdResources.usernameAssigned,
      companyMembershipCreated: createdResources.companyMembershipCreated
    }

  } catch (error) {
    console.error('User creation transaction failed:', error)
    
    // Perform rollback
    let rollbackPerformed = false
    
    if (createdResources.userId) {
      if (createdResources.companyMembershipCreated && data.companyId) {
        await rollbackCompanyMembership(createdResources.userId, data.companyId, rollbackErrors)
        rollbackPerformed = true
      }
      
      if (createdResources.profileCreated) {
        await rollbackProfile(createdResources.userId, rollbackErrors)
        rollbackPerformed = true
      }
      
      await rollbackAuthUser(createdResources.userId, rollbackErrors)
      rollbackPerformed = true
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown transaction error',
      retryable: true,
      rollbackPerformed,
      rollbackErrors: rollbackErrors.length > 0 ? rollbackErrors : undefined
    }
  }
}

/**
 * Rollback functions for cleanup
 */
async function rollbackAuthUser(userId: string, errors: string[]): Promise<void> {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (error) {
      errors.push(`Failed to rollback auth user: ${error.message}`)
    }
  } catch (error) {
    errors.push(`Failed to rollback auth user: ${error}`)
  }
}

async function rollbackProfile(userId: string, errors: string[]): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)
    
    if (error) {
      errors.push(`Failed to rollback profile: ${error.message}`)
    }
  } catch (error) {
    errors.push(`Failed to rollback profile: ${error}`)
  }
}

async function rollbackCompanyMembership(userId: string, companyId: string, errors: string[]): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('company_users')
      .delete()
      .eq('user_id', userId)
      .eq('company_id', companyId)
    
    if (error) {
      errors.push(`Failed to rollback company membership: ${error.message}`)
    }
  } catch (error) {
    errors.push(`Failed to rollback company membership: ${error}`)
  }
}

/**
 * Generate username from full name with safety checks
 */
function generateUsernameFromName(fullName: string): string {
  if (!fullName || typeof fullName !== 'string') return ''
  
  // Extract first and last name, clean them up
  const nameParts = fullName.trim().toLowerCase()
    .replace(/[^a-z\s]/g, '') // Remove non-letters except spaces
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2) // Take first two parts
  
  if (nameParts.length === 0) return ''
  
  if (nameParts.length === 1) {
    // Single name - use it directly
    const username = nameParts[0].slice(0, 20)
    return username.length >= 3 ? username : ''
  }
  
  // Multiple names - combine first and last
  const firstName = nameParts[0]
  const lastName = nameParts[nameParts.length - 1]
  
  // Try different combinations
  const combinations = [
    `${firstName}${lastName}`, // johnsmith
    `${firstName}_${lastName}`, // john_smith
    `${firstName}${lastName.charAt(0)}`, // johns
    `${firstName.charAt(0)}${lastName}`, // jsmith
  ]
  
  for (const combo of combinations) {
    if (combo.length >= 3 && combo.length <= 30) {
      return combo
    }
  }
  
  // Fallback to just first name
  return firstName.length >= 3 ? firstName.slice(0, 30) : ''
}

/**
 * Safe database operation with retry logic
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<TransactionResult<T>> {
  let attempt = 0
  let lastError: any

  while (attempt < maxRetries) {
    attempt++
    
    try {
      const result = await operation()
      return { success: true, data: result }
    } catch (error) {
      lastError = error
      console.error(`Operation attempt ${attempt} failed:`, error)
      
      // Check if error is retryable
      const isRetryable = isRetryableError(error)
      if (!isRetryable || attempt >= maxRetries) {
        break
      }
      
      // Exponential backoff with jitter
      const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  return {
    success: false,
    error: lastError instanceof Error ? lastError.message : 'Operation failed',
    retryable: isRetryableError(lastError)
  }
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: any): boolean {
  if (!error) return false
  
  const retryableCodes = [
    '08000', // Connection exception
    '08003', // Connection does not exist
    '08006', // Connection failure
    '57P01', // Admin shutdown
    '53300', // Too many connections
    '40001', // Serialization failure
    '40P01', // Deadlock detected
  ]
  
  const retryableMessages = [
    'connection',
    'timeout',
    'rate_limit',
    'too many',
    'deadlock',
    'conflict'
  ]
  
  const errorCode = error.code || error.error_code
  const errorMessage = (error.message || '').toLowerCase()
  
  return retryableCodes.includes(errorCode) ||
         retryableMessages.some(msg => errorMessage.includes(msg))
}

/**
 * Atomic username assignment with race condition protection
 */
export async function assignUsernameAtomically(
  userId: string,
  preferredUsername?: string
): Promise<TransactionResult<string>> {
  return executeWithRetry(async () => {
    // Import dynamically to avoid circular dependencies
    const { validateAndAssignUsername } = await import('./usernameUtils')
    
    const result = await validateAndAssignUsername(userId, preferredUsername)
    
    if (!result.success) {
      throw new Error(result.error || 'Username assignment failed')
    }
    
    return result.username || ''
  })
}

/**
 * Safe company user creation with conflict resolution
 */
export async function createCompanyUserSafely(
  userId: string,
  companyId: string,
  role: string,
  invitedBy?: string
): Promise<TransactionResult<void>> {
  return executeWithRetry(async () => {
    // Check if membership already exists
    const { data: existing } = await supabaseAdmin
      .from('company_users')
      .select('id')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .maybeSingle()
    
    if (existing) {
      throw new Error('User is already a member of this company')
    }
    
    // Atomic insert with conflict handling
    const { error } = await supabaseAdmin
      .from('company_users')
      .insert({
        user_id: userId,
        company_id: companyId,
        role,
        invited_by: invitedBy || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (error) {
      throw error
    }
  })
}

/**
 * Batch operation with partial success handling
 */
export async function executeBatchOperation<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  options: {
    batchSize?: number
    continueOnError?: boolean
    maxRetries?: number
  } = {}
): Promise<{
  success: boolean
  results: Array<{ success: boolean; data?: R; error?: string; item: T }>
  totalProcessed: number
  totalSuccessful: number
  totalFailed: number
}> {
  const {
    batchSize = 10,
    continueOnError = true,
    maxRetries = 3
  } = options
  
  const results: Array<{ success: boolean; data?: R; error?: string; item: T }> = []
  let totalSuccessful = 0
  let totalFailed = 0
  
  // Process in batches
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    
    const batchPromises = batch.map(async (item) => {
      const result = await executeWithRetry(
        () => operation(item),
        maxRetries
      )
      
      const itemResult = {
        success: result.success,
        data: result.data,
        error: result.error,
        item
      }
      
      if (result.success) {
        totalSuccessful++
      } else {
        totalFailed++
        if (!continueOnError) {
          throw new Error(`Batch operation failed on item: ${result.error}`)
        }
      }
      
      return itemResult
    })
    
    try {
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    } catch (error) {
      // If continueOnError is false and we reach here, stop processing
      break
    }
  }
  
  return {
    success: totalFailed === 0,
    results,
    totalProcessed: results.length,
    totalSuccessful,
    totalFailed
  }
}