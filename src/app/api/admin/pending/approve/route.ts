import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '../../../../lib/supabaseServer'

const ALLOWED_FIELDS = new Set([
  'description', 'use_cases', 'login_required', 'free_tier',
  'paid_tier', 'website', 'access_notes', 'detailed_description',
])

const BOOLEAN_FIELDS = new Set(['login_required', 'free_tier', 'paid_tier'])

function parseValue(fieldName: string, value: string | null): string | boolean | null {
  if (value === null) return null
  if (BOOLEAN_FIELDS.has(fieldName)) return value === 'true'
  return value
}

export async function POST(request: Request) {
  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = createServiceRoleClient()

  const { data: pending, error: fetchErr } = await supabase
    .from('ai_tools_pending')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !pending) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (!ALLOWED_FIELDS.has(pending.field_name)) {
    return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
  }

  const updateValue = parseValue(pending.field_name, pending.new_value)

  const { error: updateErr } = await supabase
    .from('ai_tools')
    .update({ [pending.field_name]: updateValue })
    .eq('id', pending.tool_id)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  await supabase.from('ai_tools_pending').delete().eq('id', id)

  return NextResponse.json({ ok: true })
}
