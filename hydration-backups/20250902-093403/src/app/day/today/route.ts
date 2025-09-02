import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../lib/supabaseServer'

export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('tidbits')
      .select('day_number')
      .order('day_number', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      console.error('Error fetching latest tidbit:', error)
      throw error ?? new Error('No tidbits found')
    }

    const url = new URL(req.url)
    url.pathname = `/day/${data.day_number}`

    const res = NextResponse.redirect(url, 307) // temporary redirect
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    res.headers.set('Pragma', 'no-cache')
    
    return res
  } catch (error) {
    console.error('Today route error:', error)
    // Fallback: send them home if something goes wrong
    return NextResponse.redirect(new URL('/', req.url), 307)
  }
}

// Support HEAD requests for better SEO
export const HEAD = GET