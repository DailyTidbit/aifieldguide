import { createServiceRoleClient } from '../../lib/supabaseServer'
import ReviewClient from './ReviewClient'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminReviewPage() {
  const supabase = createServiceRoleClient()

  const { data: items, error } = await supabase
    .from('ai_tools_pending')
    .select('*')
    .eq('approved', false)
    .order('tool_name')
    .order('created_at')

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">Failed to load pending changes: {error.message}</p>
      </div>
    )
  }

  const count = items?.length ?? 0

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-serif text-gray-900">Tool Review Queue</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {count === 0 ? 'No pending changes' : `${count} pending change${count !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Link
            href="/field-guide"
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            ← Field Guide
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <ReviewClient initialItems={items ?? []} />
      </main>
    </div>
  )
}
