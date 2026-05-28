'use server'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NewToolSuggestion {
  tool_name: string
  website: string
  description: string
  suggested_category: string
  reason: string
  source_urls: string[]
  funding_info: string
}

export interface ToolAuditResult {
  tool_name: string
  flag: 'keep' | 'update' | 'remove'
  reason: string
  suggested_changes?: Record<string, string>
}

export interface CategorySuggestion {
  suggestion_type: 'merge' | 'split' | 'new' | 'rename'
  current_categories: string[]
  suggested_category: string
  reasoning: string
  affected_tools: string[]
}

export interface ToolToAudit {
  name: string
  website: string | null
  category: string
}

export interface CategoryInfo {
  name: string
  count: number
}

// ── Perplexity call ───────────────────────────────────────────────────────────

async function callPerplexity(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.PERPLEXITY_API_KEY
  if (!apiKey) throw new Error('PERPLEXITY_API_KEY is not set')

  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 4000,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Perplexity API error ${res.status}: ${body.slice(0, 200)}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

// ── JSON extraction ───────────────────────────────────────────────────────────

function extractJSON(text: string): unknown {
  // Strip citation markers like [1][2]
  text = text.replace(/\[\d+\]/g, '')

  // Find the outermost JSON array
  const start = text.indexOf('[')
  if (start === -1) return []
  let raw = text.slice(start)

  // Truncation recovery: drop incomplete last object, close the array
  raw = raw.replace(/,\s*\{[^}]*$/, '').trimEnd()
  if (!raw.endsWith(']')) raw += ']'

  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

// ── Part 1: New tool discovery ────────────────────────────────────────────────

const VALID_CATEGORIES = [
  'AI Assistants', 'Image Generation', 'Video Generation', 'Music Creation',
  'Photo & Image Tools', 'Video Editing', 'AI Avatars', 'Speech & Voice',
  'Creative Writing & Storytelling', 'Productivity Tools', 'AI Search Tools',
  'Education & Learning', 'Coding Assistants', 'Automation Tools',
]

export async function discoverNewTools(): Promise<NewToolSuggestion[]> {
  const system = `You are an AI tools researcher. Return ONLY valid JSON arrays — no prose, no markdown fences, no citations. Every string value must be properly escaped.`

  const user = `Search these sources for AI tools launched or gaining significant traction in the last 3 months:
Product Hunt (AI category), TechCrunch AI section, The Verge AI, Wired AI, VentureBeat AI,
Hacker News (news.ycombinator.com), a16z.com blog, Y Combinator recent batches (ycombinator.com/companies),
Ben's Bites newsletter, The Rundown AI newsletter, and major AI-focused publications.

Only include tools that meet ALL of these criteria:
- Has a real working website (not just a landing page or waitlist)
- Mentioned in at least 2 of the listed sources
- Has legitimate funding OR a known founder
- Does something genuinely different — not a ChatGPT wrapper with no unique value
- Has a specific real use case beyond "general AI assistant"
- Is NOT already extremely well-known (don't suggest ChatGPT, Claude, Midjourney, etc.)

Assign each tool to exactly one of these categories: ${VALID_CATEGORIES.join(', ')}

Return a JSON array of 10-20 tools:
[{"tool_name":"...","website":"https://...","description":"2-3 sentences","suggested_category":"...","reason":"why it's notable and meets criteria","source_urls":["url1","url2"],"funding_info":"funding or founder info, or Unknown"}]`

  const raw = await callPerplexity(system, user)
  const parsed = extractJSON(raw) as NewToolSuggestion[]
  if (!Array.isArray(parsed)) return []

  return parsed.filter(t =>
    typeof t.tool_name === 'string' && t.tool_name.trim() &&
    typeof t.description === 'string' &&
    VALID_CATEGORIES.includes(t.suggested_category)
  )
}

// ── Part 2: Existing tool audit ───────────────────────────────────────────────

const BATCH_SIZE = 40

export async function auditExistingTools(tools: ToolToAudit[]): Promise<ToolAuditResult[]> {
  const all: ToolAuditResult[] = []

  for (let i = 0; i < tools.length; i += BATCH_SIZE) {
    const batch = tools.slice(i, i + BATCH_SIZE)
    const results = await auditToolBatch(batch)
    all.push(...results)
    // Brief pause between batches to avoid rate limits
    if (i + BATCH_SIZE < tools.length) {
      await new Promise(r => setTimeout(r, 1500))
    }
  }

  return all
}

async function auditToolBatch(tools: ToolToAudit[]): Promise<ToolAuditResult[]> {
  const system = `You are auditing an AI tools directory. Return ONLY valid JSON arrays — no prose, no markdown fences, no citations.`

  const toolList = tools.map(t => `- ${t.name} (${t.website ?? 'no website'})`).join('\n')

  const user = `Check the current status of each AI tool below. Search the web to verify each one.

For each tool determine:
1. Is the website still accessible? (parked domain / 404 / redirect-to-acquirer = REMOVE)
2. Has the company shut down, been acquired with product discontinued, or rebranded? (REMOVE or UPDATE)
3. Has pricing changed significantly (e.g. went fully paid)? (UPDATE)
4. Is it still actively maintained and relevant in ${new Date().getFullYear()}?

Flag each as:
- keep: Active, accessible, still relevant, no major changes
- update: Still active but info needs updating (specify what changed)
- remove: Shut down, discontinued, domain parked, or completely superseded

Return a JSON array — one object per tool, in the same order as the list:
[{"tool_name":"...","flag":"keep|update|remove","reason":"1-2 sentences","suggested_changes":{"field":"new value"}}]

For "keep" flags, suggested_changes can be omitted or {}.

TOOLS TO AUDIT:
${toolList}`

  const raw = await callPerplexity(system, user)
  const parsed = extractJSON(raw) as ToolAuditResult[]
  if (!Array.isArray(parsed)) return []

  return parsed.filter(r =>
    typeof r.tool_name === 'string' &&
    ['keep', 'update', 'remove'].includes(r.flag)
  )
}

// ── Part 3: Category analysis ─────────────────────────────────────────────────

export async function analyzeCategoryStructure(categories: CategoryInfo[]): Promise<CategorySuggestion[]> {
  const system = `You are an AI industry analyst. Return ONLY valid JSON arrays — no prose, no markdown fences, no citations.`

  const catList = categories.map(c => `- ${c.name} (${c.count} tools)`).join('\n')

  const user = `Analyze this AI tools directory category structure and suggest improvements.

Current categories:
${catList}

Identify:
1. MERGE: Categories that are too small (< 5 tools) or overlapping — suggest combining them
2. SPLIT: Categories that are too broad and should be divided into more specific ones
3. NEW: Emerging AI tool categories from 2024-2025 trends that are missing entirely
4. RENAME: Categories with confusing or outdated names

Be specific and practical. Only suggest changes that would genuinely improve user experience.

Return a JSON array:
[{"suggestion_type":"merge|split|new|rename","current_categories":["Cat A","Cat B"],"suggested_category":"New Name","reasoning":"why this change helps","affected_tools":["example tool 1","example tool 2"]}]`

  const raw = await callPerplexity(system, user)
  const parsed = extractJSON(raw) as CategorySuggestion[]
  if (!Array.isArray(parsed)) return []

  return parsed.filter(s =>
    typeof s.suggestion_type === 'string' &&
    ['merge', 'split', 'new', 'rename'].includes(s.suggestion_type) &&
    typeof s.reasoning === 'string'
  )
}
