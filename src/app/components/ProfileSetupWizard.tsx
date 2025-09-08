// src/app/components/ProfileSetupWizard.tsx - Fixed with proper patterns
'use client'

import { useState, useEffect, useCallback } from 'react'
import { User, AlertCircle, CheckCircle2, Loader2, Info, Lock, ChevronDown } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useMounted } from '../lib/clientUtils'
import { getSupabaseBrowserClient } from '../lib/supabaseClient'

interface ProfileSetupWizardProps {
  userId: string
  onComplete: () => void
  onDone: () => void
}

interface ProfileData {
  username: string
  full_name: string
  bio: string
  favorite_ai_tool_id: string | null
  username_changed: boolean
}

interface AITool {
  id: string
  name: string
  company: string
  category: string
  description: string
}

function ProfileSetupSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
        <div className="h-6 bg-gray-200 rounded w-64 mx-auto mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
      </div>
      
      <div className="space-y-4">
        <div className="bg-gray-50 border rounded-lg p-4">
          <div className="h-4 bg-gray-200 rounded w-32 mb-3"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        
        <div>
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        
        <div>
          <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
        
        <div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        
        <div className="h-12 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
}

export default function ProfileSetupWizard({ userId, onComplete, onDone }: ProfileSetupWizardProps) {
  const mounted = useMounted()
  const { loading: authLoading } = useAuth()
  
  const [clientReady, setClientReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // AI Tools state
  const [aiTools, setAiTools] = useState<AITool[]>([])
  const [loadingTools, setLoadingTools] = useState(true)

  // Form state
  const [formData, setFormData] = useState<ProfileData>({
    username: '',
    full_name: '',
    bio: '',
    favorite_ai_tool_id: null,
    username_changed: false
  })

  // Username validation state
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [originalUsername, setOriginalUsername] = useState('')

  // Check client availability with retry logic (matching useAuthForm pattern)
  useEffect(() => {
    if (!mounted) return

    let retries = 0
    const maxRetries = 5

    const checkClient = () => {
      try {
        const client = getSupabaseBrowserClient()
        if (client) {
          setClientReady(true)
          return true
        }
      } catch (error) {
        console.warn('Supabase client not ready:', error)
      }
      return false
    }

    if (checkClient()) return

    const retryInterval = setInterval(() => {
      if (checkClient() || retries >= maxRetries) {
        clearInterval(retryInterval)
        if (retries >= maxRetries) {
          console.error('Supabase client failed to initialize')
          setError('Authentication service unavailable. Please refresh the page.')
          setLoading(false)
          setLoadingTools(false)
        }
      } else {
        retries++
      }
    }, 1000)

    return () => clearInterval(retryInterval)
  }, [mounted])

  // Safe client getter (matching useAuthForm pattern)
  const getClient = useCallback(() => {
    if (!mounted || !clientReady) return null
    
    try {
      return getSupabaseBrowserClient()
    } catch (error) {
      console.warn('Failed to get Supabase client:', error)
      return null
    }
  }, [mounted, clientReady])

  // Auto-assign username from pool
  const assignUsernameFromPool = useCallback(async () => {
    const supabase = getClient()
    if (!supabase) return null

    try {
      // Get a random unused username from the pool
      const { data: availableUsernames, error: fetchError } = await supabase
        .from('username_pool')
        .select('id, username')
        .is('assigned_to', null)
        .limit(10)

      if (fetchError) throw fetchError

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

      if (assignError) throw assignError

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
  }, [userId, getClient])

  // Load AI tools
  const loadAITools = useCallback(async () => {
    const supabase = getClient()
    if (!supabase) {
      setLoadingTools(false)
      return
    }

    try {
      const { data: tools, error } = await supabase
        .from('ai_tools')
        .select('id, name, company, category, description')
        .eq('is_public', true)
        .order('name')

      if (error) {
        console.error('Error loading AI tools:', error)
        setAiTools([])
      } else {
        setAiTools(tools || [])
      }
    } catch (err: any) {
      console.error('Error loading AI tools:', err)
      setAiTools([])
    } finally {
      setLoadingTools(false)
    }
  }, [getClient])

  // Load existing profile data
  const loadProfile = useCallback(async () => {
    const supabase = getClient()
    if (!supabase) {
      setError('Database connection unavailable. Please refresh the page.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username, full_name, bio, favorite_ai_tool_id, username_changed')
        .eq('id', userId)
        .single()

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // No profile found - this is expected for new users
          console.log('No existing profile found, setting up new profile')
          setFormData({
            username: '',
            full_name: '',
            bio: '',
            favorite_ai_tool_id: null,
            username_changed: false
          })
          setOriginalUsername('')
        } else {
          throw new Error(`Failed to load profile: ${profileError.message}`)
        }
      } else if (profile) {
        // If user doesn't have a username, assign one from the pool
        if (!profile.username) {
          try {
            const assignedUsername = await assignUsernameFromPool()
            if (assignedUsername) {
              profile.username = assignedUsername
            }
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
          favorite_ai_tool_id: profile.favorite_ai_tool_id || null,
          username_changed: profile.username_changed || false
        })
        setOriginalUsername(profile.username || '')
      }
    } catch (err: any) {
      console.error('Error loading profile:', err)
      setError(err.message || 'Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }, [userId, getClient, assignUsernameFromPool])

  // Check username availability with better error handling
  const checkUsernameAvailability = useCallback(async (username: string) => {
    const supabase = getClient()
    if (!supabase || !username || username === originalUsername) {
      setUsernameError(null)
      return { isAvailable: true, error: null }
    }

    // Validate format
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
      const error = 'Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens'
      setUsernameError(error)
      return { isAvailable: false, error }
    }

    setCheckingUsername(true)
    setUsernameError(null)

    try {
      // Check if username is taken in profiles
      const { data: existing, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', userId)

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error checking username in profiles:', profileError)
        setUsernameError('Unable to verify username availability. Please try again.')
        return { isAvailable: false, error: 'Database error' }
      }

      if (existing && existing.length > 0) {
        setUsernameError('This username is already taken')
        return { isAvailable: false, error: 'Username taken' }
      }

      // Check if username is in the pool and assigned to someone else
      const { data: poolUsername, error: poolError } = await supabase
        .from('username_pool')
        .select('assigned_to')
        .eq('username', username)

      if (poolError && poolError.code !== 'PGRST116') {
        console.error('Error checking username pool:', poolError)
        setUsernameError('Unable to verify username availability. Please try again.')
        return { isAvailable: false, error: 'Database error' }
      }

      if (poolUsername && poolUsername.length > 0 && poolUsername[0].assigned_to && poolUsername[0].assigned_to !== userId) {
        setUsernameError('This username is already taken')
        return { isAvailable: false, error: 'Username taken' }
      }

      return { isAvailable: true, error: null }
    } catch (err) {
      console.error('Username availability check failed:', err)
      setUsernameError('Unable to verify username availability. Please try again.')
      return { isAvailable: false, error: 'Network error' }
    } finally {
      setCheckingUsername(false)
    }
  }, [originalUsername, userId, getClient])

  // Debounced username check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username && formData.username !== originalUsername) {
        checkUsernameAvailability(formData.username)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [formData.username, checkUsernameAvailability, originalUsername])

  // Load profile and AI tools when client is ready
  useEffect(() => {
    if (mounted && clientReady && !authLoading) {
      loadProfile()
      loadAITools()
    }
  }, [mounted, clientReady, authLoading, loadProfile, loadAITools])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const supabase = getClient()
    if (!supabase) {
      setError('Database connection unavailable. Please refresh the page.')
      return
    }

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
      // Re-check username availability one more time before saving
      if (formData.username !== originalUsername) {
        const { data: lastMinuteCheck } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', formData.username)
          .neq('id', userId)
          .maybeSingle()

        if (lastMinuteCheck) {
          setError('Sorry, that username was just taken by someone else. Please choose a different one.')
          setSaving(false)
          return
        }
      }

      const updateData: any = {
        full_name: formData.full_name.trim(),
        bio: formData.bio.trim() || null,
        favorite_ai_tool_id: formData.favorite_ai_tool_id || null,
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
          .maybeSingle()

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
        // Handle specific database errors with user-friendly messages
        if (updateError.code === '23505' && updateError.message.includes('profiles_username_key')) {
          setError('That username is already taken. Please choose a different one.')
        } else if (updateError.code === '23505') {
          setError('There was a conflict with your profile data. Please try again.')
        } else if (updateError.code === '42501') {
          setError('You don\'t have permission to update this profile. Please refresh the page and try again.')
        } else if (updateError.message.includes('JWT')) {
          setError('Your session has expired. Please refresh the page and log in again.')
        } else {
          setError('Unable to save your profile. Please check your internet connection and try again.')
        }
        console.error('Profile update error:', updateError)
        return
      }

      setSuccess('Profile setup complete!')
      setTimeout(() => {
        onComplete()
        onDone()
      }, 1500)

    } catch (err: any) {
      console.error('Error saving profile:', err)
      
      // Handle network and other errors
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError('Connection lost. Please check your internet and try again.')
      } else if (err.message.includes('JWT') || err.message.includes('session')) {
        setError('Your session has expired. Please refresh the page and log in again.')
      } else {
        setError('Something went wrong while saving your profile. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  const canChangeUsername = !formData.username_changed

  // Get selected AI tool details
  const selectedTool = aiTools.find(tool => tool.id === formData.favorite_ai_tool_id)

  // Show skeleton while mounting or waiting for client
  if (!mounted || !clientReady || authLoading) {
    return <ProfileSetupSkeleton />
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Personal Profile</h1>
          <button
            onClick={onDone}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-brand-green to-brand-blue rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
              <User className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Complete Your Profile</h2>
            <p className="text-gray-600 text-lg">Tell us a bit about yourself to get started</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div className="text-sm text-green-800">{success}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Username Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <Info className="w-6 h-6 text-brand-blue flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2 text-lg">Your Username</h3>
                  <p className="text-blue-700">
                    {canChangeUsername
                      ? "We've assigned you a nostalgic username! You can change it now during setup if you'd like."
                      : "Your username has already been customized and cannot be changed again."
                    }
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">@</span>
                  <input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase() }))
                      setUsernameError(null)
                    }}
                    disabled={!canChangeUsername}
                    className={`w-full pl-10 pr-12 py-4 border-2 rounded-xl focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all duration-200 text-lg ${!canChangeUsername
                        ? 'bg-gray-50 text-gray-600 cursor-not-allowed border-gray-200'
                        : usernameError
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    placeholder="your-username"
                  />
                  {checkingUsername && (
                    <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 animate-spin text-gray-400" />
                  )}
                </div>

                {usernameError && (
                  <p className="text-sm text-red-600 flex items-center gap-2 bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {usernameError}
                  </p>
                )}

                {formData.username && !usernameError && !checkingUsername && formData.username !== originalUsername && (
                  <p className="text-sm text-green-600 flex items-center gap-2 bg-green-50 p-3 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    Username is available
                  </p>
                )}
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-3">
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Display Name *
              </label>
              <input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all duration-200 text-lg hover:border-gray-300"
                placeholder="How should we display your name?"
                required
              />
              <p className="text-sm text-gray-500">This is how your name will appear to others</p>
            </div>

            {/* Bio */}
            <div className="space-y-3">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <textarea
                id="bio"
                value={formData.bio || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                rows={4}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all duration-200 resize-none hover:border-gray-300"
                placeholder="Tell us a bit about yourself..."
                maxLength={300}
              />
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">Share your interests, expertise, or what brings you to Daily Tidbit</p>
                <p className="text-sm text-gray-400">
                  {(formData.bio || '').length}/300
                </p>
              </div>
            </div>

            {/* Favorite AI Tool */}
            <div className="space-y-3">
              <label htmlFor="favorite_ai_tool" className="block text-sm font-medium text-gray-700">
                Favorite AI Tool
              </label>
              {loadingTools ? (
                <div className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl bg-gray-50 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  <span className="text-gray-500">Loading AI tools...</span>
                </div>
              ) : (
                <div className="relative">
                  <select
                    id="favorite_ai_tool"
                    value={formData.favorite_ai_tool_id || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      favorite_ai_tool_id: e.target.value || null 
                    }))}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all duration-200 appearance-none bg-white text-lg hover:border-gray-300"
                  >
                    <option value="">Select your favorite AI tool (optional)</option>
                    {aiTools.map((tool) => (
                      <option key={tool.id} value={tool.id}>
                        {tool.name} {tool.company && `by ${tool.company}`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              )}
              {selectedTool && (
                <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                  <div className="font-medium text-gray-900 mb-1">{selectedTool.name}</div>
                  {selectedTool.company && (
                    <div className="text-sm text-gray-600 mb-2">by {selectedTool.company}</div>
                  )}
                  <div className="text-sm text-gray-600">{selectedTool.description}</div>
                </div>
              )}
              <p className="text-sm text-gray-500">Share your go-to AI tool with the community</p>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={saving || checkingUsername || !!usernameError || !formData.full_name.trim()}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-brand-green to-brand-green-dark text-white py-4 px-6 rounded-xl hover:from-brand-green-dark hover:to-brand-green disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl disabled:hover:shadow-lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving Profile...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}