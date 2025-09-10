'use client'

import Image from 'next/image'
import { Heart, User, Loader2, MessageCircle, ExternalLink, Sparkles, Clock } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { isValidMediaUrl } from '../lib/clientUtils'
import { formatDateSafe } from '../lib/clientUtils'

const bgColors = [
  'bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50', 
  'bg-gradient-to-br from-brand-green/5 via-brand-green/10 to-teal-50', 
  'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50',
  'bg-gradient-to-br from-pink-50 via-rose-50 to-red-50',
  'bg-gradient-to-br from-indigo-50 via-purple-50 to-violet-50',
]

export default function PostCard({
  post,
  isLiked,
  onLike,
  onClick,
}: {
  post: any
  isLiked: boolean
  onLike: (postId: string) => void
  onClick?: () => void
}) {
  // Hydration safety: Primary mounted state
  const [mounted, setMounted] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isTouched, setIsTouched] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Hydration safe: Deterministic background color selection - stable hash from post ID
  const bgColor = useMemo(() => {
    if (!post.id) return bgColors[0]
    
    let hash = 0
    for (let i = 0; i < post.id.length; i++) {
      hash = ((hash << 5) - hash + post.id.charCodeAt(i)) & 0xffffffff
    }
    return bgColors[Math.abs(hash) % bgColors.length]
  }, [post.id])

  // Enhanced content preview: Shows user commentary + AI summary for better tiles
  const contentPreview = useMemo(() => {
    if (!post.content) return ''
    
    // Check if this is an enhanced TidbitTutor post with structured data
    if (post.type === 'tidbit_tutor_enhanced' && (post.user_commentary || post.ai_summary)) {
      let combinedContent = ''
      
      // Add user commentary first if it exists
      if (post.user_commentary) {
        combinedContent += post.user_commentary.trim()
      }
      
      // Add AI summary if it exists
      if (post.ai_summary) {
        // Add separator if we already have user commentary
        if (combinedContent) {
          combinedContent += '\n\n'
        }
        combinedContent += post.ai_summary.trim()
      }
      
      // Apply character limit to the combined content
      return combinedContent.length > 560 ? `${combinedContent.substring(0, 560)}...` : combinedContent
    }
    
    // Legacy format handling (content with --- separator)
    const parts = post.content.split('\n\n---\n\n')
    if (parts.length > 1) {
      // For legacy posts, show user commentary first, then main content
      const userCommentary = parts[1].trim()
      const mainContent = parts[0].trim()
      const combinedContent = `${userCommentary}\n\n${mainContent}`
      return combinedContent.length > 560 ? `${combinedContent.substring(0, 560)}...` : combinedContent
    }
    
    // Standard post content
    return post.content.length > 560 ? `${post.content.substring(0, 560)}...` : post.content
  }, [post.content, post.type, post.user_commentary, post.ai_summary])

  // Hydration safe: Stable media type detection with mounted guard
  const isAudioLink = useMemo(() => 
    mounted && typeof post.media_url === 'string' &&
    (post.media_url.includes('suno.ai') || post.media_url.includes('udio.com'))
  , [post.media_url, mounted])

  const hasImage = useMemo(() =>
    mounted && typeof post.media_url === 'string' &&
    isValidMediaUrl(post.media_url) &&
    !isAudioLink &&
    !imageError
  , [post.media_url, isAudioLink, imageError, mounted])

  const hasTextOnly = !hasImage && !isAudioLink && post.content

  // Hydration safe: Format date with fallback
  const formattedDate = useMemo(() => {
    return formatDateSafe(post.created_at, 'Invalid date')
  }, [post.created_at])

  // Hydration safety: Show loading skeleton during SSR
  if (!mounted) {
    return (
      <div className="break-inside-avoid mb-4 w-full">
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
    )
  }

  return (
    <div 
      className="break-inside-avoid mb-4 w-full"
      onTouchStart={() => setIsTouched(true)}
      onTouchEnd={() => setIsTouched(false)}
    >
      <div
        className={`relative group rounded-xl shadow-md overflow-hidden transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-xl ${
          isTouched 
            ? 'scale-[0.98] shadow-lg' 
            : ''
        } ${hasImage ? 'bg-white' : 'bg-white'} border border-gray-100`}
        onClick={onClick}
      >
        {/* Enhanced Media Section with Better Loading */}
        {(hasImage || isAudioLink) && (
          <div className="relative w-full h-64 bg-gray-50 flex items-center justify-center overflow-hidden">
            {hasImage ? (
              <>
                {/* Enhanced Loading Skeleton */}
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-pulse">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-medium">Loading...</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actual Image with Smooth Fade-in */}
                <Image
                  src={post.media_url}
                  alt="Post media"
                  fill
                  className={`object-cover transition-all duration-700 group-hover:scale-110 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => {
                    setImageLoaded(true)
                    setImageError(false)
                  }}
                  onError={() => {
                    setImageError(true)
                    setImageLoaded(false)
                  }}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />

                {/* Enhanced Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 opacity-0 group-hover:opacity-100">
                  <div className="absolute top-4 right-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors">
                      <ExternalLink className="w-4 h-4 text-gray-700" />
                    </div>
                  </div>
                </div>
              </>
            ) : isAudioLink ? (
              <div className="flex flex-col items-center gap-4 text-gray-600 p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🎧</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Audio Content</p>
                  <p className="text-sm text-gray-500">AI-generated music</p>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* UPDATED: Enhanced Text Content Section with repositioned decorations */}
        {post.content && (
          <div className={`p-6 text-gray-800 space-y-4 relative ${!hasImage && !isAudioLink ? bgColor : ''}`}>
            {/* MOVED: Sparkle decoration moved up and repositioned */}
            {!hasImage && !isAudioLink && (
              <div className="absolute top-2 right-4 opacity-15">
                <Sparkles className="w-10 h-10 text-brand-green" />
              </div>
            )}

            {/* Main content with better typography */}
            <div className="relative z-10">
              <div className="text-gray-800 leading-relaxed font-medium text-lg line-clamp-8 whitespace-pre-wrap">
                {contentPreview}
              </div>
            </div>

            {/* Add visual interest for text-only posts - repositioned gradient */}
            {!hasImage && !isAudioLink && (
              <div className="absolute bottom-12 left-4 opacity-8">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-green to-brand-blue rounded-full"></div>
              </div>
            )}
          </div>
        )}

        {/* UPDATED: Enhanced User Info Bar with improved day badge */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between">
            {/* Enhanced User info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {post.user_avatar ? (
                <div className="relative">
                  <Image
                    src={post.user_avatar}
                    alt={post.username || 'User'}
                    width={32}
                    height={32}
                    className="rounded-full ring-2 ring-white shadow-md"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-brand-green to-brand-blue rounded-full flex items-center justify-center ring-2 ring-white shadow-md">
                  <span className="text-white text-sm font-bold">
                    {(post.username || post.user_full_name || 'A').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-gray-800 truncate">
                    {post.user_full_name || (post.username ? `@${post.username}` : 'Anonymous')}
                  </span>
                  {post.tidbit && (
                    <span className="text-xs bg-brand-blue text-white px-3 py-1.5 rounded-full font-bold whitespace-nowrap shadow-sm border border-brand-blue-light">
                      Day {post.tidbit}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                  <Clock className="w-3 h-3" />
                  <span>{formattedDate}</span>
                </div>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Like Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onLike(post.id)
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 transform hover:scale-105 ${
                  isLiked 
                    ? 'bg-gradient-to-r from-red-50 to-pink-50 text-red-600 border-2 border-red-200 shadow-md' 
                    : 'hover:bg-gray-50 text-gray-500 hover:text-red-500 border-2 border-gray-200 hover:border-red-200'
                }`}
              >
                <Heart
                  className={`w-5 h-5 transition-all duration-200 ${
                    isLiked ? 'fill-current text-red-500' : ''
                  }`}
                />
                <span className="text-sm font-semibold">{post.likes_count ?? 0}</span>
              </button>

              {/* Comment Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (onClick) onClick()
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 transform hover:scale-105 hover:bg-brand-blue/5 text-gray-500 hover:text-brand-blue border-2 border-gray-200 hover:border-brand-blue shadow-sm"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-semibold">{post.comments_count ?? 0}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Hover Description */}
        {post.description && (
          <div className="absolute bottom-16 left-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <div className="bg-gray-900/95 backdrop-blur-sm text-white text-sm p-4 rounded-xl shadow-lg border border-white/20">
              <p className="leading-relaxed">{post.description}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}