'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
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

  useEffect(() => {
    initializeForm()
  }, [])

  const initializeForm = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (!user) {
        setError('Please sign in to post to BitBoard')
        return
      }

      // Load available tidbits dynamically
      await loadAvailableTidbits()

      // Pre-fill from URL parameters (for walkthrough integration)
      const tidbitParam = searchParams.get('tidbit')
      const contentParam = searchParams.get('content')

      if (tidbitParam) {
        setTidbit(Number(tidbitParam))
      }
      if (contentParam) {
        setContent(decodeURIComponent(contentParam))
      }

    } catch (err) {
      console.error('Error initializing form:', err)
      setError('Failed to load form. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableTidbits = async () => {
    try {
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
    if (!user || !content.trim()) {
      setError('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
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
        // Don't fail the whole operation for progress tracking
      }

      setSubmitted(true)

      // Redirect after success
      setTimeout(() => {
        if (isPrivate) {
          router.push('/profile')
        } else {
          router.push(`/bitboard`)
        }
      }, 2000)

    } catch (err: any) {
      console.error('Error submitting post:', err)
      setError(err.message || 'Failed to submit post. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#60A875]" />
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
            className="px-6 py-3 bg-[#60A875] text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
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
          <div className="w-16 h-16 bg-[#60A875] rounded-full flex items-center justify-center mx-auto mb-6">
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
              className="w-full px-6 py-3 bg-[#60A875] text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
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
        <div className="bg-gradient-to-r from-[#60A875] to-[#59B1E3] p-6 text-white">
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
                    <Globe className="w-5 h-5 text-green-600" />
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
                    : 'bg-green-500 focus:ring-green-500'
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

          {/* Tidbit Selection - Now Dynamic! */}
          <div>
            <label htmlFor="tidbit" className="block font-semibold mb-3 text-gray-900">
              Choose Tidbit # *
            </label>
            <select
              id="tidbit"
              value={tidbit}
              onChange={(e) => setTidbit(Number(e.target.value))}
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-[#60A875]/20 focus:border-[#60A875] transition-colors"
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
                className="text-sm text-[#59B1E3] hover:text-blue-600"
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
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-[#60A875]/20 focus:border-[#60A875] transition-colors"
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
            disabled={submitting || !content.trim()}
            className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              isPrivate 
                ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                : 'bg-[#60A875] hover:bg-green-600 text-white'
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