// app/api/tidbits/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getTidbits } from '../../lib/tidbits'

export const revalidate = 300

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') ?? ''
    const sort = (searchParams.get('sort') ?? 'newest') as
      | 'newest' | 'oldest' | 'alphabetical' | 'reverse-alphabetical'
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get('perPage') ?? '24', 10)))
    const filters = searchParams.getAll('filters') // supports multiple &filters=...

    const result = await getTidbits({ q, sort, page, perPage, filters })

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('/api/tidbits GET error:', error)
    return NextResponse.json(
      { data: [], count: 0, page: 1, perPage: 24, hasMore: false, error: 'Server error' },
      { status: 500 }
    )
  }
}
