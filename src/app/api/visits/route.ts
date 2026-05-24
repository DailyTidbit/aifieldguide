import { NextResponse } from 'next/server'
import { createServerClient } from '../../lib/supabaseServer'

export async function POST() {
  try {
    const supabase = createServerClient()

    const { data: current } = await supabase
      .from('site_stats')
      .select('value')
      .eq('key', 'visit_count')
      .single()

    const newCount = (current?.value ?? 0) + 1

    await supabase
      .from('site_stats')
      .upsert({ key: 'visit_count', value: newCount }, { onConflict: 'key' })

    return NextResponse.json({ count: newCount })
  } catch {
    return NextResponse.json({ count: null })
  }
}
