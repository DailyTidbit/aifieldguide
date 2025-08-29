import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start')!
  const end = searchParams.get('end')!
  
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
  
  const { data, error } = await supabase
    .from('sponsor_slots')
    .select('slot_date,status,price_cents,held_until')
    .gte('slot_date', start).lte('slot_date', end)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const now = new Date()
  return NextResponse.json({
    items: (data ?? []).map(d => ({
      date: d.slot_date,
      status: d.status === 'held' && d.held_until && new Date(d.held_until) < now ? 'open' : d.status,
      priceCents: d.price_cents
    }))
  })
}