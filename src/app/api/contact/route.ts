import { NextResponse } from 'next/server'
import { createAdminClient } from '../../lib/supabaseServer'

const MAX_NAME = 100
const MAX_EMAIL = 200
const MAX_MESSAGE = 2000
const RATE_LIMIT = 3          // max submissions per IP
const RATE_WINDOW_MS = 60 * 60 * 1000  // 1 hour
const MIN_ELAPSED_MS = 3_000  // form must be open at least 3 seconds
const MAX_ELAPSED_MS = 24 * 60 * 60 * 1000 // reject stale 24h+ old tokens

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIP = request.headers.get('x-real-ip')
  if (realIP) return realIP.trim()
  return 'unknown'
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // ── 1. Honeypot check ─────────────────────────────────────────────────────
  // If the hidden "website" field is filled, it's almost certainly a bot.
  // Return 200 silently so bots don't know they were filtered.
  if (body.website) {
    return NextResponse.json({ ok: true })
  }

  // ── 2. Timing check ───────────────────────────────────────────────────────
  // formLoadedAt must be a plausible Unix ms timestamp (after year 2020).
  // A value of 0 or a non-number means the submission bypassed the browser form.
  const formLoadedAt = Number(body.form_loaded_at)
  const YEAR_2020_MS = 1577836800000
  if (isNaN(formLoadedAt) || formLoadedAt < YEAR_2020_MS) {
    return NextResponse.json({ error: 'Invalid submission.' }, { status: 400 })
  }
  const elapsed = Date.now() - formLoadedAt
  if (elapsed < MIN_ELAPSED_MS || elapsed > MAX_ELAPSED_MS) {
    return NextResponse.json({ error: 'Invalid submission.' }, { status: 400 })
  }

  // ── 3. Input validation ───────────────────────────────────────────────────
  const name = (typeof body.name === 'string' ? body.name : '').trim()
  const email = (typeof body.email === 'string' ? body.email : '').trim()
  const message = (typeof body.message === 'string' ? body.message : '').trim()

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 })
  }
  if (name.length > MAX_NAME) {
    return NextResponse.json({ error: 'Name must be 100 characters or fewer.' }, { status: 400 })
  }
  if (email.length > MAX_EMAIL || !isValidEmail(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }
  if (message.length > MAX_MESSAGE) {
    return NextResponse.json({ error: 'Message must be 2000 characters or fewer.' }, { status: 400 })
  }

  // ── 4. Rate limiting ──────────────────────────────────────────────────────
  const ip = getClientIP(request)
  const supabase = createAdminClient()

  if (ip !== 'unknown') {
    const windowStart = new Date(Date.now() - RATE_WINDOW_MS).toISOString()
    const { count, error: countErr } = await supabase
      .from('contact_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .gte('created_at', windowStart)

    if (!countErr && count !== null && count >= RATE_LIMIT) {
      return NextResponse.json(
        { error: 'Too many messages sent. Please wait a while before trying again.' },
        { status: 429 }
      )
    }
  }

  // ── 5. Insert ─────────────────────────────────────────────────────────────
  const { error } = await supabase
    .from('contact_submissions')
    .insert({ name, email, message, ip_address: ip })

  if (error) {
    console.error('Contact submission error:', error.message)
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
