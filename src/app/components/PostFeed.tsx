'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { getSupabaseBrowserClientSafe, getSupabaseBrowserClient } from '../lib/supabaseClient'
import PostCard from './PostCard'
import PostModal from './PostModal'

export type Post = {
  id: string
  created_at: string
  user_id: string | null
  type: string
  content: string
  before_text: string | null
  after_text: string | null
  media_url: string | null
  tidbit: number
  likes_count?: number
  description?: string
  username?: string
}

export default function PostFeed({
  posts,
  selectedTidbit,
  setSelectedTidbit,
}: {
  posts: Post[]
  selectedTidbit: number | null
  setSelectedTidbit: (tidbit: number | null) => void
}) {
  // ✅ HYDRATION SAFETY: Enhanced state management
  const [mounted, setMounted] = useState(false)
  const [clientReady, setClientReady] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userLikedPosts, setUserLikedPosts] = useState<string[]>([])
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [visiblePosts, setVisiblePosts] = useState<Post[]>([])
  const [loadIndex, setLoadIndex] = useState(1)
  const [allTidbits, setAllTidbits] = useState<number[]>([])
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const postsPerLoad = 24

  // ✅ HYDRATION SAFE: Enhanced mounting and client checking
  useEffect(() => {
    setMounted(true)
    
    // Check if Supabase client is available
    const checkClient = () => {
      try {
        const client = getSupabaseBrowserClient()
        setClientReady(!!client)
      } catch (error) {
        console.warn('Supabase client not ready for PostFeed:', error)
        setClientReady(false)
      }
    }
    
    checkClient()
    
    // Recheck periodically in case client becomes available later
    const interval = setInterval(checkClient, 1000)
    
    return () => clearInterval(interval)
  }, [])

  // ✅ HYDRATION SAFE: Get Supabase client safely
  const getClient = () => {
    if (!mounted || !clientReady) {
      return null
    }
    
    try {
      return getSupabaseBrowserClientSafe()
    } catch (error) {
      console.warn('Failed to get Supabase client for PostFeed:', error)
      return null
    }
  }

  // ✅ Check if operations are ready
  const isFeedReady = mounted && clientReady

  // ✅ HYDRATION SAFE: Enhanced fetch user and likes with proper guards
  const fetchUserAndLikes = useCallback(async () => {
    if (!isFeedReady) return

    const supabase = getClient()
    if (!supabase) {
      console.warn('Cannot fetch user data - Supabase client not available')
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      
      setUser(user)

      if (user) {
        const { data: likesData } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)

        if (likesData) {
          setUserLikedPosts(likesData.map((like) => like.post_id))
        }
      }
    } catch (error) {
      console.error('Error fetching user and likes:', error)
    }
  }, [isFeedReady, getClient])

  // ✅ HYDRATION SAFE: Enhanced fetch all tidbits with proper guards
  const fetchAllTidbits = useCallback(async () => {
    if (!isFeedReady) return

    const supabase = getClient()
    if (!supabase) {
      console.warn('Cannot fetch tidbits - Supabase client not available')
      return
    }

    try {
      const { data, error }: { data: { tidbit: number }[] | null; error: any } = await supabase
        .from('posts')
        .select('tidbit')

      if (error) {
        console.error('Error fetching tidbits:', error)
        return
      }

      if (data) {
        const tidbitNums = Array.from(new Set(data.map((item) => item.tidbit))).sort(
          (a, b) => a - b
        )
        setAllTidbits(tidbitNums)
      }
    } catch (error) {
      console.error('Error fetching tidbits:', error)
    }
  }, [isFeedReady, getClient])

  // Fetch data when ready
  useEffect(() => {
    if (isFeedReady) {
      fetchUserAndLikes()
      fetchAllTidbits()
    }
  }, [isFeedReady, fetchUserAndLikes, fetchAllTidbits])

  // ✅ HYDRATION SAFE: Enhanced visible posts management
  useEffect(() => {
    if (!isFeedReady) return
    
    const filtered = selectedTidbit ? posts.filter((p) => p.tidbit === selectedTidbit) : posts
    setVisiblePosts(filtered.slice(0, postsPerLoad))
    setLoadIndex(1)
  }, [posts, selectedTidbit, isFeedReady])

  // ✅ HYDRATION SAFE: Enhanced load more with guards
  const loadMore = useCallback(() => {
    if (!isFeedReady) return
    
    const filtered = selectedTidbit ? posts.filter((p) => p.tidbit === selectedTidbit) : posts
    const nextIndex = loadIndex + 1
    setVisiblePosts(filtered.slice(0, nextIndex * postsPerLoad))
    setLoadIndex(nextIndex)
  }, [loadIndex, posts, selectedTidbit, isFeedReady])

  // ✅ HYDRATION SAFE: Enhanced intersection observer
  useEffect(() => {
    if (!isFeedReady) return
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { threshold: 1 }
    )
    
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }
    
    return () => observer.disconnect()
  }, [loadMore, isFeedReady])

  // ✅ HYDRATION SAFE: Enhanced like handler with proper guards
  const handleLike = async (postId: string) => {
    if (!isFeedReady || !user) {
      alert('Please log in to like posts.')
      return
    }

    const supabase = getClient()
    if (!supabase) {
      alert('Like service unavailable. Please try again.')
      return
    }

    try {
      const alreadyLiked = userLikedPosts.includes(postId)

      if (alreadyLiked) {
        await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', postId)
      } else {
        await supabase.from('likes').insert({ user_id: user.id, post_id: postId })
      }

      const { data: likesData } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id)

      if (likesData) {
        setUserLikedPosts(likesData.map((like) => like.post_id))
      }
    } catch (error) {
      console.error('Error handling like:', error)
      alert('Failed to like post. Please try again.')
    }
  }

  // ✅ HYDRATION SAFE: Enhanced filter change handler
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!isFeedReady) return
    
    const value = e.target.value
    setSelectedTidbit(value === '' ? null : parseInt(value))
  }

  // ✅ HYDRATION SAFE: Enhanced loading states
  if (!mounted) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-4 space-y-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="break-inside-avoid mb-4 w-full">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 animate-pulse">
                <div className="h-64 bg-gray-200"></div>
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-16 h-8 bg-gray-200 rounded-full"></div>
                      <div className="w-16 h-8 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!clientReady) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3 text-gray-600">
            <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">Connecting to post feed...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4">
      {/* Top Filter */}
      <div className="flex items-center gap-4 mb-6">
        <label htmlFor="filter" className="text-sm font-semibold text-gray-700">
          Filter by Tidbit:
        </label>
        <select
          id="filter"
          value={selectedTidbit !== null ? selectedTidbit.toString() : ''}
          onChange={handleFilterChange}
          disabled={!isFeedReady}
          className="border border-gray-300 rounded px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">All</option>
          {allTidbits.map((tidbitNum) => (
            <option key={tidbitNum} value={tidbitNum}>
              {tidbitNum}
            </option>
          ))}
        </select>
      </div>

      {/* Post Grid with masonry style */}
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-4 space-y-4">
        {visiblePosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isLiked={userLikedPosts.includes(post.id)}
            onLike={() => handleLike(post.id)}
            onClick={() => setSelectedPost(post)}
          />
        ))}
        <div ref={loadMoreRef} className="h-10 w-full"></div>
      </div>

      {/* Post Modal */}
      {selectedPost && (
        <PostModal 
          post={selectedPost} 
          onClose={() => setSelectedPost(null)} 
        />
      )}
    </div>
  )
}