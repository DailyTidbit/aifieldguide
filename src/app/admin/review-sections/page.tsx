import { createAdminClient } from '../../lib/supabaseServer'
import ReviewSectionsClient from './ReviewSectionsClient'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminReviewSectionsPage() {
  const supabase = createAdminClient()

  const { data: items, error } = await supabase
    .from('field_guide_sections_pending')
    .select('*')
    .eq('approved', false)
    .order('section_name')
    .order('created_at')
    .limit(5000)

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
            <h1 className="text-xl font-bold font-serif text-gray-900">Section Review Queue</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {count === 0 ? 'No pending changes' : `${count} pending change${count !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/audit"
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              Audit
            </Link>
            <Link
              href="/admin/review"
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              Tool Queue
            </Link>
            <Link
              href="/field-guide"
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              ← Field Guide
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <ReviewSectionsClient initialItems={items ?? []} />
      </main>
    </div>
  )
}
