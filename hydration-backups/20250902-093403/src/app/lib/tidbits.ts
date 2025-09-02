// app/lib/tidbits.ts
import 'server-only'
import { createServerClient } from './supabaseServer'

export interface Tidbit {
  id: number
  day_number: number
  title: string
  image_url: string | null
  tags: string[]
  estimated_time: number
}

export interface GetTidbitsParams {
  q?: string
  filters?: string[]
  sort?: 'newest' | 'oldest' | 'alphabetical' | 'reverse-alphabetical'
  page?: number
  perPage?: number
  countOnly?: boolean
}

export interface TidbitResponse {
  data: Tidbit[]
  count: number
  page: number
  perPage: number
  hasMore: boolean
}

function normalizeTags(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags.map(String)
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags)
      return Array.isArray(parsed) ? parsed.map(String) : []
    } catch {
      // comma-separated fallback
      return tags.split(',').map(s => s.trim()).filter(Boolean)
    }
  }
  return []
}

export async function getTidbits(params: GetTidbitsParams = {}): Promise<TidbitResponse> {
  const {
    q = '',
    filters = [],
    sort = 'newest',
    page = 1,
    perPage = 24,
    countOnly = false,
  } = params

  const supabase = createServerClient()
  const from = Math.max(0, (page - 1) * perPage)
  const to = from + perPage - 1

  // COUNT ONLY (for metadata): fast HEAD request
  if (countOnly) {
    const { count, error } = await supabase
      .from('tidbits')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')

    if (error) throw error
    return { data: [], count: count ?? 0, page: 1, perPage: 0, hasMore: false }
  }

  // Base query
  let qy = supabase
    .from('tidbits')
    .select('id, day_number, title, image_url, tags, estimated_time', { count: 'exact' })
    .eq('status', 'published')

  // Search: title match (keep it DB-side + indexable)
  if (q) {
    qy = qy.ilike('title', `%${q}%`)
  }

  // Filters: requires tags to be an array column (text[]/jsonb[])
  if (filters.length) {
    qy = qy.overlaps('tags', filters)
  }

  // Sort
  switch (sort) {
    case 'oldest':
      qy = qy.order('day_number', { ascending: true })
      break
    case 'alphabetical':
      qy = qy.order('title', { ascending: true })
      break
    case 'reverse-alphabetical':
      qy = qy.order('title', { ascending: false })
      break
    default:
      qy = qy.order('day_number', { ascending: false }) // newest
  }

  const { data, count, error } = await qy.range(from, to)
  if (error) throw error

  // Normalize rows
  const rows: Tidbit[] = (data ?? []).map((r: any) => ({
    id: Number(r.id),
    day_number: Number(r.day_number),
    title: String(r.title),
    image_url: r.image_url ?? null,
    tags: normalizeTags(r.tags),
    estimated_time: Number(r.estimated_time ?? 0),
  }))

  const total = count ?? 0
  const hasMore = to + 1 < total

  return {
    data: rows,
    count: total,
    page,
    perPage,
    hasMore,
  }
}
