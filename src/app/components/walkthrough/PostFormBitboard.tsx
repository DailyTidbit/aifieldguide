'use client'

import { useState, useEffect } from 'react'
import { getSupabaseBrowserClient } from '../../lib/supabaseClient'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Check, 
  X, 
  Loader2, 
  AlertCircle, 
  Sparkles, 
  Globe, 
  Lock,
  ExternalLink
} from 'lucide-react'

interface TidbitOption {
  day_number: number
  title: string
}

export default function PostFormBitboard() {
  // ✅ CRITICAL: Hydration safety - mounted state must be first
  const [mounted, setMounted] = useState(false)
  const [supabaseReady, setSupabaseReady] = useState(false)
  
  const [content, setContent] = useState('')
  const [tidbit, setTidbit] = useState(1)
  const [availableTidbits, setAvailableTidbits] = useState<TidbitOption[]>([])
  const [isPrivate, setIsPrivate] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  const router = useRouter()
  const searchParams = useSearchParams()

  // ✅ CRITICAL: Mount detection - must be first useEffect
  useEffect(() => {
    setMounted(true)
  }, [])

  // ✅ HYDRATION SAFE: Check Supabase client availability with retry
  useEffect(() => {
    if (!mounted) return

    const checkSupabase = () => {
      try {
        const client = getSupabaseBrowserClient()
        setSupabaseReady(!!client)
      } catch (error) {
        console.warn('Supabase not ready:', error)
        setSupabaseReady(false)
      }
    }

    checkSupabase()
    
    // Retry if not ready
    if (!supabaseReady) {
      const interval = setInterval(checkSupabase, 1000)
      return () => clearInterval(interval)
    }
  }, [mounted, supabaseReady])

  // Initialize form after mounted and supabase ready
  useEffect(() => {
    if (mounted && supabaseReady) {
      initializeForm()
    }
  }, [mounted, supabaseReady])

  // ✅ HYDRATION SAFE: Pre-fill from URL parameters only after everything is ready
  useEffect(() => {
    if (!mounted || !supabaseReady || !searchParams) return

    try {
      const tidbitParam = searchParams.get('tidbit')
      const contentParam = searchParams.get('content')

      if (tidbitParam && !isNaN(Number(tidbitParam))) {
        setTidbit(Number(tidbitParam))
      }
      if (contentParam) {
        setContent(decodeURIComponent(contentParam))
      }
    } catch (error) {
      console.warn('Error reading search params:', error)
      // don&apos;t fail the whole component for URL param issues
    }
  }, [mounted, supabaseReady, searchParams])

  const initializeForm = async () => {
    if (!mounted || !supabaseReady) return

    try {
      setLoading(true)
      setError(null)

      const supabase = getSupabaseBrowserClient()
      
      // ✅ CRITICAL FIX: Handle null supabase client
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (!user) {
        setError('Please sign in to post to BitBoard')
        return
      }

      // Load available tidbits dynamically
      await loadAvailableTidbits()

    } catch (err) {
      console.error('Error initializing form:', err)
      setError('Failed to load form. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableTidbits = async () => {
    if (!mounted || !supabaseReady) return

    try {
      const supabase = getSupabaseBrowserClient()
      
      // ✅ CRITICAL FIX: Handle null supabase client
      if (!supabase) {
        throw new Error('Supabase client not available')
      }
      
      // Try to load from Supabase tidbits table first
      const { data, error } = await supabase
        .from('tidbits')
        .select('day_number, title')
        .eq('status', 'published')
        .order('day_number', { ascending: true })

      if (!error && data && data.length > 0) {
        setAvailableTidbits(data)
        return
      }

      // Fallback: Generate from your current setup
      console.warn('No tidbits found in database, using fallback')
      const fallbackTidbits = Array.from({ length: 30 }, (_, i) => ({
        day_number: i + 1,
        title: `Daily Tidbit #${i + 1}`
      }))
      setAvailableTidbits(fallbackTidbits)

    } catch (err) {
      console.error('Error loading tidbits:', err)
      // Ultimate fallback
      const basicTidbits = Array.from({ length: 30 }, (_, i) => ({
        day_number: i + 1,
        title: `Daily Tidbit #${i + 1}`
      }))
      setAvailableTidbits(basicTidbits)
    }
  }

  const handleSubmit = async () => {
    if (!mounted || !supabaseReady || !user || !content.trim()) {
      setError('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const supabase = getSupabaseBrowserClient()
      
      // ✅ CRITICAL FIX: Handle null supabase client
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      const { error } = await supabase.from('posts').insert([
        {
          user_id: user.id,
          content: content.trim(),
          tidbit,
          is_private: isPrivate,
          type: 'bitboard_post'
        },
      ])

      if (error) {
        throw error
      }

      // Track progress - mark that user created a post for this tidbit
      try {
        await supabase
          .from('user_tidbit_progress')
          .upsert({
            user_id: user.id,
            tidbit_number: tidbit,
            created_post: true
          }, {
            onConflict: 'user_id,tidbit_number'
          })
      } catch (progressError) {
        console.warn('Progress tracking failed:', progressError)
        // don&apos;t fail the whole operation for progress tracking
      }

      setSubmitted(true)

      // ✅ HYDRATION SAFE: Router redirect only after mount
      if (mounted && typeof window !== 'undefined') {
        setTimeout(() => {
          if (isPrivate) {
            router.push('/profile')
          } else {
            router.push('/bitboard')
          }
        }, 2000)
      }

    } catch (err: any) {
      console.error('Error submitting post:', err)
      setError(err.message || 'Failed to submit post. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Hydration-safe calculations
  const canSubmit = mounted && supabaseReady ? !!content.trim() && !!user : false

  // ✅ HYDRATION SAFETY: don&apos;t render anything until mounted
  if (!mounted) {
    return null
  }

  // Loading state
  if (loading || !supabaseReady) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
            <span className="ml-3 text-gray-600">Loading form...</span>
          </div>
        </div>
      </div>
    )
  }

  // Error state (no user)
  if (error && !user) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to share your creations on BitBoard.</p>
          <button
            onClick={() => router.push('/auth')}
            className="px-6 py-3 bg-brand-green text-white rounded-lg hover:bg-brand-greenDark transition-colors font-medium"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  // Success state
  if (submitted) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-brand-green rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {isPrivate ? '🔒 Saved Privately!' : '🎉 Posted to BitBoard!'}
          </h2>
          <p className="text-gray-600 mb-6">
            {isPrivate 
              ? 'Your creation has been saved to your private collection.'
              : 'Your creation is now live for the community to see!'
            }
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/bitboard')}
              className="w-full px-6 py-3 bg-brand-green text-white rounded-lg hover:bg-brand-greenDark transition-colors font-medium"
            >
              View BitBoard
            </button>
            <button
              onClick={() => router.push(`/day/${tidbit}`)}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Back to Tidbit #{tidbit}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-green to-brand-blue p-6 text-white">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Share Your Creation</h1>
              <p className="text-white/90">Post to the Tidbit Creators Board</p>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700 text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Supabase not ready warning */}
        {!supabaseReady && (
          <div className="mx-6 mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />
            <span className="text-yellow-700 text-sm">Connecting to database...</span>
          </div>
        )}

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Privacy Toggle */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isPrivate ? 'bg-orange-100' : 'bg-green-100'}`}>
                  {isPrivate ? (
                    <Lock className="w-5 h-5 text-orange-600" />
                  ) : (
                    <Globe className="w-5 h-5 text-brand-greenDark" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {isPrivate ? 'Private Post' : 'Public Post'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {isPrivate 
                      ? 'Only you can see this' 
                      : 'Visible to everyone on BitBoard'
                    }
                  </div>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isPrivate 
                    ? 'bg-orange-500 focus:ring-orange-500' 
                    : 'bg-brand-green focus:ring-brand-green'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isPrivate ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Tidbit Selection - Dynamic! */}
          <div>
            <label htmlFor="tidbit" className="block font-semibold mb-3 text-gray-900">
              Choose Tidbit # *
            </label>
            <select
              id="tidbit"
              value={tidbit}
              onChange={(e) => setTidbit(Number(e.target.value))}
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors"
              required
            >
              {availableTidbits.map((option) => (
                <option key={option.day_number} value={option.day_number}>
                  Tidbit #{option.day_number}: {option.title}
                </option>
              ))}
            </select>
            <div className="mt-2 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-gray-400" />
              <a 
                href={`/day/${tidbit}`} 
                target="_blank"
                className="text-sm text-brand-blue hover:text-brand-blueDark"
              >
                View this tidbit walkthrough
              </a>
            </div>
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block font-semibold mb-3 text-gray-900">
              Describe your creation *
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors"
              rows={4}
              placeholder={isPrivate 
                ? "Describe your personal creation..." 
                : "Tell us what you created with this tidbit..."
              }
              required
            />
            <p className="text-sm text-gray-500 mt-2">{content.length}/500 characters</p>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !canSubmit || !supabaseReady}
            className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              isPrivate 
                ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                : 'bg-brand-green hover:bg-brand-greenDark text-white'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isPrivate ? 'Saving...' : 'Posting...'}
              </>
            ) : (
              <>
                {isPrivate ? <Lock className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                {isPrivate ? 'Save Privately' : 'Post to BitBoard'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}