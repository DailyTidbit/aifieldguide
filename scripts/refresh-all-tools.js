#!/usr/bin/env node
// Usage:
//   node scripts/refresh-all-tools.js
//   node scripts/refresh-all-tools.js --category "Image Generation"
//   node scripts/refresh-all-tools.js --skip-category "Image Generation"

'use strict'

const { loadEnv, createSupabaseClient, refreshOneTool, TOOL_SELECT } = require('./lib/refresh-core')

loadEnv()

// Delay between Perplexity calls. Raise to 3000+ if you hit rate limit errors.
const DELAY_MS = 2000

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function parseArgs() {
  const args = process.argv.slice(2)
  const catIdx = args.indexOf('--category')
  const skipIdx = args.indexOf('--skip-category')
  return {
    category: catIdx !== -1 ? args[catIdx + 1] : null,
    skipCategory: skipIdx !== -1 ? args[skipIdx + 1] : null,
  }
}

function formatDuration(ms) {
  const s = Math.round(ms / 1000)
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const { category, skipCategory } = parseArgs()

  const perplexityKey = process.env.PERPLEXITY_API_KEY
  if (!perplexityKey) {
    console.error('Missing PERPLEXITY_API_KEY in .env.local')
    process.exit(1)
  }

  let supabase
  try {
    supabase = createSupabaseClient()
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }

  // ── Fetch tool list ────────────────────────────────────────────────────────
  let query = supabase.from('ai_tools').select(TOOL_SELECT).order('name')
  if (category) query = query.ilike('category', `%${category}%`)
  if (skipCategory) query = query.not('category', 'ilike', `%${skipCategory}%`)

  const { data: tools, error: fetchErr } = await query
  if (fetchErr) { console.error('Failed to fetch tools:', fetchErr.message); process.exit(1) }
  if (!tools?.length) {
    console.error(category ? `No tools found matching category "${category}"` : 'No tools found.')
    process.exit(1)
  }

  const total = tools.length
  const categoryLabel = category ? ` in "${category}"` : skipCategory ? ` (skipping "${skipCategory}")` : ''
  console.log(`\n🚀 Starting refresh run — ${total} tool${total !== 1 ? 's' : ''}${categoryLabel}\n`)

  // ── Run each tool ──────────────────────────────────────────────────────────
  const stats = { changed: 0, unchanged: 0, failed: 0 }
  const startTime = Date.now()

  for (let i = 0; i < tools.length; i++) {
    const tool = tools[i]
    const prefix = `[${String(i + 1).padStart(String(total).length)}/${total}]`

    process.stdout.write(`${prefix} ${tool.name}… `)

    try {
      const { changesQueued, fields } = await refreshOneTool(supabase, tool, perplexityKey, {
        log: () => {}, // suppress per-field logs in batch mode
      })

      if (changesQueued > 0) {
        console.log(`⚡ ${changesQueued} change(s): ${fields.join(', ')}`)
        stats.changed++
      } else {
        console.log('✓ no changes')
        stats.unchanged++
      }
    } catch (err) {
      console.log(`✗ FAILED: ${err.message}`)
      stats.failed++
    }

    if (i < tools.length - 1) await sleep(DELAY_MS)
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const elapsed = Date.now() - startTime
  console.log(`\n${'─'.repeat(52)}`)
  console.log(`Run complete in ${formatDuration(elapsed)}`)
  console.log(`  ${total} checked  ·  ${stats.changed} with changes  ·  ${stats.unchanged} unchanged  ·  ${stats.failed} failed`)
  if (stats.changed > 0) console.log(`  Visit /admin/review to approve or reject queued changes.`)
  console.log()
}

main().catch(err => {
  console.error('\nUnexpected error:', err)
  process.exit(1)
})
