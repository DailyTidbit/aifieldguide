#!/usr/bin/env node
// Usage: node scripts/refresh-tool.js "Midjourney"
// Checks one tool against Perplexity's live web data and queues changed fields for review.

'use strict'

const { loadEnv, createSupabaseClient, refreshOneTool, TOOL_SELECT } = require('./lib/refresh-core')

loadEnv()

async function main() {
  const toolName = process.argv[2]
  if (!toolName) {
    console.error('Usage: node scripts/refresh-tool.js "Tool Name"')
    process.exit(1)
  }

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

  // ── Look up tool ───────────────────────────────────────────────────────────
  console.log(`\n🔍 Looking up "${toolName}" in database…`)

  const { data: tools, error: fetchErr } = await supabase
    .from('ai_tools')
    .select(TOOL_SELECT)
    .ilike('name', toolName)

  if (fetchErr) { console.error('Database error:', fetchErr.message); process.exit(1) }
  if (!tools?.length) { console.error(`No tool found matching "${toolName}"`); process.exit(1) }
  if (tools.length > 1) {
    console.log('Multiple matches — be more specific:')
    tools.forEach(t => console.log(`  - ${t.name}`))
    process.exit(1)
  }

  const tool = tools[0]
  console.log(`✓ Found: ${tool.name} (${tool.id})`)
  console.log('\n🌐 Fetching current data from Perplexity…')
  console.log('📊 Comparing fields…')

  // ── Run refresh ────────────────────────────────────────────────────────────
  try {
    const { changesQueued, fields } = await refreshOneTool(supabase, tool, perplexityKey)

    if (changesQueued > 0) {
      console.log(`\n💾 ${changesQueued} change(s) queued: ${fields.join(', ')}`)
      console.log('✅ Done. Visit /admin/review to approve or reject changes.')
    } else {
      console.log('\n✅ No changes to queue. Tool data is current.')
    }
    console.log('🕐 last_verified updated.\n')
  } catch (err) {
    console.error('\nError:', err.message)
    process.exit(1)
  }
}

main().catch(err => {
  console.error('\nUnexpected error:', err)
  process.exit(1)
})
