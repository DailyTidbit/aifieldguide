import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../lib/supabaseServer'
import { auditExistingTools } from '../../../../lib/audit-perplexity'

export const maxDuration = 300

export async function POST() {
  const supabase = createAdminClient()

  // Fetch all public tools
  const { data: tools, error: fetchErr } = await supabase
    .from('ai_tools')
    .select('id, name, website, category')
    .eq('is_public', true)
    .order('name')
    .limit(5000)

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }

  if (!tools?.length) {
    return NextResponse.json({ error: 'No tools found' }, { status: 404 })
  }

  // Create a run record
  const { data: run, error: runErr } = await supabase
    .from('audit_runs')
    .insert({ discover_status: 'pending', tools_status: 'running', categories_status: 'pending' })
    .select('id')
    .single()

  if (runErr || !run) {
    return NextResponse.json({ error: 'Failed to create audit run' }, { status: 500 })
  }

  try {
    const results = await auditExistingTools(
      tools.map(t => ({ name: t.name, website: t.website ?? null, category: t.category }))
    )

    // Match results back to tool IDs by name
    const nameToId = new Map(tools.map(t => [t.name.toLowerCase(), t.id]))
    const nameToWebsite = new Map(tools.map(t => [t.name.toLowerCase(), t.website ?? null]))

    const rows = results.map(r => ({
      audit_run_id: run.id,
      tool_id: nameToId.get(r.tool_name.toLowerCase()) ?? null,
      tool_name: r.tool_name,
      current_website: nameToWebsite.get(r.tool_name.toLowerCase()) ?? null,
      flag: r.flag,
      reason: r.reason ?? null,
      suggested_changes: r.suggested_changes ?? null,
      status: 'pending',
    })).filter(r => r.tool_id !== null)

    if (rows.length > 0) {
      await supabase.from('audit_tool_flags').insert(rows)
    }

    await supabase
      .from('audit_runs')
      .update({ tools_status: 'completed', status: 'partial' })
      .eq('id', run.id)

    const { data: inserted } = await supabase
      .from('audit_tool_flags')
      .select('*')
      .eq('audit_run_id', run.id)
      .order('flag')
      .order('tool_name')

    return NextResponse.json({ runId: run.id, flags: inserted ?? [] })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await supabase
      .from('audit_runs')
      .update({ tools_status: 'failed', error: msg })
      .eq('id', run.id)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
