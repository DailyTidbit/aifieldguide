// src/app/api/listing-changes/[id]/approve/route.ts - Updated with cookie auth
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/app/lib/supabaseServer'
import { supabaseAdmin } from '@/app/lib/supabaseAdmin'

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    // Check admin auth using cookies
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const id = params.id
    
    // Fetch the listing change
    const { data: change, error } = await supabaseAdmin
      .from('listing_changes')
      .select('id, listing_id, company_id, proposed')
      .eq('id', id)
      .maybeSingle()

    if (error || !change) {
      return NextResponse.json({ error: 'Change not found' }, { status: 404 })
    }

    // Apply proposed changes to tool_listings
    const { error: updateError } = await supabaseAdmin
      .from('tool_listings')
      .update({ ...change.proposed, is_published: true })
      .eq('id', change.listing_id)

    if (updateError) {
      console.error('Tool listing update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Mark listing change as approved
    const { error: statusError } = await supabaseAdmin
      .from('listing_changes')
      .update({ 
        status: 'approved', 
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id // Track who approved it
      })
      .eq('id', id)

    if (statusError) {
      console.error('Status update error:', statusError)
      return NextResponse.json({ error: statusError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('Listing approval error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}