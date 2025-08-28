// app/TidbitLibrary/TidbitLibraryClient.tsx
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Filter, X, ChevronDown, Loader2, Search } from 'lucide-react'
import CTASection from '../components/CTASection'

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

export default function TidbitLibraryClient({ initialData }: { initialData: TidbitResponse }) {
  // refs
  const mounted = useRef(false)
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

  // ui state (no in-page search anymore)
  const [sort, setSort] = useState<Sort>('newest')
  const [filters, setFilters] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false)
  const [showCTA, setShowCTA] = useState<boolean>(false)

  const filterCategories = useMemo(
    () => [
      { key: 'writing', label: 'Writing', emoji: '✍️' },
      { key: 'creative', label: 'Creative', emoji: '🎨' },
      { key: 'planning', label: 'Planning', emoji: '📋' },
      { key: 'beginner', label: 'Beginner', emoji: '🤓' },
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

  const track = (name: string, data?: Record<string, any>) => {
    console.log(`GA Event: ${name}`, data || {})
  }

  const buildUrl = useCallback((nextPage: number) => {
    const u = new URL('/api/tidbits', window.location.origin)
    // Note: removed q — library is browse-only now
    u.searchParams.set('sort', sort)
    u.searchParams.set('page', String(nextPage))
    u.searchParams.set('perPage', String(perPage))
    filters.forEach(f => u.searchParams.append('filters', f))
    return u.toString()
  }, [sort, filters, perPage])

  const fetchPage = useCallback(
    async (nextPage: number, replace = false) => {
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setIsLoading(true)
      try {
        const res = await fetch(buildUrl(nextPage), { signal: controller.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json: TidbitResponse = await res.json()

        setCount(json.count ?? 0)
        setHasMore(Boolean(json.hasMore))
        setPage(json.page)
        setItems(prev => (replace ? json.data : [...prev, ...json.data]))

        if (!replace && nextPage > 1) track('infinite_scroll_load', { page: nextPage })
      } catch (e: any) {
        if (e?.name !== 'AbortError') console.error(e)
      } finally {
        setIsLoading(false)
      }
    },
    [buildUrl]
  )

  // lifecycle
  useEffect(() => { 
    mounted.current = true
    return () => abortRef.current?.abort()
  }, [])

  // refetch when sort/filters change (page 1 replace)
  useEffect(() => {
    if (!mounted.current) return
    fetchPage(1, true)
    track('filter_apply', { sort, filters })
    setShowCTA(false)
  }, [sort, filters, fetchPage])

  // infinite scroll + CTA
  useEffect(() => {
    if (!sentinelRef.current) return
    const el = sentinelRef.current
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (hasMore && !isLoading) {
            fetchPage(page + 1)
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
  }, [page, hasMore, isLoading, fetchPage, showCTA, items.length])

  // filter helpers
  const toggleFilter = (key: string) => {
    setFilters(prev => (prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]))
  }
  const clearFilters = () => setFilters([])

  return (
    <main className="max-w-7xl mx-auto px-4 pb-24">
      {/* Controls (no library search; add Advanced Search link instead) */}
      <section className="p-4">
  <div className="max-w-[1100px] mx-auto flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    {/* Left: Sort + Filters */}
    <div className="grid grid-cols-2 gap-3 md:flex md:gap-3 md:shrink-0">
      {/* Sort */}
      <div className="relative w-full md:w-44">
        <label className="sr-only" htmlFor="sort">Sort</label>
        <select
          id="sort"
          className="w-full appearance-none pr-9 pl-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#60A875]/20"
          value={sort}
          onChange={(e) => { setSort(e.target.value as Sort); track('sort_change', { sort: e.target.value }) }}
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
        className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#60A875]/20"
      >
        <Filter className="w-4 h-4" />
        Filters
        {filters.length > 0 && (
          <span className="ml-1 inline-flex items-center justify-center text-xs px-1.5 py-0.5 rounded-full bg-[#60A875] text-white">
            {filters.length}
          </span>
        )}
      </button>
    </div>

    {/* Right: Advanced Search */}
    <div>
      <a
        href="/search"
        className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#60A875]/20"
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
                  className="block focus:outline-none focus:ring-2 focus:ring-[#60A875]/30"
                >
                  <div className="aspect-square bg-white flex items-center justify-center overflow-hidden p-2">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="max-w-full max-h-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
                        No image
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
        <div className="mt-16 animate-fade-in-up">
          <CTASection variant="transparent" />
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} aria-hidden="true" className="h-1" />

      {/* Filter dialog (unchanged) */}
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

              <div className="px-4 py-4 grow overflow-y-auto [-webkit-overflow-scrolling:touch]">
                <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <legend className="sr-only">Filter categories</legend>
                  {filterCategories.map(cat => {
                    const active = filters.includes(cat.key)
                    return (
                      <label
                        key={cat.key}
                        className={`flex items-center gap-3 rounded-xl border px-3 py-2 cursor-pointer transition ${active ? 'border-[#60A875] bg-[#60A875]/10' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <input type="checkbox" className="accent-[#60A875] h-4 w-4" checked={active} onChange={() => toggleFilter(cat.key)} />
                        <span className="text-lg" aria-hidden>{cat.emoji}</span>
                        <span className="text-sm text-gray-900">{cat.label}</span>
                      </label>
                    )
                  })}
                </fieldset>
              </div>

              <div className="flex items-center justify-between px-4 py-3 border-t">
                <button onClick={clearFilters} className="text-sm text-[#60A875] hover:underline">Clear all</button>
                <button onClick={() => { setFiltersOpen(false); filterButtonRef.current?.focus() }} className="px-3 py-2 rounded-xl bg-[#60A875] text-white hover:bg-green-600">
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes sheet-in {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </main>
  )
}
