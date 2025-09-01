// src/app/api/listing-changes/list/route.ts - Updated with cookie auth for admin access
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/app/lib/supabaseServer'
import { supabaseAdmin } from '@/app/lib/supabaseAdmin'

export async function GET() {
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

    // Fetch pending listing changes
    const { data, error } = await supabaseAdmin
      .from('listing_changes')
      .select('id, created_at, proposed, company:companies(name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Listing changes fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ items: data })

  } catch (error) {
    console.error('Listing changes list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}