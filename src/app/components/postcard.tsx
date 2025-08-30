'use client'

import Image from 'next/image'
import { Heart, User, Loader2, MessageCircle, ExternalLink, Sparkles, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { isValidMediaUrl } from '../lib/validateMedia'

const bgColors = [
  'bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50', 
  'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50', 
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
  // Enhanced image loading states
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isTouched, setIsTouched] = useState(false)
  const [mounted, setMounted] = useState(false) // HYDRATION FIX

  // HYDRATION FIX: Set mounted state
  useEffect(() => {
    setMounted(true)
  }, [])

  // HYDRATION FIX: Return early during SSR to prevent hydration mismatches
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

  const isAudioLink =
    typeof post.media_url === 'string' &&
    (post.media_url.includes('suno.ai') || post.media_url.includes('udio.com'))

  const hasImage =
    typeof post.media_url === 'string' &&
    isValidMediaUrl(post.media_url) &&
    !isAudioLink &&
    !imageError

  const hasTextOnly = !hasImage && !isAudioLink && post.content

  // HYDRATION FIX: Use stable background color selection based on post ID hash
  const getStableBgColor = () => {
    // Create a simple hash from the post ID for consistent color selection
    let hash = 0
    const id = post.id || ''
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash + id.charCodeAt(i)) & 0xffffffff
    }
    return bgColors[Math.abs(hash) % bgColors.length]
  }
  
  const bgColor = getStableBgColor()

  // HYDRATION FIX: Stable content preview
  const getContentPreview = () => {
    if (!post.content) return ''
    
    // Check if content has user commentary (separated by ---)
    const parts = post.content.split('\n\n---\n\n')
    if (parts.length > 1) {
      // If there's commentary, show that instead of main content
      const commentary = parts[1]
      return commentary.length > 560 ? `${commentary.substring(0, 560)}...` : commentary
    } else {
      // No commentary, show main content
      return post.content.length > 560 ? `${post.content.substring(0, 560)}...` : post.content
    }
  }
  
  const contentPreview = getContentPreview()

  return (
    <div 
      className="break-inside-avoid mb-4 w-full"
      onTouchStart={() => setIsTouched(true)}
      onTouchEnd={() => setIsTouched(false)}
    >
      <div
        className={`relative group rounded-xl shadow-sm overflow-hidden transition-all duration-300 cursor-pointer transform ${
          isTouched 
            ? 'scale-[0.98] shadow-lg' 
            : 'hover:shadow-xl hover:scale-[1.02]'
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

        {/* Enhanced Text Content Section */}
        {post.content && (
          <div className={`p-6 text-gray-800 space-y-4 ${!hasImage && !isAudioLink ? bgColor : ''}`}>
            {/* Main content with better typography - prioritize user commentary */}
            <div>
              <div className="text-gray-800 leading-relaxed font-medium text-lg line-clamp-8 whitespace-pre-wrap">
                {contentPreview}
              </div>
            </div>

            {/* Add visual interest for text-only posts */}
            {!hasImage && !isAudioLink && (
              <div className="relative">
                <div className="absolute top-4 right-4 opacity-20">
                  <Sparkles className="w-12 h-12 text-[#60A875]" />
                </div>
                <div className="absolute bottom-4 left-4 opacity-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#60A875] to-[#59B1E3] rounded-full"></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Enhanced User Info Bar */}
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
                <div className="w-8 h-8 bg-gradient-to-br from-[#60A875] to-[#59B1E3] rounded-full flex items-center justify-center ring-2 ring-white shadow-md">
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
                    <span className="text-xs bg-gradient-to-r from-[#59B1E3] to-blue-500 text-white px-3 py-1 rounded-full font-bold hover:from-blue-500 hover:to-blue-600 transition-all duration-200 whitespace-nowrap shadow-sm">
                      Day {post.tidbit}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {(() => {
                      try {
                        return new Date(post.created_at).toLocaleDateString()
                      } catch {
                        return 'Invalid date'
                      }
                    })()}
                  </span>
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
                className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 transform hover:scale-105 hover:bg-blue-50 text-gray-500 hover:text-[#59B1E3] border-2 border-gray-200 hover:border-[#59B1E3] shadow-sm"
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

        {/* Subtle Glow Effect on Hover */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-[#60A875]/5 to-[#59B1E3]/5 pointer-events-none"></div>
      </div>
    </div>
  )
}