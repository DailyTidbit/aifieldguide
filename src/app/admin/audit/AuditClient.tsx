'use client'

import { useState, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuditNewTool {
  id: string
  created_at: string
  tool_name: string
  website: string | null
  description: string | null
  suggested_category: string | null
  reason: string | null
  source_urls: string[]
  funding_info: string | null
  status: string
}

interface AuditToolFlag {
  id: string
  created_at: string
  tool_id: string
  tool_name: string
  current_website: string | null
  flag: 'keep' | 'update' | 'remove'
  reason: string | null
  suggested_changes: Record<string, string> | null
  status: string
}

interface AuditCategorySuggestion {
  id: string
  created_at: string
  suggestion_type: 'merge' | 'split' | 'new' | 'rename'
  current_categories: string[]
  suggested_category: string | null
  reasoning: string | null
  affected_tools: string[]
  status: string
}

interface Props {
  initialNewTools: AuditNewTool[]
  initialToolFlags: AuditToolFlag[]
  initialCategorySuggestions: AuditCategorySuggestion[]
  lastRunAt: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const FLAG_STYLES = {
  keep:   { bg: 'bg-green-100',  text: 'text-green-800',  label: 'Keep'   },
  update: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Update' },
  remove: { bg: 'bg-red-100',    text: 'text-red-800',    label: 'Remove' },
}

const TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  merge:  { bg: 'bg-blue-100',   text: 'text-blue-800',   label: 'Merge'  },
  split:  { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Split'  },
  new:    { bg: 'bg-green-100',  text: 'text-green-800',  label: 'New'    },
  rename: { bg: 'bg-gray-100',   text: 'text-gray-800',   label: 'Rename' },
}

function Pill({ bg, text, label }: { bg: string; text: string; label: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${bg} ${text}`}>
      {label}
    </span>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="text-center py-16 text-gray-400">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-sm">{text}</p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AuditClient({ initialNewTools, initialToolFlags, initialCategorySuggestions, lastRunAt }: Props) {
  const [activeTab, setActiveTab] = useState<'new-tools' | 'tool-audit' | 'categories'>('new-tools')
  const [newTools, setNewTools] = useState(initialNewTools)
  const [toolFlags, setToolFlags] = useState(initialToolFlags)
  const [categorySuggestions, setCategorySuggestions] = useState(initialCategorySuggestions)
  const [lastRun, setLastRun] = useState(lastRunAt)
  const [flagFilter, setFlagFilter] = useState<'all' | 'keep' | 'update' | 'remove'>('all')

  const [running, setRunning] = useState({ discover: false, tools: false, categories: false })
  const [runError, setRunError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [bulkLoading, setBulkLoading] = useState<'dismiss' | 'update' | null>(null)

  // ── Run handlers ────────────────────────────────────────────────────────────

  const runDiscover = useCallback(async () => {
    setRunning(r => ({ ...r, discover: true }))
    setRunError(null)
    try {
      const res = await fetch('/api/admin/audit/discover', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Discover failed')
      setNewTools(prev => [...(data.newTools ?? []), ...prev])
      setLastRun(new Date().toISOString())
    } catch (e) {
      setRunError(e instanceof Error ? e.message : String(e))
    } finally {
      setRunning(r => ({ ...r, discover: false }))
    }
  }, [])

  const runToolAudit = useCallback(async () => {
    setRunning(r => ({ ...r, tools: true }))
    setRunError(null)
    try {
      const res = await fetch('/api/admin/audit/audit-tools', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Tool audit failed')
      setToolFlags(prev => [...(data.flags ?? []), ...prev])
      setLastRun(new Date().toISOString())
    } catch (e) {
      setRunError(e instanceof Error ? e.message : String(e))
    } finally {
      setRunning(r => ({ ...r, tools: false }))
    }
  }, [])

  const runCategories = useCallback(async () => {
    setRunning(r => ({ ...r, categories: true }))
    setRunError(null)
    try {
      const res = await fetch('/api/admin/audit/categories', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Category audit failed')
      setCategorySuggestions(prev => [...(data.suggestions ?? []), ...prev])
      setLastRun(new Date().toISOString())
    } catch (e) {
      setRunError(e instanceof Error ? e.message : String(e))
    } finally {
      setRunning(r => ({ ...r, categories: false }))
    }
  }, [])

  const runAll = useCallback(async () => {
    setRunError(null)
    await runDiscover()
    await runToolAudit()
    await runCategories()
  }, [runDiscover, runToolAudit, runCategories])

  const anyRunning = running.discover || running.tools || running.categories

  // ── Action handlers ─────────────────────────────────────────────────────────

  async function newToolAction(id: string, action: 'add' | 'dismiss') {
    setActionLoading(id)
    try {
      const res = await fetch('/api/admin/audit/new-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Action failed')
      }
      setNewTools(prev => prev.map(t => t.id === id ? { ...t, status: action === 'add' ? 'added' : 'dismissed' } : t))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  async function flagAction(id: string, action: 'dismiss' | 'keep' | 'apply_update' | 'remove_tool') {
    setActionLoading(id)
    try {
      const res = await fetch('/api/admin/audit/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Action failed')
      }
      setToolFlags(prev => prev.map(f => f.id === id
        ? { ...f, status: action === 'remove_tool' || action === 'apply_update' ? 'actioned' : 'dismissed' }
        : f))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  async function bulkDismissFlags() {
    const ids = pendingFlags.map(f => f.id)
    if (!ids.length) return
    setBulkLoading('dismiss')
    try {
      const res = await fetch('/api/admin/audit/flag-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'dismiss_all' }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setToolFlags(prev => prev.map(f => ids.includes(f.id) ? { ...f, status: 'dismissed' } : f))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Bulk dismiss failed')
    } finally {
      setBulkLoading(null)
    }
  }

  async function bulkApplyUpdates() {
    const ids = pendingFlags.filter(f => f.flag === 'update').map(f => f.id)
    if (!ids.length) return
    setBulkLoading('update')
    try {
      const res = await fetch('/api/admin/audit/flag-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'apply_all_updates' }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setToolFlags(prev => prev.map(f => ids.includes(f.id) ? { ...f, status: 'actioned' } : f))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Bulk update failed')
    } finally {
      setBulkLoading(null)
    }
  }

  async function dismissSuggestion(id: string) {
    setActionLoading(id)
    try {
      await fetch('/api/admin/audit/suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setCategorySuggestions(prev => prev.map(s => s.id === id ? { ...s, status: 'dismissed' } : s))
    } finally {
      setActionLoading(null)
    }
  }

  // ── Derived counts ──────────────────────────────────────────────────────────

  const pendingNewTools = newTools.filter(t => t.status === 'pending')
  const pendingFlags = toolFlags.filter(f => f.status === 'pending')
  const pendingSuggestions = categorySuggestions.filter(s => s.status === 'pending')
  const filteredFlags = flagFilter === 'all' ? pendingFlags : pendingFlags.filter(f => f.flag === flagFilter)

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Run controls */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={runAll}
            disabled={anyRunning}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            style={{ backgroundColor: '#60A875' }}
          >
            {anyRunning ? <Spinner /> : <span>▶</span>}
            Run Full Audit
          </button>
          <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
            <RunStepBadge label="New Tools" running={running.discover} />
            <RunStepBadge label="Tool Audit" running={running.tools} />
            <RunStepBadge label="Categories" running={running.categories} />
          </div>
        </div>
        {lastRun && (
          <p className="text-xs text-gray-400">
            Last run: {new Date(lastRun).toLocaleString()}
          </p>
        )}
      </div>

      {runError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-6">
          {runError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {([
          { id: 'new-tools',  label: 'New Tools',          count: pendingNewTools.length },
          { id: 'tool-audit', label: 'Tool Audit',         count: pendingFlags.length },
          { id: 'categories', label: 'Category Suggestions', count: pendingSuggestions.length },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="bg-gray-200 text-gray-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: New Tools ── */}
      {activeTab === 'new-tools' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{pendingNewTools.length} suggested tool{pendingNewTools.length !== 1 ? 's' : ''} pending review</p>
            <button
              onClick={runDiscover}
              disabled={running.discover}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              {running.discover ? <Spinner /> : '🔍'} Scan for New Tools
            </button>
          </div>

          {running.discover && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700 mb-4 flex items-center gap-2">
              <Spinner /> Searching Product Hunt, TechCrunch, HN, and other sources… this takes about 30 seconds.
            </div>
          )}

          {pendingNewTools.length === 0 && !running.discover ? (
            <EmptyState icon="🔍" text="No new tools suggested yet. Run a scan to discover new tools." />
          ) : (
            <div className="space-y-4">
              {pendingNewTools.map(tool => (
                <div key={tool.id} className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <h3 className="font-bold text-gray-900 font-serif text-lg">{tool.tool_name}</h3>
                        {tool.suggested_category && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                            {tool.suggested_category}
                          </span>
                        )}
                      </div>
                      {tool.website && (
                        <a href={tool.website} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline break-all">
                          {tool.website}
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => newToolAction(tool.id, 'dismiss')}
                        disabled={actionLoading === tool.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => newToolAction(tool.id, 'add')}
                        disabled={actionLoading === tool.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                        style={{ backgroundColor: '#60A875' }}
                      >
                        {actionLoading === tool.id ? <Spinner /> : null}
                        Add to Database
                      </button>
                    </div>
                  </div>

                  {tool.description && (
                    <p className="text-sm text-gray-700 mt-3 leading-relaxed">{tool.description}</p>
                  )}

                  <div className="mt-4 grid sm:grid-cols-2 gap-3">
                    {tool.reason && (
                      <InfoBox label="Why Suggested" value={tool.reason} />
                    )}
                    {tool.funding_info && tool.funding_info !== 'Unknown' && (
                      <InfoBox label="Funding / Founder" value={tool.funding_info} />
                    )}
                  </div>

                  {tool.source_urls?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Sources</p>
                      <div className="flex flex-wrap gap-2">
                        {tool.source_urls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-0.5 rounded">
                            Source {i + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Tool Audit ── */}
      {activeTab === 'tool-audit' && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-500">{pendingFlags.length} tool{pendingFlags.length !== 1 ? 's' : ''} flagged</p>
              {/* Filter pills */}
              <div className="flex gap-1 ml-2">
                {(['all', 'remove', 'update', 'keep'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFlagFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      flagFilter === f ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f === 'all' ? 'All' : FLAG_STYLES[f].label}
                    {f !== 'all' && (
                      <span className="ml-1 opacity-70">
                        ({pendingFlags.filter(fl => fl.flag === f).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={runToolAudit}
              disabled={running.tools}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              {running.tools ? <Spinner /> : '🔎'} Run Tool Audit
            </button>
          </div>

          {running.tools && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700 mb-4 flex items-center gap-2">
              <Spinner /> Auditing all tools in batches via Perplexity… this may take 1–2 minutes.
            </div>
          )}

          {pendingFlags.length > 0 && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <button
                onClick={bulkDismissFlags}
                disabled={bulkLoading !== null || pendingFlags.length === 0}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
              >
                {bulkLoading === 'dismiss' ? <Spinner /> : null}
                Dismiss All ({pendingFlags.length})
              </button>
              {pendingFlags.filter(f => f.flag === 'update').length > 0 && (
                <button
                  onClick={bulkApplyUpdates}
                  disabled={bulkLoading !== null}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50 flex items-center gap-2"
                >
                  {bulkLoading === 'update' ? <Spinner /> : null}
                  Apply Update All ({pendingFlags.filter(f => f.flag === 'update').length})
                </button>
              )}
            </div>
          )}

          {filteredFlags.length === 0 && !running.tools ? (
            <EmptyState icon="🔎" text="No tool flags pending. Run a tool audit to check all existing tools." />
          ) : (
            <div className="space-y-3">
              {filteredFlags.map(flag => {
                const style = FLAG_STYLES[flag.flag] ?? FLAG_STYLES.keep
                return (
                  <div key={flag.id} className={`bg-white rounded-2xl border p-5 ${
                    flag.flag === 'remove' ? 'border-red-200' :
                    flag.flag === 'update' ? 'border-yellow-200' : 'border-gray-200'
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Pill bg={style.bg} text={style.text} label={style.label} />
                        <h3 className="font-semibold text-gray-900">{flag.tool_name}</h3>
                        {flag.current_website && (
                          <a href={flag.current_website} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline hidden sm:inline">
                            {flag.current_website}
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {flag.flag === 'remove' && (
                          <button
                            onClick={() => flagAction(flag.id, 'remove_tool')}
                            disabled={actionLoading === flag.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {actionLoading === flag.id ? <Spinner /> : null}
                            Unpublish
                          </button>
                        )}
                        {flag.flag === 'update' && flag.suggested_changes && Object.keys(flag.suggested_changes).length > 0 && (
                          <button
                            onClick={() => flagAction(flag.id, 'apply_update')}
                            disabled={actionLoading === flag.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {actionLoading === flag.id ? <Spinner /> : null}
                            Apply Update
                          </button>
                        )}
                        <button
                          onClick={() => flagAction(flag.id, 'dismiss')}
                          disabled={actionLoading === flag.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>

                    {flag.reason && (
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{flag.reason}</p>
                    )}

                    {flag.flag === 'update' && flag.suggested_changes && Object.keys(flag.suggested_changes).length > 0 && (
                      <div className="mt-3 bg-yellow-50 rounded-xl p-3 border border-yellow-100">
                        <p className="text-xs font-semibold text-yellow-800 uppercase tracking-wide mb-2">Suggested Changes</p>
                        <div className="space-y-1">
                          {Object.entries(flag.suggested_changes).map(([field, value]) => (
                            <div key={field} className="flex gap-2 text-xs">
                              <span className="font-mono text-yellow-700 shrink-0">{field}:</span>
                              <span className="text-gray-700 break-all">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Category Suggestions ── */}
      {activeTab === 'categories' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{pendingSuggestions.length} suggestion{pendingSuggestions.length !== 1 ? 's' : ''} pending</p>
            <button
              onClick={runCategories}
              disabled={running.categories}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              {running.categories ? <Spinner /> : '📊'} Analyze Categories
            </button>
          </div>

          {running.categories && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700 mb-4 flex items-center gap-2">
              <Spinner /> Analyzing category structure… this takes about 20 seconds.
            </div>
          )}

          {pendingSuggestions.length === 0 && !running.categories ? (
            <EmptyState icon="📊" text="No category suggestions yet. Run a category analysis to get recommendations." />
          ) : (
            <div className="space-y-4">
              {pendingSuggestions.map(s => {
                const style = TYPE_STYLES[s.suggestion_type] ?? TYPE_STYLES.new
                return (
                  <div key={s.id} className="bg-white rounded-2xl border border-gray-200 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Pill bg={style.bg} text={style.text} label={style.label} />
                        {s.current_categories.length > 0 && (
                          <span className="text-sm text-gray-700">
                            {s.current_categories.join(' + ')}
                            {s.suggested_category && <> → <strong>{s.suggested_category}</strong></>}
                          </span>
                        )}
                        {s.suggestion_type === 'new' && s.suggested_category && (
                          <span className="text-sm font-semibold text-gray-900">{s.suggested_category}</span>
                        )}
                      </div>
                      <button
                        onClick={() => dismissSuggestion(s.id)}
                        disabled={actionLoading === s.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 shrink-0"
                      >
                        Dismiss
                      </button>
                    </div>

                    {s.reasoning && (
                      <p className="text-sm text-gray-700 mt-3 leading-relaxed">{s.reasoning}</p>
                    )}

                    {s.affected_tools.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {s.affected_tools.map((tool, i) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {tool}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Small sub-components ──────────────────────────────────────────────────────

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-gray-700 leading-relaxed">{value}</p>
    </div>
  )
}

function RunStepBadge({ label, running }: { label: string; running: boolean }) {
  return (
    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
      running ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
    }`}>
      {running && <Spinner />}
      {label}
    </span>
  )
}
