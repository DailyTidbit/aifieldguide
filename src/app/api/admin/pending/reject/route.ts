import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '../../../../lib/supabaseServer'

export async function POST(request: Request) {
  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = createServiceRoleClient()
  const { error } = await supabase.from('ai_tools_pending').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
