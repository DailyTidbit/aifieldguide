// src/app/lib/field-guide-api.ts
import { supabase } from './supabaseClient'
import { FieldGuideSection, AITool } from './field-guide-types'

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
  // This handles the final category names and provides backward compatibility
  static getCategoryForSection(sectionName: string): string {
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
      'Language Models': 'Language Models', // Will be updated to 'AI Assistants'
      'Music': 'Music', // Will be updated to 'Music Creation'
      'Music & Audio Tools': 'Music', // Maps to current ai_tools category
      'AI Photo & Image Editors': 'AI Photo & Image Editors', // Will be updated
      'Image Editing': 'AI Photo & Image Editors', // Current section name
      'Video Editing & Avatars': 'Video Editing & AI Avatars', // Current section name
      'Video Editing & AI Avatars': 'Video Editing & AI Avatars', // Current ai_tools category
      'Voice Synthesis': 'Voice Synthesis', // Will be updated to 'Speech & Voice'
      'AI Agents & Automation': 'AI Agents & Automation', // Will be updated to 'Automation Tools'
      'Educational & Learning Tools': 'Education & Learning' // Current section name
    }
    return mapping[sectionName] || sectionName
  }

  static async getToolsForSection(sectionName: string): Promise<AITool[]> {
    const category = this.getCategoryForSection(sectionName)
    
    const { data, error } = await supabase
      .from('ai_tools')
      .select('*') // This now includes detailed_description automatically
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

  // Get single tool by ID (now includes detailed_description)
  static async getToolById(toolId: string): Promise<AITool | null> {
    const { data, error } = await supabase
      .from('ai_tools')
      .select('*')
      .eq('id', toolId)
      .single()

    if (error) {
      console.log('Tool not found:', toolId)
      return null
    }
    return data
  }

  // Get tools by category directly (for flexibility)
  static async getToolsByCategory(category: string): Promise<AITool[]> {
    const { data, error } = await supabase
      .from('ai_tools')
      .select('*') // This now includes detailed_description automatically
      .eq('category', category)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  }

  // Get all tools (useful for search functionality)
  static async getAllTools(): Promise<AITool[]> {
    const { data, error } = await supabase
      .from('ai_tools')
      .select('*') // This now includes detailed_description automatically
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  }
}