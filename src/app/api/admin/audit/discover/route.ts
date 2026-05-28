import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../lib/supabaseServer'
import { discoverNewTools } from '../../../../lib/audit-perplexity'

export const maxDuration = 120

export async function POST() {
  const supabase = createAdminClient()

  // Create a run record
  const { data: run, error: runErr } = await supabase
    .from('audit_runs')
    .insert({ discover_status: 'running', tools_status: 'pending', categories_status: 'pending' })
    .select('id')
    .single()

  if (runErr || !run) {
    return NextResponse.json({ error: 'Failed to create audit run' }, { status: 500 })
  }

  try {
    // Build a set of names already in the database or already pending review
    const [{ data: existingTools }, { data: pendingTools }] = await Promise.all([
      supabase.from('ai_tools').select('name').eq('is_public', true),
      supabase.from('audit_new_tools').select('tool_name').eq('status', 'pending'),
    ])

    const existingNames = new Set([
      ...(existingTools ?? []).map(t => t.name.toLowerCase()),
      ...(pendingTools ?? []).map(t => t.tool_name.toLowerCase()),
    ])

    const tools = await discoverNewTools()

    // Filter out anything already in the DB or already pending
    const newOnly = tools.filter(t => !existingNames.has(t.tool_name.toLowerCase()))

    if (newOnly.length > 0) {
      const rows = newOnly.map(t => ({
        audit_run_id: run.id,
        tool_name: t.tool_name,
        website: t.website || null,
        description: t.description || null,
        suggested_category: t.suggested_category || null,
        reason: t.reason || null,
        source_urls: t.source_urls ?? [],
        funding_info: t.funding_info || null,
        status: 'pending',
      }))
      await supabase.from('audit_new_tools').insert(rows)
    }

    const skipped = tools.length - newOnly.length

    await supabase
      .from('audit_runs')
      .update({ discover_status: 'completed', status: 'partial' })
      .eq('id', run.id)

    // Return newly inserted rows with their IDs
    const { data: inserted } = await supabase
      .from('audit_new_tools')
      .select('*')
      .eq('audit_run_id', run.id)
      .order('created_at')

    return NextResponse.json({ runId: run.id, newTools: inserted ?? [], skipped })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await supabase
      .from('audit_runs')
      .update({ discover_status: 'failed', error: msg })
      .eq('id', run.id)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
