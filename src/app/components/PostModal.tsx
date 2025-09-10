'use client'

import { useState, useEffect, useRef } from 'react'
import { getSupabaseBrowserClient } from '../lib/supabaseClient'
import { safeWindow } from '../lib/clientUtils'
import { 
  X, 
  Heart, 
  MessageCircle, 
  Send, 
  Trash2, 
  MoreHorizontal,
  AlertTriangle,
  ExternalLink,
  Volume2,
  Clock,
  Edit3,
  Share,
  Copy,
  Sparkles,
  CheckCircle,
  Settings,
  Lock,
  Unlock,
  Flag,
  Pin,
  PinOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import Image from 'next/image'
import { isValidMediaUrl } from '../lib/clientUtils'
import { formatDateSafe } from '../lib/clientUtils'

// Enhanced Post type with new TidbitTutor fields
export type Post = {
  id: string
  created_at: string
  user_id: string | null
  type: string
  content: string
  media_url: string | null
  tidbit: number
  likes_count?: number
  description?: string
  username?: string
  user_avatar?: string | null
  user_full_name?: string | null
  comments_enabled?: boolean
  is_pinned?: boolean
  is_private?: boolean
  // New TidbitTutor enhanced fields
  user_commentary?: string | null
  ai_summary?: string | null
  original_conversation?: string | null
  conversation_metadata?: {
    message_count: number
    user_messages: number
    ai_messages: number
    providers_used: string[]
    tidbit_number: number
    tidbit_title: string
  } | null
}

// Comment type
export type Comment = {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  username?: string
  user_avatar?: string | null
  user_full_name?: string | null
}

interface PostModalProps {
  post: Post
  onClose: () => void
}

// Loading Skeleton for PostModal
function PostModalSkeleton() {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">Loading post...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PostModal({ post, onClose }: PostModalProps) {
  // PRIMARY HYDRATION SAFETY
  const [mounted, setMounted] = useState(false)
  
  // Safe Supabase client getter
  const getSupabaseClient = () => {
    try {
      return getSupabaseBrowserClient()
    } catch (error) {
      console.error('Failed to get Supabase client:', error)
      return null
    }
  }
  
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likes_count ?? 0)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [loadingComments, setLoadingComments] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [commentsEnabled, setCommentsEnabled] = useState(post.comments_enabled ?? true)
  const [isPinned, setIsPinned] = useState(post.is_pinned ?? false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [showOriginalConvo, setShowOriginalConvo] = useState(false) // Enhanced conversation toggle
  const commentInputRef = useRef<HTMLTextAreaElement>(null)

  // Mount detection
  useEffect(() => {
    setMounted(true)
  }, [])

  // Enhanced media type detection with guards
  const isAudioLink = mounted && typeof post.media_url === 'string' &&
    (post.media_url.includes('suno.ai') || post.media_url.includes('udio.com'))

  const hasValidImage = mounted && typeof post.media_url === 'string' &&
    isValidMediaUrl(post.media_url) && !isAudioLink && !imageError

  const hasTextContent = Boolean(post.content)

  // Check if current user owns this post
  const isOwnPost = mounted && currentUser?.id === post.user_id

  // Format date with fallback
  const formattedDate = formatDateSafe(post.created_at, 'Invalid date')

  // Fetch current user and check if they liked this post
  useEffect(() => {
    if (!mounted) return

    const getCurrentUser = async () => {
      try {
        const supabase = getSupabaseClient()
        if (!supabase) {
          console.error('Supabase client not available')
          return
        }

        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)

        if (user) {
          // Check if user liked this post
          const { data: likeData } = await supabase
            .from('likes')
            .select('id')
            .eq('user_id', user.id)
            .eq('post_id', post.id)
            .single()

          setIsLiked(!!likeData)
        }
      } catch (error) {
        console.error('Error getting current user:', error)
      }
    }

    getCurrentUser()
  }, [post.id, mounted])

  // Enhanced fetch comments function
  useEffect(() => {
    if (!mounted) return

    const fetchComments = async () => {
      try {
        setLoadingComments(true)
        
        const supabase = getSupabaseClient()
        if (!supabase) {
          console.error('Supabase client not available')
          setLoadingComments(false)
          return
        }
        
        // First, fetch comments
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', post.id)
          .order('created_at', { ascending: true })

        if (commentsError) throw commentsError

        // Then fetch user profiles for each comment
        const userIds = commentsData?.map(comment => comment.user_id).filter((id): id is string => Boolean(id)) || []
        const uniqueUserIds = [...new Set(userIds)]
        
        let profilesData: any[] = []
        if (uniqueUserIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, full_name')
            .in('id', uniqueUserIds)

          if (!profilesError && profiles) {
            profilesData = profiles
          }
        }

        // Transform the data to match our Comment type
        const transformedComments: Comment[] = (commentsData || []).map(comment => {
          const profile = profilesData.find(p => p.id === comment.user_id)
          return {
            id: comment.id,
            post_id: comment.post_id,
            user_id: comment.user_id,
            content: comment.content,
            created_at: comment.created_at,
            username: profile?.username || null,
            user_avatar: profile?.avatar_url || null,
            user_full_name: profile?.full_name || null
          }
        })

        setComments(transformedComments)
      } catch (error) {
        console.error('Error fetching comments:', error)
      } finally {
        setLoadingComments(false)
      }
    }

    fetchComments()
  }, [post.id, mounted])

  // Enhanced like handler with guards
  const handleLike = async () => {
    if (!mounted || !currentUser) {
      alert('Please log in to like posts.')
      return
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error('Supabase client not available')
      return
    }

    try {
      if (isLiked) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('post_id', post.id)

        setIsLiked(false)
        setLikesCount(prev => prev - 1)
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({
            user_id: currentUser.id,
            post_id: post.id
          })

        setIsLiked(true)
        setLikesCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error updating like:', error)
    }
  }

  // Enhanced comment submission function
  const handleSubmitComment = async () => {
    if (!mounted || !currentUser || !newComment.trim() || !commentsEnabled) return

    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error('Supabase client not available')
      alert('Unable to submit comment. Please try again.')
      return
    }

    try {
      setIsSubmittingComment(true)

      // Insert the comment
      const { data: commentData, error: insertError } = await supabase
        .from('comments')
        .insert({
          post_id: post.id,
          user_id: currentUser.id,
          content: newComment.trim()
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Get user profile for the new comment
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, avatar_url, full_name')
        .eq('id', currentUser.id)
        .single()

      // Add new comment to the list
      const newCommentObj: Comment = {
        id: commentData.id,
        post_id: commentData.post_id,
        user_id: commentData.user_id,
        content: commentData.content,
        created_at: commentData.created_at,
        username: profileData?.username || null,
        user_avatar: profileData?.avatar_url || null,
        user_full_name: profileData?.full_name || null
      }

      setComments(prev => [...prev, newCommentObj])
      setNewComment('')
      
      // Focus back on input for easy follow-up comments
      setTimeout(() => commentInputRef.current?.focus(), 100)
    } catch (error) {
      console.error('Error submitting comment:', error)
      alert('Failed to submit comment. Please try again.')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  // Enhanced post deletion with guards
  const handleDeletePost = async () => {
    if (!mounted || !currentUser || !isOwnPost) return

    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error('Supabase client not available')
      alert('Unable to delete post. Please try again.')
      return
    }

    try {
      setDeleting(true)

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)
        .eq('user_id', currentUser.id) // Extra security check

      if (error) throw error

      // Close modal and refresh the feed
      onClose()
      
      // Enhanced page refresh with error handling
      if (mounted && typeof window !== 'undefined') {
        window.location.reload()
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete post. Please try again.')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  // Handle comment deletion
  const handleDeleteComment = async (commentId: string, commentUserId: string) => {
    if (!mounted || !currentUser || (currentUser.id !== commentUserId && !isOwnPost)) return

    if (!confirm('Are you sure you want to delete this comment?')) return

    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error('Supabase client not available')
      alert('Unable to delete comment. Please try again.')
      return
    }

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error

      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('Failed to delete comment. Please try again.')
    }
  }

  // Enhanced post management functions
  const toggleCommentsEnabled = async () => {
    if (!mounted || !isOwnPost) return

    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error('Supabase client not available')
      alert('Unable to update comments setting. Please try again.')
      return
    }

    try {
      const newState = !commentsEnabled
      const { error } = await supabase
        .from('posts')
        .update({ comments_enabled: newState })
        .eq('id', post.id)

      if (error) throw error

      setCommentsEnabled(newState)
      setShowDropdown(false)
    } catch (error) {
      console.error('Error updating comments setting:', error)
      alert('Failed to update comments setting.')
    }
  }

  const togglePinned = async () => {
    if (!mounted || !isOwnPost) return

    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error('Supabase client not available')
      alert('Unable to update pin status. Please try again.')
      return
    }

    try {
      const newState = !isPinned
      const { error } = await supabase
        .from('posts')
        .update({ is_pinned: newState })
        .eq('id', post.id)

      if (error) throw error

      setIsPinned(newState)
      setShowDropdown(false)
    } catch (error) {
      console.error('Error updating pin status:', error)
      alert('Failed to update pin status.')
    }
  }

  // Enhanced share functionality using safeWindow
  const handleShare = async () => {
    if (!mounted || typeof window === 'undefined') return

    try {
      const shareData = {
        title: `AI Creation - Day ${post.tidbit}`,
        text: post.content || `Check out this AI creation from Day ${post.tidbit}!`,
        url: window.location.href
      }

      // Use safeWindow.navigator.share instead of direct navigator access
      await safeWindow.navigator.share(shareData)
    } catch (error) {
      console.error('Error sharing:', error)
      setShowShareMenu(true)
    }
  }

  // Enhanced clipboard functionality
  const copyToClipboard = async () => {
    if (!mounted || typeof window === 'undefined' || !window.navigator?.clipboard) {
      return
    }

    try {
      await window.navigator.clipboard.writeText(window.location.href)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      // Fallback for browsers without clipboard API
      try {
        const textArea = document.createElement('textarea')
        textArea.value = window.location.href
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError)
      }
    }
  }

  // Handle click outside to close modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Show loading skeleton until mounted
  if (!mounted) {
    return <PostModalSkeleton />;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2 sm:p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Mobile-First Stacked Layout */}
        <div className="flex flex-col h-full max-h-[95vh]">
          {/* Header with Close Button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* User avatar with proper aspect ratio */}
              {post.user_avatar ? (
                <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-gray-100 flex-shrink-0">
                  <Image
                    src={post.user_avatar}
                    alt={post.username || 'User'}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-brand-green to-brand-blue rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">
                    {(post.username || post.user_full_name || 'A').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-900 truncate text-sm sm:text-base">
                  {post.user_full_name || post.username || 'Anonymous User'}
                </p>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                  <span>Day {post.tidbit}</span>
                  <span>•</span>
                  <span>{formattedDate}</span>
                  {isPinned && (
                    <>
                      <span>•</span>
                      <Pin className="w-3 h-3 text-brand-green" />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Share post"
              >
                <Share className="w-4 h-4 text-gray-600" />
              </button>

              {isOwnPost && (
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[180px]">
                      <button
                        onClick={toggleCommentsEnabled}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                      >
                        {commentsEnabled ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        {commentsEnabled ? 'Disable' : 'Enable'} Comments
                      </button>
                      <button
                        onClick={togglePinned}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                      >
                        {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                        {isPinned ? 'Unpin' : 'Pin'} Post
                      </button>
                      <button
                        onClick={() => {
                          setShowDropdown(false)
                          alert('Edit functionality coming soon!')
                        }}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit Post
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(true)
                          setShowDropdown(false)
                        }}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Post
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Media Section - Only show if media exists */}
          {(hasValidImage || isAudioLink) && (
            <div className="relative bg-black flex items-center justify-center max-h-[50vh] overflow-hidden">
              {hasValidImage ? (
                <div className="relative w-full h-full min-h-[300px] bg-black flex items-center justify-center">
                  {!imageLoaded && (
                    <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm">Loading image...</span>
                      </div>
                    </div>
                  )}
                  
                  <Image
                    src={post.media_url!}
                    alt="Post media"
                    fill
                    className={`object-contain transition-opacity duration-500 ${
                      imageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                  />
                </div>
              ) : isAudioLink ? (
                <div className="bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center p-8 w-full min-h-[200px]">
                  <div className="text-center text-white">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Volume2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Audio Content</h3>
                    <p className="text-white/80 mb-4">Listen to this AI-generated audio</p>
                    <a
                      href={post.media_url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open in {post.media_url!.includes('suno.ai') ? 'Suno' : 'Udio'}
                    </a>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Content and Comments Container */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* ENHANCED: Main Content Section with Better Order */}
            <div className="p-4 sm:p-6 border-b border-gray-200">
              {post.content && (
                <div className="space-y-4">
                  {(() => {
                    // Check if this is an enhanced TidbitTutor post
                    if (post.type === 'tidbit_tutor_enhanced' && (post.user_commentary || post.ai_summary)) {
                      // Enhanced post with structured data - BETTER ORDER
                      return (
                        <>
                          {/* 1. User Commentary Section FIRST */}
                          {post.user_commentary && (
                            <div className="bg-gradient-to-r from-brand-blue/5 to-brand-blue/10 border-l-4 border-brand-blue p-4 rounded-lg">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-6 h-6 bg-brand-blue rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">💭</span>
                                </div>
                                <span className="text-sm font-semibold text-brand-blue">Personal Thoughts</span>
                              </div>
                              <div className="whitespace-pre-wrap text-brand-blue-dark leading-relaxed text-base">
                                {post.user_commentary}
                              </div>
                            </div>
                          )}

                          {/* 2. AI Summary Section SECOND */}
                          {post.ai_summary && (
                            <div className="bg-gradient-to-r from-brand-green/5 to-brand-green/10 border-l-4 border-brand-green p-4 rounded-lg">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-6 h-6 bg-brand-green rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">🤖</span>
                                </div>
                                <span className="text-sm font-semibold text-brand-green">AI Summary</span>
                              </div>
                              <div className="whitespace-pre-wrap text-brand-green-dark leading-relaxed text-base">
                                {post.ai_summary}
                              </div>
                            </div>
                          )}

                          {/* 3. Original Conversation Toggle THIRD */}
                          {post.original_conversation && (
                            <div className="bg-gray-50 rounded-lg overflow-hidden">
                              <button
                                onClick={() => setShowOriginalConvo(!showOriginalConvo)}
                                className="w-full cursor-pointer p-4 hover:bg-gray-100 transition-colors flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <MessageCircle className="w-4 h-4 text-gray-600" />
                                  <span className="font-medium text-gray-700">View Original Conversation</span>
                                  {post.conversation_metadata && (
                                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                      {post.conversation_metadata.message_count} messages
                                    </span>
                                  )}
                                </div>
                                {showOriginalConvo ? (
                                  <ChevronUp className="w-4 h-4 text-gray-500" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-500" />
                                )}
                              </button>
                              
                              {/* 4. Original Conversation Content FOURTH (when expanded) */}
                              {showOriginalConvo && (
                                <div className="p-4 pt-0 bg-white border-t border-gray-200">
                                  {/* Conversation Metadata */}
                                  {post.conversation_metadata && (
                                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                        <div className="text-center">
                                          <div className="font-semibold text-gray-900">{post.conversation_metadata.user_messages}</div>
                                          <div className="text-gray-600">User Messages</div>
                                        </div>
                                        <div className="text-center">
                                          <div className="font-semibold text-gray-900">{post.conversation_metadata.ai_messages}</div>
                                          <div className="text-gray-600">AI Responses</div>
                                        </div>
                                        <div className="text-center">
                                          <div className="font-semibold text-gray-900">{post.conversation_metadata.providers_used?.length || 1}</div>
                                          <div className="text-gray-600">AI Models</div>
                                        </div>
                                        <div className="text-center">
                                          <div className="font-semibold text-gray-900">#{post.tidbit}</div>
                                          <div className="text-gray-600">Daily Tidbit</div>
                                        </div>
                                      </div>
                                      {post.conversation_metadata.providers_used && (
                                        <div className="mt-2 pt-2 border-t border-gray-200">
                                          <div className="text-xs text-gray-600 mb-1">AI Models Used:</div>
                                          <div className="flex flex-wrap gap-1">
                                            {post.conversation_metadata.providers_used.map((provider, i) => (
                                              <span key={i} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                                {provider}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Original Conversation Text */}
                                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-sm font-mono bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                                    {post.original_conversation}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      );
                    } else {
                      // Legacy post handling - check for old format with separator
                      const parts = post.content.split('\n\n---\n\n');
                      if (parts.length > 1) {
                        const mainContent = parts[0];
                        const userCommentary = parts[1];
                        
                        return (
                          <>
                            {/* User Commentary */}
                            <div className="bg-gradient-to-r from-brand-blue/5 to-brand-blue/10 border-l-4 border-brand-blue p-4 rounded-lg">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-6 h-6 bg-brand-blue rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">💭</span>
                                </div>
                                <span className="text-sm font-semibold text-brand-blue">Personal Thoughts</span>
                              </div>
                              <div className="whitespace-pre-wrap text-brand-blue-dark leading-relaxed text-base">
                                {userCommentary}
                              </div>
                            </div>
                            
                            {/* Show main content in collapsed/expandable section */}
                            <details className="group bg-gray-50 rounded-lg overflow-hidden">
                              <summary className="cursor-pointer p-4 hover:bg-gray-100 transition-colors flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <MessageCircle className="w-4 h-4 text-gray-600" />
                                  <span className="font-medium text-gray-700">View Original Conversation</span>
                                </div>
                                <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                              </summary>
                              <div className="p-4 pt-0 bg-white border-t border-gray-200">
                                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-sm sm:text-base font-mono bg-gray-50 p-4 rounded-lg">
                                  {mainContent}
                                </div>
                              </div>
                            </details>
                          </>
                        );
                      } else {
                        // Standard post content
                        return (
                          <div className="whitespace-pre-wrap text-gray-800 text-base leading-relaxed">
                            {post.content}
                          </div>
                        );
                      }
                    }
                  })()}
                </div>
              )}

              {post.description && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 italic">{post.description}</p>
                </div>
              )}

              {/* Enhanced Like and Comment buttons */}
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full transition-all duration-200 transform hover:scale-105 ${
                    isLiked 
                      ? 'bg-red-50 text-red-600 border border-red-200' 
                      : 'hover:bg-gray-50 text-gray-600 border border-gray-200'
                  }`}
                >
                  <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isLiked ? 'fill-current text-red-500' : ''}`} />
                  <span className="font-medium text-sm sm:text-base">{likesCount}</span>
                </button>
                
                <div className="flex items-center gap-2 text-gray-600 px-3 sm:px-4 py-2 border border-gray-200 rounded-full">
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-medium text-sm sm:text-base">{comments.length}</span>
                </div>

                {!commentsEnabled && isOwnPost && (
                  <div className="flex items-center gap-2 text-gray-500 px-2 sm:px-3 py-1 bg-gray-100 rounded-full text-xs sm:text-sm">
                    <Lock className="w-3 h-3" />
                    <span className="hidden sm:inline">Comments disabled</span>
                    <span className="sm:hidden">Disabled</span>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Comments Section - Mobile Optimized */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-base sm:text-lg">
                  <MessageCircle className="w-5 h-5" />
                  Comments ({comments.length})
                  {!commentsEnabled && (
                    <Lock className="w-4 h-4 text-gray-500" />
                  )}
                </h3>
              </div>

              {/* Comments List - Scrollable */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6">
                <div className="space-y-4 py-4">
                  {loadingComments ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex gap-3 animate-pulse">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
                          <div className="flex-1">
                            <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">
                        {commentsEnabled ? 'No comments yet' : 'Comments are disabled'}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {commentsEnabled ? 'Be the first to share your thoughts!' : 'The author has disabled comments for this post.'}
                      </p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3 group">
                        {/* Comment avatar */}
                        {comment.user_avatar ? (
                          <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                            <Image
                              src={comment.user_avatar}
                              alt={comment.username || 'User'}
                              fill
                              className="object-cover"
                              sizes="32px"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-br from-brand-green to-brand-blue rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">
                              {(comment.username || 'A').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="bg-gray-50 rounded-2xl rounded-tl-md p-3">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-semibold text-sm text-gray-900">
                                {comment.user_full_name || comment.username || 'Anonymous'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDateSafe(comment.created_at)}
                              </span>
                              {(currentUser?.id === comment.user_id || isOwnPost) && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id, comment.user_id)}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all ml-auto"
                                >
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Comment Input */}
            {currentUser && commentsEnabled ? (
              <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-brand-green to-brand-blue rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {(currentUser.email || 'A').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <textarea
                      ref={commentInputRef}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={2}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-green focus:border-brand-green resize-none bg-white text-sm sm:text-base"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSubmitComment()
                        }
                      }}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">
                        Press Enter to send
                      </span>
                      <button
                        onClick={handleSubmitComment}
                        disabled={!newComment.trim() || isSubmittingComment}
                        className="px-3 sm:px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-brand-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium text-sm sm:text-base"
                      >
                        {isSubmittingComment ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">Send</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : currentUser && !commentsEnabled ? (
              <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50 text-center">
                <div className="flex items-center justify-center gap-2 text-gray-500 mb-2">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm font-medium">Comments are disabled for this post</span>
                </div>
                {isOwnPost && (
                  <button
                    onClick={toggleCommentsEnabled}
                    className="text-sm text-brand-green hover:text-brand-green-dark font-medium"
                  >
                    Enable comments
                  </button>
                )}
              </div>
            ) : (
              <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50 text-center">
                <p className="text-gray-600 mb-3 text-sm sm:text-base">Sign in to join the conversation</p>
                <button 
                  onClick={onClose}
                  className="px-4 sm:px-6 py-2 bg-brand-green text-white rounded-lg hover:bg-brand-green-dark transition-colors font-medium text-sm sm:text-base"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Menu Modal */}
      {showShareMenu && (
        <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Share Post</h3>
              <button
                onClick={() => setShowShareMenu(false)}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={copyToClipboard}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {copySuccess ? <CheckCircle className="w-5 h-5 text-brand-green" /> : <Copy className="w-5 h-5 text-gray-600" />}
                <span className="font-medium text-gray-900">
                  {copySuccess ? 'Copied!' : 'Copy link'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Post</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this post? This will also remove all comments and likes.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePost}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Post
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}