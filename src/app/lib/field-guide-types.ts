// app/lib/field-guide-types.ts - Production version without debugging
import { z } from 'zod'

// Zod schemas for documentation
export const FieldGuideSectionSchema = z.object({
  id: z.string().min(1),
  section_number: z.number().int().positive(),
  section_name: z.string().min(1),
  slug: z.string().min(1),
  intro: z.string().optional(),
  summary: z.string().optional(),
  use_cases: z.string().optional(),
  title: z.string().optional(),
  how_they_work: z.string().optional(),
  what_you_can_do: z.string().optional(),
  better_results: z.string().optional(),
  strengths: z.string().optional(),
  limitations: z.string().optional(),
  pro_tips: z.string().optional(),
  published: z.boolean().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  toolCount: z.number().int().nonnegative().optional(),
})

export const AIToolSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  company: z.string().nullable().optional(),
  category: z.string().min(1),
  description: z.string().min(1),
  detailed_description: z.string().nullable().optional(),
  use_cases: z.string().nullable().optional(),
  access_notes: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  free_tier: z.boolean().nullable().optional(),
  login_required: z.boolean().nullable().optional(),
  paid_tier: z.boolean().nullable().optional(),
  company_id: z.string().nullable().optional(),
  is_public: z.boolean().nullable().optional(),
  created_at: z.string().nullable().optional(),
})

// TypeScript interfaces that match database schema
export interface FieldGuideSection {
  id: string
  section_number: number
  section_name: string
  slug: string
  intro?: string | null
  summary?: string | null
  use_cases?: string | null
  title?: string | null
  how_they_work?: string | null
  what_you_can_do?: string | null
  better_results?: string | null
  strengths?: string | null
  limitations?: string | null
  pro_tips?: string | null
  published?: boolean | null
  created_at?: string | null
  updated_at?: string | null
  toolCount?: number
}

export interface AITool {
  id: string
  name: string
  company?: string | null
  category: string
  description: string
  detailed_description?: string | null
  use_cases?: string | null
  access_notes?: string | null
  website?: string | null
  free_tier: boolean | null
  login_required: boolean | null
  paid_tier: boolean | null
  company_id?: string | null
  is_public: boolean | null
  created_at?: string | null
  // Structured detail fields
  tagline?: string | null
  model_type?: string | null
  access_method?: string | null
  pricing_breakdown?: string | null
  commercial_use_policy?: string | null
  training_data?: string | null
  workflow_notes?: string | null
  limitations?: string | null
  use_cases_list?: string[] | null
}

// Validation functions - return all data
export function validateSection(data: unknown): FieldGuideSection | null {
  if (data && typeof data === 'object' && (data as any).id) {
    return data as FieldGuideSection
  }
  return null
}

export function validateTool(data: unknown): AITool | null {
  if (data && typeof data === 'object' && (data as any).id) {
    return data as AITool
  }
  return null
}

export function validateSections(sections: unknown[]): FieldGuideSection[] {
  if (!Array.isArray(sections)) {
    return []
  }
  return sections as FieldGuideSection[]
}

export function validateTools(tools: unknown[]): AITool[] {
  if (!Array.isArray(tools)) {
    return []
  }
  return tools as AITool[]
}

// Safe data access helpers
export function safeToolName(tool: AITool): string {
  return tool.name || 'Unnamed Tool'
}

export function safeToolDescription(tool: AITool): string {
  return tool.description || tool.detailed_description || 'No description available'
}

export function safeToolCompany(tool: AITool): string {
  return tool.company || 'Unknown Company'
}

export function safeToolWebsite(tool: AITool): string | null {
  const website = tool.website
  if (!website || website === '') return null
  
  try {
    new URL(website.startsWith('http') ? website : `https://${website}`)
    return website
  } catch {
    return null
  }
}

export function safeToolCategory(tool: AITool): string {
  return tool.category || 'Uncategorized'
}

// Boolean helpers that handle null values
export function isFreeTier(tool: AITool): boolean {
  return tool.free_tier === true
}

export function isPaidTier(tool: AITool): boolean {
  return tool.paid_tier === true
}

export function requiresLogin(tool: AITool): boolean {
  return tool.login_required === true
}

export function isPublic(tool: AITool): boolean {
  return tool.is_public !== false
}

// Category mappings
const CATEGORY_MAPPING: Record<string, string> = {
  'AI Assistants': 'AI Assistants',
  'Image Generation': 'Image Generation',
  'Video Generation': 'Video Generation',
  'Music Creation': 'Music Creation',
  'Photo & Image Tools': 'Photo & Image Tools',
  'Video Editing': 'Video Editing',
  'AI Avatars': 'AI Avatars',
  'Speech & Voice': 'Speech & Voice',
  'Creative Writing & Storytelling': 'Creative Writing & Storytelling',
  'Productivity Tools': 'Productivity Tools',
  'AI Search Tools': 'AI Search Tools',
  'Education & Learning': 'Education & Learning',
  'Coding Assistants': 'Coding Assistants',
  'Automation Tools': 'Automation Tools',
  
  // Legacy mappings
  'Language Models': 'AI Assistants',
  'Music': 'Music Creation',
  'Music & Audio Tools': 'Music Creation',
  'AI Photo & Image Editors': 'Photo & Image Tools',
  'Image Editing': 'Photo & Image Tools',
  'Video Editing & Avatars': 'Video Editing',
  'Video Editing & AI Avatars': 'Video Editing',
  'Voice Synthesis': 'Speech & Voice',
  'AI Agents & Automation': 'Automation Tools',
  'Educational & Learning Tools': 'Education & Learning'
} as const

// Color mapping
const COLOR_MAPPING: Record<string, string> = {
  'ai-assistants': '#60A875',
  'image-generation': '#59B1E3',
  'video-generation': '#F7936F',
  'music-creation': '#F39C12',
  'photo-image-tools': '#9B59B6',
  'video-editing': '#E74C3C',
  'ai-avatars': '#8E44AD',
  'speech-voice': '#4A9B8E',
  'creative-writing-storytelling': '#8E44AD',
  'productivity-tools': '#27AE60',
  'ai-search-tools': '#3498DB',
  'education-learning': '#E67E22',
  'coding-assistants': '#3B82F6',
  'automation-tools': '#2ECC71',
  
  // Legacy mappings
  'language-models': '#60A875',
  'music': '#F39C12',
  'music-audio-tools': '#F39C12',
  'ai-photo-image-editors': '#9B59B6',
  'image-editing': '#9B59B6',
  'video-editing-avatars': '#E74C3C',
  'video-editing-ai-avatars': '#E74C3C',
  'voice-synthesis': '#4A9B8E',
  'ai-agents-automation': '#2ECC71',
  'educational-learning-tools': '#E67E22'
} as const

// Emoji mapping
const EMOJI_MAPPING: Record<string, string> = {
  'AI Assistants': '🤖',
  'Image Generation': '🎨',
  'Video Generation': '🎬',
  'Music Creation': '🎵',
  'Photo & Image Tools': '🖼️',
  'Video Editing': '🎞️',
  'AI Avatars': '👤',
  'Speech & Voice': '🎤',
  'Creative Writing & Storytelling': '✍️',
  'Productivity Tools': '⚡',
  'AI Search Tools': '🔍',
  'Education & Learning': '📚',
  'Coding Assistants': '💻',
  'Automation Tools': '🤖',
  
  // Legacy mappings
  'Language Models': '🤖',
  'Music': '🎵',
  'Music & Audio Tools': '🎵',
  'AI Photo & Image Editors': '🖼️',
  'Image Editing': '🖼️',
  'Video Editing & Avatars': '🎞️',
  'Video Editing & AI Avatars': '🎞️',
  'Voice Synthesis': '🎤',
  'AI Agents & Automation': '🤖',
  'Educational & Learning Tools': '📚'
} as const

// Utility functions with caching
const slugCache = new Map<string, string>()
const colorClassCache = new Map<string, { bg: string; text: string; border: string; suffix: string }>()

export function getCategoryForSection(sectionName: string): string {
  if (!sectionName || typeof sectionName !== 'string') {
    return 'AI Assistants'
  }
  return CATEGORY_MAPPING[sectionName] || sectionName
}

export function sectionNameToClassSuffix(sectionName: string): string {
  if (!sectionName || typeof sectionName !== 'string') {
    return 'ai-assistants'
  }
  
  if (slugCache.has(sectionName)) {
    return slugCache.get(sectionName)!
  }
  
  const suffix = sectionName
    .toLowerCase()
    .replace(/[&]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim()
  
  slugCache.set(sectionName, suffix)
  return suffix
}

export function getSectionColorClasses(sectionName: string) {
  if (!sectionName || typeof sectionName !== 'string') {
    return {
      bg: 'bg-category-ai-assistants',
      text: 'text-category-ai-assistants',
      border: 'border-category-ai-assistants',
      suffix: 'ai-assistants'
    }
  }

  if (colorClassCache.has(sectionName)) {
    return colorClassCache.get(sectionName)!
  }
  
  const suffix = sectionNameToClassSuffix(sectionName)
  
  const result = {
    bg: `bg-category-${suffix}`,
    text: `text-category-${suffix}`,
    border: `border-category-${suffix}`,
    suffix
  }
  
  colorClassCache.set(sectionName, result)
  return result
}

export function getSectionHexColor(sectionName: string): string {
  if (!sectionName || typeof sectionName !== 'string') {
    return '#60A875'
  }
  
  const suffix = sectionNameToClassSuffix(sectionName)
  return COLOR_MAPPING[suffix] || '#60A875'
}

export function getSectionEmoji(sectionName: string): string {
  if (!sectionName || typeof sectionName !== 'string') {
    return '🤖'
  }
  return EMOJI_MAPPING[sectionName] || '🤖'
}

// Safe getter functions
export function getSectionIntro(section: FieldGuideSection): string {
  return (
    section.intro || 
    section.summary || 
    `Discover ${section.section_name.toLowerCase()} AI tools and learn how to use them effectively in your workflow.`
  )
}

export function getToolDescription(tool: AITool): string {
  return tool.description || 'No description available.'
}

export function getToolUseCases(tool: AITool): string {
  return tool.use_cases || 'Use cases not specified.'
}

export function getToolAccessInfo(tool: AITool): {
  hasFree: boolean;
  hasPaid: boolean;
  requiresLogin: boolean;
  accessText: string;
} {
  const hasFree = tool.free_tier === true
  const hasPaid = tool.paid_tier === true
  const requiresLogin = tool.login_required === true

  let accessText = ''
  if (hasFree && hasPaid) {
    accessText = requiresLogin ? 'Free & paid tiers (account required)' : 'Free & paid tiers available'
  } else if (hasFree) {
    accessText = requiresLogin ? 'Free tier (account required)' : 'Free tier available'
  } else if (hasPaid) {
    accessText = 'Paid tier only'
  } else {
    accessText = 'Access information not available'
  }

  return { hasFree, hasPaid, requiresLogin, accessText }
}

// Helper types
export interface FieldGuideResponse {
  sections: FieldGuideSection[]
  totalTools: number
  metadata?: {
    lastUpdated: string
    version: string
  }
}

export interface SectionWithTools {
  section: FieldGuideSection
  tools: AITool[]
  stats?: {
    totalTools: number
    freeTools: number
    paidTools: number
  }
}

export interface SectionResponse {
  data: FieldGuideSection[]
  count: number
  error?: string
}

export interface ToolResponse {
  data: AITool[]
  count: number
  error?: string
}

export interface SearchFilters {
  query?: string
  categories?: string[]
  freeTier?: boolean | null
  paidTier?: boolean | null
  loginRequired?: boolean | null
  companies?: string[]
}

export interface SearchResult {
  tools: AITool[]
  totalCount: number
  hasMore: boolean
  filters: SearchFilters
  stats?: {
    categoryCounts: Record<string, number>
    companyCounts: Record<string, number>
  }
}

export interface SectionClientProps {
  initialData?: {
    section?: FieldGuideSection
    tools?: AITool[]
    sectionColor?: string
    sectionEmoji?: string
    error?: string
  }
}

export interface FieldGuideClientProps {
  initialData?: {
    sections?: FieldGuideSection[]
    totalTools?: number
    sectionCount?: number
    error?: string
  }
}

export type FieldGuideErrorType = 
  | 'SECTION_NOT_FOUND' 
  | 'TOOLS_LOAD_ERROR' 
  | 'INVALID_DATA' 
  | 'NETWORK_ERROR' 
  | 'VALIDATION_ERROR'
  | 'CACHE_ERROR'
  | 'UNKNOWN_ERROR'

export interface FieldGuideError {
  type: FieldGuideErrorType
  message: string
  details?: any
  timestamp?: number
  context?: string
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export interface PerformanceMetrics {
  loadTime: number
  cacheHitRate: number
  errorRate: number
  lastUpdated: number
}

// Constants
export const FIELD_GUIDE_CONSTANTS = {
  DEFAULT_SECTION_COLOR: '#60A875',
  DEFAULT_SECTION_EMOJI: '🤖',
  CACHE_TTL: 5 * 60 * 1000,
  MAX_SEARCH_RESULTS: 100,
  ITEMS_PER_PAGE: 20,
  MIN_SEARCH_LENGTH: 2,
} as const

export const EMPTY_SECTION: Partial<FieldGuideSection> = {
  id: '',
  section_number: 0,
  section_name: 'Unknown Section',
  slug: '',
  toolCount: 0,
  published: false
} as const

export const EMPTY_TOOL: Partial<AITool> = {
  id: '',
  name: 'Unknown Tool',
  category: 'AI Assistants',
  description: 'No description available.',
  free_tier: false,
  login_required: true,
  paid_tier: false,
  is_public: true
} as const

// Cache management utilities
export class FieldGuideCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private maxSize: number
  private defaultTTL: number

  constructor(maxSize = 100, defaultTTL = FIELD_GUIDE_CONSTANTS.CACHE_TTL) {
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
  }

  set(key: string, data: T, ttl = this.defaultTTL): void {
    this.cleanup()
    
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0,
      oldestEntry: Math.min(...Array.from(this.cache.values()).map(e => e.timestamp))
    }
  }
}