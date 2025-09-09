// app/lib/field-guide-types.ts - UPDATED based on actual database schema

export interface FieldGuideSection {
  id: string
  section_number: number
  section_name: string
  slug: string
  intro?: string
  summary?: string
  use_cases?: string
  title?: string
  // New fields from updated Supabase schema
  how_they_work?: string
  what_you_can_do?: string
  better_results?: string
  strengths?: string
  limitations?: string
  pro_tips?: string
  published?: boolean
  // Timestamps
  created_at?: string
  updated_at?: string
  // Add toolCount for the main page display
  toolCount?: number
}

// CORRECTED: Database actually stores booleans correctly
export interface AITool {
  id: string
  name: string
  company?: string
  category: string
  description: string
  detailed_description?: string
  use_cases?: string
  access_notes?: string
  website?: string
  // These are actual booleans in the database
  free_tier: boolean
  login_required: boolean
  paid_tier: boolean
  // New fields from actual schema
  company_id?: string | null
  is_public: boolean
  // Timestamps
  created_at?: string
}

// REMOVED: Raw tool interface - not needed since DB stores proper booleans
// The convertRawTool function was unnecessary complexity

// Keep existing category and color mappings...
const CATEGORY_MAPPING: Record<string, string> = {
  // FINAL preferred names
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
  
  // OLD names (backward compatibility)
  'Language Models': 'Language Models',
  'Music': 'Music',
  'Music & Audio Tools': 'Music',
  'AI Photo & Image Editors': 'AI Photo & Image Editors',
  'Image Editing': 'AI Photo & Image Editors',
  'Video Editing & Avatars': 'Video Editing & AI Avatars',
  'Video Editing & AI Avatars': 'Video Editing & AI Avatars',
  'Voice Synthesis': 'Voice Synthesis',
  'AI Agents & Automation': 'AI Agents & Automation',
  'Educational & Learning Tools': 'Education & Learning'
}

// CONSOLIDATED: Single source of truth for color mappings
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
  
  // Backward compatibility
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
}

// CONSOLIDATED: Single source of truth for emoji mappings
const EMOJI_MAPPING: Record<string, string> = {
  'AI Assistants': '💬',
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
  // Backward compatibility
  'Language Models': '💬',
  'Music': '🎵',
  'Music & Audio Tools': '🎵',
  'AI Photo & Image Editors': '🖼️',
  'Image Editing': '🖼️',
  'Video Editing & Avatars': '🎞️',
  'Video Editing & AI Avatars': '🎞️',
  'Voice Synthesis': '🎤',
  'AI Agents & Automation': '🤖',
  'Educational & Learning Tools': '📚'
}

// CENTRALIZED FUNCTIONS - Replace all scattered implementations

export function getCategoryForSection(sectionName: string): string {
  if (!sectionName || typeof sectionName !== 'string') {
    return 'Unknown'
  }
  return CATEGORY_MAPPING[sectionName] || sectionName
}

export function sectionNameToClassSuffix(sectionName: string): string {
  if (!sectionName || typeof sectionName !== 'string') {
    return 'ai-assistants' // Default fallback
  }
  
  return sectionName
    .toLowerCase()
    .replace(/[&]/g, '') // Remove &
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters except spaces
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

export function getSectionColorClasses(sectionName: string) {
  const suffix = sectionNameToClassSuffix(sectionName)
  
  return {
    bg: `bg-category-${suffix}`,
    text: `text-category-${suffix}`,
    border: `border-category-${suffix}`,
    suffix
  }
}

export function getSectionHexColor(sectionName: string): string {
  const suffix = sectionNameToClassSuffix(sectionName)
  return COLOR_MAPPING[suffix] || '#60A875'
}

export function getSectionEmoji(sectionName: string): string {
  if (!sectionName || typeof sectionName !== 'string') {
    return '🤖' // Default emoji
  }
  return EMOJI_MAPPING[sectionName] || '🤖'
}

// REMOVED: String boolean parsing - database has proper booleans

// REMOVED: Convert raw tool function - not needed with proper schema

// Helper types for API responses
export interface FieldGuideResponse {
  sections: FieldGuideSection[]
  totalTools: number
}

export interface SectionWithTools {
  section: FieldGuideSection
  tools: AITool[]
}

export interface SectionResponse {
  data: FieldGuideSection[]
  count: number
}

export interface ToolResponse {
  data: AITool[]
  count: number
}

// Search and filter types
export interface SearchFilters {
  query?: string
  categories?: string[]
  freeTier?: boolean
  loginRequired?: boolean
}

export interface SearchResult {
  tools: AITool[]
  totalCount: number
  hasMore: boolean
}

// Enhanced client component prop types
export interface SectionClientProps {
  initialData?: {
    section?: FieldGuideSection
    tools?: AITool[]
    sectionColor?: string
    sectionEmoji?: string
  }
}

export interface FieldGuideClientProps {
  initialData?: {
    sections?: FieldGuideSection[]
    totalTools?: number
    sectionCount?: number
  }
}

// Validation helpers as type guards
export function isValidSection(section: any): section is FieldGuideSection {
  return (
    section &&
    typeof section === 'object' &&
    typeof section.id === 'string' &&
    typeof section.section_name === 'string' &&
    typeof section.slug === 'string' &&
    typeof section.section_number === 'number' &&
    section.id.length > 0 &&
    section.section_name.length > 0 &&
    section.slug.length > 0
  )
}

export function isValidTool(tool: any): tool is AITool {
  return (
    tool &&
    typeof tool === 'object' &&
    typeof tool.id === 'string' &&
    typeof tool.name === 'string' &&
    typeof tool.category === 'string' &&
    typeof tool.description === 'string' &&
    typeof tool.free_tier === 'boolean' &&
    typeof tool.login_required === 'boolean' &&
    typeof tool.paid_tier === 'boolean' &&
    typeof tool.is_public === 'boolean' &&
    tool.id.length > 0 &&
    tool.name.length > 0 &&
    tool.category.length > 0
  )
}

// Validation helper for arrays
export function validateSections(sections: any[]): FieldGuideSection[] {
  if (!Array.isArray(sections)) {
    console.warn('validateSections: input is not an array', sections)
    return []
  }
  
  return sections.filter((section, index) => {
    const valid = isValidSection(section)
    if (!valid) {
      console.warn(`validateSections: invalid section at index ${index}`, section)
    }
    return valid
  })
}

export function validateTools(tools: any[]): AITool[] {
  if (!Array.isArray(tools)) {
    console.warn('validateTools: input is not an array', tools)
    return []
  }
  
  return tools.filter((tool, index) => {
    const valid = isValidTool(tool)
    if (!valid) {
      console.warn(`validateTools: invalid tool at index ${index}`, tool)
    }
    return valid
  })
}

// Safe getter functions for optional fields
export function getSectionIntro(section: FieldGuideSection): string {
  return section.intro || section.summary || `Learn about ${section.section_name.toLowerCase()} AI tools and how to use them effectively.`
}

export function getToolDescription(tool: AITool): string {
  return tool.description || 'No description available.'
}

export function getToolUseCases(tool: AITool): string {
  return tool.use_cases || 'Use cases not specified.'
}

// Error handling types
export interface FieldGuideError {
  type: 'SECTION_NOT_FOUND' | 'TOOLS_LOAD_ERROR' | 'INVALID_DATA' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR'
  message: string
  details?: any
}

// Default values
export const DEFAULT_SECTION_COLOR = 'brand-green'
export const DEFAULT_SECTION_EMOJI = '🤖'

export const EMPTY_SECTION: Partial<FieldGuideSection> = {
  id: '',
  section_number: 0,
  section_name: 'Unknown Section',
  slug: '',
  toolCount: 0
}

export const EMPTY_TOOL: Partial<AITool> = {
  id: '',
  name: 'Unknown Tool',
  category: '',
  description: 'No description available.',
  free_tier: false,
  login_required: true,
  paid_tier: false,
  is_public: true
}