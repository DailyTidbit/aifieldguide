#!/usr/bin/env node
// Arbiter — uses Claude Haiku to auto-approve or reject pending tool field updates.
//
// Usage:
//   node scripts/lib/arbiter.js
//   node scripts/lib/arbiter.js --dry-run
//   node scripts/lib/arbiter.js --limit 50
//   node scripts/lib/arbiter.js --batch-size 20
//   node scripts/lib/arbiter.js --tool "Pika Labs"
//
// Decisions:
//   approve + high confidence  → applied directly to ai_tools, removed from pending
//   reject  + high confidence  → removed from pending (discarded)
//   approve + low confidence   → left in pending for manual review, written to arbiter-review.json
//   reject  + low confidence   → left in pending for manual review, written to arbiter-review.json
//
// The admin review queue (/admin/review) will therefore only surface items the arbiter
// couldn't decide confidently — reducing noise without removing human oversight.

'use strict'

const fs = require('fs')
const path = require('path')
const Anthropic = require('@anthropic-ai/sdk')
const { loadEnv, createSupabaseClient } = require('./refresh-core')

// ── Config ────────────────────────────────────────────────────────────────────

const DEFAULT_BATCH_SIZE = 25
const INTER_BATCH_DELAY_MS = 400
const MAX_RETRIES = 2
const REVIEW_FILE = path.join(__dirname, '..', 'arbiter-review.json')

// Haiku pricing per token (claude-haiku-4-5-20251001)
const HAIKU_COST = {
  input:      0.80 / 1_000_000,
  output:     5.00 / 1_000_000,
  cacheWrite: 1.00 / 1_000_000,
  cacheRead:  0.08 / 1_000_000,
}

const BOOLEAN_FIELDS = new Set(['login_required', 'free_tier', 'paid_tier'])
const ARRAY_FIELDS = new Set(['use_cases_list'])

// ── System prompt (stable across batches — benefits from prompt caching) ──────

const SYSTEM_PROMPT = `You are a quality-control arbiter for an AI tool directory. Your job is to decide whether proposed field updates should replace current database values.

APPROVE only when ALL of these are true:
- The updated value contains verifiably new or more accurate information not present in the current value.
- No specific facts are removed: prices, URLs, version numbers, feature limits, technology names, thresholds.
- The change is not just a cosmetic rewrite, synonym swap, reordering, or stylistic variation.

REJECT when ANY of these is true:
- Updated is shorter, vaguer, or less specific than current.
- Updated removes concrete details (numbers, named technologies, URLs, limits, specific capabilities).
- Updated is a rewording of the same information — even if it sounds better.
- Updated contradicts current without providing clearly verifiable new information.
- When genuinely uncertain: REJECT. The admin review queue exists for edge cases.

CONFIDENCE:
- "high": you are certain — clear approve or clear reject with no meaningful doubt.
- "low": borderline, close call, or you cannot confidently evaluate the factual accuracy.

Return ONLY a valid JSON array — no markdown, no explanation, nothing else.`

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function formatDuration(ms) {
  const s = Math.round(ms / 1000)
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
}

function estimateCost(usage) {
  return (
    usage.input_tokens  * HAIKU_COST.input      +
    usage.output_tokens * HAIKU_COST.output     +
    usage.cache_write   * HAIKU_COST.cacheWrite  +
    usage.cache_read    * HAIKU_COST.cacheRead
  )
}

function parseArgs() {
  const args = process.argv.slice(2)
  const get = flag => {
    const i = args.indexOf(flag)
    return i !== -1 ? args[i + 1] : null
  }
  return {
    dryRun: args.includes('--dry-run'),
    limit: get('--limit') ? parseInt(get('--limit'), 10) : null,
    batchSize: get('--batch-size') ? parseInt(get('--batch-size'), 10) : DEFAULT_BATCH_SIZE,
    toolFilter: get('--tool') ?? null,
  }
}

// ── Value parsing (mirrors the admin approve endpoint) ────────────────────────

function parseUpdateValue(fieldName, rawValue) {
  if (BOOLEAN_FIELDS.has(fieldName)) {
    return rawValue === 'true' || rawValue === true
  }
  if (ARRAY_FIELDS.has(fieldName)) {
    if (typeof rawValue === 'string') {
      try { return JSON.parse(rawValue) } catch { /* fall through */ }
      return rawValue.split(',').map(s => s.trim()).filter(Boolean)
    }
    return rawValue
  }
  return rawValue
}

// ── Supabase operations ───────────────────────────────────────────────────────

async function fetchPending(supabase, { limit, toolFilter }) {
  let query = supabase
    .from('ai_tools_pending')
    .select('id, tool_id, tool_name, field_name, old_value, new_value, created_at')
    .eq('approved', false)
    .order('tool_name')
    .order('created_at')

  if (toolFilter) query = query.ilike('tool_name', `%${toolFilter}%`)
  if (limit) query = query.limit(limit)

  const { data, error } = await query
  if (error) throw new Error(`Failed to fetch pending changes: ${error.message}`)
  return data ?? []
}

async function applyApproved(supabase, item) {
  const updateValue = parseUpdateValue(item.field_name, item.new_value)

  const { error: updateErr } = await supabase
    .from('ai_tools')
    .update({ [item.field_name]: updateValue })
    .eq('id', item.tool_id)

  if (updateErr) throw new Error(`Update failed: ${updateErr.message}`)

  const { error: deleteErr } = await supabase
    .from('ai_tools_pending')
    .delete()
    .eq('id', item.id)

  if (deleteErr) throw new Error(`Delete failed: ${deleteErr.message}`)
}

async function deleteRejected(supabase, item) {
  const { error } = await supabase
    .from('ai_tools_pending')
    .delete()
    .eq('id', item.id)

  if (error) throw new Error(`Delete failed: ${error.message}`)
}

async function insertRun(supabase, runData) {
  const { data, error } = await supabase
    .from('arbiter_runs')
    .insert(runData)
    .select('id')
    .single()
  if (error) throw new Error(`Failed to log run: ${error.message}`)
  return data.id
}

async function insertLogs(supabase, runId, decisions) {
  if (!decisions.length) return
  const rows = decisions.map(dec => ({
    run_id:         runId,
    tool_name:      dec.item.tool_name,
    field_name:     dec.item.field_name,
    decision:       dec.confidence === 'low' ? 'manual' : dec.decision,
    confidence:     dec.confidence,
    reason:         dec.reason,
    previous_value: dec.item.old_value ?? null,
    proposed_value: dec.item.new_value ?? null,
    applied:        dec.applied ?? false,
  }))
  const { error } = await supabase.from('arbiter_logs').insert(rows)
  if (error) throw new Error(`Failed to log decisions: ${error.message}`)
}

// ── Claude Haiku calls ────────────────────────────────────────────────────────

function buildUserMessage(batch) {
  const comparisons = batch.map((item, i) => {
    const current = item.old_value?.trim() || '(empty)'
    const updated = item.new_value?.trim() || '(empty)'
    return [
      `[${i + 1}] Tool: ${item.tool_name} | Field: ${item.field_name}`,
      `CURRENT: ${current}`,
      `UPDATED: ${updated}`,
    ].join('\n')
  })

  return [
    `Review these ${batch.length} proposed field updates. For each, return one JSON object in the array.`,
    '',
    comparisons.join('\n\n'),
    '',
    `Return a JSON array with exactly ${batch.length} objects:`,
    `[{"index":1,"field":"...","tool":"...","decision":"approve"|"reject","reason":"one sentence","confidence":"high"|"low"}, ...]`,
  ].join('\n')
}

function parseHaikuResponse(content, batch) {
  let cleaned = content
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/m, '')
    .trim()

  // If the response has prose before the JSON array, extract just the array
  const arrayStart = cleaned.indexOf('[')
  const arrayEnd = cleaned.lastIndexOf(']')
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    cleaned = cleaned.slice(arrayStart, arrayEnd + 1)
  }

  let parsed
  try {
    parsed = JSON.parse(cleaned)
  } catch (err) {
    throw new Error(`JSON parse failed: ${err.message}\nRaw: ${content.slice(0, 300)}`)
  }

  if (!Array.isArray(parsed)) throw new Error('Response is not a JSON array')

  // Map decisions back to their batch items by index
  const results = []
  for (const d of parsed) {
    const idx = Number(d.index)
    if (!idx || idx < 1 || idx > batch.length) {
      throw new Error(`Invalid index ${d.index} (batch size ${batch.length})`)
    }
    const item = batch[idx - 1]
    if (!['approve', 'reject'].includes(d.decision)) {
      throw new Error(`Invalid decision "${d.decision}" for index ${idx}`)
    }
    results.push({
      index: idx,
      field: d.field ?? item.field_name,
      tool: d.tool ?? item.tool_name,
      decision: d.decision,
      reason: String(d.reason ?? ''),
      confidence: d.confidence === 'high' ? 'high' : 'low',
      item,
    })
  }

  if (results.length !== batch.length) {
    throw new Error(`Expected ${batch.length} decisions, got ${results.length}`)
  }

  return results
}

async function judgeWithHaiku(anthropic, batch, attempt = 1) {
  const userMessage = buildUserMessage(batch)

  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024 + batch.length * 60,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' }, // cache stable system prompt across batches
        },
      ],
      messages: [{ role: 'user', content: userMessage }],
    })
  } catch (err) {
    if (attempt <= MAX_RETRIES) {
      const wait = attempt * 2000
      console.log(`    API error (attempt ${attempt}/${MAX_RETRIES}), retrying in ${wait}ms: ${err.message}`)
      await sleep(wait)
      return judgeWithHaiku(anthropic, batch, attempt + 1)
    }
    throw err
  }

  const content = message.content[0]?.text ?? ''
  const usage = {
    input_tokens:  message.usage?.input_tokens                ?? 0,
    output_tokens: message.usage?.output_tokens               ?? 0,
    cache_write:   message.usage?.cache_creation_input_tokens ?? 0,
    cache_read:    message.usage?.cache_read_input_tokens     ?? 0,
  }

  try {
    return { decisions: parseHaikuResponse(content, batch), usage }
  } catch (parseErr) {
    if (attempt <= MAX_RETRIES) {
      console.log(`    Parse error (attempt ${attempt}/${MAX_RETRIES}), retrying: ${parseErr.message}`)
      await sleep(1000)
      return judgeWithHaiku(anthropic, batch, attempt + 1)
    }
    throw parseErr
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function runArbiter(opts = {}) {
  const {
    dryRun = false,
    limit = null,
    batchSize = DEFAULT_BATCH_SIZE,
    toolFilter = null,
  } = opts

  const runStartTime = Date.now()

  loadEnv()

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set in .env.local')

  const supabase = createSupabaseClient()
  const anthropic = new Anthropic({ apiKey })

  // ── 1. Fetch pending changes ───────────────────────────────────────────────

  const pending = await fetchPending(supabase, { limit, toolFilter })

  if (pending.length === 0) {
    console.log('No pending changes found. Nothing to do.')
    return { approved: 0, rejected: 0, flagged: 0, errors: 0 }
  }

  const filterLabel = toolFilter ? ` for tool "${toolFilter}"` : ''
  const limitLabel = limit ? ` (limited to ${limit})` : ''
  console.log(`\nFound ${pending.length} pending change${pending.length !== 1 ? 's' : ''}${filterLabel}${limitLabel}`)
  if (dryRun) console.log('DRY RUN — no changes will be written\n')
  console.log()

  // ── 2. Batch through Haiku ─────────────────────────────────────────────────

  const batches = []
  for (let i = 0; i < pending.length; i += batchSize) {
    batches.push(pending.slice(i, i + batchSize))
  }

  const allDecisions = []
  const totalUsage = { input_tokens: 0, output_tokens: 0, cache_write: 0, cache_read: 0 }

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi]
    const label = `Batch ${String(bi + 1).padStart(String(batches.length).length)}/${batches.length}`
    process.stdout.write(`${label} (${batch.length} items)… `)

    try {
      const { decisions, usage } = await judgeWithHaiku(anthropic, batch)
      totalUsage.input_tokens  += usage.input_tokens
      totalUsage.output_tokens += usage.output_tokens
      totalUsage.cache_write   += usage.cache_write
      totalUsage.cache_read    += usage.cache_read
      const approved = decisions.filter(d => d.decision === 'approve').length
      const rejected = decisions.filter(d => d.decision === 'reject').length
      const lowConf = decisions.filter(d => d.confidence === 'low').length
      console.log(`✓  approve ${approved}  reject ${rejected}  low-conf ${lowConf}`)
      allDecisions.push(...decisions)
    } catch (err) {
      console.log(`✗ FAILED`)
      console.error(`  Error: ${err.message}`)
      // Flag the whole batch for manual review
      for (const item of batch) {
        allDecisions.push({
          index: null,
          field: item.field_name,
          tool: item.tool_name,
          decision: 'reject',
          reason: `Arbiter batch error: ${err.message}`,
          confidence: 'low',
          item,
        })
      }
    }

    if (bi < batches.length - 1) await sleep(INTER_BATCH_DELAY_MS)
  }

  // ── 3. Apply decisions ────────────────────────────────────────────────────

  console.log('\nApplying decisions…\n')

  const counts = { approved: 0, rejected: 0, flagged: 0, errors: 0 }
  const flaggedItems = []

  for (const dec of allDecisions) {
    const { item } = dec
    const tag = `${item.tool_name} · ${item.field_name}`

    if (dec.decision === 'approve' && dec.confidence === 'high') {
      if (dryRun) {
        dec.applied = false
        console.log(`  [approve] ${tag}`)
        counts.approved++
        continue
      }
      try {
        await applyApproved(supabase, item)
        dec.applied = true
        counts.approved++
      } catch (err) {
        dec.applied = false
        console.error(`  ✗ Apply failed for ${tag}: ${err.message}`)
        counts.errors++
      }

    } else if (dec.decision === 'reject' && dec.confidence === 'high') {
      if (dryRun) {
        dec.applied = false
        console.log(`  [reject]  ${tag} — ${dec.reason}`)
        counts.rejected++
        continue
      }
      try {
        await deleteRejected(supabase, item)
        dec.applied = true
        counts.rejected++
      } catch (err) {
        dec.applied = false
        console.error(`  ✗ Delete failed for ${tag}: ${err.message}`)
        counts.errors++
      }

    } else {
      // Low-confidence approve or reject → leave in pending for human review
      dec.applied = false
      flaggedItems.push({
        id: item.id,
        tool: item.tool_name,
        field: item.field_name,
        decision: dec.decision,
        reason: dec.reason,
        confidence: dec.confidence,
        current: item.old_value,
        proposed: item.new_value,
        created_at: item.created_at,
      })
      counts.flagged++
    }
  }

  // ── 4. Write review file ──────────────────────────────────────────────────

  if (flaggedItems.length > 0) {
    fs.writeFileSync(REVIEW_FILE, JSON.stringify(flaggedItems, null, 2))
    console.log(`\nWrote ${flaggedItems.length} low-confidence item${flaggedItems.length !== 1 ? 's' : ''} to scripts/arbiter-review.json`)
    console.log('These remain in the admin review queue (/admin/review) for manual decision.')
  } else if (fs.existsSync(REVIEW_FILE)) {
    fs.unlinkSync(REVIEW_FILE) // clean up stale file from previous run
  }

  // ── 5. Summary ────────────────────────────────────────────────────────────

  const durationMs = Date.now() - runStartTime
  const costUsd = estimateCost(totalUsage)

  const total = pending.length
  const bar = '─'.repeat(48)
  console.log(`\n${bar}`)
  console.log(`  Total processed:           ${total}`)
  console.log(`  Auto-approved (applied):   ${counts.approved}`)
  console.log(`  Auto-rejected (discarded): ${counts.rejected}`)
  console.log(`  Flagged (manual review):   ${counts.flagged}`)
  if (counts.errors > 0)
    console.log(`  Errors:                    ${counts.errors}`)
  console.log(`  Estimated cost:            $${costUsd.toFixed(4)}`)
  console.log(bar)
  if (counts.flagged > 0)
    console.log(`  Run /admin/review to handle the ${counts.flagged} flagged item${counts.flagged !== 1 ? 's' : ''}.`)
  console.log()

  // ── 6. Log run to Supabase ────────────────────────────────────────────────
  try {
    const runId = await insertRun(supabase, {
      dry_run:            dryRun,
      tool_filter:        toolFilter ?? null,
      total_processed:    pending.length,
      approved_count:     counts.approved,
      rejected_count:     counts.rejected,
      manual_count:       counts.flagged,
      error_count:        counts.errors,
      duration_ms:        durationMs,
      estimated_cost_usd: costUsd,
      input_tokens:       totalUsage.input_tokens,
      output_tokens:      totalUsage.output_tokens,
      cache_read_tokens:  totalUsage.cache_read,
      cache_write_tokens: totalUsage.cache_write,
    })
    await insertLogs(supabase, runId, allDecisions)
    console.log(`  Logged run ${runId}\n`)
  } catch (err) {
    console.error(`  ⚠ Failed to log run: ${err.message}\n`)
  }

  return counts
}

// ── CLI entry point ───────────────────────────────────────────────────────────

if (require.main === module) {
  const opts = parseArgs()

  const startTime = Date.now()

  runArbiter(opts)
    .then(counts => {
      console.log(`Arbiter finished in ${formatDuration(Date.now() - startTime)}`)
      process.exit(counts.errors > 0 ? 1 : 0)
    })
    .catch(err => {
      console.error('\nFatal error:', err.message)
      process.exit(1)
    })
}

module.exports = { runArbiter }
