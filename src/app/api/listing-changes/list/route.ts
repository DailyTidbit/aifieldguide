import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('listing_changes')
    .select('id, created_at, proposed, company:companies(name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data })
}
