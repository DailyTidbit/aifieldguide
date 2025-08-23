import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const token = process.env.ADMIN_API_TOKEN
  const hdr = process.env.NODE_ENV === 'development' ? 'super-secret' : token
  // in dev you can hardcode for quick testing (or read from header)
  // const header = req.headers.get('x-admin-token')

  const id = params.id
  // fetch change
  const { data: change, error } = await supabaseAdmin
    .from('listing_changes')
    .select('id, listing_id, company_id, proposed')
    .eq('id', id).maybeSingle()
  if (error || !change) return NextResponse.json({ error: 'change not found' }, { status: 404 })

  // apply proposed to tool_listings
  const { error: updErr } = await supabaseAdmin
    .from('tool_listings')
    .update({ ...change.proposed, is_published: true })
    .eq('id', change.listing_id)
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

  // mark approved
  const { error: stErr } = await supabaseAdmin
    .from('listing_changes')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', id)
  if (stErr) return NextResponse.json({ error: stErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
