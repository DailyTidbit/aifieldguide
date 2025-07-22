'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import PostCard from './postcard'
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
  username?: string // for future use
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
  const [user, setUser] = useState<any>(null)
  const [userLikedPosts, setUserLikedPosts] = useState<string[]>([])
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [visiblePosts, setVisiblePosts] = useState<Post[]>([])
  const [loadIndex, setLoadIndex] = useState(1)
  const [allTidbits, setAllTidbits] = useState<number[]>([])
  const loadMoreRef = useRef(null)
  const postsPerLoad = 24

  const fetchUserAndLikes = async () => {
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
  }

  const fetchAllTidbits = async () => {
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
  }

  useEffect(() => {
    fetchUserAndLikes()
    fetchAllTidbits()
  }, [])

  useEffect(() => {
    const filtered = selectedTidbit ? posts.filter((p) => p.tidbit === selectedTidbit) : posts
    setVisiblePosts(filtered.slice(0, postsPerLoad))
    setLoadIndex(1)
  }, [posts, selectedTidbit])

  const loadMore = useCallback(() => {
    const filtered = selectedTidbit ? posts.filter((p) => p.tidbit === selectedTidbit) : posts
    const nextIndex = loadIndex + 1
    setVisiblePosts(filtered.slice(0, nextIndex * postsPerLoad))
    setLoadIndex(nextIndex)
  }, [loadIndex, posts, selectedTidbit])

  useEffect(() => {
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
  }, [loadMore])

  const handleLike = async (postId: string) => {
    if (!user) return alert('Please log in to like posts.')
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
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelectedTidbit(value === '' ? null : parseInt(value))
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
          className="border border-gray-300 rounded px-3 py-1"
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
          <div
            key={post.id}
            className="break-inside-avoid relative group cursor-pointer"
            onClick={() => setSelectedPost(post)}
          >
            <PostCard
              post={post}
              isLiked={userLikedPosts.includes(post.id)}
              onLike={() => handleLike(post.id)}
            />
            <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-70 text-white text-xs p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
              <p className="font-semibold text-sm mb-1">
                {post.description || 'No description provided.'}
              </p>
              <div className="text-gray-300 text-xs">
                <p>
                  Posted by:{' '}
                  <span className="font-semibold">
                    {post.username
                      ? `@${post.username}`
                      : post.user_id
                      ? post.user_id.slice(0, 8) + '...'
                      : 'Unknown user'}
                  </span>
                </p>
                <p>{new Date(post.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
        <div ref={loadMoreRef} className="h-10 w-full"></div>
      </div>

      {/* Post Modal */}
      {selectedPost && <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />}
    </div>
  )
}
