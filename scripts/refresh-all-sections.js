#!/usr/bin/env node
// Refresh all (or one) field guide sections using Perplexity.
// Usage:
//   node scripts/refresh-all-sections.js
//   node scripts/refresh-all-sections.js --section "Image Generation"

'use strict'

const {
  loadEnv, createSupabaseClient,
  refreshOneSection, SECTION_SELECT,
} = require('./lib/refresh-sections-core')

loadEnv()

const DELAY_MS = 2500

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function parseArgs() {
  const args = process.argv.slice(2)
  const idx = args.indexOf('--section')
  return { section: idx !== -1 ? args[idx + 1] : null }
}

function formatDuration(ms) {
  const s = Math.round(ms / 1000)
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
}

async function main() {
  const { section: sectionFilter } = parseArgs()

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

  let query = supabase
    .from('field_guide_sections')
    .select(SECTION_SELECT)
    .eq('published', true)
    .order('section_number')

  if (sectionFilter) {
    query = query.ilike('section_name', `%${sectionFilter}%`)
  }

  const { data: sections, error: fetchErr } = await query
  if (fetchErr) { console.error('Failed to fetch sections:', fetchErr.message); process.exit(1) }
  if (!sections?.length) {
    console.error(sectionFilter ? `No sections found matching "${sectionFilter}"` : 'No sections found.')
    process.exit(1)
  }

  const total = sections.length
  const label = sectionFilter ? ` matching "${sectionFilter}"` : ''
  console.log(`\n🚀 Starting section refresh — ${total} section${total !== 1 ? 's' : ''}${label}\n`)

  const stats = { changed: 0, unchanged: 0, failed: 0 }
  const startTime = Date.now()

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]
    const prefix = `[${String(i + 1).padStart(String(total).length)}/${total}]`
    process.stdout.write(`${prefix} ${section.section_name}… `)

    try {
      const { changesQueued, fields } = await refreshOneSection(supabase, section, perplexityKey, {
        log: () => {},
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

    if (i < sections.length - 1) await sleep(DELAY_MS)
  }

  const elapsed = Date.now() - startTime
  console.log(`\n${'─'.repeat(52)}`)
  console.log(`Run complete in ${formatDuration(elapsed)}`)
  console.log(`  ${total} checked  ·  ${stats.changed} with changes  ·  ${stats.unchanged} unchanged  ·  ${stats.failed} failed`)
  if (stats.changed > 0) console.log('  Visit /admin/review-sections to approve or reject queued changes.')
  console.log()
}

main().catch(err => {
  console.error('\nUnexpected error:', err)
  process.exit(1)
})
