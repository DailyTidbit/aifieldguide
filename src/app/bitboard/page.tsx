// Mobile-Optimized BitBoard with Enhanced PostCard Integration, Privacy Support, and Advanced Search
'use client'

import { Suspense, useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { getSupabaseBrowserClient } from '../lib/supabase-browser'
import AuthForm from '../components/AuthForm'
import PostForm from '../components/PostForm'
import UserProfile from '../components/UserProfile'
import ProfileSetupWizard from '../components/ProfileSetupWizard'
import PostModal from '../components/PostModal'
import PostCard from '../components/PostCard'
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
  MessageCircle,
  ArrowUp,
  Lock,
  Globe,
  Eye,
  EyeOff
} from 'lucide-react'
import Image from 'next/image'
import { isValidMediaUrl } from '../lib/validateMedia'

// Enhanced Post type with privacy and pin support
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
  is_private?: boolean
  is_pinned?: boolean
}

// Profile type for better type safety
type Profile = {
  id: string
  username: string | null
  avatar_url: string | null
  full_name: string | null
}

// Define interface for database query results
interface LikeData {
  post_id: string
  user_id?: string
}

interface CommentData {
  post_id: string
  user_id?: string
}

interface PostData {
  id: string
  created_at: string
  user_id: string | null
  type: string
  content: string
  before_text: string | null
  after_text: string | null
  media_url: string | null
  tidbit: number
  is_private?: boolean
  is_pinned?: boolean
}

type FilterOption = 'all' | 'trending' | 'recent' | 'popular' | 'liked' | 'commented' | 'private'
type ViewMode = 'masonry' | 'grid' | 'list'

// Helper function to parse search dates more reliably
const parseSearchDate = (dateString: string): Date => {
  // First try standard Date constructor
  let date = new Date(dateString)
  
  if (!isNaN(date.getTime())) {
    return date
  }
  
  // Try MM/DD/YYYY format
  const mmddyyyy = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (mmddyyyy) {
    const month = parseInt(mmddyyyy[1]) - 1  // Month is 0-indexed
    const day = parseInt(mmddyyyy[2])
    const year = parseInt(mmddyyyy[3])
    return new Date(year, month, day)
  }
  
  // Try MM-DD-YYYY format
  const mmddyyyyDash = dateString.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (mmddyyyyDash) {
    const month = parseInt(mmddyyyyDash[1]) - 1
    const day = parseInt(mmddyyyyDash[2])
    const year = parseInt(mmddyyyyDash[3])
    return new Date(year, month, day)
  }
  
  // Try YYYY/MM/DD format
  const yyyymmdd = dateString.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/)
  if (yyyymmdd) {
    const year = parseInt(yyyymmdd[1])
    const month = parseInt(yyyymmdd[2]) - 1
    const day = parseInt(yyyymmdd[3])
    return new Date(year, month, day)
  }
  
  console.log('Could not parse date:', dateString)
  return new Date(NaN) // Invalid date
}

// FIXED: Better search parsing with proper day number handling
const parseSearchQuery = (query: string) => {
  const parts = {
    username: null as string | null,
    afterDate: null as string | null,
    beforeDate: null as string | null,
    dayNumber: null as number | null,
    textQuery: ''
  }

  let remainingQuery = query.trim()

  // Extract @username (match @word)
  const usernameMatch = remainingQuery.match(/@(\w+)/)
  if (usernameMatch) {
    parts.username = usernameMatch[1].toLowerCase()
    remainingQuery = remainingQuery.replace(usernameMatch[0], '').trim()
  }

  // Extract after:date
  const afterMatch = remainingQuery.match(/after:(\S+)/)
  if (afterMatch) {
    parts.afterDate = afterMatch[1]
    remainingQuery = remainingQuery.replace(afterMatch[0], '').trim()
  }

  // Extract before:date
  const beforeMatch = remainingQuery.match(/before:(\S+)/)
  if (beforeMatch) {
    parts.beforeDate = beforeMatch[1]
    remainingQuery = remainingQuery.replace(beforeMatch[0], '').trim()
  }

  // FIXED: Extract day number patterns - be more restrictive about standalone numbers
  const dayPatterns = [
    /day:(\d+)/i,      // day:5
    /day\s+(\d+)/i,    // day 5  
    /#(\d+)/           // #5
    // Removed /^(\d{1,3})$/ to allow partial numbers like "2", "20", "202" to be text searches
  ]

  for (const pattern of dayPatterns) {
    const match = remainingQuery.match(pattern)
    if (match) {
      const dayNum = parseInt(match[1])
      // Only treat as day number if it's reasonable (1-365 or similar)
      if (dayNum >= 1 && dayNum <= 365) {
        parts.dayNumber = dayNum
        remainingQuery = remainingQuery.replace(match[0], '').trim()
        break
      }
    }
  }

  // Only treat bare numbers as tidbit days if they're complete and reasonable
  // BUT ALSO keep them as text queries for broader matching
  const bareNumberMatch = remainingQuery.match(/^(\d{1,2})$/)
  if (bareNumberMatch) {
    const dayNum = parseInt(bareNumberMatch[1])
    if (dayNum >= 1 && dayNum <= 31) { // Only single/double digit days (1-31)
      parts.dayNumber = dayNum
      // DON'T remove from remainingQuery - let it also be a text search
    }
  }

  // Everything else is text search (including the number if it matched above)
  parts.textQuery = remainingQuery.toLowerCase().trim()
  
  console.log('Search parsed:', JSON.stringify(parts, null, 2), 'from query:', query)
  return parts
}

// Mobile-optimized skeleton with touch-friendly design
function MobileSkeletonCard({ variant = 'default' }: { variant?: 'tall' | 'default' | 'wide' }) {
  const heightClass = {
    tall: 'h-80',
    default: 'h-64', 
    wide: 'h-48'
  }[variant]

  return (
    <div className="break-inside-avoid mb-3 w-full animate-pulse">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        {/* Image skeleton */}
        <div className={`w-full ${heightClass} bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer`}></div>
        
        {/* Content skeleton - mobile optimized */}
        <div className="p-3 sm:p-4 space-y-3">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-4/5"></div>
            <div className="h-4 bg-gray-200 rounded w-3/5"></div>
          </div>
          
          {/* User info skeleton */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-200 rounded-full"></div>
              <div className="h-3 bg-gray-200 rounded w-16 sm:w-20"></div>
              <div className="h-4 bg-gray-200 rounded-full w-8"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-6 bg-gray-200 rounded-full"></div>
              <div className="w-8 h-6 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Mobile-optimized masonry component with privacy support
function MobileOptimizedMasonry({ 
  posts, 
  onTidbitClick, 
  onLike, 
  userLikedPosts,
  viewMode,
  loading = false,
  onPostClick,
  currentUser
}: { 
  posts: Post[]
  onTidbitClick: (tidbit: number) => void 
  onLike: (postId: string) => void
  userLikedPosts: string[]
  viewMode: ViewMode
  loading?: boolean
  onPostClick: (post: Post) => void
  currentUser: any
}) {
  const [visiblePosts, setVisiblePosts] = useState<Post[]>([])
  const [page, setPage] = useState(1)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const postsPerPage = 20 // Reduced for mobile performance

  // Mobile-optimized style injection
  const masonryStyles = useMemo(() => `
    .masonry-container {
      column-count: auto;
      column-width: 280px;
      column-gap: 12px;
      padding: 8px;
    }
    
    @media (min-width: 640px) {
      .masonry-container {
        column-width: 300px;
        column-gap: 16px;
        padding: 16px;
      }
    }
    
    @media (min-width: 1024px) {
      .masonry-container {
        column-width: 320px;
        column-gap: 20px;
        padding: 20px;
      }
    }
    
    @media (min-width: 1536px) {
      .masonry-container {
        column-width: 340px;
        column-gap: 24px;
        padding: 24px;
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
      gap: 0.75rem;
      padding: 0.5rem;
    }
    
    @media (min-width: 640px) {
      .grid-container {
        gap: 1rem;
        padding: 1rem;
      }
    }

    .list-container {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 0.5rem;
    }
    
    @media (min-width: 640px) {
      .list-container {
        gap: 1rem;
        padding: 1rem;
      }
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

  // Enhanced PostCard with privacy awareness
  const EnhancedPostCard = ({ post }: { post: Post }) => {
    const isOwnPost = currentUser?.id === post.user_id
    
    return (
      <div className="break-inside-avoid mb-3 w-full">
        <div className="relative">
          {/* Privacy indicator for own private posts */}
          {post.is_private && isOwnPost && (
            <div className="absolute top-2 left-2 z-10 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
              <Lock className="w-3 h-3" />
              Private
            </div>
          )}
          
          {/* Pin indicator */}
          {post.is_pinned && (
            <div className="absolute top-2 right-2 z-10 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
              <span className="text-xs">📌</span>
              Pinned
            </div>
          )}
          
          <PostCard
            post={post}
            isLiked={userLikedPosts.includes(post.id)}
            onLike={onLike}
            onClick={() => onPostClick(post)}
          />
        </div>
      </div>
    )
  }

  // Render posts using the enhanced PostCard component with privacy indicators
  const renderPosts = () => {
    if (loading) {
      const skeletonVariants: Array<'tall' | 'default' | 'wide'> = ['default', 'tall', 'wide']
      return Array.from({ length: 12 }).map((_, index) => (
        <MobileSkeletonCard 
          key={`skeleton-${index}`} 
          variant={skeletonVariants[index % skeletonVariants.length]} 
        />
      ))
    }

    return visiblePosts.map((post, index) => (
      <EnhancedPostCard key={`${post.id}-${index}`} post={post} />
    ))
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
          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-gray-400" />
        </div>
      )}
    </>
  )
}

function BitBoardContent() {
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
  const [showScrollTop, setShowScrollTop] = useState(false)

  const supabase = getSupabaseBrowserClient()

  // Enhanced debounced search
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Mobile scroll to top functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // FIXED: Enhanced filtered posts with better search and debugging
  const filteredPosts = useMemo(() => {
    console.log('=== SEARCH DEBUG START ===')
    console.log('Total posts:', posts.length)
    console.log('Search query:', debouncedSearchQuery)
    
    let filtered = [...posts]

    // Apply tidbit filter
    if (selectedTidbit !== null) {
      filtered = filtered.filter(post => post.tidbit === selectedTidbit)
      console.log('After tidbit filter:', filtered.length)
    }

    // Enhanced search filter with better date handling
    if (debouncedSearchQuery.trim()) {
      const searchParts = parseSearchQuery(debouncedSearchQuery)
      console.log('Search parts parsed:', searchParts)
      
      const beforeFilterCount = filtered.length
      
      filtered = filtered.filter(post => {
        // Username filter - check both username and full_name
        if (searchParts.username) {
          const matchesUsername = post.username?.toLowerCase().includes(searchParts.username)
          const matchesFullName = post.user_full_name?.toLowerCase().includes(searchParts.username)
          if (!matchesUsername && !matchesFullName) {
            return false
          }
        }
        
        // Date filters - improved logic with better error handling
        if (searchParts.afterDate || searchParts.beforeDate) {
          const postDate = new Date(post.created_at)
          console.log(`Checking post "${post.content?.slice(0, 20)}...": date = ${postDate} (valid: ${!isNaN(postDate.getTime())})`)
          
          if (searchParts.afterDate) {
            const searchDate = parseSearchDate(searchParts.afterDate)
            console.log(`After comparison: ${postDate.toDateString()} >= ${searchDate.toDateString()} = ${postDate >= searchDate}`)
            
            if (isNaN(searchDate.getTime())) {
              console.warn(`Invalid after date: ${searchParts.afterDate}`)
              return false // Skip posts if date is invalid
            }
            
            if (postDate < searchDate) {
              return false
            }
          }
          
          if (searchParts.beforeDate) {
            const searchDate = parseSearchDate(searchParts.beforeDate)
            searchDate.setHours(23, 59, 59, 999) // End of day
            console.log(`Before comparison: ${postDate.toDateString()} <= ${searchDate.toDateString()} = ${postDate <= searchDate}`)
            
            if (isNaN(searchDate.getTime())) {
              console.warn(`Invalid before date: ${searchParts.beforeDate}`)
              return false // Skip posts if date is invalid
            }
            
            if (postDate > searchDate) {
              return false
            }
          }
        }
        
        // COMBINED SEARCH: Check both tidbit day AND text content
        let matchesSearch = true
        
        if (searchParts.dayNumber !== null || searchParts.textQuery) {
          let matchesDay = false
          let matchesText = false
          
          // Check tidbit day match
          if (searchParts.dayNumber !== null) {
            const postTidbit = Number(post.tidbit)
            const searchDay = Number(searchParts.dayNumber)
            matchesDay = !isNaN(postTidbit) && !isNaN(searchDay) && postTidbit === searchDay
          }
          
          // Check text content match (including dates)
          if (searchParts.textQuery) {
            const displayDate = new Date(post.created_at).toLocaleDateString()
            const isoDate = new Date(post.created_at).toISOString()
            
            const searchableText = [
              post.content || '',
              post.description || '',
              post.before_text || '',
              post.after_text || '',
              post.username || '',
              post.user_full_name || '',
              displayDate, // Add formatted date (e.g., "7/22/2025")
              isoDate, // Add ISO date (e.g., "2025-07-22T...")
              post.created_at || '' // Add raw date string
            ].join(' ').toLowerCase()
            
            matchesText = searchableText.includes(searchParts.textQuery)
          }
          
          // Post matches if it matches EITHER day number OR text content
          matchesSearch = matchesDay || matchesText
        }
        
        return matchesSearch
      })
      
      console.log(`Filter results: ${beforeFilterCount} -> ${filtered.length}`)
      
      // Debug: show what we're actually searching for
      if (searchParts.textQuery) {
        console.log(`Text search active: "${searchParts.textQuery}"`)
        console.log('Sample post content:', posts.slice(0, 2).map(p => p.content?.slice(0, 50) + '...'))
      }
      if (searchParts.dayNumber !== null) {
        console.log(`Day number search: ${searchParts.dayNumber}`)
        console.log('Post tidbits found:', posts.slice(0, 5).map(p => p.tidbit))
      }
      
      // Add helpful feedback for date searches that return all results
      if (searchParts.afterDate || searchParts.beforeDate) {
        if (filtered.length === beforeFilterCount) {
          console.log('🔍 Date filter returned all posts - consider adjusting your date range')
        }
      }
    }

    // Apply privacy-aware sorting
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
      case 'private':
        // Show only user's private posts
        return filtered.filter(post => post.is_private && post.user_id === user?.id)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      case 'recent':
      default:
        // Sort with pinned posts first, then by date
        return filtered.sort((a, b) => {
          // First, sort by pinned status (pinned posts first)
          if (a.is_pinned && !b.is_pinned) return -1
          if (!a.is_pinned && b.is_pinned) return 1
          // Then by date
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
    }
  }, [posts, selectedTidbit, debouncedSearchQuery, filterOption, userLikedPosts, userCommentedPosts, user?.id])

  // OPTIMIZED: Single batched fetchPosts function (no N+1 queries)
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // 1) Who's logged in?
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      // 2) Get posts (public, or your own privates)
      let postsQuery = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (currentUser) {
        // public OR (private AND mine)
        postsQuery = postsQuery.or(
          `is_private.eq.false,and(is_private.eq.true,user_id.eq.${currentUser.id})`
        )
      } else {
        postsQuery = postsQuery.eq('is_private', false)
      }

      const { data: postsData, error: postsError } = await postsQuery
      if (postsError) throw postsError

      const posts = (postsData || []) as PostData[]
      if (posts.length === 0) {
        setPosts([])
        return
      }

      // 3) Batch all secondary fetches in parallel (no per-post requests)
      const postIds = posts.map((p: PostData) => p.id)
      const userIds = [...new Set(posts.map((p: PostData) => p.user_id).filter(Boolean))] as string[]

      const [
        // likes by current user (for heart fill)
        likesByUserPromise,
        // all likes for these posts (to get counts)
        allLikesPromise,
        // all comments for these posts (to get counts)
        allCommentsPromise,
        // profiles for authors
        profilesPromise,
      ] = [
        currentUser
          ? supabase
              .from('likes')
              .select('post_id')
              .eq('user_id', currentUser.id)
              .in('post_id', postIds)
          : Promise.resolve({ data: [] as LikeData[] }),

        supabase
          .from('likes')
          .select('post_id')
          .in('post_id', postIds),

        supabase
          .from('comments')
          .select('post_id')
          .in('post_id', postIds),

        userIds.length
          ? supabase
              .from('profiles')
              .select('id, username, avatar_url, full_name')
              .in('id', userIds)
          : Promise.resolve({ data: [] as Profile[] }),
      ]

      const [
        { data: likesByUser = [] }, 
        { data: allLikes = [] }, 
        { data: allComments = [] }, 
        { data: profiles = [] }
      ] = await Promise.all([
        likesByUserPromise, 
        allLikesPromise, 
        allCommentsPromise, 
        profilesPromise
      ])

      // 4) Build count maps in O(n) - with null safety
      const likesCountMap = new Map<string, number>()
      if (allLikes) {
        for (const row of allLikes as LikeData[]) {
          likesCountMap.set(row.post_id, (likesCountMap.get(row.post_id) || 0) + 1)
        }
      }

      const commentsCountMap = new Map<string, number>()
      if (allComments) {
        for (const row of allComments as CommentData[]) {
          commentsCountMap.set(row.post_id, (commentsCountMap.get(row.post_id) || 0) + 1)
        }
      }

      // 5) Profile map
      const profileMap = new Map<string, Profile>()
      for (const p of profiles as Profile[]) profileMap.set(p.id, p as Profile)

      // 6) Merge everything
      const enriched = posts.map((post: PostData) => {
        const profile = post.user_id ? profileMap.get(post.user_id) : undefined
        return {
          ...post,
          likes_count: likesCountMap.get(post.id) || 0,
          comments_count: commentsCountMap.get(post.id) || 0,
          username: profile?.username || null,
          user_avatar: profile?.avatar_url || null,
          user_full_name: profile?.full_name || null,
        } as Post
      })

      // 7) Save liked posts list (for heart fill)
      setUserLikedPosts((likesByUser as LikeData[]).map((r: LikeData) => r.post_id))

      setPosts(enriched)
    } catch (err) {
      console.error('⚠ Error fetching posts:', err)
      setError('Failed to load posts. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // OPTIMIZED: Simplified fetchUserAndLikes (likes now handled in fetchPosts)
  const fetchUserAndLikes = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    if (!user) {
      setNeedsProfileSetup(false)
      setUserLikedPosts([])
      setUserCommentedPosts([])
      return
    }

    // profile check
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', user.id)
      .single()

    setNeedsProfileSetup(!profile?.full_name)

    // commented posts (for your filter)
    const { data: commentsData } = await supabase
      .from('comments')
      .select('post_id')
      .eq('user_id', user.id)

    if (commentsData) {
      const commentedPostIds = [...new Set((commentsData as CommentData[]).map((c: CommentData) => c.post_id))]
      setUserCommentedPosts(commentedPostIds)
    }
  }, [supabase])

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
  }, [user, userLikedPosts, supabase])

  // Mobile scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Initial setup
  useEffect(() => {
    fetchUserAndLikes()
    fetchPosts()
  }, [fetchUserAndLikes, fetchPosts])

  // OPTIMIZED: Debounced real-time subscriptions
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    const channel = supabase
      .channel('posts_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'posts'
      }, (_payload: any) => {
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => fetchPosts(), 250) // coalesce bursts of events
      })
      .subscribe()

    return () => {
      if (timer) clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [fetchPosts, supabase])

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
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Professional Header - Similar to Tidbit Library */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              BitBoard
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Post your AI creations. Explore, connect, and be inspired.
            </p>
          </div>
        </div>
      </header>

      {/* Mobile-Optimized Top Navigation */}
      <nav className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-white border-b border-gray-200 relative z-40 sticky top-0">
        {/* Center - Mobile-Optimized Search */}
        <div className="flex-1 max-w-md sm:max-w-2xl mx-2 sm:mx-4">
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search posts"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 sm:pl-11 pr-8 sm:pr-12 py-2 sm:py-3 bg-gray-100 border-none rounded-full text-sm sm:text-base focus:ring-2 focus:ring-[#60A875]/20 focus:bg-white focus:shadow-md transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right Section - Mobile Optimized */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Filter Button - Mobile Priority */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 sm:p-3 rounded-full transition-colors relative ${
              getActiveFiltersCount() > 0 
                ? 'bg-[#60A875] text-white'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
            {getActiveFiltersCount() > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] sm:text-xs">
                {getActiveFiltersCount()}
              </span>
            )}
          </button>

          {user && (
            <button
              onClick={() => setShowPostForm(!showPostForm)}
              className="p-2 sm:p-3 bg-[#60A875] text-white rounded-full hover:bg-[#60A875] transition-colors"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </nav>

      {/* Enhanced Desktop/Mobile-Optimized Filters Bar with Privacy Support */}
      {showFilters && (
        <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border-b border-gray-200">
          <div className="lg:flex lg:items-center lg:justify-between">
            {/* Filter buttons - wrap on mobile, stay inline on desktop */}
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide lg:overflow-visible">
              {['recent', 'trending', 'popular', 'liked', 'commented'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterOption(filter as FilterOption)}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-colors whitespace-nowrap capitalize text-xs sm:text-sm font-medium ${
                    filterOption === filter
                      ? 'bg-[#60A875] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {filter === 'trending' && <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />}
                  {filter === 'liked' && <Heart className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />}
                  {filter === 'commented' && <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />}
                  {filter}
                </button>
              ))}

              {/* Private Posts Filter - Only for logged-in users */}
              {user && (
                <button
                  onClick={() => setFilterOption('private')}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-colors whitespace-nowrap text-xs sm:text-sm font-medium ${
                    filterOption === 'private'
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Lock className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                  Private
                </button>
              )}
            </div>

            {/* Secondary filters - on new line for mobile, same line for desktop */}
            <div className="flex items-center gap-2 mt-2 lg:mt-0 lg:ml-4">
              {selectedTidbit !== null && (
                <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#59B1E3] text-white rounded-full">
                  <span className="text-xs sm:text-sm font-medium">Day {selectedTidbit}</span>
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
                  className="px-3 py-1.5 sm:px-4 sm:py-2 text-gray-500 hover:text-gray-700 transition-colors whitespace-nowrap text-xs sm:text-sm"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {/* Profile Setup Modal */}
        {user && needsProfileSetup && (
          <ProfileSetupWizard 
            userId={user.id} 
            onComplete={() => {
              setNeedsProfileSetup(false)
              handleRefresh()
            }}
            onSkip={() => setNeedsProfileSetup(false)}
          />
        )}

        {/* User Profile Modal */}
        {user && showUserProfile && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto relative">
              <div className="sticky top-0 bg-white flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 z-10">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Your Profile</h2>
                <button
                  onClick={() => setShowUserProfile(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
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
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white rounded-2xl p-4 sm:p-8 max-w-lg sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Create a Post</h2>
                <button
                  onClick={() => setShowPostForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
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
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40 mx-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 shadow-lg max-w-sm sm:max-w-md">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 rounded-full p-2">
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800 text-sm sm:text-base">Error loading posts</h3>
                  <p className="text-red-700 text-xs sm:text-sm">{error}</p>
                </div>
                <button
                  onClick={handleRefresh}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content with Privacy Support */}
        <div className="h-full overflow-y-auto">
          {filteredPosts.length === 0 && !loading ? (
            <div className="flex items-center justify-center h-full p-4 sm:p-8">
              <div className="text-center max-w-sm sm:max-w-md">
                <div className="bg-gray-100 rounded-2xl p-6 sm:p-8 w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
                  {filterOption === 'private' ? (
                    <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                  ) : (
                    <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                  {filterOption === 'private' ? 'No private posts yet' : 
                   debouncedSearchQuery ? 'No posts found' : 'No posts yet'}
                </h3>
                <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
                  {filterOption === 'private' 
                    ? "Private posts you create will appear here. They're only visible to you!"
                    : debouncedSearchQuery 
                      ? `No posts match "${debouncedSearchQuery}". Try a different search.`
                      : selectedTidbit 
                        ? `No posts for Day ${selectedTidbit} yet. Be the first to create one!`
                        : filterOption === 'commented'
                          ? "You haven't commented on any posts yet. Start engaging with the community!"
                          : "Be the first to share your AI creation and inspire the community!"
                  }
                </p>
                
                <div className="flex flex-col gap-3">
                  {user && (
                    <button
                      onClick={() => setShowPostForm(true)}
                      className="px-4 sm:px-6 py-2.5 sm:py-3 bg-[#60A875] text-white rounded-full hover:bg-green-600 transition-colors font-medium text-sm sm:text-base flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      {filterOption === 'private' ? 'Create private post' : 'Create your first post'}
                    </button>
                  )}
                  {(debouncedSearchQuery || selectedTidbit || filterOption !== 'recent') && (
                    <button
                      onClick={clearFilters}
                      className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm sm:text-base"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <MobileOptimizedMasonry 
              posts={filteredPosts} 
              onTidbitClick={setSelectedTidbit}
              onLike={handleLike}
              userLikedPosts={userLikedPosts}
              viewMode={viewMode}
              loading={loading}
              onPostClick={setSelectedPost}
              currentUser={user}
            />
          )}
        </div>
      </div>

      {/* Mobile Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 p-3 bg-[#60A875] text-white rounded-full shadow-lg hover:bg-green-600 transition-all duration-300 z-40 hover:scale-110"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Mobile-specific styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}

export default function MobileOptimizedBitBoard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-brand-green" />
      </div>
    }>
      <BitBoardContent />
    </Suspense>
  )
}