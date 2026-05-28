import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../lib/supabaseServer'

export async function POST(request: Request) {
  const { id, action } = await request.json()
  if (!id || !['add', 'dismiss'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: item, error: fetchErr } = await supabase
    .from('audit_new_tools')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (action === 'dismiss') {
    await supabase.from('audit_new_tools').update({ status: 'dismissed' }).eq('id', id)
    return NextResponse.json({ ok: true })
  }

  // action === 'add': insert into ai_tools
  const { data: newTool, error: insertErr } = await supabase
    .from('ai_tools')
    .insert({
      name: item.tool_name,
      description: item.description ?? `${item.tool_name} — AI tool`,
      category: item.suggested_category ?? 'AI Assistants',
      website: item.website ?? null,
      is_public: true,
      free_tier: false,
      login_required: false,
      paid_tier: false,
    })
    .select('id')
    .single()

  if (insertErr || !newTool) {
    return NextResponse.json({ error: insertErr?.message ?? 'Insert failed' }, { status: 500 })
  }

  await supabase
    .from('audit_new_tools')
    .update({ status: 'added', added_tool_id: newTool.id })
    .eq('id', id)

  return NextResponse.json({ ok: true, toolId: newTool.id })
}
