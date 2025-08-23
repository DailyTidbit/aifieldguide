'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabaseClient } from '@/app/lib/supabaseClient'

type Item = { date: string; status: 'open'|'held'|'booked'|'blocked'; priceCents: number }

export default function SponsorAdsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      // require sign-in
      const { data: { user } } = await supabaseClient.auth.getUser()
      if (!user) { window.location.href = '/auth'; return }

      // load availability
      const start = new Date()
      const end = new Date(); end.setMonth(end.getMonth() + 1)
      const qs = new URLSearchParams({
        start: start.toISOString().slice(0,10),
        end: end.toISOString().slice(0,10)
      }).toString()
      const res = await fetch(`/api/sponsor/availability?${qs}`)
      const d = await res.json()
      setItems(d.items ?? [])
      setLoading(false)
    })()
  }, [])

  const days = useMemo(() => {
    const start = new Date()
    const end = new Date(); end.setMonth(end.getMonth() + 1)
    const arr: string[] = []
    const d = new Date(start)
    while (d <= end) { arr.push(d.toISOString().slice(0,10)); d.setDate(d.getDate()+1) }
    return arr
  }, [])

  // ⬇️ UPDATED: no company_id sent
  async function onSelect(date: string) {
    const res = await fetch('/api/sponsor/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date })
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else alert(data.error || 'Unable to start checkout')
  }

  if (loading) return <div className="p-8">Loading…</div>

  const byDate = new Map(items.map(i => [i.date, i]))
  return (
    <main className="mx-auto max-w-5xl px-6 py-12 space-y-4">
      <h1 className="text-2xl font-semibold">Sponsor a Daily Tidbit</h1>
      <p className="text-neutral-600 text-sm">Intro month special — $1. One sponsor per day. 1 per company this month.</p>
      <div className="grid grid-cols-7 gap-2">
        {days.map(date => {
          const it = byDate.get(date)
          const disabled = !it || it.status !== 'open'
          return (
            <button
              key={date}
              disabled={disabled}
              onClick={() => onSelect(date)}
              className={`p-3 rounded-2xl border text-sm ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:shadow'}`}
            >
              <div className="font-medium">{date.slice(5)}</div>
              <div className="text-xs">
                {it ? (it.status === 'open' ? `$${(it.priceCents/100).toFixed(2)}` : it.status) : '—'}
              </div>
            </button>
          )
        })}
      </div>
      <p className="text-xs text-neutral-500">Times shown in Eastern (US). 10-minute hold during checkout.</p>
    </main>
  )
}
