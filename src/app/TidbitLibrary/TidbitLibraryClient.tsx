'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Filter, X, ChevronDown, Loader2, Search, AlertCircle } from 'lucide-react'
import CTASection from '../components/CTASection'
import { isBrowser, useMounted } from '../lib/clientUtils'

type Sort = 'newest' | 'oldest' | 'alphabetical' | 'reverse-alphabetical'

interface Tidbit {
  id: number
  day_number: number
  title: string
  image_url: string | null
  tags?: string[]
  estimated_time?: number
}

interface TidbitResponse {
  data: Tidbit[]
  count: number
  page: number
  perPage: number
  hasMore: boolean
}

// Loading Skeleton Component
function TidbitLibrarySkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 pb-24">
      <div className="animate-pulse">
        <section className="p-4">
          <div className="max-w-[1100px] mx-auto flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="grid grid-cols-2 gap-3 md:flex md:gap-3 md:shrink-0">
              <div className="h-10 w-full md:w-44 bg-gray-200 rounded-xl"></div>
              <div className="h-10 w-full md:w-auto bg-gray-200 rounded-xl md:w-24"></div>
            </div>
            <div className="h-10 w-full md:w-32 bg-gray-200 rounded-xl"></div>
          </div>
        </section>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-white border border-black/5 shadow-sm overflow-hidden">
              <div className="aspect-square bg-gray-200"></div>
              <div className="p-4">
                <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-5 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Error Display Component
function ErrorDisplay({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="text-center py-20">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">Unable to Load Tidbits</h3>
        <p className="text-red-700 text-sm mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}

export default function TidbitLibraryClient({ initialData }: { initialData: TidbitResponse }) {
  const mounted = useMounted()
  
  // refs
  const abortRef = useRef<AbortController | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const filterButtonRef = useRef<HTMLButtonElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)

  // list state
  const [items, setItems] = useState<Tidbit[]>(initialData.data)
  const [count, setCount] = useState<number>(initialData.count)
  const [page, setPage] = useState<number>(1)
  const [perPage] = useState<number>(initialData.perPage || 24)
  const [hasMore, setHasMore] = useState<boolean>(initialData.hasMore)

  // ui state
  const [sort, setSort] = useState<Sort>('newest')
  const [filters, setFilters] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false)
  const [showCTA, setShowCTA] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})

  const filterCategories = useMemo(
    () => [
      { key: 'writing', label: 'Writing', emoji: '✏️' },
      { key: 'creative', label: 'Creative', emoji: '🎨' },
      { key: 'planning', label: 'Planning', emoji: '📋' },
      { key: 'beginner', label: 'Beginner', emoji: '🤔' },
      { key: 'productivity', label: 'Productivity', emoji: '⏱️' },
      { key: 'business', label: 'Business', emoji: '💼' },
      { key: 'communication', label: 'Communication', emoji: '💬' },
      { key: 'email', label: 'Email', emoji: '📧' },
      { key: 'social-media', label: 'Social Media', emoji: '📱' },
      { key: 'marketing', label: 'Marketing', emoji: '📈' },
      { key: 'branding', label: 'Branding', emoji: '🏷️' },
      { key: 'content-creation', label: 'Content Creation', emoji: '📝' },
      { key: 'brainstorming', label: 'Brainstorming', emoji: '💡' },
      { key: 'innovation', label: 'Innovation', emoji: '⚡' },
      { key: 'inspiration', label: 'Inspiration', emoji: '✨' },
      { key: 'lifestyle', label: 'Lifestyle', emoji: '🌟' },
      { key: 'travel', label: 'Travel', emoji: '✈️' },
      { key: 'adventure', label: 'Adventure', emoji: '🏔️' },
      { key: 'music', label: 'Music', emoji: '🎵' },
      { key: 'image', label: 'Images', emoji: '🖼️' },
      { key: 'advanced', label: 'Advanced', emoji: '🚀' },
    ],
    []
  )

  // Safe analytics tracking function
  const track = useCallback((name: string, data?: Record<string, any>) => {
    if (!mounted) return
    console.log(`GA Event: ${name}`, data || {})
  }, [mounted])

  // Image error handlers
  const handleImageError = useCallback((itemId: number) => {
    setImageErrors(prev => ({ ...prev, [itemId]: true }))
  }, [])

  const handleImageLoad = useCallback((itemId: number) => {
    setImageErrors(prev => {
      const { [itemId]: _, ...rest } = prev
      return rest
    })
  }, [])

  // FIXED: Safe URL building with mount check
  const buildUrl = useCallback((nextPage: number) => {
    if (!mounted || !isBrowser) {
      return `/api/tidbits?page=${nextPage}&perPage=${perPage}&sort=${sort}${filters.map(f => `&filters=${f}`).join('')}`
    }
    
    const u = new URL('/api/tidbits', window.location.origin)
    u.searchParams.set('sort', sort)
    u.searchParams.set('page', String(nextPage))
    u.searchParams.set('perPage', String(perPage))
    filters.forEach(f => u.searchParams.append('filters', f))
    return u.toString()
  }, [sort, filters, perPage, mounted])

  const fetchPage = useCallback(
    async (nextPage: number, replace = false) => {
      if (!mounted) return
      
      // Cancel any existing request
      if (abortRef.current) {
        abortRef.current.abort()
      }
      
      const controller = new AbortController()
      abortRef.current = controller
      setIsLoading(true)
      setError(null)
      
      try {
        const res = await fetch(buildUrl(nextPage), { signal: controller.signal })
        
        if (!res.ok) {
          let errorMessage = `Server error (${res.status})`
          try {
            const errorData = await res.json()
            errorMessage = errorData.error || errorData.message || errorMessage
          } catch {
            errorMessage = `Server error (${res.status}): ${res.statusText}`
          }
          throw new Error(errorMessage)
        }

        const json: TidbitResponse = await res.json()

        // FIXED: Always update count and hasMore from the response
        setCount(json.count ?? 0)
        setHasMore(Boolean(json.hasMore))
        setPage(json.page)
        
        // FIXED: For replace operations (sort/filter changes), completely replace items
        // For pagination (adding pages), append to existing items
        if (replace) {
          setItems(json.data)
          // Reset image errors when replacing data
          setImageErrors({})
        } else {
          setItems(prev => [...prev, ...json.data])
        }

        // Analytics tracking
        if (!replace && nextPage > 1) {
          track('infinite_scroll_load', { page: nextPage })
        }
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          console.error('Fetch error:', e)
          setError(e.message || 'Failed to load tidbits')
        }
      } finally {
        setIsLoading(false)
      }
    },
    [buildUrl, mounted, track]
  )

  // Retry function for error handling
  const retryFetch = useCallback(() => {
    fetchPage(1, true)
  }, [fetchPage])

  // FIXED: Cleanup on unmount
  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  // FIXED: Effect for sort/filter changes - always refetch from page 1
  useEffect(() => {
    if (!mounted) return
    
    // FIXED: Always refetch when sort or filters change, regardless of initial state
    // This ensures the "newest" sort works when switching back from other sorts
    console.log('Sort/filters changed:', { sort, filters })
    
    // Reset to page 1 and fetch new data
    setPage(1)
    fetchPage(1, true)
    track('filter_apply', { sort, filters })
    setShowCTA(false)
    
  }, [sort, filters, mounted, fetchPage, track])

  // FIXED: Intersection observer with mount check - infinite scroll + CTA
  useEffect(() => {
    if (!mounted || !sentinelRef.current) return
    
    const el = sentinelRef.current
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (hasMore && !isLoading) {
            fetchPage(page + 1, false) // false = append, don't replace
          } else if (!hasMore && !showCTA) {
            setShowCTA(true)
            track('library_reached_bottom', { total_items: items.length })
          }
        }
      },
      { rootMargin: '800px 0px 800px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [page, hasMore, isLoading, fetchPage, showCTA, items.length, mounted, track])

  // Filter helpers
  const toggleFilter = (key: string) => {
    setFilters(prev => (prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]))
  }
  const clearFilters = () => setFilters([])

  // FIXED: Show loading skeleton until mounted
  if (!mounted) {
    return <TidbitLibrarySkeleton />
  }

  // Show error state if there's an error
  if (error && items.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-4 pb-24 relative z-10">
        <ErrorDisplay error={error} onRetry={retryFetch} />
      </main>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 pb-24 relative z-10">
      {/* Controls */}
      <section className="p-4">
        <div className="max-w-[1100px] mx-auto flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Left: Sort + Filters */}
          <div className="grid grid-cols-2 gap-3 md:flex md:gap-3 md:shrink-0">
            {/* Sort */}
            <div className="relative w-full md:w-44">
              <label className="sr-only" htmlFor="sort">Sort</label>
              <select
                id="sort"
                className="w-full appearance-none pr-9 pl-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                value={sort}
                onChange={(e) => { 
                  const newSort = e.target.value as Sort
                  console.log('Sort changing from', sort, 'to', newSort)
                  setSort(newSort)
                  track('sort_change', { sort: newSort }) 
                }}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="alphabetical">A → Z</option>
                <option value="reverse-alphabetical">Z → A</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>

            {/* Filters */}
            <button
              ref={filterButtonRef}
              type="button"
              aria-haspopup="dialog"
              aria-expanded={filtersOpen}
              aria-controls="filters-dialog"
              onClick={() => setFiltersOpen(true)}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            >
              <Filter className="w-4 h-4" />
              Filters
              {filters.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center text-xs px-1.5 py-0.5 rounded-full bg-brand-green text-white">
                  {filters.length}
                </span>
              )}
            </button>
          </div>

          {/* Right: Advanced Search */}
          <div>
            <a
              href="/search"
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            >
              <Search className="w-4 h-4" />
              <span>Advanced search</span>
            </a>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section aria-live="polite">
        {items.length === 0 && !isLoading ? (
          <div className="text-center py-20">
            <p className="text-gray-600">No results. Try a different filter or sorting option.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {items.map(item => (
              <li key={item.id} className="group rounded-2xl overflow-hidden bg-white border border-black/5 shadow-sm hover:shadow-md transition">
                <a
                  href={`/day/${item.day_number}`}
                  onClick={() => track('card_click', { id: item.id })}
                  className="block focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                >
                  <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden p-2">
                    {item.image_url && !imageErrors[item.id] ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="max-w-full max-h-full object-contain transition-transform duration-500 ease-out group-hover:scale-105"
                        loading="lazy"
                        onError={() => handleImageError(item.id)}
                        onLoad={() => handleImageLoad(item.id)}
                      />
                    ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 text-center p-4">
                        <div className="w-12 h-12 mb-2 rounded-xl bg-gray-200 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="text-xs">Day {item.day_number}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="text-xs text-gray-500 mb-1">Day {item.day_number}</div>
                    <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2">{item.title}</h3>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Loading */}
      {isLoading && (
        <div className="mt-10 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
          <span className="ml-2 text-sm text-gray-600">Loading…</span>
        </div>
      )}

      {/* CTA Section */}
      {showCTA && (
        <div className="mt-16 animate-fade-in">
          <CTASection variant="transparent" />
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} aria-hidden="true" className="h-1" />

      {/* Filter dialog - only render when open to avoid hydration issues */}
      {filtersOpen && (
        <div role="dialog" aria-modal="true" aria-label="Filter categories" id="filters-dialog" className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => { setFiltersOpen(false); filterButtonRef.current?.focus() }} />
          <div className="absolute inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[min(92vw,720px)]">
            <div ref={dialogRef} className="bg-white rounded-t-2xl md:rounded-2xl shadow-xl border border-black/5 h-[88vh] md:h-auto md:max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                <button onClick={() => { setFiltersOpen(false); filterButtonRef.current?.focus() }} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close filters">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-4 py-4 grow overflow-y-auto">
                <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <legend className="sr-only">Filter categories</legend>
                  {filterCategories.map(cat => {
                    const active = filters.includes(cat.key)
                    return (
                      <label
                        key={cat.key}
                        className={`flex items-center gap-3 rounded-xl border px-3 py-2 cursor-pointer transition ${active ? 'border-brand-green bg-brand-green/10' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <input type="checkbox" className="accent-brand-green h-4 w-4" checked={active} onChange={() => toggleFilter(cat.key)} />
                        <span className="text-lg" aria-hidden>{cat.emoji}</span>
                        <span className="text-sm text-gray-900">{cat.label}</span>
                      </label>
                    )
                  })}
                </fieldset>
              </div>

              <div className="flex items-center justify-between px-4 py-3 border-t">
                <button onClick={clearFilters} className="text-sm text-brand-green hover:underline">Clear all</button>
                <button onClick={() => { setFiltersOpen(false); filterButtonRef.current?.focus() }} className="px-3 py-2 rounded-xl bg-brand-green text-white hover:bg-brand-green-dark">
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}