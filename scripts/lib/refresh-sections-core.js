'use strict'

const { loadEnv, createSupabaseClient } = require('./refresh-core')

// ── Config ────────────────────────────────────────────────────────────────────

const SECTION_FIELDS = [
  'title', 'intro', 'summary', 'use_cases',
  'how_they_work', 'what_you_can_do', 'better_results',
  'strengths', 'limitations', 'pro_tips',
]

const SECTION_SELECT = [
  'id', 'section_name', 'slug', 'title', 'intro', 'summary', 'use_cases',
  'how_they_work', 'what_you_can_do', 'better_results',
  'strengths', 'limitations', 'pro_tips',
].join(', ')

// ── Field-specific prompt instructions ───────────────────────────────────────
//
// Each entry describes exactly what Perplexity should produce for that field.

const FIELD_INSTRUCTIONS = {
  title: 'Page title. Format: "[Category Name]: [Short Descriptive Subtitle]" — e.g. "Image Generation Tools: Turn Ideas into Pictures". Max 70 characters.',

  intro: `Beginner-friendly introduction to this category of AI tools. 3-5 sentences of flowing prose. Answer: what are these tools, who uses them, why should someone care? No markdown headers. Plain language, no jargon. Optionally follow with a short bullet list of 4-6 emoji-prefixed examples of what people do with these tools.`,

  summary: `Short 2-3 sentence closing paragraph. Encourage the reader to explore the tools. Upbeat but not cheesy. No headers or bullets — flowing prose only.`,

  use_cases: `6-8 real-world use case examples. Each on its own line, prefixed with a relevant emoji. Format: "emoji Task — brief description". Example: "🖼️ Remove backgrounds from product photos for an online store". Make them concrete and specific, not vague.`,

  how_they_work: `Plain-English explanation of the underlying technology for a curious but non-technical reader. 2-3 paragraphs. Use analogies. Avoid acronyms unless explained. Cover: what the model was trained on, how it produces output, any key technical concepts a user would encounter (like "diffusion", "tokens", "fine-tuning") — explained simply.`,

  what_you_can_do: `4-6 named capability groups. Format each as:\n[Bold Category Label]\nOne sentence description of what tools in this group let you do.\n\nExample:\nBasic Edits\nCrop, resize, rotate, and adjust brightness or contrast.\n\nList should cover the range from beginner to advanced use.`,

  better_results: `5 numbered tips for getting better results from this category of tools. Each tip: bold label, then 1-2 sentences of concrete advice. Format:\n1) Be Specific — [advice]\n2) ...\nTips should be practical and actionable, not generic.`,

  strengths: `5-7 key advantages of this tool category. Format each as:\n[Bold Label]\nOne sentence explanation.\n\nFocus on what genuinely sets this category apart. Be honest, not just promotional.`,

  limitations: `4-6 real limitations or gotchas users will encounter. Format each as:\n[Bold Label]\nOne sentence explanation.\n\nBe direct and honest. Things like accuracy issues, paywalls, learning curves, or common frustrations.`,

  pro_tips: `4-5 advanced tips for power users. Brief bullet list format (• tip). Should go beyond the basics — things that improve workflow, save time, or unlock hidden capability. Not repeats of "better_results" tips.`,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const truncate = (s, n) => s && s.length > n ? s.slice(0, n) + '…' : (s || '')

function stripCitations(obj) {
  if (typeof obj === 'string') return obj.replace(/(\[\d+\])+/g, '').replace(/\s{2,}/g, ' ').trim()
  if (Array.isArray(obj)) return obj.map(stripCitations)
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, stripCitations(v)]))
  }
  return obj
}

function valuesMatch(dbVal, aiVal) {
  return String(dbVal ?? '').trim() === String(aiVal ?? '').trim()
}

// ── Perplexity ────────────────────────────────────────────────────────────────

async function fetchSectionFromPerplexity(section, perplexityKey) {
  const currentContext = SECTION_FIELDS
    .map(f => `- ${f}: "${truncate(section[f], 200)}"`)
    .join('\n')

  const fieldSpecs = SECTION_FIELDS
    .map(f => `  "${f}": ${FIELD_INSTRUCTIONS[f]}`)
    .join(',\n\n')

  const prompt = `You are updating an educational AI tools directory. Research the current state of "${section.section_name}" AI tools using live web data.

The audience is everyday users — not developers or engineers. All content should be clear, jargon-free, and practical. Where jargon is unavoidable, explain it simply.

Current content stored in our database (for reference — update if outdated or improvable):
${currentContext}

Return ONLY a valid JSON object (no markdown, no explanation) with these exact keys and content requirements:

{
${fieldSpecs}
}

Research what's currently possible with ${section.section_name} tools, what the leading tools are doing, and what real users are using them for. Reflect the current state of the technology, not just a description from 1-2 years ago.`

  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${perplexityKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 4000,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Perplexity API error ${res.status}: ${body}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content ?? ''

  let cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

  if (cleaned && !cleaned.endsWith('}')) {
    const lastComplete = cleaned.lastIndexOf('\n')
    if (lastComplete > 0) cleaned = cleaned.slice(0, lastComplete)
    cleaned = cleaned.replace(/,\s*$/, '')
    cleaned += '\n}'
  }

  try {
    return stripCitations(JSON.parse(cleaned))
  } catch (err) {
    console.error(`\n⚠ JSON parse failed for "${section.section_name}". Raw response:\n${content}\n`)
    throw new Error(`Failed to parse Perplexity response as JSON: ${err.message}`)
  }
}

// ── Core refresh logic ────────────────────────────────────────────────────────

async function refreshOneSection(supabase, section, perplexityKey, { log = console.log } = {}) {
  const aiData = await fetchSectionFromPerplexity(section, perplexityKey)
  const changes = []

  for (const field of SECTION_FIELDS) {
    const dbVal = section[field]
    const aiVal = aiData[field]

    if (aiVal === undefined || aiVal === null || String(aiVal).trim() === '') continue

    if (valuesMatch(dbVal, aiVal)) {
      log(`  ✓ ${field}: no change`)
      continue
    }

    changes.push({
      section_id: section.id,
      section_name: section.section_name,
      field_name: field,
      old_value: String(dbVal ?? ''),
      new_value: String(aiVal),
      approved: false,
    })

    log(`  ⚡ ${field}: change detected`)
  }

  for (const change of changes) {
    await supabase
      .from('field_guide_sections_pending')
      .delete()
      .eq('section_id', change.section_id)
      .eq('field_name', change.field_name)
      .eq('approved', false)

    const { error: insertErr } = await supabase
      .from('field_guide_sections_pending')
      .insert(change)

    if (insertErr) log(`  ✗ Failed to queue ${change.field_name}: ${insertErr.message}`)
  }

  return {
    changesQueued: changes.length,
    fields: changes.map(c => c.field_name),
  }
}

module.exports = {
  loadEnv,
  createSupabaseClient,
  fetchSectionFromPerplexity,
  refreshOneSection,
  SECTION_FIELDS,
  SECTION_SELECT,
}
