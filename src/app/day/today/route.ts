import { NextResponse } from 'next/server'
import { createServerClient } from '../../lib/supabaseServer'

export async function GET(req: Request) {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('tidbits')
      .select('day_number')
      .order('day_number', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) throw error ?? new Error('No tidbits found')

    const url = new URL(req.url)
    url.pathname = `/day/${data.day_number}`

    const res = NextResponse.redirect(url, 307) // temporary redirect
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    return res
  } catch {
    // Fallback: send them home if something goes wrong
    return NextResponse.redirect(new URL('/', req.url), 307)
  }
}

// (Optional) support HEAD requests
export const HEAD = GET
