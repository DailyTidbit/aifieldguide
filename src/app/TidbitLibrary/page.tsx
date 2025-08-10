// app/TidbitLibrary/page.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, ChevronDown, Loader2, Sparkles, X, SlidersHorizontal, BookOpen } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'

// ---------------- hooks ----------------
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debouncedValue
}

function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch { return defaultValue }
  })
  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(value)) } catch {}
  }, [key, value])
  return [value, setValue] as const
}

// ---------------- types ----------------
interface RawTidbit {
  id: number
  day_number: number
  title: string
  image_url: string | null
  tags: string // JSON string
  estimated_time: number | null
  status: string
  created_at: string
}
interface Tidbit {
  id: number
  day_number: number
  title: string
  image_url: string | null
  tags: string[]
  estimated_time: number
}

type SortOption = 'newest' | 'oldest' | 'alphabetical' | 'reverse-alphabetical'

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
  { key: 'advanced', label: 'Advanced', emoji: '🚀' },
]

// ---------------- skeletons ----------------
function TidbitCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="relative aspect-square bg-gray-200 rounded-2xl overflow-hidden shadow-md"
      style={{ animationDelay: `${index * 80}ms`, animation: 'fadeInUp 0.7s ease-out both' }}
      role="status" aria-busy="true"
    >
      <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
    </div>
  )
}

// ---------------- page ----------------
export default function TidbitLibrary() {
  // one-time keyframes
  useEffect(() => {
    const styles = `
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(24px) scale(0.98); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
    `
    if (typeof document !== 'undefined' && !document.getElementById('tidbit-library-styles')) {
      const s = document.createElement('style'); s.id = 'tidbit-library-styles'; s.innerText = styles; document.head.appendChild(s)
    }
  }, [])

  const [tidbits, setTidbits] = useState<Tidbit[]>([])
  const [filteredTidbits, setFilteredTidbits] = useState<Tidbit[]>([])
  const [displayedTidbits, setDisplayedTidbits] = useState<Tidbit[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 250)
  const [activeFilters, setActiveFilters] = useLocalStorage<string[]>('tidbit-filters', [])
  const [sortOption, setSortOption] = useLocalStorage<SortOption>('tidbit-sort', 'newest')
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  // compact filters dropdown
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const filterDropdownRef = useRef<HTMLDivElement>(null)

  // infinite scroll
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const itemsPerPage = 24
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // keyboard QoL (no visible “Shortcuts” UI)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement | null
      if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA')) return
      if (e.key === '/') { e.preventDefault(); searchInputRef.current?.focus() }
      if (e.key === 'Escape') { setSearchQuery(''); clearFilters(); searchInputRef.current?.blur() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // close filters dropdown when clicking outside
  useEffect(() => {
    if (!showFilterDropdown) return
    const onDocClick = (e: MouseEvent) => {
      if (!filterDropdownRef.current) return
      if (!filterDropdownRef.current.contains(e.target as Node)) setShowFilterDropdown(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [showFilterDropdown])

  // fetch (lean columns only)
  const fetchTidbits = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const { data, error: fetchError } = await supabase
        .from('tidbits')
        .select('id, day_number, title, image_url, tags, estimated_time, status, created_at')
        .eq('status', 'published')
        .order('day_number', { ascending: true })
      if (fetchError) throw fetchError

      const processed: Tidbit[] = (data as RawTidbit[] || []).map(t => {
        let parsedTags: string[] = []
        try { parsedTags = t.tags ? JSON.parse(t.tags) : [] } catch { parsedTags = [] }
        return {
          id: t.id,
          day_number: t.day_number,
          title: t.title,
          image_url: t.image_url ? t.image_url.trim() : null,
          tags: Array.isArray(parsedTags) ? parsedTags : [],
          estimated_time: t.estimated_time || 5,
        }
      })
      setTidbits(processed)
    } catch (e) {
      console.error(e)
      setError('Failed to load tidbits. Please try again.')
    } finally { setLoading(false) }
  }, [])

  // filter + search + sort
  const applyFiltersAndSearch = useCallback(() => {
    let filtered = [...tidbits]
    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase()
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      )
    }
    if (activeFilters.length > 0) {
      filtered = filtered.filter(t => activeFilters.some(f => t.tags.includes(f)))
    }
    switch (sortOption) {
      case 'newest': filtered.sort((a, b) => b.day_number - a.day_number); break
      case 'oldest': filtered.sort((a, b) => a.day_number - b.day_number); break
      case 'alphabetical': filtered.sort((a, b) => a.title.localeCompare(b.title)); break
      case 'reverse-alphabetical': filtered.sort((a, b) => b.title.localeCompare(a.title)); break
    }
    setFilteredTidbits(filtered)
    setPage(1)
    setHasMore(filtered.length > itemsPerPage)
  }, [tidbits, debouncedSearchQuery, activeFilters, sortOption])

  const updateDisplayedTidbits = useCallback(() => {
    const endIndex = page * itemsPerPage
    setDisplayedTidbits(filteredTidbits.slice(0, endIndex))
    setHasMore(endIndex < filteredTidbits.length)
  }, [filteredTidbits, page])

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    setTimeout(() => { setPage(p => p + 1); setLoadingMore(false) }, 350)
  }, [loadingMore, hasMore])

  // observers
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMore && !loadingMore) loadMore() },
      { threshold: 0, rootMargin: '600px' }
    )
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current)
    return () => observerRef.current?.disconnect()
  }, [hasMore, loadingMore, loadMore])

  // lifecycle
  useEffect(() => { fetchTidbits() }, [fetchTidbits])
  useEffect(() => { applyFiltersAndSearch() }, [applyFiltersAndSearch])
  useEffect(() => { updateDisplayedTidbits() }, [updateDisplayedTidbits])

  const toggleFilter = (key: string) => {
    setActiveFilters(prev => prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key])
  }
  const clearFilters = () => { setActiveFilters([]); setSearchQuery(''); setSortOption('newest') }

  // ---------------- UI ----------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
        <div className="sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-center gap-3">
              <div className="bg-gradient-to-br from-[#60A875] to-[#59B1E3] p-3 rounded-2xl">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <h1 className="heading-hero text-5xl md:text-6xl lg:text-7xl leading-tight text-gray-900 text-center">
                Tidbit Library
              </h1>
            </div>
            <div className="mt-6 h-12 bg-white/60 rounded-xl animate-pulse" role="status" aria-busy="true" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {Array.from({ length: 12 }).map((_, i) => <TidbitCardSkeleton key={i} index={i} />)}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <div className="bg-red-100 p-6 rounded-2xl mx-auto mb-6 w-20 h-20 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={fetchTidbits} className="px-6 py-3 bg-[#60A875] text-white rounded-xl hover:bg-green-600 transition-colors">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Centered header on gradient */}
      <div className="sticky top-0 z-40 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center gap-3">
            <div className="bg-gradient-to-br from-[#60A875] to-[#59B1E3] p-3 rounded-2xl">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <h1 className="heading-hero text-5xl md:text-6xl lg:text-7xl leading-tight text-gray-900 text-center">
              Tidbit Library
            </h1>
          </div>

          {/* Search + compact controls */}
          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="relative w-full md:max-w-xl">
              <label htmlFor="tidbit-search" className="sr-only">Search tidbits</label>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
              <input
                id="tidbit-search"
                ref={searchInputRef}
                type="text"
                placeholder="search tidbits"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-10 py-3 text-base md:text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#60A875]/20 focus:border-[#60A875] bg-white shadow-sm transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Filters + Sort */}
            <div className="flex items-center gap-3 md:justify-end">
              {/* Filters dropdown */}
              <div className="relative" ref={filterDropdownRef}>
                <button
                  onClick={() => setShowFilterDropdown(v => !v)}
                  aria-haspopup="dialog"
                  aria-expanded={showFilterDropdown}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">Filters</span>
                  {activeFilters.length > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center rounded-full bg-[#60A875] text-white text-xs px-2 py-0.5">
                      {activeFilters.length}
                    </span>
                  )}
                </button>

                {showFilterDropdown && (
                  <div
                    role="dialog"
                    aria-label="Filter tidbits"
                    className="absolute right-0 top-[115%] z-50 w-64 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
                  >
                    <div className="max-h-64 overflow-auto p-2">
                      {filterCategories.map((c) => (
                        <label
                          key={c.key}
                          className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="accent-[#60A875]"
                            checked={activeFilters.includes(c.key)}
                            onChange={() => toggleFilter(c.key)}
                          />
                          <span className="text-sm text-gray-800">
                            <span className="mr-1">{c.emoji}</span>{c.label}
                          </span>
                        </label>
                      ))}
                    </div>
                    <div className="flex items-center justify-between gap-2 p-2 border-t">
                      <button onClick={clearFilters} className="text-sm text-[#60A875] hover:text-green-700 font-medium">Clear</button>
                      <button onClick={() => setShowFilterDropdown(false)} className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-black">Done</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sort */}
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(v => !v)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  aria-haspopup="listbox"
                  aria-expanded={showSortDropdown}
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
                  <div className="absolute right-0 top-[115%] mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[160px]" role="listbox">
                    {[
                      { key: 'newest', label: 'Newest first' },
                      { key: 'oldest', label: 'Oldest first' },
                      { key: 'alphabetical', label: 'A → Z' },
                      { key: 'reverse-alphabetical', label: 'Z → A' },
                    ].map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => { setSortOption(opt.key as SortOption); setShowSortDropdown(false) }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl transition-colors ${
                          sortOption === opt.key ? 'text-[#60A875] font-medium bg-green-50' : 'text-gray-700'
                        }`}
                        role="option"
                        aria-selected={sortOption === opt.key}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-gray-700" aria-live="polite">
            {debouncedSearchQuery || activeFilters.length > 0
              ? `${filteredTidbits.length} tidbits found`
              : `${tidbits.length} tidbits available`}
            {debouncedSearchQuery && <span className="ml-2 text-sm text-gray-600">for “{debouncedSearchQuery}”</span>}
          </p>
        </div>

        {displayedTidbits.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {displayedTidbits.map((t, i) => <TidbitCard key={t.id} tidbit={t} index={i} />)}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="bg-white/70 rounded-2xl p-8 w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-sm">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tidbits found</h3>
            <p className="text-gray-600 mb-6">
              {debouncedSearchQuery
                ? `No tidbits match “${debouncedSearchQuery}”. Try different keywords.`
                : activeFilters.length > 0
                  ? 'No tidbits match your selected filters. Try different tags.'
                  : 'No tidbits available yet.'}
            </p>
            <button onClick={clearFilters} className="px-6 py-3 bg-[#60A875] text-white rounded-xl hover:bg-green-600 transition-colors">
              Clear filters
            </button>
          </div>
        )}

        {/* Infinite scroll sentinel */}
        {hasMore && (
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {loadingMore && (
              <div className="flex items-center gap-3 text-gray-700" role="status" aria-busy="true">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading more tidbits…</span>
              </div>
            )}
          </div>
        )}

        {!hasMore && displayedTidbits.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-700">You’ve reached the end! 🎉</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------- card ----------------
function TidbitCard({ tidbit, index }: { tidbit: Tidbit; index: number }) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const imageUrl = tidbit.image_url?.trim() || ''

  return (
    <Link href={`/day/${tidbit.day_number}`} className="group block" aria-label={`Open Day ${tidbit.day_number}: ${tidbit.title}`}>
      <div
        className="relative aspect-square bg-gradient-to-br from-[#60A875]/15 to-[#59B1E3]/15 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 group-hover:scale-[1.02] group-hover:-translate-y-1"
        style={{ animationDelay: `${index * 80}ms`, animation: 'fadeInUp 0.7s ease-out both' }}
      >
        {imageUrl && !imageError ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60" role="status" aria-busy="true">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <Image
              src={imageUrl}
              alt={`Day ${tidbit.day_number}: ${tidbit.title}`}
              fill
              sizes="(min-width:1536px) 20vw, (min-width:1280px) 25vw, (min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw"
              className={`object-contain p-3 transition-transform duration-700 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoadingComplete={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              priority={index < 6}
            />
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-gradient-to-br from-[#60A875] to-[#59B1E3] p-4 rounded-2xl mb-3 shadow-xl">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <span className="text-sm text-gray-700">Day {tidbit.day_number}</span>
          </div>
        )}

        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-[#60A875]/10 to-[#59B1E3]/10 pointer-events-none" />
      </div>

      <span className="sr-only">
        {tidbit.title}. Estimated {tidbit.estimated_time} minutes. {tidbit.tags.slice(0, 3).join(', ')}
      </span>
    </Link>
  )
}
