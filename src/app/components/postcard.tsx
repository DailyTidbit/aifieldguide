'use client'

import Image from 'next/image'
import { Heart, User, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { isValidMediaUrl } from '../lib/validateMedia'

const bgColors = [
  'bg-[#F9FCF7]', // cream
  'bg-[#E6F4EC]', // soft green
  'bg-[#E3F2FD]', // soft blue
]

export default function PostCard({
  post,
  isLiked,
  onLike,
}: {
  post: any
  isLiked: boolean
  onLike: (postId: string) => void
}) {
  // Enhanced image loading states
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isTouched, setIsTouched] = useState(false)

  const isAudioLink =
    typeof post.media_url === 'string' &&
    (post.media_url.includes('suno.ai') || post.media_url.includes('udio.com'))

  const hasImage =
    typeof post.media_url === 'string' &&
    isValidMediaUrl(post.media_url) &&
    !isAudioLink

  const hasTextOnly =
    !hasImage &&
    !isAudioLink &&
    (post.content || post.before_text || post.after_text)

  const bgColor = bgColors[post.id.charCodeAt(0) % bgColors.length]

  const contentFontSize =
    post.content?.length < 80
      ? 'text-xl'
      : post.content?.length < 200
      ? 'text-base'
      : 'text-sm'

  return (
    <div 
      className="break-inside-avoid mb-4 w-full"
      onTouchStart={() => setIsTouched(true)}
      onTouchEnd={() => setIsTouched(false)}
    >
      <div
        className={`relative group rounded-xl shadow-md overflow-hidden transition-all duration-300 cursor-pointer transform ${
          isTouched 
            ? 'scale-[0.98] shadow-lg' 
            : 'hover:shadow-xl hover:scale-[1.02]'
        } ${hasImage ? 'bg-white' : bgColor}`}
      >
        {/* Enhanced Media Section with Smooth Loading */}
        {(hasImage || isAudioLink) && (
          <div className="relative w-full h-64 bg-gray-100 flex items-center justify-center overflow-hidden">
            {hasImage && !imageError ? (
              <>
                {/* Loading Skeleton with Animation */}
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-sm font-medium">Loading image...</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actual Image with Smooth Fade-in */}
                <img
                  src={post.media_url}
                  alt="Post media"
                  className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${
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
                />

                {/* Enhanced Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 opacity-0 group-hover:opacity-100">
                  <div className="absolute top-4 right-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors">
                      <Heart className="w-4 h-4 text-gray-700" />
                    </div>
                  </div>
                </div>
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
              // Error state for broken images
              <div className="flex flex-col items-center gap-3 text-gray-500 p-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🖼️</span>
                </div>
                <div className="text-center">
                  <p className="font-medium">Image unavailable</p>
                  <p className="text-sm">Failed to load media</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Text content with improved spacing */}
        {(post.content || post.before_text || post.after_text) && (
          <div className="p-4 text-gray-800 space-y-3">
            {post.content && (
              <p
                className={`whitespace-pre-wrap leading-snug font-medium ${contentFontSize} transition-colors duration-200`}
              >
                {post.content}
              </p>
            )}

            {(post.before_text || post.after_text) && (
              <div className="space-y-2 text-sm text-gray-700">
                {post.before_text && (
                  <div className="p-3 bg-[#60A875]/10 rounded-lg border-l-4 border-[#60A875]">
                    <p>
                      <strong className="text-[#60A875]">Before:</strong>{' '}
                      {post.before_text}
                    </p>
                  </div>
                )}
                {post.after_text && (
                  <div className="p-3 bg-[#59B1E3]/10 rounded-lg border-l-4 border-[#59B1E3]">
                    <p>
                      <strong className="text-[#59B1E3]">After:</strong>{' '}
                      {post.after_text}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Enhanced user info bar at bottom */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between">
            {/* User info with better styling */}
            <div className="flex items-center gap-3">
              {post.user_avatar ? (
                <div className="relative">
                  <img
                    src={post.user_avatar}
                    alt={post.username || 'User'}
                    className="w-7 h-7 rounded-full ring-2 ring-white shadow-sm"
                  />
                </div>
              ) : (
                <div className="w-7 h-7 bg-gradient-to-br from-[#60A875] to-[#59B1E3] rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
                  <span className="text-white text-xs font-bold">
                    {(post.username || 'A').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 truncate">
                  {post.username ? `@${post.username}` : 'Anonymous'}
                </span>
                {post.tidbit && (
                  <span className="text-xs bg-[#59B1E3] text-white px-2 py-1 rounded-full font-medium hover:bg-blue-600 transition-colors">
                    #{post.tidbit}
                  </span>
                )}
              </div>
            </div>

            {/* Enhanced like button with animation */}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onLike(post.id)
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-200 transform hover:scale-110 ${
                  isLiked 
                    ? 'bg-[#60A875]/10 text-[#60A875]' 
                    : 'hover:bg-gray-100 text-gray-500 hover:text-[#60A875]'
                }`}
              >
                <Heart
                  className={`w-4 h-4 transition-all duration-200 ${
                    isLiked ? 'fill-[#60A875] text-[#60A875]' : ''
                  }`}
                />
                <span className="text-sm font-medium">{post.likes_count ?? 0}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced hover description with better positioning */}
        {post.description && (
          <div className="absolute bottom-14 left-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <div className="bg-[#59B1E3]/95 backdrop-blur-sm text-white text-sm p-4 rounded-xl shadow-lg border border-white/20">
              <p className="leading-relaxed">{post.description}</p>
            </div>
          </div>
        )}

        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-[#60A875]/5 to-[#59B1E3]/5 pointer-events-none"></div>
      </div>
    </div>
  )
}