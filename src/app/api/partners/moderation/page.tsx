'use client'
import { useEffect, useState } from 'react'

type Change = {
  id: string
  created_at: string
  company: { name: string } | null
  proposed: Record<string, any>
}

export default function ModerationPage() {
  const [items, setItems] = useState<Change[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/admin/listing-changes/list')
      const data = await res.json()
      setItems(data.items || [])
      setLoading(false)
    })()
  }, [])

  async function approve(id: string) {
    await fetch(`/api/admin/listing-changes/${id}/approve`, { method: 'POST' })
    setItems(prev => prev.filter(x => x.id !== id))
  }
  async function reject(id: string) {
    await fetch(`/api/admin/listing-changes/${id}/reject`, { method: 'POST', body: JSON.stringify({}) })
    setItems(prev => prev.filter(x => x.id !== id))
  }

  if (loading) return <div className="p-6">Loading…</div>

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Pending listing changes</h1>
      {items.length === 0 ? <div>No pending items.</div> : items.map(ch => (
        <div key={ch.id} className="rounded-xl border p-4">
          <div className="text-sm mb-2">
            <b>{ch.company?.name ?? 'Unknown company'}</b> • {new Date(ch.created_at).toLocaleString()}
          </div>
          <pre className="text-xs overflow-auto bg-neutral-50 p-3 rounded">{JSON.stringify(ch.proposed, null, 2)}</pre>
          <div className="mt-3 flex gap-2">
            <button onClick={() => approve(ch.id)} className="border rounded px-3 py-1 text-sm">Approve</button>
            <button onClick={() => reject(ch.id)} className="border rounded px-3 py-1 text-sm">Reject</button>
          </div>
        </div>
      ))}
    </main>
  )
}
