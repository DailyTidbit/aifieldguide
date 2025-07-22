// Updated BitBoard component with comment counting and filtering

'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import AuthForm from '../components/AuthForm'
import PostForm from '../components/PostForm'
import UserProfile from '../components/UserProfile'
import ProfileSetupWizard from '../components/ProfileSetupWizard'
import PostModal from '../components/PostModal'
import { 
  Loader2, 
  RefreshCw, 
  Filter, 
  TrendingUp, 
  Users, 
  Sparkles,
  Plus,
  Search,
  X,
  Menu,
  Heart,
  Camera,
  Grid3X3,
  List,
  SortAsc,
  ChevronDown,
  MessageCircle
} from 'lucide-react'
import Image from 'next/image'
import { isValidMediaUrl } from '../lib/validateMedia'

// Enhanced Post type with comment count
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
  comments_count?: number
  description?: string
  username?: string
  user_avatar?: string | null
  user_full_name?: string | null
}

// Profile type for better type safety
type Profile = {
  id: string
  username: string | null
  avatar_url: string | null
  full_name: string | null
}

type FilterOption = 'all' | 'trending' | 'recent' | 'popular' | 'liked' | 'commented'
type ViewMode = 'masonry' | 'grid' | 'list'

// Enhanced skeleton with multiple variants
function SkeletonCard({ variant = 'default' }: { variant?: 'tall' | 'default' | 'wide' }) {
  const heightClass = {
    tall: 'h-80',
    default: 'h-64', 
    wide: 'h-48'
  }[variant]

  return (
    <div className={`break-inside-avoid mb-4 w-full animate-pulse`}>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Image skeleton with variant height */}
        <div className={`w-full ${heightClass} bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer`}></div>
        
        {/* Content skeleton */}
        <div className="p-4 space-y-3">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          
          {/* User info skeleton */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gray-200 rounded-full"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
              <div className="h-5 bg-gray-200 rounded-full w-8"></div>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-6"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Enhanced masonry component with intersection observer
function OptimizedMasonry({ 
  posts, 
  onTidbitClick, 
  onLike, 
  userLikedPosts,
  viewMode,
  loading = false,
  onPostClick
}: { 
  posts: Post[]
  onTidbitClick: (tidbit: number) => void 
  onLike: (postId: string) => void
  userLikedPosts: string[]
  viewMode: ViewMode
  loading?: boolean
  onPostClick: (post: Post) => void
}) {
  const [visiblePosts, setVisiblePosts] = useState<Post[]>([])
  const [page, setPage] = useState(1)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const postsPerPage = 24

  // Memoized style injection for better performance
  const masonryStyles = useMemo(() => `
    .masonry-container {
      column-count: auto;
      column-width: 300px;
      column-gap: 16px;
      padding: 16px;
    }
    
    @media (max-width: 640px) {
      .masonry-container {
        column-width: 280px;
        column-gap: 12px;
        padding: 12px;
      }
    }
    
    @media (min-width: 1536px) {
      .masonry-container {
        column-width: 320px;
        column-gap: 20px;
        padding: 20px;
      }
    }

    @keyframes shimmer {
      0% { background-position: -1000px 0; }
      100% { background-position: 1000px 0; }
    }
    
    .animate-shimmer {
      background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
      background-size: 1000px 100%;
      animation: shimmer 2s infinite;
    }

    .grid-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
      padding: 1rem;
    }

    .list-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
    }
  `, [])

  // Load more posts with intersection observer
  const loadMore = useCallback(() => {
    const startIndex = (page - 1) * postsPerPage
    const endIndex = page * postsPerPage
    const newPosts = posts.slice(startIndex, endIndex)
    
    if (newPosts.length > 0) {
      setVisiblePosts(prev => [...prev, ...newPosts])
      setPage(prev => prev + 1)
    }
  }, [posts, page])

  // Reset when posts change
  useEffect(() => {
    setVisiblePosts(posts.slice(0, postsPerPage))
    setPage(2)
  }, [posts])

  // Intersection observer setup
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visiblePosts.length < posts.length) {
          loadMore()
        }
      },
      { threshold: 1.0 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [loadMore, visiblePosts.length, posts.length])

  // Render different view modes
  const renderPosts = () => {
    if (loading) {
      const skeletonVariants: Array<'tall' | 'default' | 'wide'> = ['default', 'tall', 'wide']
      return Array.from({ length: 12 }).map((_, index) => (
        <SkeletonCard 
          key={`skeleton-${index}`} 
          variant={skeletonVariants[index % skeletonVariants.length]} 
        />
      ))
    }

    switch (viewMode) {
      case 'list':
        return visiblePosts.map((post) => (
          <ListCard 
            key={post.id} 
            post={post} 
            onTidbitClick={onTidbitClick}
            onLike={onLike}
            isLiked={userLikedPosts.includes(post.id)}
            onClick={() => onPostClick(post)}
          />
        ))
      
      case 'grid':
        return visiblePosts.map((post) => (
          <GridCard 
            key={post.id} 
            post={post} 
            onTidbitClick={onTidbitClick}
            onLike={onLike}
            isLiked={userLikedPosts.includes(post.id)}
            onClick={() => onPostClick(post)}
          />
        ))
      
      case 'masonry':
      default:
        return visiblePosts.map((post) => (
          <PinterestCard 
            key={post.id} 
            post={post} 
            onTidbitClick={onTidbitClick}
            onLike={onLike}
            isLiked={userLikedPosts.includes(post.id)}
            onClick={() => onPostClick(post)}
          />
        ))
    }
  }

  const containerClass = {
    masonry: 'masonry-container',
    grid: 'grid-container',
    list: 'list-container'
  }[viewMode]

  return (
    <>
      <style>{masonryStyles}</style>
      
      <div className={containerClass}>
        {renderPosts()}
      </div>

      {/* Load more trigger */}
      {visiblePosts.length < posts.length && (
        <div ref={loadMoreRef} className="h-10 w-full flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      )}
    </>
  )
}

// Enhanced Pinterest Card Component
function PinterestCard({ 
  post, 
  onTidbitClick, 
  onLike, 
  isLiked,
  onClick
}: { 
  post: Post
  onTidbitClick: (tidbit: number) => void 
  onLike: (postId: string) => void
  isLiked: boolean
  onClick: () => void
}) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  const isAudioLink = typeof post.media_url === 'string' &&
    (post.media_url.includes('suno.ai') || post.media_url.includes('udio.com'))

  const hasImage = typeof post.media_url === 'string' &&
    isValidMediaUrl(post.media_url) && !isAudioLink

  const bgColors = ['bg-[#F9FCF7]', 'bg-[#E6F4EC]', 'bg-[#E3F2FD]']
  const bgColor = bgColors[post.id.charCodeAt(0) % bgColors.length]

  return (
    <div className="break-inside-avoid mb-4 w-full">
      <div 
        className={`relative group rounded-2xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer ${
          hasImage ? 'bg-white' : bgColor
        }`}
        onClick={onClick}
      >
        {/* Enhanced Media Section */}
        {(hasImage || isAudioLink) && (
          <div className="relative w-full h-64 bg-gray-100 flex items-center justify-center overflow-hidden">
            {hasImage && !imageError ? (
              <>
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-shimmer w-full h-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"></div>
                  </div>
                )}

                <Image
                  src={post.media_url!}
                  alt="Post media"
                  fill
                  className={`object-cover transition-all duration-700 group-hover:scale-105 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </>
            ) : isAudioLink ? (
              <div className="flex flex-col items-center gap-3 text-gray-600 p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#60A875] to-[#59B1E3] rounded-full flex items-center justify-center">
                  <span className="text-2xl">🎧</span>
                </div>
                <div>
                  <p className="font-medium">Audio Content</p>
                  <p className="text-sm text-gray-500">Click to listen</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-gray-500 p-6">
                <Camera className="w-8 h-8" />
                <p className="text-sm">Media unavailable</p>
              </div>
            )}

            {/* Enhanced Hover Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 opacity-0 group-hover:opacity-100">
              <div className="absolute top-4 right-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <button className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors">
                  <Plus className="w-4 h-4 text-gray-700" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Text Content */}
        {(post.content || post.before_text || post.after_text) && (
          <div className="p-4 text-gray-800 space-y-3">
            {post.content && (
              <p className="whitespace-pre-wrap leading-snug font-medium text-sm line-clamp-6">
                {post.content}
              </p>
            )}

            {(post.before_text || post.after_text) && (
              <div className="space-y-2 text-sm text-gray-700">
                {post.before_text && (
                  <div className="p-3 bg-[#60A875]/10 rounded-lg border-l-4 border-[#60A875]">
                    <p><strong className="text-[#60A875]">Before:</strong> {post.before_text}</p>
                  </div>
                )}
                {post.after_text && (
                  <div className="p-3 bg-[#59B1E3]/10 rounded-lg border-l-4 border-[#59B1E3]">
                    <p><strong className="text-[#59B1E3]">After:</strong> {post.after_text}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Enhanced User Info Bar */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {post.user_avatar ? (
                <Image
                  src={post.user_avatar}
                  alt={post.username || 'User'}
                  width={24}
                  height={24}
                  className="rounded-full ring-2 ring-white shadow-sm"
                />
              ) : (
                <div className="w-6 h-6 bg-gradient-to-br from-[#60A875] to-[#59B1E3] rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {(post.username || 'A').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-sm font-medium text-gray-700 truncate">
                {post.username ? `@${post.username}` : 'Anonymous'}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onTidbitClick(post.tidbit)
                }}
                className="text-xs bg-[#59B1E3] text-white px-2 py-1 rounded-full hover:bg-blue-600 transition-colors whitespace-nowrap"
              >
                Day {post.tidbit}
              </button>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Like Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onLike(post.id)
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-200 ${
                  isLiked 
                    ? 'bg-[#60A875]/10 text-[#60A875] scale-105' 
                    : 'hover:bg-gray-100 text-gray-500 hover:text-[#60A875] hover:scale-105'
                }`}
              >
                <Heart
                  className={`w-4 h-4 transition-all duration-200 ${
                    isLiked ? 'fill-[#60A875] text-[#60A875]' : ''
                  }`}
                />
                <span className="text-sm font-medium">{post.likes_count ?? 0}</span>
              </button>

              {/* Comment Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onClick()
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-200 hover:bg-gray-100 text-gray-500 hover:text-[#59B1E3] hover:scale-105"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{post.comments_count ?? 0}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Grid Card Component for grid view
function GridCard({ post, onTidbitClick, onLike, isLiked, onClick }: {
  post: Post
  onTidbitClick: (tidbit: number) => void
  onLike: (postId: string) => void
  isLiked: boolean
  onClick: () => void
}) {
  return (
    <div 
      className="aspect-square bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer"
      onClick={onClick}
    >
      <div className="h-full flex flex-col">
        {/* Fixed height image area */}
        <div className="h-48 bg-gray-100 relative overflow-hidden">
          {post.media_url && isValidMediaUrl(post.media_url) ? (
            <Image
              src={post.media_url}
              alt="Post media"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#60A875]/20 to-[#59B1E3]/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[#60A875]" />
            </div>
          )}
        </div>
        
        {/* Content area */}
        <div className="flex-1 p-3 flex flex-col justify-between">
          <div>
            <p className="text-sm line-clamp-3 text-gray-700">{post.content}</p>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Day {post.tidbit}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onLike(post.id)
                }}
                className={`p-1 rounded-full transition-colors ${
                  isLiked ? 'text-[#60A875]' : 'text-gray-400 hover:text-[#60A875]'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onClick()
                }}
                className="p-1 rounded-full transition-colors text-gray-400 hover:text-[#59B1E3]"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// List Card Component for list view
function ListCard({ post, onTidbitClick, onLike, isLiked, onClick }: {
  post: Post
  onTidbitClick: (tidbit: number) => void
  onLike: (postId: string) => void
  isLiked: boolean
  onClick: () => void
}) {
  return (
    <div 
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 p-4 cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          {post.media_url && isValidMediaUrl(post.media_url) ? (
            <Image
              src={post.media_url}
              alt="Post media"
              width={80}
              height={80}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#60A875]/20 to-[#59B1E3]/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#60A875]" />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs bg-[#59B1E3] text-white px-2 py-1 rounded-full">
                  Day {post.tidbit}
                </span>
                <span className="text-xs text-gray-500">
                  {post.username ? `@${post.username}` : 'Anonymous'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onLike(post.id)
                }}
                className={`p-2 rounded-full transition-all duration-200 ${
                  isLiked 
                    ? 'text-[#60A875] bg-[#60A875]/10' 
                    : 'text-gray-400 hover:text-[#60A875] hover:bg-gray-100'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onClick()
                }}
                className="p-2 rounded-full transition-all duration-200 text-gray-400 hover:text-[#59B1E3] hover:bg-gray-100"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EnhancedBitBoard() {
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedTidbit, setSelectedTidbit] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [showPostForm, setShowPostForm] = useState(false)
  const [filterOption, setFilterOption] = useState<FilterOption>('recent')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [userLikedPosts, setUserLikedPosts] = useState<string[]>([])
  const [userCommentedPosts, setUserCommentedPosts] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('masonry')
  const [showViewOptions, setShowViewOptions] = useState(false)
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false)
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  // Enhanced debounced search
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Memoized filtered posts for better performance
  const filteredPosts = useMemo(() => {
    let filtered = [...posts]

    // Apply tidbit filter
    if (selectedTidbit !== null) {
      filtered = filtered.filter(post => post.tidbit === selectedTidbit)
    }

    // Apply search filter
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = filtered.filter(post => 
        post.content?.toLowerCase().includes(query) ||
        post.description?.toLowerCase().includes(query) ||
        post.username?.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    switch (filterOption) {
      case 'trending':
      case 'popular':
        return filtered.sort((a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0))
      case 'liked':
        return filtered.filter(post => userLikedPosts.includes(post.id))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      case 'commented':
        return filtered.filter(post => userCommentedPosts.includes(post.id))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      case 'recent':
      default:
        return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
  }, [posts, selectedTidbit, debouncedSearchQuery, filterOption, userLikedPosts, userCommentedPosts])

  // Enhanced fetchPosts function with comment counts
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (postsError) throw postsError

      // Get comment counts for each post
      const postsWithComments = await Promise.all(
        (postsData || []).map(async (post) => {
          const { count, error: countError } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id)

          return {
            ...post,
            comments_count: countError ? 0 : (count || 0)
          }
        })
      )

      // Get user profiles
      const userIds = [...new Set(postsWithComments.map(post => post.user_id).filter(Boolean))]
      
      let profilesData: Profile[] = []
      if (userIds.length > 0) {
        const { data, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, full_name')
          .in('id', userIds)

        if (!profilesError && data) {
          profilesData = data as Profile[]
        }
      }

      const postsWithProfiles = postsWithComments.map(post => {
        const profile = profilesData.find(p => p.id === post.user_id)
        return {
          ...post,
          username: profile?.username || null,
          user_avatar: profile?.avatar_url || null,
          user_full_name: profile?.full_name || null
        }
      })

      setPosts(postsWithProfiles)
    } catch (err) {
      console.error('❌ Error fetching posts:', err)
      setError('Failed to load posts. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Enhanced user and likes fetching
  const fetchUserAndLikes = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    if (user) {
      // Check if profile needs setup
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', user.id)
        .single()

      // If no full_name, they need to complete setup
      if (!profile?.full_name) {
        setNeedsProfileSetup(true)
      }

      // Get liked posts
      const { data: likesData } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id)

      if (likesData) {
        setUserLikedPosts(likesData.map(like => like.post_id))
      }

      // Get commented posts
      const { data: commentsData } = await supabase
        .from('comments')
        .select('post_id')
        .eq('user_id', user.id)

      if (commentsData) {
        const commentedPostIds = [...new Set(commentsData.map(comment => comment.post_id))]
        setUserCommentedPosts(commentedPostIds)
      }
    }
  }, [])

  // Like handling
  const handleLike = useCallback(async (postId: string) => {
    if (!user) {
      alert('Please log in to like posts.')
      return
    }
    
    const alreadyLiked = userLikedPosts.includes(postId)

    try {
      if (alreadyLiked) {
        await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', postId)
        setUserLikedPosts(prev => prev.filter(id => id !== postId))
      } else {
        await supabase.from('likes').insert({ user_id: user.id, post_id: postId })
        setUserLikedPosts(prev => [...prev, postId])
      }

      // Update like count in posts
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              likes_count: alreadyLiked 
                ? (post.likes_count ?? 1) - 1 
                : (post.likes_count ?? 0) + 1 
            }
          : post
      ))
    } catch (error) {
      console.error('Error updating like:', error)
    }
  }, [user, userLikedPosts])

  // Initial setup
  useEffect(() => {
    fetchUserAndLikes()
    fetchPosts()
  }, [fetchUserAndLikes, fetchPosts])

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('posts_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'posts'
      }, () => {
        fetchPosts()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchPosts])

  const handleRefresh = useCallback(async () => {
    await Promise.all([fetchPosts(), fetchUserAndLikes()])
  }, [fetchPosts, fetchUserAndLikes])

  const handlePostSubmit = useCallback(() => {
    setShowPostForm(false)
    handleRefresh()
  }, [handleRefresh])

  const clearFilters = useCallback(() => {
    setSelectedTidbit(null)
    setSearchQuery('')
    setFilterOption('recent')
  }, [])

  const getActiveFiltersCount = () => {
    let count = 0
    if (selectedTidbit !== null) count++
    if (debouncedSearchQuery.trim()) count++
    if (filterOption !== 'recent') count++
    return count
  }

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Enhanced Top Navigation */}
      <nav className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 relative z-50">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button className="lg:hidden p-2 hover:bg-gray-100 rounded-xl">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-[#60A875] to-[#59B1E3] p-2 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 
              className="text-xl font-bold text-gray-900 hidden sm:block"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              BitBoard
            </h1>
          </div>
        </div>

        {/* Center - Enhanced Search */}
        <div className="flex-1 max-w-2xl mx-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search for AI creations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-12 py-3 bg-gray-100 border-none rounded-full focus:ring-2 focus:ring-[#60A875]/20 focus:bg-white focus:shadow-md transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right Section - Enhanced */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowViewOptions(!showViewOptions)}
              className="p-3 hover:bg-gray-100 rounded-full transition-colors relative"
            >
              {viewMode === 'masonry' && <Grid3X3 className="w-5 h-5" />}
              {viewMode === 'grid' && <Grid3X3 className="w-5 h-5" />}
              {viewMode === 'list' && <List className="w-5 h-5" />}
            </button>

            {showViewOptions && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[120px]">
                {[
                  { key: 'masonry', label: 'Masonry', icon: Grid3X3 },
                  { key: 'grid', label: 'Grid', icon: Grid3X3 },
                  { key: 'list', label: 'List', icon: List }
                ].map((option) => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.key}
                      onClick={() => {
                        setViewMode(option.key as ViewMode)
                        setShowViewOptions(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl transition-colors flex items-center gap-2 ${
                        viewMode === option.key ? 'text-[#60A875] font-medium bg-green-50' : 'text-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {option.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-full transition-colors relative ${
              getActiveFiltersCount() > 0 
                ? 'bg-[#60A875] text-white hover:bg-green-600' 
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <Filter className="w-5 h-5" />
            {getActiveFiltersCount() > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {getActiveFiltersCount()}
              </span>
            )}
          </button>

          {user && (
            <button
              onClick={() => setShowPostForm(!showPostForm)}
              className="p-3 bg-[#60A875] text-white rounded-full hover:bg-green-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-3 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
            ) : (
              <RefreshCw className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {user ? (
            <button
              onClick={() => setShowUserProfile(true)}
              className="w-8 h-8 bg-gray-300 rounded-full hover:ring-2 hover:ring-[#60A875]/20 transition-all flex items-center justify-center"
            >
              <span className="text-sm font-medium text-gray-700">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </button>
          ) : (
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="px-4 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              Sign up
            </button>
          )}
        </div>
      </nav>

      {/* Enhanced Filters Bar */}
      {showFilters && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-3 overflow-x-auto">
            {['recent', 'trending', 'popular', 'liked', 'commented'].map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterOption(filter as FilterOption)}
                className={`px-4 py-2 rounded-full transition-colors whitespace-nowrap capitalize text-sm font-medium ${
                  filterOption === filter
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {filter === 'trending' && <TrendingUp className="w-4 h-4 inline mr-1" />}
                {filter === 'liked' && <Heart className="w-4 h-4 inline mr-1" />}
                {filter === 'commented' && <MessageCircle className="w-4 h-4 inline mr-1" />}
                {filter}
              </button>
            ))}

            {selectedTidbit !== null && (
              <div className="flex items-center gap-2 px-4 py-2 bg-[#59B1E3] text-white rounded-full">
                <span className="text-sm font-medium">Day {selectedTidbit}</span>
                <button
                  onClick={() => setSelectedTidbit(null)}
                  className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {getActiveFiltersCount() > 0 && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors whitespace-nowrap text-sm"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {/* Auth Modal */}
        {!user && showMobileMenu && (
          <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Join BitBoard</h2>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <AuthForm />
            </div>
          </div>
        )}

        {/* Profile Setup Modal */}
        {user && needsProfileSetup && (
          <ProfileSetupWizard 
            userId={user.id} 
            onComplete={() => {
              setNeedsProfileSetup(false)
              handleRefresh() // Refresh data after setup
            }}
            onSkip={() => setNeedsProfileSetup(false)}
          />
        )}

        {/* User Profile Modal */}
        {user && showUserProfile && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
              <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-gray-200 z-10">
                <h2 className="text-2xl font-bold text-gray-900">Your Profile</h2>
                <button
                  onClick={() => setShowUserProfile(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-0">
                <UserProfile userId={user.id} isOwnProfile={true} />
              </div>
            </div>
          </div>
        )}

        {/* Post Creation Modal */}
        {user && showPostForm && (
          <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create a Pin</h2>
                <button
                  onClick={() => setShowPostForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <PostForm onPostSubmit={handlePostSubmit} />
            </div>
          </div>
        )}

        {/* Post Detail Modal */}
        {selectedPost && (
          <PostModal 
            post={selectedPost} 
            onClose={() => setSelectedPost(null)} 
          />
        )}

        {/* Error State */}
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg max-w-md">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 rounded-full p-2">
                  <RefreshCw className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800">Error loading posts</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="h-full overflow-y-auto">
          {filteredPosts.length === 0 && !loading ? (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center max-w-md">
                <div className="bg-gray-100 rounded-2xl p-8 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {debouncedSearchQuery ? 'No pins found' : 'No pins yet'}
                </h3>
                <p className="text-gray-600 mb-8">
                  {debouncedSearchQuery 
                    ? `No pins match "${debouncedSearchQuery}". Try a different search.`
                    : selectedTidbit 
                      ? `No pins for Day ${selectedTidbit} yet. Be the first to create one!`
                      : filterOption === 'commented'
                        ? "You haven't commented on any posts yet. Start engaging with the community!"
                        : "Be the first to share your AI creation and inspire the community!"
                  }
                </p>
                
                <div className="flex flex-col gap-3">
                  {user && (
                    <button
                      onClick={() => setShowPostForm(true)}
                      className="px-6 py-3 bg-[#60A875] text-white rounded-full hover:bg-green-600 transition-colors font-medium"
                    >
                      Create your first pin
                    </button>
                  )}
                  {(debouncedSearchQuery || selectedTidbit) && (
                    <button
                      onClick={clearFilters}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <OptimizedMasonry 
              posts={filteredPosts} 
              onTidbitClick={setSelectedTidbit}
              onLike={handleLike}
              userLikedPosts={userLikedPosts}
              viewMode={viewMode}
              loading={loading}
              onPostClick={setSelectedPost}
            />
          )}
        </div>
      </div>
    </div>
  )
}