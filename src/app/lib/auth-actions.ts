// src/app/lib/auth-actions.ts - FIXED VERSION with username race condition protection
'use server'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from './supabaseServer'
import { supabaseAdmin } from './supabaseAdmin'
import { validateAndAssignUsername, autoAssignUsername } from './usernameUtils'

// Consistent return type for all auth actions
type AuthActionResult = {
  success?: boolean
  error?: string
  message?: string
}

// FIXED: Enhanced signup with race condition protection
export async function signUpAction(prevState: AuthActionResult | null, formData: FormData): Promise<AuthActionResult> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  if (!email || !password || !fullName) {
    return { error: 'All fields are required' }
  }

  try {
    const supabase = await createServerSupabaseClient()

    // FIXED: Create user first, then handle profile creation separately
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          password_set: true,
        },
      },
    })

    if (error) {
      return { error: error.message }
    }

    // FIXED: Handle profile creation with better error handling
    if (data.user) {
      try {
        // Use admin client for atomic profile creation with username assignment
        const usernameResult = await validateAndAssignUsername(
          data.user.id,
          generateUsernameFromName(fullName) // Try to use their name first
        )

        if (!usernameResult.success) {
          console.warn('Username assignment failed during signup:', usernameResult.error)
          // Continue anyway - username can be assigned later
        }

        // FIXED: Create profile with upsert to handle race conditions
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: data.user.id,
            full_name: fullName.trim(),
            username: usernameResult.username || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id',
            ignoreDuplicates: false
          })

        if (profileError) {
          console.error('Profile creation error during signup:', profileError)
          // Don't fail the signup for profile creation issues
        }

      } catch (profileException) {
        console.error('Profile creation exception during signup:', profileException)
        // Continue - profile can be created later via middleware
      }
    }

    // Handle different signup outcomes
    if (data.user && !data.session) {
      redirect('/auth?message=Check your email to confirm your account')
    }

    if (data.session) {
      redirect('/')
    }

    return { success: true, message: 'Account created successfully' }
  } catch (error) {
    console.error('Signup error:', error)
    return { error: 'Failed to create account' }
  }
}

// FIXED: Enhanced signin with profile creation fallback
export async function signInAction(prevState: AuthActionResult | null, formData: FormData): Promise<AuthActionResult> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirectTo') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) {
      return { error: error.message }
    }

    // FIXED: Ensure profile exists with username assignment
    if (data.user) {
      try {
        // Check if profile exists
        const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
          .from('profiles')
          .select('id, username')
          .eq('id', data.user.id)
          .maybeSingle()

        // FIXED: Handle missing profiles or profiles without usernames
        if (profileCheckError && profileCheckError.code !== 'PGRST116') {
          console.error('Profile check error during signin:', profileCheckError)
        }

        let needsUsernameAssignment = false

        if (!existingProfile) {
          // Create missing profile
          needsUsernameAssignment = true
          
          const { error: createError } = await supabaseAdmin
            .from('profiles')
            .upsert({
              id: data.user.id,
              full_name: data.user.user_metadata?.full_name || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id',
              ignoreDuplicates: false
            })

          if (createError) {
            console.error('Profile creation error during signin:', createError)
          }
        } else if (!existingProfile.username) {
          // Profile exists but missing username
          needsUsernameAssignment = true
        }

        // FIXED: Assign username if needed
        if (needsUsernameAssignment) {
          const usernameResult = await autoAssignUsername(data.user.id)
          if (!usernameResult.success) {
            console.warn('Username assignment failed during signin:', usernameResult.error)
            // Continue anyway - username can be assigned later
          }
        }

      } catch (profileException) {
        console.error('Profile handling exception during signin:', profileException)
        // Continue with signin - profile issues can be resolved later
      }
    }

    // Successful login - redirect
    if (redirectTo && redirectTo !== 'null') {
      redirect(redirectTo)
    } else {
      redirect('/')
    }
  } catch (error) {
    console.error('Signin error:', error)
    return { error: 'Failed to sign in' }
  }
}

export async function signOutAction(): Promise<never> {
  const supabase = await createServerSupabaseClient()
  
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Sign out error:', error)
  }

  redirect('/auth')
}

export async function resetPasswordAction(prevState: AuthActionResult | null, formData: FormData): Promise<AuthActionResult> {
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Email is required' }
  }

  try {
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset`,
      }
    )

    if (error) {
      return { error: error.message }
    }

    return { 
      success: true, 
      message: 'Password reset email sent. Check your inbox.' 
    }
  } catch (error) {
    return { error: 'Failed to send reset email' }
  }
}

export async function updatePasswordAction(formData: FormData): Promise<never> {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || !confirmPassword) {
    redirect('/auth/reset?error=Both password fields are required')
  }

  if (password !== confirmPassword) {
    redirect('/auth/reset?error=Passwords do not match')
  }

  if (password.length < 6) {
    redirect('/auth/reset?error=Password must be at least 6 characters')
  }

  try {
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase.auth.updateUser({
      password,
      data: { password_set: true },
    })

    if (error) {
      redirect('/auth/reset?error=' + encodeURIComponent(error.message))
    }

    redirect('/')
  } catch (error) {
    redirect('/auth/reset?error=Failed to update password')
  }
}

// FIXED: Enhanced username availability check with proper error handling
export async function checkUsernameAvailability(username: string): Promise<{
  available: boolean
  error?: string
}> {
  try {
    // Use server-side admin client for consistency
    const { data: existing, error } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    // FIXED: Handle database errors properly
    if (error && error.code !== 'PGRST116') {
      console.error('Username availability check error:', error)
      return {
        available: false,
        error: 'Username validation service temporarily unavailable'
      }
    }

    // FIXED: Check reserved usernames
    const { data: reserved, error: reservedError } = await supabaseAdmin
      .from('reserved_usernames')
      .select('username')
      .eq('username', username.toLowerCase())
      .maybeSingle()

    if (reservedError && reservedError.code !== 'PGRST116') {
      console.error('Reserved username check error:', reservedError)
    }

    if (reserved) {
      return {
        available: false,
        error: 'This username is reserved and cannot be used'
      }
    }

    return {
      available: !existing,
      error: existing ? 'This username is already taken' : undefined
    }
  } catch (error) {
    console.error('Username availability check exception:', error)
    return {
      available: false,
      error: 'Username validation service unavailable'
    }
  }
}

// FIXED: Helper function to generate username from full name
function generateUsernameFromName(fullName: string): string {
  if (!fullName) return ''
  
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

// FIXED: Server action for updating username with race condition protection
export async function updateUsernameAction(
  userId: string,
  newUsername: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Import the function dynamically to avoid circular deps
    const { updateUsername } = await import('./usernameUtils')
    const result = await updateUsername(userId, newUsername)
    
    return {
      success: result.success,
      error: result.error
    }
  } catch (error) {
    console.error('Username update action error:', error)
    return {
      success: false,
      error: 'Username update service temporarily unavailable'
    }
  }
}