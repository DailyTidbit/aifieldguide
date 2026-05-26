import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../lib/supabaseServer'

const ALLOWED_FIELDS = new Set([
  'title', 'intro', 'summary', 'use_cases',
  'how_they_work', 'what_you_can_do', 'better_results',
  'strengths', 'limitations', 'pro_tips',
])

export async function POST(request: Request) {
  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = createAdminClient()

  const { data: pending, error: fetchErr } = await supabase
    .from('field_guide_sections_pending')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !pending) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (!ALLOWED_FIELDS.has(pending.field_name)) {
    return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
  }

  const { error: updateErr } = await supabase
    .from('field_guide_sections')
    .update({ [pending.field_name]: pending.new_value })
    .eq('id', pending.section_id)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  await supabase.from('field_guide_sections_pending').delete().eq('id', id)

  return NextResponse.json({ ok: true })
}
