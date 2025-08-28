// src/app/api/today/route.ts
// Server route: returns { day_number: number | null }
import { NextResponse } from 'next/server'
import { createServerClient } from '@/app/lib/supabaseServer'

export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('tidbits')
      .select('day_number')
      .order('day_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('API /today error:', error)
      return NextResponse.json({ day_number: null }, { status: 200 })
    }
    
    return NextResponse.json({ day_number: data?.day_number ?? null })
  } catch (e) {
    console.error('API /today exception:', e)
    return NextResponse.json({ day_number: null }, { status: 200 })
  }
}