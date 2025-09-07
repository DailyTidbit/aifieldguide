// src/app/components/ProfileSetupWizard.tsx - Updated with username auto-assignment and null safety
'use client'

import { useState, useEffect, useCallback } from 'react'
import { User, AlertCircle, CheckCircle2, Loader2, Info, Edit3, Lock } from 'lucide-react'
import { getSupabaseBrowserClient } from '../lib/supabaseClient'
import { useMounted } from '../lib/clientUtils'

interface ProfileSetupWizardProps {
  userId: string
  onComplete: () => void
  onDone: () => void
}

interface ProfileData {
  username: string
  full_name: string
  bio: string
  website: string
  username_changed: boolean
}

export default function ProfileSetupWizard({ userId, onComplete, onDone }: ProfileSetupWizardProps) {
  const mounted = useMounted()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<ProfileData>({
    username: '',
    full_name: '',
    bio: '',
    website: '',
    username_changed: false
  })

  // Username validation state
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [originalUsername, setOriginalUsername] = useState('')

  // Auto-assign username from pool
  const assignUsernameFromPool = useCallback(async () => {
    if (!mounted) return null

    try {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      // Get a random unused username from the pool
      const { data: availableUsernames, error: fetchError } = await supabase
        .from('username_pool')
        .select('id, username')
        .is('assigned_to', null)
        .limit(10) // Get 10 random options

      if (fetchError) {
        throw fetchError
      }

      if (!availableUsernames || availableUsernames.length === 0) {
        throw new Error('No usernames available in pool')
      }

      // Pick a random username from the available ones
      const randomIndex = Math.floor(Math.random() * availableUsernames.length)
      const selectedUsername = availableUsernames[randomIndex]

      // Mark it as assigned in the pool
      const { error: assignError } = await supabase
        .from('username_pool')
        .update({
          assigned_to: userId,
          assigned_at: new Date().toISOString()
        })
        .eq('id', selectedUsername.id)

      if (assignError) {
        throw assignError
      }

      // Update the user's profile with the new username
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: selectedUsername.username,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (profileError) {
        // Rollback the username_pool assignment if profile update fails
        await supabase
          .from('username_pool')
          .update({
            assigned_to: null,
            assigned_at: null
          })
          .eq('id', selectedUsername.id)
        
        throw profileError
      }

      return selectedUsername.username

    } catch (err: any) {
      console.error('Error assigning username:', err)
      throw err
    }
  }, [userId, mounted])

  // Load existing profile data
  const loadProfile = useCallback(async () => {
    if (!mounted) return

    try {
      setLoading(true)
      setError(null)

      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username, full_name, bio, website, username_changed')
        .eq('id', userId)
        .single()

      if (profileError) {
        throw profileError
      }

      if (profile) {
        // If user doesn't have a username, assign one from the pool
        if (!profile.username) {
          try {
            const assignedUsername = await assignUsernameFromPool()
            profile.username = assignedUsername
          } catch (assignError) {
            console.error('Failed to assign username:', assignError)
            setError('Failed to assign username. Please try refreshing the page.')
            return
          }
        }

        setFormData({
          username: profile.username || '',
          full_name: profile.full_name || '',
          bio: profile.bio || '',
          website: profile.website || '',
          username_changed: profile.username_changed || false
        })
        setOriginalUsername(profile.username || '')
      }
    } catch (err: any) {
      console.error('Error loading profile:', err)
      setError('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }, [userId, mounted, assignUsernameFromPool])

  // Check username availability
  const checkUsernameAvailability = useCallback(async (username: string) => {
    if (!mounted || !username || username === originalUsername) {
      setUsernameError(null)
      return
    }

    // Validate format
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
      setUsernameError('Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens')
      return
    }

    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    setCheckingUsername(true)
    setUsernameError(null)

    try {
      // Check if username is taken in profiles
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', userId)
        .single()

      if (existing) {
        setUsernameError('This username is already taken')
        return
      }

      // Check if username is in the pool and assigned to someone else
      const { data: poolUsername } = await supabase
        .from('username_pool')
        .select('assigned_to')
        .eq('username', username)
        .single()

      if (poolUsername && poolUsername.assigned_to && poolUsername.assigned_to !== userId) {
        setUsernameError('This username is already taken')
      }
    } catch (err) {
      // Error likely means username is available (no match found)
      setUsernameError(null)
    } finally {
      setCheckingUsername(false)
    }
  }, [mounted, originalUsername, userId])

  // Debounced username check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username && formData.username !== originalUsername) {
        checkUsernameAvailability(formData.username)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [formData.username, checkUsernameAvailability, originalUsername])

  // Load profile on mount
  useEffect(() => {
    if (mounted) {
      loadProfile()
    }
  }, [mounted, loadProfile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mounted) return

    // Validation
    if (!formData.full_name.trim()) {
      setError('Display name is required')
      return
    }

    if (usernameError) {
      setError('Please fix the username error before continuing')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      const updateData: any = {
        full_name: formData.full_name.trim(),
        bio: formData.bio.trim() || null,
        website: formData.website.trim() || null,
        updated_at: new Date().toISOString()
      }

      // If username is being changed, mark as changed and update pool
      if (formData.username !== originalUsername) {
        updateData.username = formData.username
        updateData.username_changed = true
        updateData.username_changed_at = new Date().toISOString()

        // Update the username pool - unassign old username and assign new one if it exists in pool
        if (originalUsername) {
          // Unassign the old username
          await supabase
            .from('username_pool')
            .update({
              assigned_to: null,
              assigned_at: null
            })
            .eq('username', originalUsername)
            .eq('assigned_to', userId)
        }

        // If new username exists in pool, assign it
        const { data: newUsernameInPool } = await supabase
          .from('username_pool')
          .select('id')
          .eq('username', formData.username)
          .single()

        if (newUsernameInPool) {
          await supabase
            .from('username_pool')
            .update({
              assigned_to: userId,
              assigned_at: new Date().toISOString()
            })
            .eq('id', newUsernameInPool.id)
        }
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)

      if (updateError) {
        throw updateError
      }

      setSuccess('Profile setup complete!')
      setTimeout(() => {
        onComplete()
        onDone()
      }, 1500)

    } catch (err: any) {
      console.error('Error saving profile:', err)
      setError(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const formatWebsiteForDisplay = (website: string) => {
    if (!website || website.trim() === '') return ''
    if (website.startsWith('http://') || website.startsWith('https://')) {
      return website.replace(/^https?:\/\//, '')
    }
    return website
  }

  const canChangeUsername = !formData.username_changed

  if (!mounted) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-brand-green" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-green mx-auto mb-4" />
          <p className="text-gray-600">Setting up your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-brand-green to-brand-blue rounded-full mx-auto mb-4 flex items-center justify-center">
          <User className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
        <p className="text-gray-600">Tell us a bit about yourself to get started</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <div className="text-sm text-green-800">{success}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Username Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3 mb-3">
            <Info className="w-5 h-5 text-brand-blue flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 mb-1">Your Username</h3>
              <p className="text-sm text-blue-700">
                {canChangeUsername
                  ? "We've assigned you a nostalgic username! You can change it now if you'd like - but only once!"
                  : "Your username has already been customized and cannot be changed again."
                }
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              {!canChangeUsername && (
                <div title="Username cannot be changed">
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">@</span>
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase() }))
                  setUsernameError(null)
                }}
                disabled={!canChangeUsername}
                className={`w-full pl-8 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors ${!canChangeUsername
                    ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                    : usernameError
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-300'
                  }`}
                placeholder="your-username"
              />
              {checkingUsername && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
              )}
            </div>

            {usernameError && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {usernameError}
              </p>
            )}

            {formData.username && !usernameError && !checkingUsername && formData.username !== originalUsername && (
              <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Username is available
              </p>
            )}
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
            Display Name *
          </label>
          <input
            id="full_name"
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors"
            placeholder="How should we display your name?"
            required
          />
          <p className="text-xs text-gray-500 mt-1">This is how your name will appear to others</p>
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            id="bio"
            value={formData.bio || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            rows={3}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors resize-none"
            placeholder="Tell us a bit about yourself..."
            maxLength={300}
          />
          <p className="text-xs text-gray-500 mt-1">
            {(formData.bio || '').length}/300 characters
          </p>
        </div>

        {/* Website */}
        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
            Website
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              https://
            </span>
            <input
              id="website"
              type="text"
              value={formatWebsiteForDisplay(formData.website || '')}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              className="w-full pl-20 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors"
              placeholder="yourwebsite.com"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Your personal or professional website</p>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={saving || checkingUsername || !!usernameError || !formData.full_name.trim()}
            className="w-full flex items-center justify-center gap-2 bg-brand-green text-white py-3 px-4 rounded-lg hover:bg-brand-green-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Profile...
              </>
            ) : (
              'Complete Setup'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}