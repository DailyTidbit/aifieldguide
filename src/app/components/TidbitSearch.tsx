'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Clock, Eye, ArrowRight, Loader2, AlertCircle, Book } from 'lucide-react'
import { getSupabaseBrowserClient } from '../lib/supabaseClient'
import { useDebounce } from '../hooks/useDebounce'
import { formatDate } from '../lib/clientUtils' // ✅ Use safe date formatter

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
  status: 'published' | 'draft' | 'archived'
  tags: string[]
  difficulty_level: 1 | 2 | 3 | 4 | 5
  estimated_time: number
  seo_description: string | null
  extra: number | null
  created_at: string
  updated_at: string
}

interface SearchState {
  tidbits: Tidbit[]
  loading: boolean
  error: string | null
  searchResults: Tidbit[]
  hasSearched: boolean
}

// ✅ HYDRATION SAFE: Analytics helper
const trackSearchEvent = (eventName: string, parameters: Record<string, any>) => {
  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    try {
      ;(window as any).gtag('event', eventName, {
        event_category: 'search',
        ...parameters
      })
    } catch (error) {
      console.warn('Analytics tracking failed:', error)
    }
  }
}

// ✅ HYDRATION SAFE: Generate stable timestamp only after mount
const getStableStartTime = (): number => {
  if (typeof window === 'undefined') return 0
  return Date.now()
}

const loadTidbitsFromSupabase = async (): Promise<Tidbit[]> => {
  try {
    const supabase = getSupabaseBrowserClient()
    
    // CRITICAL FIX: Handle null supabase client
    if (!supabase) {
      throw new Error('Supabase client not available')
    }
    
    const { data, error } = await supabase
      .from('tidbits')
      .select('*')
      .order('day_number', { ascending: true })
    
    if (error) {
      console.error('Error loading tidbits:', error)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('Failed to load tidbits:', error)
    throw error
  }
}

export default function TidbitSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resultsRef = useRef<HTMLDivElement>(null)

  // ✅ HYDRATION SAFETY: Mount protection
  const [mounted, setMounted] = useState(false)

  const [searchState, setSearchState] = useState<SearchState>({
    tidbits: [],
    loading: true,
    error: null,
    searchResults: [],
    hasSearched: false
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [numberQuery, setNumberQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  
  // ✅ HYDRATION SAFE: Timing states only after mount
  const [searchStartTime, setSearchStartTime] = useState<number>(0)
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // ✅ HYDRATION SAFETY: Mount detection
  useEffect(() => {
    setMounted(true)
  }, [])

  // ✅ HYDRATION SAFE: Initialize search query from URL after hydration
  useEffect(() => {
    if (mounted && searchParams) {
      const queryParam = searchParams.get('q')
      if (queryParam) {
        setSearchQuery(queryParam)
      }
    }
  }, [mounted, searchParams])

  useEffect(() => {
    if (mounted) {
      loadTidbits()
    }
  }, [mounted])

  // ✅ HYDRATION SAFE: Update URL only after mounted
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return
    
    const params = new URLSearchParams()
    if (debouncedSearchQuery) params.set('q', debouncedSearchQuery)
    const newUrl = params.toString() ? `/search?${params.toString()}` : '/search'
    window.history.replaceState({}, '', newUrl)
  }, [debouncedSearchQuery, mounted])

  const loadTidbits = async () => {
    if (!mounted) return
    
    try {
      setSearchState(prev => ({ ...prev, loading: true, error: null }))
      const data = await loadTidbitsFromSupabase()
      setSearchState(prev => ({
        ...prev,
        tidbits: data,
        searchResults: data,
        loading: false
      }))
      trackSearchEvent('search_data_loaded', { tidbit_count: data.length })
    } catch (err: any) {
      console.error('Error loading tidbits:', err)
      setSearchState(prev => ({
        ...prev,
        error: 'Failed to load tidbits. Please try again.',
        loading: false
      }))
    }
  }

  const performKeywordSearch = useCallback(
    (query: string) => {
      if (!mounted) return
      
      setIsSearching(true)
      // ✅ HYDRATION SAFE: Set timestamp after mount using stable method
      setSearchStartTime(getStableStartTime())

      if (!query.trim()) {
        setSearchState(prev => ({
          ...prev,
          searchResults: prev.tidbits,
          hasSearched: false
        }))
        setIsSearching(false)
        return
      }

      const queryLower = query.toLowerCase().trim()
      const results: Array<{ tidbit: Tidbit; score: number }> = []

      searchState.tidbits.forEach(tidbit => {
        let score = 0
        const searchableContent = {
          title: (tidbit.title || '').toLowerCase(),
          hero_heading: (tidbit.hero_heading || '').toLowerCase(),
          description: (tidbit.seo_description || '').toLowerCase(),
          walkthrough: (tidbit.walkthrough_intro || '').toLowerCase(),
          tags: (tidbit.tags || []).join(' ').toLowerCase()
        }

        if (searchableContent.title.includes(queryLower)) score += 100
        if (searchableContent.hero_heading.includes(queryLower)) score += 80
        if (searchableContent.description.includes(queryLower)) score += 60
        if (searchableContent.tags.includes(queryLower)) score += 40
        if (searchableContent.walkthrough.includes(queryLower)) score += 20

        if (score > 0) results.push({ tidbit, score })
      })

      const sortedResults = results
        .sort((a, b) => (b.score - a.score) || (a.tidbit.day_number - b.tidbit.day_number))
        .map(r => r.tidbit)

      setSearchState(prev => ({
        ...prev,
        searchResults: sortedResults,
        hasSearched: true
      }))

      setIsSearching(false)
      
      // ✅ HYDRATION SAFE: Calculate search time only if start time was set
      if (searchStartTime > 0) {
        const searchTime = getStableStartTime() - searchStartTime
        trackSearchEvent('search_performed', {
          query,
          results_count: sortedResults.length,
          search_time_ms: searchTime
        })
      }
    },
    [searchState.tidbits, mounted, searchStartTime]
  )

  const performNumberSearch = useCallback(
    (num: string) => {
      if (!mounted) return
      
      if (!num.trim()) {
        setSearchState(prev => ({
          ...prev,
          searchResults: prev.tidbits,
          hasSearched: false
        }))
        return
      }
      const dayNum = parseInt(num, 10)
      if (!isNaN(dayNum)) {
        const match = searchState.tidbits.filter(t => t.day_number === dayNum)
        setSearchState(prev => ({
          ...prev,
          searchResults: match,
          hasSearched: true
        }))
        trackSearchEvent('search_performed', {
          query: `day_${dayNum}`,
          results_count: match.length
        })
      }
    },
    [searchState.tidbits, mounted]
  )

  useEffect(() => {
    if (!searchState.loading && !numberQuery && mounted) {
      performKeywordSearch(debouncedSearchQuery)
    }
  }, [debouncedSearchQuery, numberQuery, searchState.loading, performKeywordSearch, mounted])

  useEffect(() => {
    if (!searchState.loading && numberQuery && mounted) {
      performNumberSearch(numberQuery)
    }
  }, [numberQuery, searchState.loading, performNumberSearch, mounted])

  const navigateToTidbit = (tidbit: Tidbit) => {
    if (!mounted) return
    router.push(`/day/${tidbit.day_number}`)
  }

  // ✅ BRAND COLOR FIX: Use brand colors instead of generic ones
  const getDifficultyColor = (level: number): string => {
    const colors: Record<number, string> = {
      1: 'bg-brand-green/10 text-brand-green border-brand-green/20',
      2: 'bg-brand-blue/10 text-brand-blue border-brand-blue/20', 
      3: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      4: 'bg-orange-100 text-orange-800 border-orange-200',
      5: 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[level] || colors[1]
  }

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      published: 'bg-brand-green/10 text-brand-green border-brand-green/20',
      draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      archived: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[status] || colors['draft']
  }

  // ✅ HYDRATION SAFE: Loading skeleton during hydration
  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-gray-50 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-gray-50 min-h-screen">
      <nav className="mb-4 sm:mb-6 flex items-center justify-between sm:hidden">
        <a
          href="/TidbitLibrary"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg 
                     bg-gradient-to-r from-brand-green to-brand-blue text-white font-semibold
                     shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green"
        >
          <span role="img" aria-label="Conch shell" className="text-lg">
            🐚
          </span>
          <span className="text-sm">FULL TIDBIT LIBRARY</span>
        </a>
      </nav>

      <header className="mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-2">
          Search Daily Tidbits
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Search by keyword or by tidbit number to quickly find what you need.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div>
          <label htmlFor="tidbit-search" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
            Search by keyword
          </label>
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              id="tidbit-search"
              type="text"
              placeholder="Search tidbits by keyword, title, or tag"
              value={searchQuery}
              onChange={(e) => {
                if (!mounted) return
                setSearchQuery(e.target.value)
                setNumberQuery('')
              }}
              className="w-full pl-9 sm:pl-12 pr-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-green focus:border-brand-green bg-white shadow-sm"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            )}
          </div>
        </div>

        <div>
          <label htmlFor="tidbit-number" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
            Search by Tidbit number
          </label>
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              id="tidbit-number"
              type="number"
              min={1}
              placeholder="Enter day number..."
              value={numberQuery}
              onChange={(e) => {
                if (!mounted) return
                setNumberQuery(e.target.value)
                setSearchQuery('')
              }}
              className="w-full pl-9 sm:pl-12 pr-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-green focus:border-brand-green bg-white shadow-sm"
            />
          </div>
        </div>
      </div>

      {searchState.loading && (
        <div className="flex items-center justify-center py-10 sm:py-12" role="status">
          <Loader2 className="animate-spin h-6 w-6 sm:h-8 sm:w-8 text-brand-green mr-3" />
          <span className="text-sm sm:text-base text-gray-600">Loading tidbits...</span>
        </div>
      )}

      {searchState.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-5 mb-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
            <div>
              <p className="text-red-700 font-semibold">Error Loading Tidbits</p>
              <p className="text-red-600 mt-1">{searchState.error}</p>
            </div>
          </div>
        </div>
      )}

      {!searchState.loading && !searchState.error && (
        <div ref={resultsRef} className="space-y-4 sm:space-y-5" role="list">
          {searchState.searchResults.map((tidbit) => (
            <article
              key={tidbit.id}
              className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              role="listitem"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                    <span className="text-xs sm:text-sm font-semibold text-brand-green">Day #{tidbit.day_number}</span>
                    <span className={`inline-flex px-2 py-1 text-[10px] sm:text-xs font-semibold rounded-full border ${getStatusColor(tidbit.status)}`}>
                      {tidbit.status}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-[10px] sm:text-xs font-semibold rounded-full border ${getDifficultyColor(tidbit.difficulty_level)}`}>
                      Level {tidbit.difficulty_level}
                    </span>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">{tidbit.estimated_time}m</span>
                    </div>
                  </div>

                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">{tidbit.title}</h2>

                  {tidbit.walkthrough_intro && (
                    <p className="text-[13px] sm:text-base text-gray-700 leading-relaxed">
                      {tidbit.walkthrough_intro}
                    </p>
                  )}

                  {tidbit.tags.length > 0 && (
                    <div className="mt-2 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2" aria-label="Tags">
                      {tidbit.tags.map(tag => (
                        <span key={tag} className="inline-flex px-2 py-1 text-[10px] sm:text-xs bg-gray-100 text-gray-700 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* ✅ HYDRATION SAFE: Use formatDate instead of toLocaleDateString */}
                  <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-500">
                    Updated {formatDate(tidbit.updated_at)}
                  </p>
                </div>

                <div className="sm:ml-4">
                  <button
                    onClick={() => navigateToTidbit(tidbit)}
                    className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2 bg-brand-green text-white font-semibold rounded-lg hover:bg-brand-greenDark focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Tidbit
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}

          {searchState.searchResults.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No tidbits found</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">Try a different keyword or tidbit number above.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}