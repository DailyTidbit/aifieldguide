import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../lib/supabaseServer'

const SAFE_FIELDS = new Set([
  'description', 'website', 'use_cases', 'access_notes', 'detailed_description',
  'tagline', 'model_type', 'access_method', 'pricing_breakdown',
  'commercial_use_policy', 'training_data', 'workflow_notes', 'limitations',
  'free_tier', 'paid_tier', 'login_required',
])

// action: dismiss_all | apply_all_updates
// ids: array of audit_tool_flag ids to act on
export async function POST(request: Request) {
  const { ids, action } = await request.json()
  if (!Array.isArray(ids) || ids.length === 0 || !['dismiss_all', 'apply_all_updates'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const supabase = createAdminClient()

  if (action === 'dismiss_all') {
    const { error } = await supabase
      .from('audit_tool_flags')
      .update({ status: 'dismissed' })
      .in('id', ids)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, count: ids.length })
  }

  // apply_all_updates — fetch all "update" flags, apply suggested_changes for each
  const { data: flags, error: fetchErr } = await supabase
    .from('audit_tool_flags')
    .select('id, tool_id, suggested_changes')
    .in('id', ids)
    .eq('flag', 'update')
    .eq('status', 'pending')

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })

  let applied = 0
  for (const flag of flags ?? []) {
    const changes = flag.suggested_changes as Record<string, unknown> | null
    if (changes && typeof changes === 'object') {
      const safeUpdate: Record<string, unknown> = {}
      for (const [field, value] of Object.entries(changes)) {
        if (SAFE_FIELDS.has(field)) safeUpdate[field] = value
      }
      if (Object.keys(safeUpdate).length > 0) {
        await supabase.from('ai_tools').update(safeUpdate).eq('id', flag.tool_id)
        applied++
      }
    }
  }

  await supabase
    .from('audit_tool_flags')
    .update({ status: 'actioned' })
    .in('id', ids)
    .eq('flag', 'update')

  return NextResponse.json({ ok: true, applied })
}
