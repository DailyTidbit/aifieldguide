import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../lib/supabaseServer'

const SAFE_FIELDS = new Set([
  'description', 'website', 'use_cases', 'access_notes', 'detailed_description',
  'tagline', 'model_type', 'access_method', 'pricing_breakdown',
  'commercial_use_policy', 'training_data', 'workflow_notes', 'limitations',
  'free_tier', 'paid_tier', 'login_required',
])

export async function POST(request: Request) {
  const { id, action } = await request.json()
  // actions: dismiss | keep | apply_update | remove_tool
  if (!id || !['dismiss', 'keep', 'apply_update', 'remove_tool'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: flag, error: fetchErr } = await supabase
    .from('audit_tool_flags')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !flag) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (action === 'dismiss' || action === 'keep') {
    await supabase.from('audit_tool_flags').update({ status: 'dismissed' }).eq('id', id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'apply_update') {
    const changes = flag.suggested_changes as Record<string, unknown> | null
    if (changes && typeof changes === 'object') {
      const safeUpdate: Record<string, unknown> = {}
      for (const [field, value] of Object.entries(changes)) {
        if (SAFE_FIELDS.has(field)) safeUpdate[field] = value
      }
      if (Object.keys(safeUpdate).length > 0) {
        await supabase.from('ai_tools').update(safeUpdate).eq('id', flag.tool_id)
      }
    }
    await supabase.from('audit_tool_flags').update({ status: 'actioned' }).eq('id', id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'remove_tool') {
    await supabase.from('ai_tools').update({ is_public: false }).eq('id', flag.tool_id)
    await supabase.from('audit_tool_flags').update({ status: 'actioned' }).eq('id', id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
