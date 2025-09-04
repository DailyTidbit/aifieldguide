// app/lib/field-guide-server.ts - SCHEMA-AWARE VERSION

import { createServerClient } from './supabaseServer'
import { FieldGuideSection, AITool, AIToolRaw, convertRawTool, convertRawTools, validateRawTools } from './field-guide-types'

// Simple in-memory cache for server-side data
class ServerCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  
  set(key: string, data: any, ttlMs: number = 5 * 60 * 1000) { // 5 minutes default TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    })
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }
  
  clear() {
    this.cache.clear()
  }
  
  delete(key: string) {
    this.cache.delete(key)
  }
}

const cache = new ServerCache()

export class FieldGuideServerAPI {
  
  // Enhanced error handling wrapper
  private static async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string,
    maxRetries: number = 2
  ): Promise<T | null> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        console.error(`${context} - Attempt ${attempt}/${maxRetries} failed:`, error)
        
        // don&apos;t retry on certain errors
        if (error && typeof error === 'object' && 'code' in error) {
          const supabaseError = error as any
          if (supabaseError.code === 'PGRST116' || supabaseError.code === '42P01') {
            // Table doesn&apos;t exist or similar structural issues
            break
          }
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100))
        }
      }
    }
    
    console.error(`${context} - All attempts failed. Last error:`, lastError)
    return null
  }

  // Get section by slug with caching - includes published filter
  static async getSectionBySlug(slug: string): Promise<FieldGuideSection | null> {
    if (!slug || typeof slug !== 'string') {
      console.error('Invalid slug provided to getSectionBySlug:', slug)
      return null
    }

    const cacheKey = `section_${slug}`
    const cached = cache.get(cacheKey)
    if (cached) {
      return cached
    }

    const result = await this.executeWithRetry(async () => {
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
        .eq('published', true) // Only get published sections
        .single()

      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }

      if (!data || !data.section_name) {
        throw new Error('Invalid section data returned from database')
      }

      return data
    }, `getSectionBySlug(${slug})`)

    if (result) {
      cache.set(cacheKey, result, 10 * 60 * 1000) // Cache for 10 minutes
    }

    return result
  }

  // Get all published sections with tool counts
  static async getAllSectionsWithCounts(): Promise<FieldGuideSection[]> {
    const cacheKey = 'all_sections_with_counts'
    const cached = cache.get(cacheKey)
    if (cached && Array.isArray(cached)) {
      return cached
    }

    const result = await this.executeWithRetry(async () => {
      const supabase = createServerClient()
      
      // First get all published sections
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
        .eq('published', true) // Only get published sections
        .order('section_number')

      if (sectionsError) {
        throw new Error(`Error fetching sections: ${sectionsError.message}`)
      }

      if (!sections || !Array.isArray(sections)) {
        throw new Error('Invalid sections data returned')
      }

      // Get tool counts in batch for better performance
      const validSections = sections.filter(section => section && section.section_name)
      const sectionCategories = validSections.map(section => 
        this.getCategoryForSection(section.section_name)
      )

      // Single query to get all tool counts
      const { data: toolCounts, error: countError } = await supabase
        .from('ai_tools')
        .select('category')
        .in('category', sectionCategories)

      if (countError) {
        console.warn('Error fetching tool counts:', countError)
      }

      // Count tools by category
      const countsByCategory = (toolCounts || []).reduce((acc, tool) => {
        acc[tool.category] = (acc[tool.category] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Combine sections with their tool counts
      const sectionsWithCounts = validSections.map(section => ({
        ...section,
        toolCount: countsByCategory[this.getCategoryForSection(section.section_name)] || 0
      }))

      return sectionsWithCounts
    }, 'getAllSectionsWithCounts')

    if (result && Array.isArray(result)) {
      cache.set(cacheKey, result, 5 * 60 * 1000) // Cache for 5 minutes
      return result
    }

    return []
  }

  // Get tools for section with caching - only select existing columns
  static async getToolsForSection(sectionName: string): Promise<AITool[]> {
    if (!sectionName || typeof sectionName !== 'string') {
      console.error('Invalid sectionName provided to getToolsForSection:', sectionName)
      return []
    }

    const category = this.getCategoryForSection(sectionName)
    const cacheKey = `tools_${category}`
    const cached = cache.get(cacheKey)
    if (cached && Array.isArray(cached)) {
      return cached
    }

    const result = await this.executeWithRetry(async () => {
      const supabase = createServerClient()
      
      // Only select columns that exist in your ai_tools table
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
          created_at
        `)
        .eq('category', category)
        .order('name')

      if (error) {
        throw new Error(`Error fetching tools: ${error.message}`)
      }

      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid tools data returned')
      }

      // Process all tools from database, even if some fail validation
      const allTools = data || []
      console.log(`Processing ${allTools.length} tools from database`)
      
      // Convert all tools, with error handling for individual tools
      const convertedTools = allTools.map((rawTool, index) => {
        try {
          return convertRawTool(rawTool)
        } catch (error) {
          console.warn(`Error converting tool at index ${index}:`, error)
          return null
        }
      }).filter(Boolean) as AITool[]

      console.log(`Successfully converted ${convertedTools.length} tools`)
      return convertedTools
    }, `getToolsForSection(${sectionName})`)

    if (result && Array.isArray(result)) {
      cache.set(cacheKey, result, 10 * 60 * 1000) // Cache for 10 minutes
      return result
    }

    return []
  }

  // Get total tools count with caching
  static async getTotalToolsCount(): Promise<number> {
    const cacheKey = 'total_tools_count'
    const cached = cache.get(cacheKey)
    if (typeof cached === 'number') {
      return cached
    }

    const result = await this.executeWithRetry(async () => {
      const supabase = createServerClient()
      
      const { count, error } = await supabase
        .from('ai_tools')
        .select('id', { count: 'exact' })

      if (error) {
        throw new Error(`Error getting total tools count: ${error.message}`)
      }

      return count || 0
    }, 'getTotalToolsCount')

    if (typeof result === 'number') {
      cache.set(cacheKey, result, 5 * 60 * 1000) // Cache for 5 minutes
      return result
    }

    return 0
  }

  // Enhanced category mapping with validation
  static getCategoryForSection(sectionName: string): string {
    if (!sectionName || typeof sectionName !== 'string') {
      console.warn('Invalid sectionName provided to getCategoryForSection:', sectionName)
      return sectionName || 'Unknown'
    }

    const mapping: Record<string, string> = {
      // FINAL preferred names (after migration)
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
      
      // OLD names (backward compatibility during migration)
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
    
    const mappedCategory = mapping[sectionName] || sectionName
    
    if (!mapping[sectionName]) {
      console.warn(`No category mapping found for section: ${sectionName}, using original name`)
    }
    
    return mappedCategory
  }

  // Helper functions for colors and emojis (optimized)
  static getSectionColor(sectionName: string): string {
    if (!sectionName || typeof sectionName !== 'string') {
      return 'brand-green' // Default green
    }

    const colorMap: Record<string, string> = {
      'AI Assistants': 'brand-green',
      'Image Generation': 'brand-blue',
      'Video Generation': '#F7936F',
      'Music Creation': '#F39C12',
      'Photo & Image Tools': '#9B59B6',
      'Video Editing': '#E74C3C',
      'AI Avatars': '#8E44AD',
      'Speech & Voice': '#4A9B8E',
      'Creative Writing & Storytelling': '#8E44AD',
      'Productivity Tools': '#27AE60',
      'AI Search Tools': '#3498DB',
      'Education & Learning': '#E67E22',
      'Coding Assistants': '#3B82F6',
      'Automation Tools': '#2ECC71',
      // Backward compatibility
      'Language Models': 'brand-green',
      'Music': '#F39C12',
      'Music & Audio Tools': '#F39C12',
      'AI Photo & Image Editors': '#9B59B6',
      'Image Editing': '#9B59B6',
      'Video Editing & Avatars': '#E74C3C',
      'Video Editing & AI Avatars': '#E74C3C',
      'Voice Synthesis': '#4A9B8E',
      'AI Agents & Automation': '#2ECC71',
      'Educational & Learning Tools': '#E67E22'
    }
    return colorMap[sectionName] || 'brand-green'
  }

  static getSectionEmoji(sectionName: string): string {
    if (!sectionName || typeof sectionName !== 'string') {
      return '🤖' // Default emoji
    }

    const emojiMap: Record<string, string> = {
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
    return emojiMap[sectionName] || '🤖'
  }

  // Enhanced validation helpers
  static validateSectionData(section: any): section is FieldGuideSection {
    return (
      section &&
      typeof section === 'object' &&
      section.id &&
      section.section_name &&
      section.slug &&
      typeof section.section_number === 'number' &&
      section.id.length > 0 &&
      section.section_name.length > 0 &&
      section.slug.length > 0
    )
  }

  static validateToolData(tool: any): tool is AITool {
    return (
      tool &&
      typeof tool === 'object' &&
      tool.id &&
      tool.name &&
      tool.category &&
      typeof tool.free_tier === 'boolean' &&
      typeof tool.login_required === 'boolean' &&
      tool.id.length > 0 &&
      tool.name.length > 0 &&
      tool.category.length > 0
    )
  }

  // Cache management methods
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

  // Advanced search functionality - only select existing columns
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
    if (cached) {
      return cached
    }

    const result = await this.executeWithRetry(async () => {
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
          created_at
        `, { count: 'exact' })

      // Add search conditions
      const searchTerm = query.toLowerCase()
      queryBuilder = queryBuilder.or(
        `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%,use_cases.ilike.%${searchTerm}%`
      )

      // Add filters
      if (options.categories && options.categories.length > 0) {
        queryBuilder = queryBuilder.in('category', options.categories)
      }

      if (options.freeTierOnly) {
        queryBuilder = queryBuilder.eq('free_tier', 'true')
      }

      // Add pagination
      const limit = Math.min(options.limit || 50, 100) // Max 100 results
      const offset = options.offset || 0
      queryBuilder = queryBuilder.range(offset, offset + limit - 1)

      // Order by relevance (name matches first, then description)
      queryBuilder = queryBuilder.order('name')

      const { data, error, count } = await queryBuilder

      if (error) {
        throw new Error(`Search error: ${error.message}`)
      }

      const allTools = data || []
      const convertedTools = allTools.map((rawTool, index) => {
        try {
          return convertRawTool(rawTool)
        } catch (error) {
          console.warn(`Error converting search tool at index ${index}:`, error)
          return null
        }
      }).filter(Boolean) as AITool[]

      return {
        tools: convertedTools,
        totalCount: count || 0
      }
    }, `searchToolsAcrossCategories(${query})`)

    if (result) {
      cache.set(cacheKey, result, 2 * 60 * 1000) // Cache search results for 2 minutes
      return result
    }

    return { tools: [], totalCount: 0 }
  }

  // Get popular/featured tools - only select existing columns
  static async getFeaturedTools(limit: number = 6): Promise<AITool[]> {
    const cacheKey = `featured_tools_${limit}`
    const cached = cache.get(cacheKey)
    if (cached && Array.isArray(cached)) {
      return cached
    }

    const result = await this.executeWithRetry(async () => {
      const supabase = createServerClient()
      
      // For now, get tools that have websites and are free tier
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
          created_at
        `)
        .not('website', 'is', null)
        .eq('free_tier', 'true')
        .order('name')
        .limit(limit)

      if (error) {
        throw new Error(`Error fetching featured tools: ${error.message}`)
      }

      const allTools = data || []
      const convertedTools = allTools.map((rawTool, index) => {
        try {
          return convertRawTool(rawTool)
        } catch (error) {
          console.warn(`Error converting featured tool at index ${index}:`, error)
          return null
        }
      }).filter(Boolean) as AITool[]

      return convertedTools
    }, `getFeaturedTools(${limit})`)

    if (result && Array.isArray(result)) {
      cache.set(cacheKey, result, 15 * 60 * 1000) // Cache for 15 minutes
      return result
    }

    return []
  }

  // Health check method
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
          details: {
            error: error.message,
            responseTime
          }
        }
      }

      return {
        status: 'healthy',
        details: {
          responseTime,
          cacheSize: cache['cache'].size
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  }

  // Utility method to warm up cache
  static async warmUpCache(): Promise<void> {
    console.log('Warming up Field Guide cache...')
    
    try {
      // Warm up main data
      await Promise.allSettled([
        this.getAllSectionsWithCounts(),
        this.getTotalToolsCount(),
        this.getFeaturedTools()
      ])
      
      console.log('Field Guide cache warmed up successfully')
    } catch (error) {
      console.error('Error warming up cache:', error)
    }
  }

  // Method to get cache statistics
  static getCacheStats(): {
    size: number
    keys: string[]
    totalMemoryEstimate: string
  } {
    const cacheMap = cache['cache']
    const size = cacheMap.size
    const keys = Array.from(cacheMap.keys())
    
    // Rough memory estimate
    const totalMemoryEstimate = `~${Math.round(size * 50 / 1024)}KB` // Very rough estimate
    
    return {
      size,
      keys,
      totalMemoryEstimate
    }
  }
}
