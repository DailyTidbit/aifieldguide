'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
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
  VolumeX,
  Clock,
  Edit3,
  Flag,
  Share,
  Copy,
  Sparkles
} from 'lucide-react'
import Image from 'next/image'
import { isValidMediaUrl } from '../lib/validateMedia'

// Enhanced Post type with comments
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
  user_avatar?: string | null
  user_full_name?: string | null
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

export default function PostModal({ post, onClose }: PostModalProps) {
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
  const commentInputRef = useRef<HTMLTextAreaElement>(null)

  // Check if current user owns this post
  const isOwnPost = currentUser?.id === post.user_id

  // Enhanced media type detection
  const isAudioLink = typeof post.media_url === 'string' &&
    (post.media_url.includes('suno.ai') || post.media_url.includes('udio.com'))

  const hasValidImage = typeof post.media_url === 'string' &&
    isValidMediaUrl(post.media_url) && !isAudioLink && !imageError

  const hasTextContent = Boolean(post.content || post.before_text || post.after_text)

  // Fetch current user and check if they liked this post
  useEffect(() => {
    const getCurrentUser = async () => {
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
    }

    getCurrentUser()
  }, [post.id])

  // Fixed fetch comments function
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoadingComments(true)
        
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
  }, [post.id])

  // Handle like/unlike
  const handleLike = async () => {
    if (!currentUser) {
      alert('Please log in to like posts.')
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
    if (!currentUser || !newComment.trim()) return

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

  // Handle post deletion
  const handleDeletePost = async () => {
    if (!currentUser || !isOwnPost) return

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
      
      // Refresh the page to update the feed
      window.location.reload()
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
    if (!currentUser || currentUser.id !== commentUserId) return

    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', currentUser.id)

      if (error) throw error

      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('Failed to delete comment. Please try again.')
    }
  }

  // Handle share functionality
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `AI Creation - Day ${post.tidbit}`,
          text: post.content || `Check out this AI creation from Day ${post.tidbit}!`,
          url: window.location.href
        })
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  // Handle click outside to close modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Enhanced media section rendering
  const renderMediaSection = () => {
    if (hasValidImage) {
      return (
        <div className="relative w-full bg-black flex items-center justify-center">
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
      )
    }
    
    if (isAudioLink) {
      return (
        <div className="bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center p-12">
          <div className="text-center text-white">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Volume2 className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Audio Content</h3>
            <p className="text-white/80 mb-6">Listen to this AI-generated audio</p>
            <a
              href={post.media_url!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open in {post.media_url!.includes('suno.ai') ? 'Suno' : 'Udio'}
            </a>
          </div>
        </div>
      )
    }

    // Enhanced text-only display - no more ugly "Text Post" placeholder!
    return (
      <div className="bg-gradient-to-br from-[#60A875] to-[#59B1E3] flex items-center justify-center p-8 min-h-[400px]">
        <div className="text-center text-white max-w-md">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold mb-4">AI Creation</h3>
          <p className="text-white/90 text-lg leading-relaxed">
            {post.content ? 
              `"${post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content}"` :
              "Discover this AI transformation on the right →"
            }
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-white/70">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Day {post.tidbit} Creation</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
        <div className="flex h-full max-h-[95vh]">
          {/* Enhanced Media Section */}
          <div className="flex-1 bg-black flex items-center justify-center relative">
            {renderMediaSection()}

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Enhanced Content Section */}
          <div className="w-96 flex flex-col bg-white">
            {/* Enhanced Header with better user info */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {post.user_avatar ? (
                  <Image
                    src={post.user_avatar}
                    alt={post.username || 'User'}
                    width={44}
                    height={44}
                    className="rounded-full ring-2 ring-gray-100"
                  />
                ) : (
                  <div className="w-11 h-11 bg-gradient-to-br from-[#60A875] to-[#59B1E3] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {(post.username || post.user_full_name || 'A').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900 truncate">
                    {post.user_full_name || post.username || 'Anonymous User'}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>Day {post.tidbit}</span>
                    <span>•</span>
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Enhanced Options Menu */}
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
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {showDropdown && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[140px]">
                        <button
                          onClick={() => {
                            // Edit functionality - could be implemented later
                            setShowDropdown(false)
                            alert('Edit functionality coming soon!')
                          }}
                          className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Edit3 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setShowDeleteConfirm(true)
                            setShowDropdown(false)
                          }}
                          className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Post Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Main content */}
              <div className="p-4 border-b border-gray-200">
                {post.content && (
                  <p className="whitespace-pre-wrap text-gray-800 mb-4 text-base leading-relaxed">
                    {post.content}
                  </p>
                )}
                
                {(post.before_text || post.after_text) && (
                  <div className="space-y-3">
                    {post.before_text && (
                      <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-400">
                        <p className="text-sm font-medium text-red-800 mb-1">Before:</p>
                        <p className="text-red-700">{post.before_text}</p>
                      </div>
                    )}
                    {post.after_text && (
                      <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                        <p className="text-sm font-medium text-green-800 mb-1">After:</p>
                        <p className="text-green-700">{post.after_text}</p>
                      </div>
                    )}
                  </div>
                )}

                {post.description && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 italic">{post.description}</p>
                  </div>
                )}

                {/* Enhanced Like and Comment buttons */}
                <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-100">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 transform hover:scale-105 ${
                      isLiked 
                        ? 'bg-red-50 text-red-600 border border-red-200' 
                        : 'hover:bg-gray-50 text-gray-600 border border-gray-200'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current text-red-500' : ''}`} />
                    <span className="font-medium">{likesCount}</span>
                  </button>
                  
                  <div className="flex items-center gap-2 text-gray-600 px-4 py-2 border border-gray-200 rounded-full">
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-medium">{comments.length}</span>
                  </div>
                </div>
              </div>

              {/* Enhanced Comments Section */}
              <div className="flex-1 p-4">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Comments ({comments.length})
                </h3>

                {/* Comments List with better styling */}
                <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
                  {loadingComments ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex gap-3 animate-pulse">
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No comments yet</p>
                      <p className="text-gray-400 text-sm">Be the first to share your thoughts!</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3 group">
                        {comment.user_avatar ? (
                          <Image
                            src={comment.user_avatar}
                            alt={comment.username || 'User'}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-br from-[#60A875] to-[#59B1E3] rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {(comment.username || 'A').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="bg-gray-50 rounded-2xl rounded-tl-md p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm text-gray-900">
                                {comment.user_full_name || comment.username || 'Anonymous'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </span>
                              {currentUser?.id === comment.user_id && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id, comment.user_id)}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all ml-auto"
                                >
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Comment Input */}
            {currentUser ? (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#60A875] to-[#59B1E3] rounded-full flex items-center justify-center flex-shrink-0">
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
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#60A875] focus:border-[#60A875] resize-none bg-white"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSubmitComment()
                        }
                      }}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">
                        Press Enter to send, Shift+Enter for new line
                      </span>
                      <button
                        onClick={handleSubmitComment}
                        disabled={!newComment.trim() || isSubmittingComment}
                        className="px-4 py-2 bg-[#60A875] text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                      >
                        {isSubmittingComment ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 border-t border-gray-200 bg-gray-50 text-center">
                <p className="text-gray-600 mb-3">Sign in to join the conversation</p>
                <button 
                  onClick={onClose}
                  className="px-6 py-2 bg-[#60A875] text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

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