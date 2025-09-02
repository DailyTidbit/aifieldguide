// src/app/components/PostForm.tsx - HYDRATION SAFE: Fixed Date.now() issue
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '../lib/supabaseClient'
import { safeRandom } from '../lib/clientUtils'
import { Lock, Globe, Eye, EyeOff } from 'lucide-react'

export default function PostForm({ onPostSubmit }: { onPostSubmit: () => void }) {
  const [user, setUser] = useState<any>(null)
  const [tidbit, setTidbit] = useState<number | null>(null)
  const [content, setContent] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [isPrivate, setIsPrivate] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // ✅ HYDRATION SAFE: Generate stable file identifier only after mount
  const [fileIdentifier, setFileIdentifier] = useState<string>('')

  const searchParams = useSearchParams()
  const router = useRouter()

  // Hydration safety
  useEffect(() => {
    setMounted(true)
    // ✅ HYDRATION SAFE: Generate stable identifier after mount using safeRandom
    const timestamp = Date.now()
    const randomComponent = safeRandom.number().toString(36).substring(2, 15)
    setFileIdentifier(`${timestamp}_${randomComponent}`)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const initializeComponent = async () => {
      try {
        const supabase = getSupabaseBrowserClient()
        
        // CRITICAL FIX: Handle null supabase client
        if (!supabase) {
          throw new Error('Supabase client not available')
        }
        
        // Get logged-in user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) {
          console.error('Auth error:', authError)
          return
        }
        setUser(user)

        // Get tidbit number from URL
        const tidbitParam = searchParams?.get('tidbit')
        if (tidbitParam) {
          setTidbit(Number(tidbitParam))
        }

        // Pre-fill content from URL params
        const contentParam = searchParams?.get('content')
        if (contentParam) {
          setContent(decodeURIComponent(contentParam))
        }
      } catch (err: any) {
        console.error('Error initializing PostForm:', err)
        setError('Failed to initialize form')
      }
    }

    initializeComponent()
  }, [searchParams, mounted])

  if (!mounted) {
    return (
      <div className="max-w-2xl mx-auto bg-white border rounded-xl shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const markPostCreated = async (tidbitNumber: number, postId: string) => {
    if (!user) return

    try {
      console.log(`Tracking BitBoard post for Tidbit ${tidbitNumber}, Post ID: ${postId}`)
      
      const supabase = getSupabaseBrowserClient()
      
      // CRITICAL FIX: Handle null supabase client
      if (!supabase) {
        console.warn('Supabase client not available')
        return
      }
      
      const { error } = await supabase
        .from('user_tidbit_progress')
        .upsert({
          user_id: user.id,
          tidbit_number: tidbitNumber,
          posted_at: new Date().toISOString(),
          bitboard_post_id: postId
        }, {
          onConflict: 'user_id,tidbit_number'
        })

      if (error) {
        console.error('Error marking post created:', error)
      } else {
        console.log(`BitBoard posting tracked successfully for Tidbit ${tidbitNumber}!`)
      }
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !tidbit || !mounted || !fileIdentifier) return

    setSubmitting(true)
    setError(null)

    try {
      const supabase = getSupabaseBrowserClient()
      
      // CRITICAL FIX: Handle null supabase client
      if (!supabase) {
        throw new Error('Supabase client not available')
      }
      
      let media_url = null
      if (mediaFile && fileIdentifier) {
        const fileExt = mediaFile.name.split('.').pop()
        // ✅ HYDRATION SAFE: Use stable file identifier generated after mount
        const filePath = `public/${fileIdentifier}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, mediaFile)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw new Error('Failed to upload media')
        }

        if (uploadData) {
          const { data } = supabase.storage.from('media').getPublicUrl(filePath)
          media_url = data.publicUrl
        }
      }

      const { data: postData, error } = await supabase.from('posts').insert({
        user_id: user.id,
        content,
        media_url,
        tidbit,
        type: 'text',
        is_private: isPrivate,
      }).select().single()

      if (error) {
        console.error('Post creation error:', error)
        throw new Error('Failed to create post')
      }

      if (postData) {
        console.log('Post created successfully:', postData)
        
        await markPostCreated(tidbit, postData.id)
        
        const successMessage = isPrivate 
          ? 'Private post saved successfully!' 
          : 'Posted to BitBoard successfully!'
        
        if (typeof window !== 'undefined') {
          if (isPrivate) {
            const viewProfile = window.confirm(`${successMessage}\n\nWant to see it in your private collection?`)
            if (viewProfile) {
              window.open('/profile', '_blank')
            }
          } else {
            const viewBitBoard = window.confirm(`${successMessage}\n\nWant to see it on BitBoard?`)
            if (viewBitBoard) {
              window.open('/bitboard', '_blank')
            }
          }
        }
        
        // Reset form
        setContent('')
        setMediaFile(null)
        setIsPrivate(false)
        
        onPostSubmit()
      }
    } catch (err: any) {
      console.error('Error in handleSubmit:', err)
      setError(err.message || 'Failed to submit post')
    } finally {
      setSubmitting(false)
    }
  }

  if (!user || tidbit === null) return null

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto bg-white border rounded-xl shadow p-6 space-y-4"
    >
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>
        Share your creation
      </h2>

      <div className="bg-gradient-to-r from-brand-green/10 to-brand-blue/10 rounded-lg p-4 border border-brand-green/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">
              Posting to <strong>Tidbit #{tidbit}</strong>
            </div>
            <div className="text-xs text-brand-green font-medium mt-1">
              Complete your learning journey by sharing!
            </div>
          </div>
          <div className="text-2xl">🎯</div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
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
                  ? 'Only you can see this post' 
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
        
        <div className="mt-3 text-xs text-gray-500 bg-white rounded-md p-3">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0">
              {isPrivate ? (
                <EyeOff className="w-4 h-4 text-orange-500 mt-0.5" />
              ) : (
                <Eye className="w-4 h-4 text-brand-green mt-0.5" />
              )}
            </div>
            <div>
              {isPrivate ? (
                <div>
                  <div className="font-medium text-orange-700">Private posts are perfect for:</div>
                  <div className="text-orange-600">Personal projects, practice work, gifts for family, or anything you want to keep just for yourself.</div>
                </div>
              ) : (
                <div>
                  <div className="font-medium text-green-700">Public posts help the community:</div>
                  <div className="text-brand-greenDark">Share your creativity, inspire others, and get feedback from the Daily Tidbit community.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <label className="block">
        <span className="text-sm text-gray-600 font-medium">What did you create?</span>
        <textarea
          className="border w-full mt-1 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors font-mono text-sm"
          rows={8}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          placeholder={isPrivate ? "Describe your personal creation..." : "Share your AI conversation, what you learned, or what you created..."}
        />
        <div className="text-xs text-gray-500 mt-1">
          {content.length}/1000 characters • Use **bold** for formatting
        </div>
      </label>

      <label className="block">
        <span className="text-sm text-gray-600 font-medium">Upload image, video, or audio (optional)</span>
        <input
          type="file"
          accept="image/*,video/mp4,video/webm,audio/mpeg"
          onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
          className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-green/10 file:text-brand-green hover:file:bg-brand-green/20 transition-colors"
        />
      </label>

      <button
        type="submit"
        className={`w-full px-6 py-3 rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
          isPrivate 
            ? 'bg-orange-500 hover:bg-orange-600 text-white' 
            : 'bg-brand-green hover:bg-brand-greenDark text-white'
        }`}
        disabled={submitting}
      >
        {submitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Creating...
          </>
        ) : (
          <>
            {isPrivate ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
            {isPrivate ? 'Save Privately' : 'Share to BitBoard'}
          </>
        )}
      </button>

      {!isPrivate && (
        <div className="text-center text-xs text-gray-500 bg-green-50 rounded-lg p-3 border border-green-200">
          🎉 Sharing this post will complete your Day {tidbit} learning journey!
        </div>
      )}
    </form>
  )
}