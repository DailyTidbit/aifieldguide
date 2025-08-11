// app/lib/field-guide-types.ts - COMPATIBLE WITH EXISTING COMPONENTS

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

// Main AITool interface - keeps existing boolean interface for components
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
  // Keep as booleans for component compatibility
  free_tier: boolean
  login_required: boolean
  paid_tier?: boolean
  // Timestamps
  created_at?: string
}

// Raw database interface (what comes from Supabase)
export interface AIToolRaw {
  id: string
  name: string
  company?: string
  category: string
  description: string
  detailed_description?: string
  use_cases?: string
  access_notes?: string
  website?: string
  // These are strings in the database
  free_tier: string
  login_required: string
  paid_tier?: string
  created_at?: string
}

// Helper function to parse string booleans from database
export function parseStringBoolean(value: string | boolean | null | undefined): boolean {
  // Handle null/undefined
  if (value === null || value === undefined) return false
  
  // Already a boolean
  if (typeof value === 'boolean') return value
  
  // Handle string values
  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim()
    return normalized === 'true' || normalized === 'yes' || normalized === '1' || normalized === 'on'
  }
  
  // Handle other types (numbers, etc.)
  if (typeof value === 'number') return value !== 0
  
  // Default to false for unknown types
  return false
}

// Convert raw database tool to component-friendly format
export function convertRawTool(rawTool: AIToolRaw): AITool {
  try {
    return {
      id: rawTool.id,
      name: rawTool.name,
      company: rawTool.company,
      category: rawTool.category,
      description: rawTool.description,
      detailed_description: rawTool.detailed_description,
      use_cases: rawTool.use_cases,
      access_notes: rawTool.access_notes,
      website: rawTool.website,
      free_tier: parseStringBoolean(rawTool.free_tier),
      login_required: parseStringBoolean(rawTool.login_required),
      paid_tier: parseStringBoolean(rawTool.paid_tier),
      created_at: rawTool.created_at
    }
  } catch (error) {
    console.error('Error converting raw tool:', error, rawTool)
    // Return a safe fallback
    return {
      id: rawTool.id || 'unknown',
      name: rawTool.name || 'Unknown Tool',
      company: rawTool.company,
      category: rawTool.category || 'Unknown',
      description: rawTool.description || 'No description available',
      detailed_description: rawTool.detailed_description,
      use_cases: rawTool.use_cases,
      access_notes: rawTool.access_notes,
      website: rawTool.website,
      free_tier: false,
      login_required: true,
      paid_tier: false,
      created_at: rawTool.created_at
    }
  }
}

// Convert array of raw tools
export function convertRawTools(rawTools: AIToolRaw[]): AITool[] {
  return rawTools.map(convertRawTool)
}

export interface FieldGuideResponse {
  sections: FieldGuideSection[]
  totalTools: number
}

export interface SectionWithTools {
  section: FieldGuideSection
  tools: AITool[]
}

// Helper types for API responses
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
    tool.id.length > 0 &&
    tool.name.length > 0 &&
    tool.category.length > 0
  )
}

export function isValidRawTool(tool: any): tool is AIToolRaw {
  // More lenient validation for real-world database data
  try {
    return (
      tool &&
      typeof tool === 'object' &&
      typeof tool.id === 'string' &&
      typeof tool.name === 'string' &&
      typeof tool.category === 'string' &&
      typeof tool.description === 'string' &&
      // Allow string boolean fields (your database format)
      (typeof tool.free_tier === 'string' || typeof tool.free_tier === 'boolean') &&
      (typeof tool.login_required === 'string' || typeof tool.login_required === 'boolean') &&
      tool.id.length > 0 &&
      tool.name.length > 0 &&
      tool.category.length > 0 &&
      tool.description.length > 0
      // Don't validate detailed_description length since it can be very long
    )
  } catch (error) {
    console.warn('Error validating tool:', error)
    return false
  }
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

export function validateRawTools(tools: any[]): AIToolRaw[] {
  if (!Array.isArray(tools)) {
    console.warn('validateRawTools: input is not an array', tools)
    return []
  }
  
  return tools.filter((tool, index) => {
    const valid = isValidRawTool(tool)
    if (!valid) {
      // More detailed logging for debugging
      console.warn(`validateRawTools: invalid tool at index ${index}:`, {
        id: tool?.id || 'missing',
        name: tool?.name || 'missing', 
        category: tool?.category || 'missing',
        hasDescription: !!tool?.description,
        free_tier_type: typeof tool?.free_tier,
        login_required_type: typeof tool?.login_required
      })
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
export const DEFAULT_SECTION_COLOR = '#60A875'
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
  login_required: true
}