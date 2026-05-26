import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../lib/supabaseServer'

export async function POST(request: Request) {
  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase.from('field_guide_sections_pending').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
