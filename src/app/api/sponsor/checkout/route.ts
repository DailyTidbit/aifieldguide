import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!) // let account API version apply
const HOLD_MINUTES = 10

type Body = { date?: string } // expects 'YYYY-MM-DD'
const isoDateOnly = (d: Date) => d.toISOString().slice(0, 10)

export async function POST(req: Request) {
  try {
    const { date } = (await req.json()) as Body
    if (!date) return NextResponse.json({ error: 'date (YYYY-MM-DD) required' }, { status: 400 })
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'invalid date format (expected YYYY-MM-DD)' }, { status: 400 })
    }
    if (date < isoDateOnly(new Date())) {
      return NextResponse.json({ error: 'date is in the past' }, { status: 400 })
    }

    // --- derive user + company_id from the current session (cookies are async in your Next version)
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
          set: (name: string, value: string, options: any) => {
            cookieStore.set(name, value, options as any)
          },
          remove: (name: string, options: any) => {
            cookieStore.set(name, '', { ...(options || {}), maxAge: 0 })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const { data: membership, error: cuErr } = await supabaseAdmin
      .from('company_users')
      .select('company_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (cuErr || !membership?.company_id) {
      return NextResponse.json({ error: 'no company attached to this user' }, { status: 403 })
    }
    const company_id = membership.company_id as string

    // --- fetch slot & guards
    const { data: slot, error: slotErr } = await supabaseAdmin
      .from('sponsor_slots')
      .select('*')
      .eq('slot_date', date)
      .maybeSingle()

    if (slotErr || !slot) return NextResponse.json({ error: 'no slot for that date' }, { status: 404 })
    if (slot.status === 'booked') return NextResponse.json({ error: 'already booked' }, { status: 409 })

    const now = new Date()
    const holdExpired = !slot.held_until || new Date(slot.held_until) < now
    if (slot.status === 'held' && !holdExpired) {
      return NextResponse.json({ error: 'temporarily held' }, { status: 409 })
    }

    // --- 1 per company in rolling 30 days
    const introStart = new Date()
    const introEnd = new Date(); introEnd.setDate(introEnd.getDate() + 30)

    const { count: bookedCount } = await supabaseAdmin
      .from('sponsor_slots')
      .select('*', { count: 'exact', head: true })
      .gte('slot_date', isoDateOnly(introStart))
      .lte('slot_date', isoDateOnly(introEnd))
      .eq('sponsor_company_id', company_id)
      .eq('status', 'booked')

    if ((bookedCount ?? 0) >= 1) {
      return NextResponse.json({ error: 'limit reached: one sponsored day per company this month' }, { status: 403 })
    }

    // optional: block if another pending order exists
    const { count: pendingCount } = await supabaseAdmin
      .from('sponsor_orders')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company_id)
      .eq('status', 'pending')

    if ((pendingCount ?? 0) >= 1) {
      return NextResponse.json({ error: 'you already have a pending sponsorship' }, { status: 403 })
    }

    // --- place a 10-min hold
    const heldUntil = new Date(now.getTime() + HOLD_MINUTES * 60_000).toISOString()
    const { error: updErr } = await supabaseAdmin
      .from('sponsor_slots')
      .update({ status: 'held', held_until: heldUntil, sponsor_company_id: company_id })
      .eq('id', slot.id)
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

    // --- create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Daily Tidbit Sponsorship • ${date}` },
          unit_amount: slot.price_cents,
        },
        quantity: 1
      }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/partners/ads?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/partners/ads?canceled=1`,
      metadata: { slot_id: slot.id, slot_date: date, company_id },
    })

    // --- record pending order
    const { error: insErr } = await supabaseAdmin.from('sponsor_orders').insert({
      slot_id: slot.id,
      company_id,
      stripe_session_id: session.id,
      amount_cents: slot.price_cents,
      status: 'pending',
    })
    if (insErr) {
      // best-effort release
      await supabaseAdmin.from('sponsor_slots')
        .update({ status: 'open', held_until: null, sponsor_company_id: null })
        .eq('id', slot.id)
      return NextResponse.json({ error: insErr.message }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[sponsor/checkout] error', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
