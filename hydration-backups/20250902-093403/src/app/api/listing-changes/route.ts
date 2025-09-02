import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { supabaseAdmin } from '../../lib/supabaseAdmin' // <- relative to /api/listing-changes/route.ts

type Proposed = Partial<{
  display_name: string
  website_url: string
  logo_url: string
  model_name: string
  pricing: string | any
  login_requirements: string
  summary: string
  use_cases: string
  features: any
  screenshots: any
}>

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const proposed: Proposed = body?.proposed
    if (!proposed || typeof proposed !== 'object') {
      return NextResponse.json({ error: 'proposed object required' }, { status: 400 })
    }

    // identify user from session (Next 15+ cookie shape)
    const jar = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return jar.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) { jar.set({ name, value, ...options }) },
          remove(name: string, options: CookieOptions) { jar.set({ name, value: '', ...options }) },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    // find company_id for this user
    const { data: cu, error: cuErr } = await supabaseAdmin
      .from('company_users')
      .select('company_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (cuErr || !cu?.company_id) return NextResponse.json({ error: 'no company attached' }, { status: 403 })
    const company_id = cu.company_id as string

    // find or create a tool_listings row for this company
    let listingId: string | null = null
    {
      const { data: existing } = await supabaseAdmin
        .from('tool_listings')
        .select('id')
        .eq('company_id', company_id)
        .limit(1)
        .maybeSingle()
      if (existing?.id) {
        listingId = existing.id
      } else {
        const { data: created, error: createErr } = await supabaseAdmin
          .from('tool_listings')
          .insert({
            company_id,
            display_name: proposed.display_name ?? null,
            website_url: proposed.website_url ?? null,
            logo_url: proposed.logo_url ?? null,
            model_name: proposed.model_name ?? null,
            summary: proposed.summary ?? null,
            use_cases: proposed.use_cases ?? null,
            pricing: proposed.pricing ?? null,
            login_requirements: proposed.login_requirements ?? null,
            is_published: false,
          })
          .select('id').single()
        if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 })
        listingId = created!.id
      }
    }

    // insert listing_changes (moderation queue)
    const { data: change, error: insErr } = await supabaseAdmin
      .from('listing_changes')
      .insert({
        listing_id: listingId,
        company_id,
        proposed,
        status: 'pending',
        created_by: user.id,
        notes: null,
      })
      .select('id, status, created_at')
      .single()

    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
    return NextResponse.json({ ok: true, change })
  } catch (e: any) {
    console.error('[listing-changes POST]', e)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
