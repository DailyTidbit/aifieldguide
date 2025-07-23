'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Users, Share2, Sparkles, Target, ArrowRight, ExternalLink, CheckCircle, Clock } from 'lucide-react'
import RotatingWord from './RotatingWord'

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
  const [recentPosts, setRecentPosts] = useState<SimplePost[]>([])
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [totalPostsCount, setTotalPostsCount] = useState(0)
  const [userProgress, setUserProgress] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [tidbitNumber, user])

  const loadData = async () => {
    await Promise.all([loadRecentPosts(), loadUserProgress()])
  }

  const loadRecentPosts = async () => {
    try {
      setLoadingPosts(true)
      
      // Get total count
      const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('tidbit', tidbitNumber)
        .eq('is_private', false)

      setTotalPostsCount(count || 0)

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
        return
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

          if (!profilesError && profiles) {
            setUserProfiles(profiles)
          }
        }
      }
    } catch (err) {
      console.error('Error loading recent posts:', err)
    } finally {
      setLoadingPosts(false)
    }
  }

  const loadUserProgress = async () => {
    if (!user) return
    try {
      const { data: progress } = await supabase
        .from('user_tidbit_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('tidbit_number', tidbitNumber)
        .single()
      setUserProgress(progress)
    } catch (err) {
      console.error('Error loading user progress:', err)
    }
  }

  const handleShareClick = () => {
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
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
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
                      {new Date(post.created_at).toLocaleDateString()}
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

  // Not logged in state
  if (!user) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-8 lg:p-12 border border-blue-200 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-6">
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
              onClick={() => window.location.href = '/auth'}
              className="inline-flex items-center justify-center gap-3 bg-green-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-green-700 transition-all duration-200 transform hover:scale-105"
            >
              <Target className="w-5 h-5" />
              SIGN IN TO SHARE
            </button>
            
            <a
              href="/bitboard"
              className="inline-flex items-center justify-center gap-3 border-2 border-blue-500 text-blue-500 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-500 hover:text-white transition-all duration-200"
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full mb-6">
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
              {userProgress.practiced_with_ai && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Practiced with AI</span>
                </div>
              )}
              {userProgress.created_post && (
                <div className="flex items-center gap-2 text-blue-600">
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
                  ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!latestConversation}
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
              className="text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1"
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
              className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium transition-colors"
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