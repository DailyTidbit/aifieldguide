#!/usr/bin/env node
// Usage: node scripts/refresh-tool.js "Midjourney"
// Checks one tool against Perplexity's live web data and queues changed fields for review.
// Connects to PROD_SUPABASE_URL using PROD_SUPABASE_SERVICE_ROLE_KEY from .env.local

'use strict'

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// ── Env loader ────────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1)
    if (val.startsWith('"') || val.startsWith("'")) {
      const q = val[0]
      const end = val.indexOf(q, 1)
      val = end === -1 ? val.slice(1) : val.slice(1, end)
    } else {
      const commentIdx = val.indexOf(' #')
      if (commentIdx !== -1) val = val.slice(0, commentIdx)
      val = val.trim()
    }
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnv()

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.PROD_SUPABASE_URL
const SUPABASE_KEY = process.env.PROD_SUPABASE_SERVICE_ROLE_KEY
const PERPLEXITY_KEY = process.env.PERPLEXITY_API_KEY

const CHECKED_FIELDS = [
  'description', 'use_cases', 'login_required', 'free_tier',
  'paid_tier', 'website', 'access_notes', 'detailed_description',
]

const BOOLEAN_FIELDS = new Set(['login_required', 'free_tier', 'paid_tier'])
const SIGNIFICANT_FIELDS = new Set(['description', 'detailed_description'])

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeWebsite(url) {
  if (!url) return ''
  return url.replace(/\/+$/, '').toLowerCase()
}

function valToString(fieldName, val) {
  if (val === null || val === undefined) return ''
  return String(val)
}

function valuesMatch(fieldName, dbVal, aiVal) {
  if (BOOLEAN_FIELDS.has(fieldName)) {
    return Boolean(dbVal) === (String(aiVal).toLowerCase() === 'true')
  }
  if (fieldName === 'website') {
    return normalizeWebsite(String(dbVal ?? '')) === normalizeWebsite(String(aiVal ?? ''))
  }
  return String(dbVal ?? '').trim() === String(aiVal ?? '').trim()
}

// ── Perplexity call ───────────────────────────────────────────────────────────

async function fetchFromPerplexity(tool) {
  const prompt = `You are updating an AI tool database. Research the current state of this tool using live web data.

Tool: ${tool.name}
Website: ${tool.website || 'unknown'}

Current values stored in our database:
- description: "${tool.description || ''}"
- detailed_description: "${(tool.detailed_description || '').slice(0, 500)}${(tool.detailed_description || '').length > 500 ? '…' : ''}"

Return ONLY a valid JSON object (no markdown, no explanation) with these exact keys:

{
  "description": "1-2 sentence accurate current description of what this tool does",
  "use_cases": "primary use cases as a comma-separated string",
  "login_required": true or false,
  "free_tier": true or false,
  "paid_tier": true or false,
  "website": "official URL",
  "access_notes": "current pricing tiers, limits, and access method — be specific about prices if known",
  "detailed_description": "comprehensive 3-4 paragraph description of capabilities, use cases, and what makes it distinctive",
  "description_significant_change": true or false,
  "detailed_description_significant_change": true or false
}

For the significance flags: only set true if there is a major change vs the stored value — e.g. new pricing model, free tier added or removed, product pivot, major new feature set. Ignore minor wording differences. If the stored value is substantially accurate, significance = false.`

  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PERPLEXITY_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 2000,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Perplexity API error ${res.status}: ${body}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content ?? ''

  // Strip markdown code fences if present
  const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    throw new Error(`Failed to parse Perplexity response as JSON:\n${content}`)
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const toolName = process.argv[2]
  if (!toolName) {
    console.error('Usage: node scripts/refresh-tool.js "Tool Name"')
    process.exit(1)
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing PROD_SUPABASE_URL or PROD_SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  if (!PERPLEXITY_KEY) {
    console.error('Missing PERPLEXITY_API_KEY in .env.local')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  })

  // ── 1. Fetch tool from DB ──────────────────────────────────────────────────
  console.log(`\n🔍 Looking up "${toolName}" in database…`)

  const { data: tools, error: fetchErr } = await supabase
    .from('ai_tools')
    .select('id, name, description, detailed_description, use_cases, login_required, free_tier, paid_tier, website, access_notes')
    .ilike('name', toolName)

  if (fetchErr) {
    console.error('Database error:', fetchErr.message)
    process.exit(1)
  }

  if (!tools || tools.length === 0) {
    console.error(`No tool found matching "${toolName}"`)
    process.exit(1)
  }

  if (tools.length > 1) {
    console.log('Multiple matches found:')
    tools.forEach(t => console.log(`  - ${t.name}`))
    console.log('Be more specific.')
    process.exit(1)
  }

  const tool = tools[0]
  console.log(`✓ Found: ${tool.name} (${tool.id})`)

  // ── 2. Call Perplexity ─────────────────────────────────────────────────────
  console.log('\n🌐 Fetching current data from Perplexity…')
  let aiData
  try {
    aiData = await fetchFromPerplexity(tool)
  } catch (err) {
    console.error('Perplexity error:', err.message)
    process.exit(1)
  }
  console.log('✓ Got response')

  // ── 3. Compare fields ──────────────────────────────────────────────────────
  console.log('\n📊 Comparing fields…')
  const changes = []

  for (const field of CHECKED_FIELDS) {
    const dbVal = tool[field]
    const aiVal = aiData[field]

    if (aiVal === undefined || aiVal === null || aiVal === '') continue

    if (valuesMatch(field, dbVal, aiVal)) {
      console.log(`  ✓ ${field}: no change`)
      continue
    }

    // For description fields, only queue if Perplexity flagged it as significant
    if (SIGNIFICANT_FIELDS.has(field)) {
      const sigKey = `${field}_significant_change`
      if (!aiData[sigKey]) {
        console.log(`  ~ ${field}: changed but not significant — skipping`)
        continue
      }
    }

    changes.push({
      tool_id: tool.id,
      tool_name: tool.name,
      field_name: field,
      old_value: valToString(field, dbVal),
      new_value: valToString(field, aiVal),
      approved: false,
    })

    console.log(`  ⚡ ${field}: change detected`)
  }

  if (changes.length === 0) {
    console.log('\n✅ No changes to queue. Tool data is current.')
    return
  }

  // ── 4. Write to ai_tools_pending ──────────────────────────────────────────
  console.log(`\n💾 Writing ${changes.length} change(s) to review queue…`)

  for (const change of changes) {
    // Remove existing unapproved entry for same tool+field (replaced by fresh data)
    await supabase
      .from('ai_tools_pending')
      .delete()
      .eq('tool_id', change.tool_id)
      .eq('field_name', change.field_name)
      .eq('approved', false)

    const { error: insertErr } = await supabase
      .from('ai_tools_pending')
      .insert(change)

    if (insertErr) {
      console.error(`  ✗ Failed to queue ${change.field_name}: ${insertErr.message}`)
    } else {
      console.log(`  ✓ Queued: ${change.field_name}`)
    }
  }

  console.log(`\n✅ Done. Visit /admin/review to approve or reject changes.\n`)
}

main().catch(err => {
  console.error('\nUnexpected error:', err)
  process.exit(1)
})
