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
