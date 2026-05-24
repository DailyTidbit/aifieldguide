// app/lib/field-guide-server.ts - SIMPLIFIED VERSION based on actual database schema

import { createServerClient } from './supabaseServer'
import { 
  FieldGuideSection, 
  AITool, 
  getCategoryForSection,
  getSectionHexColor,
  getSectionEmoji,
  validateSections,
  validateTools
} from './field-guide-types'

// SIMPLIFIED: Basic cache with reasonable limits
interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
}

class SimpleServerCache {
  private cache = new Map<string, CacheEntry>()
  private readonly maxSize = 100
  private readonly defaultTtl = 5 * 60 * 1000 // 5 minutes
  
  set(key: string, data: any, ttlMs: number = this.defaultTtl) {
    // Simple size management
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    })
  }
  
  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }
  
  clear() {
    this.cache.clear()
  }
  
  delete(key: string) {
    return this.cache.delete(key)
  }
}

const cache = new SimpleServerCache()

export class FieldGuideServerAPI {
  
  // SIMPLIFIED: Basic error handling
  private static async executeQuery<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T | null> {
    try {
      return await operation()
    } catch (error) {
      const msg = error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null
          ? JSON.stringify(error)
          : String(error)
      console.error(`${context} failed: ${msg}`)
      return null
    }
  }

  // Get section by slug with basic caching
  static async getSectionBySlug(slug: string): Promise<FieldGuideSection | null> {
    if (!slug || typeof slug !== 'string') {
      console.error('Invalid slug provided to getSectionBySlug:', slug)
      return null
    }

    const cacheKey = `section_${slug}`
    const cached = cache.get(cacheKey)
    if (cached) return cached

    const result = await this.executeQuery(async () => {
      const supabase = createServerClient()
      
      const { data, error } = await supabase
        .from('field_guide_sections')
        .select(`
          id,
          section_number,
          section_name,
          slug,
          intro,
          summary,
          use_cases,
          how_they_work,
          what_you_can_do,
          better_results,
          strengths,
          limitations,
          pro_tips,
          title,
          published,
          created_at,
          updated_at
        `)
        .eq('slug', slug)
        .eq('published', true)
        .single()

      if (error) throw error
      return data
    }, `getSectionBySlug(${slug})`)

    if (result) {
      cache.set(cacheKey, result, 15 * 60 * 1000) // 15 minutes
    }

    return result
  }

  // Get all published sections with tool counts
  static async getAllSectionsWithCounts(): Promise<FieldGuideSection[]> {
    const cacheKey = 'all_sections_with_counts'
    const cached = cache.get(cacheKey)
    if (cached && Array.isArray(cached)) return cached

    const result = await this.executeQuery(async () => {
      const supabase = createServerClient()
      
      // Get all published sections
      const { data: sections, error: sectionsError } = await supabase
        .from('field_guide_sections')
        .select(`
          id,
          section_number,
          section_name,
          slug,
          intro,
          summary,
          use_cases,
          how_they_work,
          what_you_can_do,
          better_results,
          strengths,
          limitations,
          pro_tips,
          title,
          published,
          created_at,
          updated_at
        `)
        .eq('published', true)
        .order('section_number')

      if (sectionsError) throw sectionsError

      const validSections = validateSections(sections || [])

      // Get tool counts by category
      const sectionCategories = validSections.map(section => 
        getCategoryForSection(section.section_name)
      )

      const { data: toolCounts, error: countError } = await supabase
        .from('ai_tools')
        .select('category')
        .eq('is_public', true)
        .in('category', sectionCategories)

      if (countError) {
        console.warn('Error fetching tool counts:', countError)
      }

      // Count tools by category
      const countsByCategory = (toolCounts || []).reduce((acc, tool) => {
        acc[tool.category] = (acc[tool.category] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Add tool counts to sections
      return validSections.map(section => ({
        ...section,
        toolCount: countsByCategory[getCategoryForSection(section.section_name)] || 0
      }))
    }, 'getAllSectionsWithCounts')

    if (result && Array.isArray(result)) {
      cache.set(cacheKey, result, 8 * 60 * 1000) // 8 minutes
      return result
    }

    return []
  }

  // Get tools for section - SIMPLIFIED without conversion since DB has proper types
  static async getToolsForSection(sectionName: string): Promise<AITool[]> {
    if (!sectionName || typeof sectionName !== 'string') {
      console.error('Invalid sectionName provided to getToolsForSection:', sectionName)
      return []
    }

    const category = getCategoryForSection(sectionName)
    const cacheKey = `tools_${category}`
    const cached = cache.get(cacheKey)
    if (cached && Array.isArray(cached)) return cached

    const result = await this.executeQuery(async () => {
      const supabase = createServerClient()
      
      const { data, error } = await supabase
        .from('ai_tools')
        .select(`
          id,
          name,
          company,
          category,
          description,
          detailed_description,
          use_cases,
          access_notes,
          website,
          free_tier,
          login_required,
          paid_tier,
          company_id,
          is_public,
          created_at
        `)
        .eq('category', category)
        .eq('is_public', true)
        .order('name')

      if (error) throw error

      // SIMPLIFIED: No conversion needed - database has proper types
      return validateTools(data || [])
    }, `getToolsForSection(${sectionName})`)

    if (result && Array.isArray(result)) {
      cache.set(cacheKey, result, 12 * 60 * 1000) // 12 minutes
      return result
    }

    return []
  }

  // Get total tools count
  static async getTotalToolsCount(): Promise<number> {
    const cacheKey = 'total_tools_count'
    const cached = cache.get(cacheKey)
    if (typeof cached === 'number') return cached

    const result = await this.executeQuery(async () => {
      const supabase = createServerClient()
      
      const { count, error } = await supabase
        .from('ai_tools')
        .select('id', { count: 'exact' })
        .eq('is_public', true)

      if (error) throw error
      return count || 0
    }, 'getTotalToolsCount')

    if (typeof result === 'number') {
      cache.set(cacheKey, result, 5 * 60 * 1000) // 5 minutes
      return result
    }

    return 0
  }

  // Get tool by ID
  static async getToolById(toolId: string): Promise<AITool | null> {
    if (!toolId || typeof toolId !== 'string') return null

    const cacheKey = `tool_${toolId}`
    const cached = cache.get(cacheKey)
    if (cached) return cached

    const result = await this.executeQuery(async () => {
      const supabase = createServerClient()
      
      const { data, error } = await supabase
        .from('ai_tools')
        .select(`
          id,
          name,
          company,
          category,
          description,
          detailed_description,
          use_cases,
          access_notes,
          website,
          free_tier,
          login_required,
          paid_tier,
          company_id,
          is_public,
          created_at
        `)
        .eq('id', toolId)
        .eq('is_public', true)
        .single()

      if (error) throw error
      return data
    }, `getToolById(${toolId})`)

    if (result) {
      cache.set(cacheKey, result, 10 * 60 * 1000) // 10 minutes
    }

    return result
  }

  // Search tools across categories - SIMPLIFIED
  static async searchToolsAcrossCategories(
    query: string,
    options: {
      categories?: string[]
      freeTierOnly?: boolean
      limit?: number
      offset?: number
    } = {}
  ): Promise<{ tools: AITool[]; totalCount: number }> {
    if (!query || query.trim().length < 2) {
      return { tools: [], totalCount: 0 }
    }

    const cacheKey = `search_${query}_${JSON.stringify(options)}`
    const cached = cache.get(cacheKey)
    if (cached) return cached

    const result = await this.executeQuery(async () => {
      const supabase = createServerClient()
      
      let queryBuilder = supabase
        .from('ai_tools')
        .select(`
          id,
          name,
          company,
          category,
          description,
          detailed_description,
          use_cases,
          access_notes,
          website,
          free_tier,
          login_required,
          paid_tier,
          company_id,
          is_public,
          created_at
        `, { count: 'exact' })
        .eq('is_public', true)

      const searchTerm = query.toLowerCase()
      queryBuilder = queryBuilder.or(
        `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%,use_cases.ilike.%${searchTerm}%,detailed_description.ilike.%${searchTerm}%`
      )

      if (options.categories && options.categories.length > 0) {
        queryBuilder = queryBuilder.in('category', options.categories)
      }

      if (options.freeTierOnly) {
        queryBuilder = queryBuilder.eq('free_tier', true)
      }

      const limit = Math.min(options.limit || 50, 100)
      const offset = options.offset || 0
      queryBuilder = queryBuilder.range(offset, offset + limit - 1)
      queryBuilder = queryBuilder.order('name')

      const { data, error, count } = await queryBuilder

      if (error) throw error

      return {
        tools: validateTools(data || []),
        totalCount: count || 0
      }
    }, `searchToolsAcrossCategories(${query})`)

    if (result) {
      cache.set(cacheKey, result, 2 * 60 * 1000) // 2 minutes
      return result
    }

    return { tools: [], totalCount: 0 }
  }

  // Get featured tools
  static async getFeaturedTools(limit: number = 6): Promise<AITool[]> {
    const cacheKey = `featured_tools_${limit}`
    const cached = cache.get(cacheKey)
    if (cached && Array.isArray(cached)) return cached

    const result = await this.executeQuery(async () => {
      const supabase = createServerClient()
      
      const { data, error } = await supabase
        .from('ai_tools')
        .select(`
          id,
          name,
          company,
          category,
          description,
          detailed_description,
          use_cases,
          access_notes,
          website,
          free_tier,
          login_required,
          paid_tier,
          company_id,
          is_public,
          created_at
        `)
        .eq('is_public', true)
        .eq('free_tier', true)
        .not('website', 'is', null)
        .order('name')
        .limit(limit)

      if (error) throw error
      return validateTools(data || [])
    }, `getFeaturedTools(${limit})`)

    if (result && Array.isArray(result)) {
      cache.set(cacheKey, result, 20 * 60 * 1000) // 20 minutes
      return result
    }

    return []
  }

  // Helper functions
  static getSectionColor(sectionName: string): string {
    return getSectionHexColor(sectionName)
  }

  static getSectionEmoji(sectionName: string): string {
    return getSectionEmoji(sectionName)
  }

  // Cache management
  static clearCache() {
    cache.clear()
  }

  static invalidateSectionCache(slug?: string) {
    if (slug) {
      cache.delete(`section_${slug}`)
    }
    cache.delete('all_sections_with_counts')
  }

  static invalidateToolsCache(category?: string) {
    if (category) {
      cache.delete(`tools_${category}`)
    }
    cache.delete('total_tools_count')
  }

  // Health check
  static async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const startTime = Date.now()
      const supabase = createServerClient()
      
      const { data, error } = await supabase
        .from('field_guide_sections')
        .select('id')
        .limit(1)

      const responseTime = Date.now() - startTime

      if (error) {
        return {
          status: 'unhealthy',
          details: { error: error.message, responseTime }
        }
      }

      return {
        status: 'healthy',
        details: { responseTime, environment: process.env.NODE_ENV }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }
}