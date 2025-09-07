// src/app/lib/auth-actions.ts - Updated with username assignment
'use server'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from './supabaseServer'

// Consistent return type for all auth actions
type AuthActionResult = {
  success?: boolean
  error?: string
  message?: string
}

export async function signUpAction(prevState: AuthActionResult | null, formData: FormData): Promise<AuthActionResult> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  if (!email || !password || !fullName) {
    return { error: 'All fields are required' }
  }

  try {
    const supabase = await createServerSupabaseClient()

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

    // Create profile with auto-assigned username (handled by trigger)
    if (data.user && data.session) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          full_name: fullName.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Don't fail the signup, profile can be created later
      }
    }

    // If user was created but needs email confirmation
    if (data.user && !data.session) {
      redirect('/auth?message=Check your email to confirm your account')
    }

    // If user was created and confirmed immediately
    if (data.session) {
      redirect('/')
    }

    return { success: true, message: 'Account created successfully' }
  } catch (error) {
    return { error: 'Failed to create account' }
  }
}

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

    // Ensure profile exists with username
    if (data.user) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('id', data.user.id)
        .single()

      if (!existingProfile) {
        // Create profile if it doesn't exist
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (profileError) {
          console.error('Profile creation error during sign in:', profileError)
        }
      }
    }

    // Successful login - redirect
    if (redirectTo && redirectTo !== 'null') {
      redirect(redirectTo)
    } else {
      redirect('/')
    }
  } catch (error) {
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

// New action to check username availability
export async function checkUsernameAvailability(username: string): Promise<{
  available: boolean
  error?: string
}> {
  try {
    const supabase = await createServerSupabaseClient()

    // Check format
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
      return {
        available: false,
        error: 'Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens'
      }
    }

    // Check if reserved
    const { data: reserved } = await supabase
      .from('reserved_usernames')
      .select('username')
      .eq('username', username.toLowerCase())
      .single()

    if (reserved) {
      return {
        available: false,
        error: 'This username is reserved and cannot be used'
      }
    }

    // Check if taken
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (existing) {
      return {
        available: false,
        error: 'This username is already taken'
      }
    }

    return { available: true }
  } catch (error) {
    // If we get here, likely means no match found (username available)
    return { available: true }
  }
}