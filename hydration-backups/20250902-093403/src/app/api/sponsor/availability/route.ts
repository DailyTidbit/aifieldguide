// src/app/api/sponsor/availability/route.ts - Already correct, just optimized
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/app/lib/supabaseServer'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    
    if (!start || !end) {
      return NextResponse.json(
        { error: 'start and end parameters are required' }, 
        { status: 400 }
      )
    }
    
    const supabase = await createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('sponsor_slots')
      .select('slot_date,status,price_cents,held_until')
      .gte('slot_date', start)
      .lte('slot_date', end)

    if (error) {
      console.error('Sponsor availability error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const now = new Date()
    return NextResponse.json({
      items: (data ?? []).map(d => ({
        date: d.slot_date,
        status: d.status === 'held' && d.held_until && new Date(d.held_until) < now 
          ? 'open' 
          : d.status,
        priceCents: d.price_cents
      }))
    })

  } catch (error) {
    console.error('Sponsor availability exception:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}