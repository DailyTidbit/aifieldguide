'use strict'

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// ── Env loader ────────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = path.join(__dirname, '..', '..', '.env.local')
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

// ── Config ────────────────────────────────────────────────────────────────────

const CHECKED_FIELDS = [
  'description', 'use_cases', 'login_required', 'free_tier',
  'paid_tier', 'website', 'pricing_tiers', 'pricing_page_url',
  'access_notes', 'detailed_description',
  'tagline', 'model_type', 'access_method', 'pricing_breakdown',
  'commercial_use_policy', 'training_data', 'workflow_notes',
  'limitations', 'use_cases_list',
]

const BOOLEAN_FIELDS = new Set(['login_required', 'free_tier', 'paid_tier'])
const ARRAY_FIELDS = new Set(['use_cases_list'])
const SIGNIFICANT_FIELDS = new Set(['description', 'detailed_description'])

// Shared select string — keeps both scripts in sync with the DB schema
const TOOL_SELECT = 'id, name, category, description, detailed_description, use_cases, login_required, free_tier, paid_tier, website, pricing_tiers, pricing_page_url, access_notes, tagline, model_type, access_method, pricing_breakdown, commercial_use_policy, training_data, workflow_notes, limitations, use_cases_list'

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeWebsite(url) {
  if (!url) return ''
  return url.replace(/\/+$/, '').toLowerCase()
}

function valToString(fieldName, val) {
  if (val === null || val === undefined) return ''
  if (ARRAY_FIELDS.has(fieldName)) {
    return Array.isArray(val) ? JSON.stringify(val) : String(val)
  }
  return String(val)
}

function valuesMatch(fieldName, dbVal, aiVal) {
  if (BOOLEAN_FIELDS.has(fieldName)) {
    return Boolean(dbVal) === (String(aiVal).toLowerCase() === 'true')
  }
  if (fieldName === 'website') {
    return normalizeWebsite(String(dbVal ?? '')) === normalizeWebsite(String(aiVal ?? ''))
  }
  if (ARRAY_FIELDS.has(fieldName)) {
    const a = Array.isArray(dbVal) ? JSON.stringify([...dbVal].sort()) : ''
    const b = Array.isArray(aiVal) ? JSON.stringify([...aiVal].sort()) : ''
    return a === b
  }
  return String(dbVal ?? '').trim() === String(aiVal ?? '').trim()
}

// ── Supabase ──────────────────────────────────────────────────────────────────

function createSupabaseClient() {
  const url = process.env.PROD_SUPABASE_URL
  const key = process.env.PROD_SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('PROD_SUPABASE_URL or PROD_SUPABASE_SERVICE_ROLE_KEY not set in .env.local')
  }
  return createClient(url, key, { auth: { persistSession: false } })
}

// ── Perplexity ────────────────────────────────────────────────────────────────

async function fetchFromPerplexity(tool, perplexityKey) {
  const officialSite = tool.website || 'the official website'
  const truncate = (s, n) => s && s.length > n ? s.slice(0, n) + '…' : (s || '')

  const prompt = `You are updating an AI tool database. Research the current state of "${tool.name}" using live web data.

PRICING RESEARCH — follow this process exactly:
1. Visit ${officialSite} and look for a /pricing page or pricing section. This is the primary source.
2. If specific plan names and prices are found there, those are confirmed. Record the pricing page URL.
3. If the official site has no pricing, check in order: official blog/changelog → TechCrunch/The Verge/Wired/VentureBeat → Product Hunt.
4. DECISION RULE: You either found specific prices (use them, cite the source URL) or you did not (set pricing_source to "unconfirmed" and pricing_tiers to "Unconfirmed"). Never mix confirmed and unconfirmed in the same response.

Current values stored in our database:
- description: "${truncate(tool.description, 300)}"
- detailed_description: "${truncate(tool.detailed_description, 500)}"
- tagline: "${tool.tagline || ''}"
- model_type: "${tool.model_type || ''}"

Return ONLY a valid JSON object (no markdown, no explanation) with these exact keys:

{
  "description": "1-2 sentence accurate current description of what this tool does",
  "use_cases": "exactly 3-5 specific, actionable use cases as a comma-separated string — no vague entries like 'various tasks' or 'general use'",
  "login_required": true or false,
  "free_tier": true or false,
  "paid_tier": true or false,
  "website": "official URL",
  "pricing_tiers": "tier names and monthly prices ONLY — e.g. 'Free (10 queries/day), Pro ($20/mo), Business ($50/mo, 5 seats)' — or 'Unconfirmed' if no specific prices found",
  "pricing_page_url": "direct URL to the pricing page, e.g. https://example.com/pricing — or null if none found",
  "access_notes": "how to access the tool only — login method (Google, email, SSO, API key), platforms (web, iOS, Android, CLI), waitlist or open signup, enterprise contact required",
  "pricing_source": "specific URL where pricing was confirmed, or 'unconfirmed'",
  "detailed_description": "comprehensive 3-4 paragraph description of capabilities, use cases, and what makes it distinctive",
  "description_significant_change": true or false,
  "detailed_description_significant_change": true or false,
  "tagline": "punchy 8-12 word tagline capturing what makes this tool distinctive",
  "model_type": "underlying model or technology stack — e.g. 'GPT-4o fine-tune', 'Diffusion-based image model', 'RAG pipeline over web index'",
  "access_method": "where and how to access it — platforms (web, iOS, Android, API, CLI, VS Code extension), sign-up friction (open signup, waitlist, invite-only, enterprise sales), embeds or integrations",
  "pricing_breakdown": "full tier breakdown: tier name, price, key limits — one tier per line, e.g. 'Free — 10 generations/day\\nPro — $20/mo, unlimited generations\\nBusiness — $60/mo, 5 seats, API access' — or 'Unconfirmed' if no confirmed prices",
  "commercial_use_policy": "whether outputs can be used commercially, any attribution or licensing requirements, any revenue thresholds that change terms",
  "training_data": "what the model was trained on — licensed data, open datasets, web scrape, proprietary corpus — and any known controversies or restrictions",
  "workflow_notes": "concrete step-by-step notes on how to use it effectively — key prompting tips, important settings, integration gotchas, things that trip up new users",
  "limitations": "specific limitations, constraints, and gotchas a user will run into — not marketing copy, be direct",
  "use_cases_list": ["exactly 3-5 specific, actionable use cases as individual strings — no vague entries"]
}

For significance flags: only true for major changes vs the stored value — new pricing model, free tier added/removed, product pivot, major new feature set. Minor wording differences = false.
For use_cases_list: return a JSON array of strings, not a comma-separated string.`

  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${perplexityKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 4000,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Perplexity API error ${res.status}: ${body}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content ?? ''

  // Strip markdown fences
  let cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

  // If the response was truncated mid-JSON, attempt to close it so JSON.parse can succeed
  if (cleaned && !cleaned.endsWith('}')) {
    // Drop any trailing incomplete line, then close the object
    const lastComplete = cleaned.lastIndexOf('\n')
    if (lastComplete > 0) cleaned = cleaned.slice(0, lastComplete)
    // Remove trailing comma if present after truncation
    cleaned = cleaned.replace(/,\s*$/, '')
    cleaned += '\n}'
  }

  try {
    const parsed = JSON.parse(cleaned)
    return stripCitations(parsed)
  } catch (err) {
    console.error(`\n⚠ JSON parse failed for "${tool.name}". Raw response:\n${content}\n`)
    throw new Error(`Failed to parse Perplexity response as JSON: ${err.message}`)
  }
}

// Strip Perplexity citation markers like [1], [2][3], [1][2][3] from all string values
function stripCitations(obj) {
  if (typeof obj === 'string') return obj.replace(/(\[\d+\])+/g, '').replace(/\s{2,}/g, ' ').trim()
  if (Array.isArray(obj)) return obj.map(stripCitations)
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, stripCitations(v)]))
  }
  return obj
}

// ── Core refresh logic ────────────────────────────────────────────────────────
//
// refreshOneTool expects a tool object already fetched from the DB.
// Pass log: () => {} to suppress per-field output in batch mode.
// Returns { changesQueued, fields, pricingUnconfirmed } or throws on hard errors.

async function refreshOneTool(supabase, tool, perplexityKey, { log = console.log } = {}) {
  const aiData = await fetchFromPerplexity(tool, perplexityKey)

  const pricingUnconfirmed = String(aiData.pricing_source || '').toLowerCase() === 'unconfirmed'
  const changes = []

  for (const field of CHECKED_FIELDS) {
    const dbVal = tool[field]
    const aiVal = aiData[field]

    if (aiVal === undefined || aiVal === null || aiVal === '') continue

    // Never queue pricing_tiers when Perplexity couldn't confirm prices
    if (field === 'pricing_tiers' && pricingUnconfirmed) {
      log(`  ~ pricing_tiers: pricing unconfirmed — leaving database value untouched`)
      continue
    }

    if (valuesMatch(field, dbVal, aiVal)) {
      log(`  ✓ ${field}: no change`)
      continue
    }

    if (SIGNIFICANT_FIELDS.has(field)) {
      const sigKey = `${field}_significant_change`
      if (!aiData[sigKey]) {
        log(`  ~ ${field}: changed but not significant — skipping`)
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

    log(`  ⚡ ${field}: change detected`)
  }

  for (const change of changes) {
    await supabase
      .from('ai_tools_pending')
      .delete()
      .eq('tool_id', change.tool_id)
      .eq('field_name', change.field_name)
      .eq('approved', false)

    const { error: insertErr } = await supabase
      .from('ai_tools_pending')
      .insert(change)

    if (insertErr) log(`  ✗ Failed to queue ${change.field_name}: ${insertErr.message}`)
  }

  const { error: stampErr } = await supabase
    .from('ai_tools')
    .update({ last_verified: new Date().toISOString() })
    .eq('id', tool.id)

  if (stampErr) log(`  ✗ Failed to update last_verified: ${stampErr.message}`)

  return {
    changesQueued: changes.length,
    fields: changes.map(c => c.field_name),
    pricingUnconfirmed,
  }
}

module.exports = {
  loadEnv,
  createSupabaseClient,
  fetchFromPerplexity,
  refreshOneTool,
  CHECKED_FIELDS,
  TOOL_SELECT,
}
