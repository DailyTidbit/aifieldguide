#!/usr/bin/env node
// Refresh a single field guide section using Perplexity.
// Usage: node scripts/refresh-section.js "AI Assistants"

'use strict'

const {
  loadEnv, createSupabaseClient,
  refreshOneSection, SECTION_SELECT,
} = require('./lib/refresh-sections-core')

loadEnv()

async function main() {
  const sectionName = process.argv[2]
  if (!sectionName) {
    console.error('Usage: node scripts/refresh-section.js "Section Name"')
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

  const { data: section, error } = await supabase
    .from('field_guide_sections')
    .select(SECTION_SELECT)
    .ilike('section_name', sectionName)
    .eq('published', true)
    .single()

  if (error || !section) {
    console.error(`Section "${sectionName}" not found.`)
    process.exit(1)
  }

  console.log(`\n🔍 Refreshing: ${section.section_name}\n`)

  try {
    const { changesQueued, fields } = await refreshOneSection(supabase, section, perplexityKey)

    if (changesQueued > 0) {
      console.log(`\n✅ ${changesQueued} change(s) queued: ${fields.join(', ')}`)
      console.log('Visit /admin/review-sections to approve or reject.')
    } else {
      console.log('\n✓ No changes detected.')
    }
  } catch (err) {
    console.error(`\n✗ Failed: ${err.message}`)
    process.exit(1)
  }
}

main().catch(err => {
  console.error('\nUnexpected error:', err)
  process.exit(1)
})
