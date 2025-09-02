'use client'

import { useState, useEffect } from 'react'
import { getSupabaseBrowserClient } from '../lib/supabaseClient'
import { Users, Share2, Sparkles, Target, ArrowRight, ExternalLink, CheckCircle, Clock } from 'lucide-react'
import RotatingWord from './RotatingWord'
import { formatDate } from '../lib/clientUtils' // ✅ Use safe date formatter

interface WalkthroughBitBoardCTAProps {
  tidbitNumber: number
  tidbitTitle: string
  user: any
  latestConversation: {
    userInput: string
    aiOutput: string
    timestamp: Date
  } | null
}

interface SimplePost {
  id: string
  content: string
  created_at: string
  user_id: string
}

interface UserProfile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
}

export default function WalkthroughBitBoardCTA({ 
  tidbitNumber, 
  tidbitTitle, 
  user, 
  latestConversation
}: WalkthroughBitBoardCTAProps) {
  // ✅ HYDRATION SAFETY: Mount protection
  const [mounted, setMounted] = useState(false)
  const [recentPosts, setRecentPosts] = useState<SimplePost[]>([])
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [totalPostsCount, setTotalPostsCount] = useState(0)
  const [userProgress, setUserProgress] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // ✅ HYDRATION SAFETY: Mount detection
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      loadData()
    }
  }, [tidbitNumber, user, mounted])

  const loadData = async () => {
    await Promise.all([loadRecentPosts(), loadUserProgress()])
  }

  const loadRecentPosts = async () => {
    if (!mounted) return
    
    try {
      setLoadingPosts(true)
      setError(null)
      
      const supabase = getSupabaseBrowserClient()
      
      // ✅ FIXED: Handle null supabase client
      if (!supabase) {
        console.error('Supabase client not available')
        setError('Unable to connect to database')
        setLoadingPosts(false)
        return
      }

      // Get total count
      const { count, error: countError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('tidbit', tidbitNumber)
        .eq('is_private', false)

      if (countError) {
        console.error('Error fetching post count:', countError)
      } else {
        setTotalPostsCount(count || 0)
      }

      // Get recent posts (simple query)
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('id, content, created_at, user_id')
        .eq('tidbit', tidbitNumber)
        .eq('is_private', false)
        .order('created_at', { ascending: false })
        .limit(3)

      if (postsError) {
        console.error('Error fetching posts:', postsError)
        throw postsError
      }

      if (posts && posts.length > 0) {
        setRecentPosts(posts)

        // Get user profiles separately
        const userIds = [...new Set(posts.map(post => post.user_id).filter(Boolean))]
        
        if (userIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .in('id', userIds)

          if (profilesError) {
            console.error('Error fetching profiles:', profilesError)
          } else if (profiles) {
            setUserProfiles(profiles)
          }
        }
      }
    } catch (err: any) {
      console.error('Error loading recent posts:', err)
      setError('Failed to load recent posts')
    } finally {
      setLoadingPosts(false)
    }
  }

  const loadUserProgress = async () => {
    if (!mounted || !user) return
    
    try {
      const supabase = getSupabaseBrowserClient()
      
      // ✅ FIXED: Handle null supabase client
      if (!supabase) {
        console.error('Supabase client not available for user progress')
        return
      }
      
      const { data: progress, error } = await supabase
        .from('user_tidbit_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('tidbit_number', tidbitNumber)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user progress:', error)
      } else {
        setUserProgress(progress)
      }
    } catch (err) {
      console.error('Error loading user progress:', err)
    }
  }

  const handleShareClick = () => {
    if (!mounted || typeof window === 'undefined') return
    
    const params = new URLSearchParams({
      tidbit: tidbitNumber.toString(),
      content: latestConversation 
        ? `Just used AI to transform my writing with Daily Tidbit #${tidbitNumber}! "${tidbitTitle}"`
        : `Just completed Daily Tidbit #${tidbitNumber}! "${tidbitTitle}"`
    })

    if (latestConversation) {
      params.set('before', latestConversation.userInput)
      params.set('after', latestConversation.aiOutput)
    }

    window.location.href = `/post?${params.toString()}`
  }

  const getProfileForPost = (userId: string) => {
    return userProfiles.find(profile => profile.id === userId) || null
  }

  // Component for recent posts preview
  const RecentPostsPreview = () => {
    if (loadingPosts) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Users className="w-8 h-8 text-red-400" />
          </div>
          <h4 className="text-lg font-semibold text-red-700 mb-2">Error Loading Posts</h4>
          <p className="text-red-600">{error}</p>
        </div>
      )
    }

    if (recentPosts.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-semibold text-gray-700 mb-2">Be the First!</h4>
          <p className="text-gray-600">No one has shared their Day {tidbitNumber} creation yet. Be the first to inspire others!</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {recentPosts.map((post) => {
          const profile = getProfileForPost(post.user_id)
          return (
            <div key={post.id} className="bg-white/70 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="User avatar"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 bg-gradient-to-br from-brand-blue to-brand-green rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {(profile?.full_name || profile?.username || 'A').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 text-sm">
                      {profile?.full_name || profile?.username || 'Anonymous'}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {/* ✅ HYDRATION SAFE: Use formatDate instead of toLocaleDateString */}
                      {formatDate(post.created_at)}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                {post.content.length > 120 ? `${post.content.substring(0, 120)}...` : post.content}
              </p>
            </div>
          )
        })}
      </div>
    )
  }

  // ✅ HYDRATION SAFE: Loading skeleton during hydration
  if (!mounted) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-8 lg:p-12 border border-blue-200 text-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-6"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
          <div className="h-12 bg-gray-200 rounded w-full mb-4"></div>
          <div className="h-12 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    )
  }

  // Not logged in state
  if (!user) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-8 lg:p-12 border border-blue-200 text-center">
        <div className="max-w-2xl mx-auto">
          {/* ✅ BRAND COLOR FIX: Use brand-blue */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-blue rounded-full mb-6">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
            Join The Tidbit Creators Board
          </h3>
          <p className="text-lg lg:text-xl text-gray-700 leading-relaxed mb-8">
            Share your AI transformations and connect with fellow learners!
          </p>
          
          {/* Show recent posts even for non-logged users */}
          {totalPostsCount > 0 && (
            <div className="bg-white/50 rounded-xl p-6 mb-8 text-left">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-gray-800">Recent Day {tidbitNumber} Posts</h4>
                <span className="text-sm text-gray-600">{totalPostsCount} total</span>
              </div>
              <RecentPostsPreview />
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                if (mounted && typeof window !== 'undefined') {
                  window.location.href = '/auth'
                }
              }}
              className="inline-flex items-center justify-center gap-3 bg-brand-green text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-brand-greenDark transition-all duration-200 transform hover:scale-105"
            >
              <Target className="w-5 h-5" />
              SIGN IN TO SHARE
            </button>
            
            <a
              href="/bitboard"
              className="inline-flex items-center justify-center gap-3 border-2 border-brand-blue text-brand-blue px-8 py-4 rounded-xl font-semibold text-lg hover:bg-brand-blue hover:text-white transition-all duration-200"
            >
              <Users className="w-5 h-5" />
              BROWSE COMMUNITY
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Logged in state
  return (
    <div className="space-y-6">
      {/* Main CTA Section */}
      <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-8 border border-blue-200">
        <div className="max-w-3xl mx-auto text-center">
          {/* ✅ BRAND COLOR FIX: Use brand gradient colors */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brand-blue to-brand-green rounded-full mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
            Post Your <RotatingWord /> to The Tidbit Creators Board
          </h3>
          <p className="text-lg lg:text-xl text-gray-700 leading-relaxed mb-8">
            Share your AI transformations and see what others have created with this tidbit.
          </p>
          
          {/* Progress indicators */}
          {userProgress && (
            <div className="flex justify-center gap-4 mb-6">
              {userProgress.tutor_used_at && (
                <div className="flex items-center gap-2 text-brand-green">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Practiced with AI</span>
                </div>
              )}
              {userProgress.posted_at && (
                <div className="flex items-center gap-2 text-brand-blue">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Already shared!</span>
                </div>
              )}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleShareClick}
              className={`inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 ${
                latestConversation 
                  ? 'bg-brand-blue text-white hover:bg-brand-blueDark shadow-lg' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!latestConversation || !mounted}
            >
              <Share2 className="w-5 h-5" />
              {latestConversation ? 'SHARE YOUR RESULTS' : 'TRY TUTOR FIRST'}
            </button>
            
            <a
              href={`/bitboard?tidbit=${tidbitNumber}`}
              className="inline-flex items-center justify-center gap-3 border border-gray-300 text-gray-700 px-6 py-4 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
            >
              <ExternalLink className="w-5 h-5" />
              VIEW ALL DAY {tidbitNumber} POSTS
            </a>
          </div>
          
          {/* Hint about what will be shared */}
          {latestConversation && (
            <div className="mt-6 text-sm text-gray-600 bg-white/50 rounded-lg p-4">
              <p className="font-medium mb-2">Preview of what you'll share:</p>
              <div className="text-left space-y-2">
                <div className="text-red-700">
                  <strong>Before:</strong> "{latestConversation.userInput.slice(0, 50)}..."
                </div>
                <div className="text-green-700">
                  <strong>After:</strong> "{latestConversation.aiOutput.slice(0, 50)}..."
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Community Preview Section */}
      <div className="bg-white rounded-2xl p-6 lg:p-8 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xl lg:text-2xl font-bold text-gray-900">
            Community Creations
          </h4>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {totalPostsCount} posts
            </div>
            <a 
              href={`/bitboard?tidbit=${tidbitNumber}`}
              className="text-brand-blue hover:text-brand-blueDark font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
        
        <RecentPostsPreview />
        
        {recentPosts.length > 0 && (
          <div className="mt-6 text-center">
            <a
              href={`/bitboard?tidbit=${tidbitNumber}`}
              className="inline-flex items-center gap-2 text-brand-blue hover:text-brand-blueDark font-medium transition-colors"
            >
              <span>See all {totalPostsCount} Day {tidbitNumber} creations</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}