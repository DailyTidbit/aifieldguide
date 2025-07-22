'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Filter, ChevronDown, Loader2, Grid3X3, Sparkles, Keyboard, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'

// Custom hooks for enhanced functionality
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue
    }
    
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return defaultValue
    }
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, JSON.stringify(value))
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    }
  }, [key, value])

  return [value, setValue] as const
}

// Tidbit type for database fetching (raw format)
interface RawTidbit {
  id: number
  day_number: number
  title: string
  hero_heading: string
  walkthrough_intro: string
  what_is_ai: string
  what_you_need: string
  step_by_step: string
  try_it: string
  tutor_intro: string
  video_url: string | null
  image_url: string | null
  bitboard_url: string | null
  chatbot_embed: string | null
  extra: number | null
  created_at: string
  updated_at: string
  status: string
  tags: string // JSON string array format like "[\"ai-basics\",\"beginner\"]"
  difficulty_level: number
  estimated_time: number
  seo_description: string | null
  explore_more: string | null
}

// Tidbit type for processed data (parsed format)
interface Tidbit {
  id: number
  day_number: number
  title: string
  hero_heading: string
  walkthrough_intro: string
  what_is_ai: string
  what_you_need: string
  step_by_step: string
  try_it: string
  tutor_intro: string
  video_url: string | null
  image_url: string | null
  bitboard_url: string | null
  chatbot_embed: string | null
  extra: number | null
  created_at: string
  updated_at: string
  status: string
  tags: string[] // Parsed array format
  difficulty_level: number
  estimated_time: number
  seo_description: string | null
  explore_more: string | null
}

type SortOption = 'newest' | 'oldest' | 'alphabetical' | 'reverse-alphabetical'

// Popular filter categories
const filterCategories = [
  { key: 'writing', label: 'Writing', emoji: '✍️' },
  { key: 'creative', label: 'Creative', emoji: '🎨' },
  { key: 'planning', label: 'Planning', emoji: '📋' },
  { key: 'beginner', label: 'Beginner', emoji: '🤓' },
  { key: 'productivity', label: 'Time-saving', emoji: '⏱️' },
  { key: 'business', label: 'Business', emoji: '💼' },
  { key: 'email', label: 'Email', emoji: '📧' },
  { key: 'music', label: 'Music', emoji: '🎵' },
  { key: 'image', label: 'Images', emoji: '🖼️' },
  { key: 'advanced', label: 'Advanced', emoji: '🚀' }
]

// Enhanced Skeleton Card Component
function TidbitCardSkeleton({ index }: { index: number }) {
  return (
    <div 
      className="relative aspect-[4/3] bg-gray-200 rounded-2xl overflow-hidden shadow-md animate-pulse"
      style={{
        animationDelay: `${index * 100}ms`,
        animation: 'fadeInUp 0.8s ease-out both'
      }}
    >
      {/* Image skeleton */}
      <div className="w-full h-3/4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse"></div>
      
      {/* Content skeleton */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-12"></div>
          </div>
          <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
        </div>
      </div>
      
      {/* Corner badge skeleton */}
      <div className="absolute top-3 left-3 w-8 h-5 bg-gray-300 rounded-full"></div>
    </div>
  )
}

// Keyboard Shortcuts Help Modal
function KeyboardShortcutsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded text-gray-500"
          >
            ×
          </button>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span>Focus search</span>
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">/</kbd>
          </div>
          <div className="flex justify-between">
            <span>Clear search & filters</span>
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd>
          </div>
          <div className="flex justify-between">
            <span>Refresh page</span>
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl + R</kbd>
          </div>
          <div className="flex justify-between">
            <span>Show shortcuts</span>
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">?</kbd>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TidbitLibrary() {
  // Add fade-in animation styles
  useEffect(() => {
    const styles = `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    `
    
    if (typeof document !== 'undefined') {
      const existingStyle = document.getElementById('tidbit-library-styles')
      if (!existingStyle) {
        const styleSheet = document.createElement('style')
        styleSheet.id = 'tidbit-library-styles'
        styleSheet.innerText = styles
        document.head.appendChild(styleSheet)
      }
    }
  }, [])

  const [tidbits, setTidbits] = useState<Tidbit[]>([])
  const [filteredTidbits, setFilteredTidbits] = useState<Tidbit[]>([])
  const [displayedTidbits, setDisplayedTidbits] = useState<Tidbit[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Enhanced state with localStorage and debouncing
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 300) // 300ms delay
  const [activeFilters, setActiveFilters] = useLocalStorage<string[]>('tidbit-filters', [])
  const [sortOption, setSortOption] = useLocalStorage<SortOption>('tidbit-sort', 'newest')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  
  // Infinite scroll state
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const itemsPerPage = 24
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key) {
        case '/':
          e.preventDefault()
          searchInputRef.current?.focus()
          break
        case 'Escape':
          setSearchQuery('')
          clearFilters()
          searchInputRef.current?.blur()
          break
        case '?':
          e.preventDefault()
          setShowKeyboardHelp(true)
          break
        case 'r':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            window.location.reload()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Fetch tidbits from Supabase
  const fetchTidbits = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('tidbits')
        .select('*')
        .eq('status', 'published') // Only show published tidbits
        .order('day_number', { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      // Process and clean the data
      const processedTidbits: Tidbit[] = (data as RawTidbit[] || []).map(tidbit => {
        // Parse tags from JSON string format
        let parsedTags: string[] = []
        try {
          if (tidbit.tags && typeof tidbit.tags === 'string') {
            parsedTags = JSON.parse(tidbit.tags)
          } else if (Array.isArray(tidbit.tags)) {
            parsedTags = tidbit.tags
          }
        } catch (e) {
          console.warn('Failed to parse tags for tidbit', tidbit.id, tidbit.tags)
          parsedTags = []
        }

        // Clean image URL (remove any trailing whitespace/newlines)
        const cleanImageUrl = tidbit.image_url ? tidbit.image_url.trim() : null

        return {
          ...tidbit,
          tags: parsedTags,
          image_url: cleanImageUrl,
          seo_description: tidbit.seo_description || '',
          difficulty_level: tidbit.difficulty_level || 1,
          estimated_time: tidbit.estimated_time || 5
        }
      })

      setTidbits(processedTidbits)
    } catch (err) {
      console.error('Error fetching tidbits:', err)
      setError('Failed to load tidbits. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Apply filters and search with debounced search
  const applyFiltersAndSearch = useCallback(() => {
    let filtered = [...tidbits]

    // Apply search filter (using debounced version)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = filtered.filter(tidbit =>
        tidbit.title.toLowerCase().includes(query) ||
        tidbit.hero_heading.toLowerCase().includes(query) ||
        tidbit.walkthrough_intro.toLowerCase().includes(query) ||
        tidbit.tags.some(tag => tag.toLowerCase().includes(query)) ||
        (tidbit.seo_description && tidbit.seo_description.toLowerCase().includes(query))
      )
    }

    // Apply tag filters
    if (activeFilters.length > 0) {
      filtered = filtered.filter(tidbit =>
        activeFilters.some(filter => tidbit.tags.includes(filter))
      )
    }

    // Apply sorting
    switch (sortOption) {
      case 'newest':
        filtered.sort((a, b) => b.day_number - a.day_number)
        break
      case 'oldest':
        filtered.sort((a, b) => a.day_number - b.day_number)
        break
      case 'alphabetical':
        filtered.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'reverse-alphabetical':
        filtered.sort((a, b) => b.title.localeCompare(a.title))
        break
    }

    setFilteredTidbits(filtered)
    setPage(1)
    setHasMore(filtered.length > itemsPerPage)
  }, [tidbits, debouncedSearchQuery, activeFilters, sortOption]) // Use debouncedSearchQuery instead of searchQuery

  // Update displayed tidbits for infinite scroll
  const updateDisplayedTidbits = useCallback(() => {
    const endIndex = page * itemsPerPage
    const newDisplayed = filteredTidbits.slice(0, endIndex)
    setDisplayedTidbits(newDisplayed)
    setHasMore(endIndex < filteredTidbits.length)
  }, [filteredTidbits, page])

  // Load more items
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    
    setLoadingMore(true)
    setTimeout(() => {
      setPage(prev => prev + 1)
      setLoadingMore(false)
    }, 500) // Small delay for smooth UX
  }, [loadingMore, hasMore])

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
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
  }, [hasMore, loadingMore, loadMore])

  // Initial data fetch
  useEffect(() => {
    fetchTidbits()
  }, [fetchTidbits])

  // Apply filters when dependencies change
  useEffect(() => {
    applyFiltersAndSearch()
  }, [applyFiltersAndSearch])

  // Update displayed items when page changes
  useEffect(() => {
    updateDisplayedTidbits()
  }, [updateDisplayedTidbits])

  // Filter toggle
  const toggleFilter = (filterKey: string) => {
    setActiveFilters(prev =>
      prev.includes(filterKey)
        ? prev.filter(f => f !== filterKey)
        : [...prev, filterKey]
    )
  }

  // Clear all filters
  const clearFilters = () => {
    setActiveFilters([])
    setSearchQuery('')
    setSortOption('newest')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
            </div>
            <div className="h-12 bg-gray-200 rounded-xl animate-pulse mb-6"></div>
            <div className="flex gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded-full w-20 animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {Array.from({ length: 20 }).map((_, index) => (
              <TidbitCardSkeleton key={index} index={index} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-red-100 p-6 rounded-2xl mx-auto mb-6 w-20 h-20 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchTidbits}
            className="px-6 py-3 bg-[#60A875] text-white rounded-xl hover:bg-green-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Title Section */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-gradient-to-br from-[#60A875] to-[#59B1E3] p-2 rounded-xl">
                <Grid3X3 className="w-6 h-6 text-white" />
              </div>
              <h1 
                className="text-3xl font-bold text-gray-900"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Tidbit Library
              </h1>
            </div>
            <div className="flex items-center justify-between">
              <p 
                className="text-gray-600"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Explore all {tidbits.length} Daily Tidbits • Find the perfect AI solution for any task
              </p>
              <button
                onClick={() => setShowKeyboardHelp(true)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Keyboard className="w-4 h-4" />
                <span className="hidden sm:inline">Shortcuts</span>
              </button>
            </div>
          </div>

          {/* Enhanced Search Bar with Keyboard Hint */}
          <div className="mb-6">
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search tidbits... (Press '/' to focus)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#60A875]/20 focus:border-[#60A875] bg-white shadow-sm transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Filters and Sort */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {filterCategories.map((category) => (
                <button
                  key={category.key}
                  onClick={() => toggleFilter(category.key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    activeFilters.includes(category.key)
                      ? 'bg-[#60A875] text-white transform scale-105'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 hover:scale-105'
                  }`}
                >
                  <span className="mr-1">{category.emoji}</span>
                  {category.label}
                </button>
              ))}
            </div>

            {/* Sort and Clear */}
            <div className="flex items-center gap-3">
              {/* Active Filter Count & Clear */}
              {(activeFilters.length > 0 || debouncedSearchQuery) && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {filteredTidbits.length} of {tidbits.length} tidbits
                  </span>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-[#60A875] hover:text-green-600 font-medium transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {/* Enhanced Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-medium">
                    {sortOption === 'newest' && 'Newest first'}
                    {sortOption === 'oldest' && 'Oldest first'}
                    {sortOption === 'alphabetical' && 'A → Z'}
                    {sortOption === 'reverse-alphabetical' && 'Z → A'}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showSortDropdown && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[160px]">
                    {[
                      { key: 'newest', label: 'Newest first' },
                      { key: 'oldest', label: 'Oldest first' },
                      { key: 'alphabetical', label: 'A → Z' },
                      { key: 'reverse-alphabetical', label: 'Z → A' }
                    ].map((option) => (
                      <button
                        key={option.key}
                        onClick={() => {
                          setSortOption(option.key as SortOption)
                          setShowSortDropdown(false)
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl transition-colors ${
                          sortOption === option.key ? 'text-[#60A875] font-medium bg-green-50' : 'text-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            {debouncedSearchQuery || activeFilters.length > 0 
              ? `${filteredTidbits.length} tidbits found`
              : `${tidbits.length} tidbits available`
            }
            {debouncedSearchQuery && (
              <span className="ml-2 text-sm text-gray-500">
                for "{debouncedSearchQuery}"
              </span>
            )}
          </p>
        </div>

        {/* Grid */}
        {displayedTidbits.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {displayedTidbits.map((tidbit, index) => (
              <TidbitCard
                key={tidbit.id}
                tidbit={tidbit}
                index={index}
              />
            ))}
          </div>
        ) : (
          // Empty State
          <div className="text-center py-20">
            <div className="bg-gray-100 rounded-2xl p-8 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tidbits found</h3>
            <p className="text-gray-600 mb-6">
              {debouncedSearchQuery
                ? `No tidbits match "${debouncedSearchQuery}". Try different keywords.`
                : activeFilters.length > 0
                  ? 'No tidbits match your selected filters. Try different tags.'
                  : 'No tidbits available yet.'
              }
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-[#60A875] text-white rounded-xl hover:bg-green-600 transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Load More Trigger */}
        {hasMore && (
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {loadingMore && (
              <div className="flex items-center gap-3 text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading more tidbits...</span>
              </div>
            )}
          </div>
        )}

        {/* End Message */}
        {!hasMore && displayedTidbits.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">You've reached the end! 🎉</p>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal 
        isOpen={showKeyboardHelp} 
        onClose={() => setShowKeyboardHelp(false)} 
      />
    </div>
  )
}

// Enhanced Individual Tidbit Card Component
function TidbitCard({ 
  tidbit, 
  index 
}: { 
  tidbit: Tidbit
  index: number
}) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  const imageUrl = tidbit.image_url?.trim()
  const hasValidImageUrl = imageUrl && imageUrl.length > 0

  return (
    <Link href={`/day/${tidbit.day_number}`} className="group block">
      <div 
        className="relative aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 group-hover:scale-[1.03] group-hover:-translate-y-2"
        style={{
          animationDelay: `${index * 100}ms`,
          animation: 'fadeInUp 0.8s ease-out both'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {hasValidImageUrl ? (
          <>
            {/* Loading state */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="relative">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#60A875] to-[#59B1E3] opacity-20 animate-pulse"></div>
                </div>
              </div>
            )}

            {/* Actual image */}
            <img
              src={imageUrl}
              alt={`Day ${tidbit.day_number}: ${tidbit.title}`}
              className={`w-full h-full object-contain transition-all duration-700 group-hover:scale-110 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />

            {imageLoaded && (
              <>
                {/* Enhanced floating action button on hover */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <div className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-colors group-hover:scale-110">
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>

                {/* Title overlay on hover */}
                <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white transition-all duration-300 ${
                  isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                }`}>
                  <h3 className="font-bold text-lg leading-tight">{tidbit.title}</h3>
                  <p className="text-sm text-gray-200 mt-1">
                    {tidbit.estimated_time} min • {tidbit.tags.slice(0, 2).join(', ')}
                  </p>
                </div>
              </>
            )}
          </>
        ) : null}

        {/* Enhanced fallback with animations */}
        {(!hasValidImageUrl || imageError) && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#60A875]/30 to-[#59B1E3]/30 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-gradient-to-br from-[#60A875] to-[#59B1E3] p-4 rounded-2xl mb-4 shadow-xl transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2 text-lg leading-tight transform transition-transform duration-300 group-hover:scale-105">
              Day {tidbit.day_number}
            </h3>
            <p className="text-gray-700 text-sm font-medium leading-tight line-clamp-4 transform transition-transform duration-300 group-hover:translate-y-[-2px]">
              {tidbit.title}
            </p>
          </div>
        )}

        {/* Enhanced corner badge with animation */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:bg-white">
          <span className="text-xs font-bold text-gray-900 transition-colors duration-300 group-hover:text-[#60A875]">
            #{tidbit.day_number}
          </span>
        </div>

        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-[#60A875]/10 to-[#59B1E3]/10 pointer-events-none"></div>

        {/* Enhanced hover overlay with better interaction */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-500 rounded-2xl"></div>
      </div>
    </Link>
  )
}