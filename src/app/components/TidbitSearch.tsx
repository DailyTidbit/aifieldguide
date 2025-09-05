'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Clock, Eye, ArrowRight, Loader2, AlertCircle, Book } from 'lucide-react'
import { getSupabaseBrowserClient } from '../lib/supabaseClient'
import { useDebounce } from '../hooks/useDebounce'
import { formatDate, useMounted } from '../lib/clientUtils'

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

// Analytics helper
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

const loadTidbitsFromSupabase = async (): Promise<Tidbit[]> => {
  try {
    const supabase = getSupabaseBrowserClient()
    
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
  const searchParams = useSearchParams()
  const resultsRef = useRef<HTMLDivElement>(null)
  const mounted = useMounted()

  const [searchState, setSearchState] = useState<SearchState>({
    tidbits: [],
    loading: true,
    error: null,
    searchResults: [],
    hasSearched: false
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Initialize search query from URL
  useEffect(() => {
    if (mounted && searchParams) {
      const queryParam = searchParams.get('q')
      if (queryParam && queryParam !== searchQuery) {
        setSearchQuery(queryParam)
      }
    }
  }, [mounted, searchParams])

  // Load tidbits on mount
  useEffect(() => {
    if (!mounted) return
    
    const loadTidbits = async () => {
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

    loadTidbits()
  }, [mounted])

  // Update URL when search query changes (but don't redirect)
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return
    
    const params = new URLSearchParams()
    if (debouncedSearchQuery) params.set('q', debouncedSearchQuery)
    const newUrl = params.toString() ? `/search?${params.toString()}` : '/search'
    
    // Use replaceState to update URL without navigation
    if (window.location.pathname + window.location.search !== newUrl) {
      window.history.replaceState({}, '', newUrl)
    }
  }, [debouncedSearchQuery, mounted])

  // Search logic - pure filtering, no redirects
  useEffect(() => {
    if (!mounted || searchState.loading || !searchState.tidbits.length) return
    
    const startTime = Date.now()
    setIsSearching(true)
    
    if (!debouncedSearchQuery.trim()) {
      setSearchState(prev => ({
        ...prev,
        searchResults: prev.tidbits,
        hasSearched: false
      }))
      setIsSearching(false)
      return
    }

    // Perform search - treat everything as text search
    const queryLower = debouncedSearchQuery.toLowerCase().trim()
    const results: Array<{ tidbit: Tidbit; score: number }> = []

    searchState.tidbits.forEach(tidbit => {
      let score = 0
      
      // Create searchable text content
      const searchableFields = [
        { text: (tidbit.title || '').toLowerCase(), weight: 100 },
        { text: (tidbit.hero_heading || '').toLowerCase(), weight: 80 },
        { text: (tidbit.seo_description || '').toLowerCase(), weight: 60 },
        { text: (tidbit.walkthrough_intro || '').toLowerCase(), weight: 20 },
        { text: (tidbit.tags || []).join(' ').toLowerCase(), weight: 40 },
        { text: `day ${tidbit.day_number}`, weight: 90 },
        { text: `tidbit ${tidbit.day_number}`, weight: 90 },
        { text: tidbit.day_number.toString(), weight: 85 }
      ]

      // Calculate relevance score
      searchableFields.forEach(field => {
        if (field.text.includes(queryLower)) {
          score += field.weight
        }
      })

      if (score > 0) {
        results.push({ tidbit, score })
      }
    })

    const sortedResults = results
      .sort((a, b) => (b.score - a.score) || (a.tidbit.day_number - b.tidbit.day_number))
      .map(r => r.tidbit)

    setSearchState(prev => ({
      ...prev,
      searchResults: sortedResults,
      hasSearched: true
    }))

    trackSearchEvent('search_performed', {
      query: debouncedSearchQuery,
      results_count: sortedResults.length,
      search_time_ms: Date.now() - startTime
    })
    
    setIsSearching(false)
  }, [mounted, searchState.loading, searchState.tidbits, debouncedSearchQuery])

  // Handle tidbit viewing - open in new tab to avoid navigation
  const handleViewTidbit = (tidbit: Tidbit) => {
    if (!mounted) return
    
    // Track the click
    trackSearchEvent('tidbit_view_clicked', {
      day_number: tidbit.day_number,
      title: tidbit.title
    })
    
    // Open in new tab
    window.open(`/day/${tidbit.day_number}`, '_blank')
  }

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

  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-gray-50 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="mb-8">
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
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
          Search by keyword, title, or tag to find the tidbits you're looking for. You can also search by day number like "day 1" or "tidbit 5".
        </p>
      </header>

      <div className="mb-6 sm:mb-8">
        <label htmlFor="tidbit-search" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
          Search tidbits
        </label>
        <div className="relative">
          <input
            id="tidbit-search"
            type="text"
            placeholder="Search by keyword, title, tag, or day number..."
            value={searchQuery}
            onChange={(e) => {
              if (!mounted) return
              setSearchQuery(e.target.value)
            }}
            onKeyDown={(e) => {
              // Prevent any form submission or enter key behavior
              if (e.key === 'Enter') {
                e.preventDefault()
              }
            }}
            className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-green focus:border-brand-green bg-white shadow-sm"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Try: "recipes", "productivity tips", "day 1", "tidbit 5"
        </p>
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

                  <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-500">
                    Updated {formatDate(tidbit.updated_at)}
                  </p>
                </div>

                <div className="sm:ml-4">
                  <button
                    onClick={() => handleViewTidbit(tidbit)}
                    className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2 bg-brand-green text-white font-semibold rounded-lg hover:bg-brand-green-dark focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Tidbit
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}

          {searchState.searchResults.length === 0 && searchState.hasSearched && (
            <div className="text-center py-12">
              <Book className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No tidbits found</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">Try a different keyword, or search for a specific day like "day 1".</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}