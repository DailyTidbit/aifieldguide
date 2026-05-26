'use client'

import { useState } from 'react'

interface PendingItem {
  id: string
  section_id: string
  section_name: string
  field_name: string
  old_value: string | null
  new_value: string | null
  created_at: string
}

const FIELD_LABELS: Record<string, string> = {
  title: 'Title',
  intro: 'Intro',
  summary: 'Summary',
  use_cases: 'Use Cases',
  how_they_work: 'How They Work',
  what_you_can_do: 'What You Can Do',
  better_results: 'Better Results',
  strengths: 'Strengths',
  limitations: 'Limitations',
  pro_tips: 'Pro Tips',
}

function ValueBox({ value, tone }: { value: string | null; tone: 'old' | 'new' }) {
  const bg = tone === 'old' ? '#fff5f5' : '#f0faf4'
  const border = tone === 'old' ? '#fecaca' : '#a7f3c0'
  const label = tone === 'old' ? 'Current' : 'Updated'
  const labelColor = tone === 'old' ? '#ef4444' : '#16a34a'

  return (
    <div className="flex-1 min-w-0 rounded-xl p-4" style={{ backgroundColor: bg, border: `1px solid ${border}` }}>
      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: labelColor }}>
        {label}
      </p>
      <p className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
        {value ?? <span className="italic text-gray-400">empty</span>}
      </p>
    </div>
  )
}

export default function ReviewSectionsClient({ initialItems }: { initialItems: PendingItem[] }) {
  const [items, setItems] = useState(initialItems)
  const [loading, setLoading] = useState<string | null>(null)
  const [approvingAll, setApprovingAll] = useState(false)

  async function handleAction(id: string, action: 'approve' | 'reject') {
    setLoading(id)
    try {
      await fetch(`/api/admin/pending-sections/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setItems(prev => prev.filter(item => item.id !== id))
    } finally {
      setLoading(null)
    }
  }

  async function handleApproveAll() {
    setApprovingAll(true)
    try {
      for (const item of items) {
        await fetch('/api/admin/pending-sections/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item.id }),
        })
        setItems(prev => prev.filter(i => i.id !== item.id))
      }
    } finally {
      setApprovingAll(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-5xl mb-4">✓</p>
        <h2 className="text-xl font-semibold text-gray-700">All caught up</h2>
        <p className="text-gray-400 mt-1">No pending section changes to review.</p>
      </div>
    )
  }

  const grouped = items.reduce<Record<string, PendingItem[]>>((acc, item) => {
    if (!acc[item.section_name]) acc[item.section_name] = []
    acc[item.section_name].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <p className="text-sm text-gray-500">
          {items.length} pending change{items.length !== 1 ? 's' : ''} across {Object.keys(grouped).length} section{Object.keys(grouped).length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={handleApproveAll}
          disabled={approvingAll}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#60A875' }}
        >
          {approvingAll ? 'Approving…' : `Approve All (${items.length})`}
        </button>
      </div>

      {Object.entries(grouped).map(([sectionName, sectionItems]) => (
        <div key={sectionName}>
          <h2 className="text-lg font-bold text-gray-900 font-serif mb-4 border-b border-gray-100 pb-2">
            {sectionName}
            <span className="ml-2 text-sm font-normal text-gray-400">
              {sectionItems.length} change{sectionItems.length !== 1 ? 's' : ''}
            </span>
          </h2>
          <div className="space-y-4">
            {sectionItems.map(item => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    {FIELD_LABELS[item.field_name] ?? item.field_name}
                  </span>
                  <span className="text-xs text-gray-300">{item.created_at.slice(0, 10)}</span>
                </div>
                <div className="flex gap-3 mb-4 flex-col sm:flex-row">
                  <ValueBox value={item.old_value} tone="old" />
                  <ValueBox value={item.new_value} tone="new" />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => handleAction(item.id, 'reject')}
                    disabled={loading === item.id}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleAction(item.id, 'approve')}
                    disabled={loading === item.id}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: '#60A875' }}
                  >
                    {loading === item.id ? 'Applying…' : 'Approve'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
