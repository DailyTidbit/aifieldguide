import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/app/lib/supabaseAdmin'

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')!
  const buf = Buffer.from(await req.arrayBuffer())
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  let event: Stripe.Event
  try { event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!) }
  catch (e:any) { return NextResponse.json({ error: `Webhook Error: ${e.message}` }, { status: 400 }) }

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object as Stripe.Checkout.Session
    const slot_id = s.metadata?.slot_id!, company_id = s.metadata?.company_id!
    await supabaseAdmin.from('sponsor_orders')
      .update({ status: 'paid', stripe_payment_intent: s.payment_intent?.toString() ?? null })
      .eq('stripe_session_id', s.id)
    await supabaseAdmin.from('sponsor_slots')
      .update({ status: 'booked', sponsor_company_id: company_id, held_until: null })
      .eq('id', slot_id)
  }

  if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
    const s = event.data.object as Stripe.Checkout.Session
    const slot_id = s.metadata?.slot_id!
    await supabaseAdmin.from('sponsor_orders').update({ status: 'failed' }).eq('stripe_session_id', s.id)
    await supabaseAdmin.from('sponsor_slots').update({ status: 'open', held_until: null }).eq('id', slot_id)
  }
  return NextResponse.json({ received: true })
}
