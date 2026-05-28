import { createAdminClient } from '../../lib/supabaseServer'
import AuditClient from './AuditClient'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminAuditPage() {
  const supabase = createAdminClient()

  // Latest run
  const { data: latestRun } = await supabase
    .from('audit_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // All pending new tools (most recent first)
  const { data: newTools } = await supabase
    .from('audit_new_tools')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(100)

  // All pending tool flags
  const { data: toolFlags } = await supabase
    .from('audit_tool_flags')
    .select('*')
    .eq('status', 'pending')
    .order('flag')
    .order('tool_name')
    .limit(500)

  // All pending category suggestions
  const { data: categorySuggestions } = await supabase
    .from('audit_category_suggestions')
    .select('*')
    .eq('status', 'pending')
    .order('suggestion_type')
    .limit(50)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-serif text-gray-900">AI Tools Audit</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {latestRun
                ? `Last run ${new Date(latestRun.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                : 'No audit run yet'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin/review" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
              Tool Queue
            </Link>
            <Link href="/admin/review-sections" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
              Section Queue
            </Link>
            <Link href="/field-guide" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
              ← Field Guide
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <AuditClient
          initialNewTools={newTools ?? []}
          initialToolFlags={toolFlags ?? []}
          initialCategorySuggestions={categorySuggestions ?? []}
          lastRunAt={latestRun?.created_at ?? null}
        />
      </main>
    </div>
  )
}
