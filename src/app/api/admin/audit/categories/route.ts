import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../lib/supabaseServer'
import { analyzeCategoryStructure } from '../../../../lib/audit-perplexity'

export const maxDuration = 120

export async function POST() {
  const supabase = createAdminClient()

  // Get category counts
  const { data: tools, error: fetchErr } = await supabase
    .from('ai_tools')
    .select('category')
    .eq('is_public', true)

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }

  const counts: Record<string, number> = {}
  for (const t of tools ?? []) {
    counts[t.category] = (counts[t.category] ?? 0) + 1
  }
  const categories = Object.entries(counts).map(([name, count]) => ({ name, count }))

  // Create a run record
  const { data: run, error: runErr } = await supabase
    .from('audit_runs')
    .insert({ discover_status: 'pending', tools_status: 'pending', categories_status: 'running' })
    .select('id')
    .single()

  if (runErr || !run) {
    return NextResponse.json({ error: 'Failed to create audit run' }, { status: 500 })
  }

  try {
    const suggestions = await analyzeCategoryStructure(categories)

    if (suggestions.length > 0) {
      const rows = suggestions.map(s => ({
        audit_run_id: run.id,
        suggestion_type: s.suggestion_type,
        current_categories: s.current_categories ?? [],
        suggested_category: s.suggested_category ?? null,
        reasoning: s.reasoning ?? null,
        affected_tools: s.affected_tools ?? [],
        status: 'pending',
      }))
      await supabase.from('audit_category_suggestions').insert(rows)
    }

    await supabase
      .from('audit_runs')
      .update({ categories_status: 'completed', status: 'partial' })
      .eq('id', run.id)

    const { data: inserted } = await supabase
      .from('audit_category_suggestions')
      .select('*')
      .eq('audit_run_id', run.id)
      .order('suggestion_type')

    return NextResponse.json({ runId: run.id, suggestions: inserted ?? [] })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await supabase
      .from('audit_runs')
      .update({ categories_status: 'failed', error: msg })
      .eq('id', run.id)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
