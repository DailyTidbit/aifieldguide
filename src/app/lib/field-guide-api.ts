// src/app/lib/field-guide-api.ts
import { supabase } from './supabaseClient'
import { FieldGuideSection, AITool, ToolDetail } from './field-guide-types'

export class FieldGuideAPI {
  static async getAllSections(): Promise<FieldGuideSection[]> {
    const { data, error } = await supabase
      .from('field_guide_sections')
      .select('*')
      .order('section_number', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async getSectionBySlug(slug: string): Promise<FieldGuideSection | null> {
    const { data, error } = await supabase
      .from('field_guide_sections')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) return null
    return data
  }

  // Map section names to the tool categories in your database
  static getCategoryForSection(sectionName: string): string {
    const mapping: Record<string, string> = {
      'Language Models': 'Language Models',
      'Image Generation': 'Image Generation',
      'Video Generation': 'Video Generation', 
      'Voice Synthesis': 'Voice Synthesis',
      'Image Editing': 'Image Editing',
      'Video Editing & Avatars': 'Video Editing & Avatars',
      'Music & Audio Tools': 'Music', // Note: your DB has "Music" not "Music & Audio Tools"
      'AI Agents & Automation': 'AI Agents & Automation',
      'AI Search Tools': 'AI Search Tools',
      'Educational & Learning Tools': 'Education & Learning' // Note: your DB has "Education & Learning"
    }
    return mapping[sectionName] || sectionName
  }

  static async getToolsForSection(sectionName: string): Promise<AITool[]> {
    const category = this.getCategoryForSection(sectionName)
    
    const { data, error } = await supabase
      .from('ai_tools')
      .select('*')
      .eq('category', category)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async getAllToolsCount(): Promise<number> {
    const { count, error } = await supabase
      .from('ai_tools')
      .select('*', { count: 'exact', head: true })

    if (error) return 0
    return count || 0
  }

  // NEW: Get tool details
  static async getToolDetails(toolId: string): Promise<ToolDetail | null> {
    const { data, error } = await supabase
      .from('tool_details')
      .select('*')
      .eq('tool_id', toolId)
      .single()

    if (error) {
      console.log('No details found for tool:', toolId)
      return null
    }
    return data
  }

  // NEW: Get tool with details
  static async getToolWithDetails(toolId: string): Promise<{ tool: AITool; details: ToolDetail | null }> {
    const [toolResult, detailsResult] = await Promise.all([
      supabase.from('ai_tools').select('*').eq('id', toolId).single(),
      this.getToolDetails(toolId)
    ])

    if (toolResult.error) throw toolResult.error
    
    return {
      tool: toolResult.data,
      details: detailsResult
    }
  }

  // Added method for getting tools by category directly (for flexibility)
  static async getToolsByCategory(category: string): Promise<AITool[]> {
    const { data, error } = await supabase
      .from('ai_tools')
      .select('*')
      .eq('category', category)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  }
}