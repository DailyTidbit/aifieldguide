// app/lib/field-guide-server.ts - SERVER UTILITY FOR FIELD GUIDE
import { createServerClient } from './supabaseServer'

export interface FieldGuideSection {
  id: string
  section_number: number
  section_name: string
  slug: string
  intro?: string
  summary?: string
  use_cases?: string
  created_at?: string
  updated_at?: string
}

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
  free_tier: boolean
  login_required: boolean
  created_at?: string
  updated_at?: string
}

// Server-side field guide operations
export class FieldGuideServerAPI {
  
  // Get all sections with tool counts
  static async getAllSectionsWithCounts(): Promise<(FieldGuideSection & { toolCount: number })[]> {
    const supabase = createServerClient()
    
    try {
      // Get all sections
      const { data: sections, error: sectionsError } = await supabase
        .from('field_guide_sections')
        .select('*')
        .order('section_number', { ascending: true })

      if (sectionsError) throw sectionsError

      // Get tool counts for each section
      const sectionsWithCounts = await Promise.all(
        (sections || []).map(async (section) => {
          const category = this.getCategoryForSection(section.section_name)
          
          const { count } = await supabase
            .from('ai_tools')
            .select('*', { count: 'exact', head: true })
            .eq('category', category)

          return {
            ...section,
            toolCount: count || 0
          }
        })
      )

      return sectionsWithCounts
    } catch (error) {
      console.error('Error fetching sections with counts:', error)
      return []
    }
  }

  // Get section by slug
  static async getSectionBySlug(slug: string): Promise<FieldGuideSection | null> {
    const supabase = createServerClient()
    
    try {
      const { data, error } = await supabase
        .from('field_guide_sections')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) return null
      return data
    } catch (error) {
      console.error('Error fetching section by slug:', error)
      return null
    }
  }

  // Get tools for a section
  static async getToolsForSection(sectionName: string): Promise<AITool[]> {
    const supabase = createServerClient()
    const category = this.getCategoryForSection(sectionName)
    
    try {
      const { data, error } = await supabase
        .from('ai_tools')
        .select('*')
        .eq('category', category)
        .order('name', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching tools for section:', error)
      return []
    }
  }

  // Get total tools count
  static async getTotalToolsCount(): Promise<number> {
    const supabase = createServerClient()
    
    try {
      const { count, error } = await supabase
        .from('ai_tools')
        .select('*', { count: 'exact', head: true })

      if (error) return 0
      return count || 0
    } catch (error) {
      console.error('Error fetching total tools count:', error)
      return 0
    }
  }

  // Map section names to tool categories (same logic as your client version)
  static getCategoryForSection(sectionName: string): string {
    const mapping: Record<string, string> = {
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
    return mapping[sectionName] || sectionName
  }

  // Helper functions for UI (can be used server-side for metadata)
  static getSectionEmoji(sectionName: string): string {
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
      
      // OLD names
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

  static getSectionColor(sectionName: string): string {
    const colorMap: Record<string, string> = {
      'AI Assistants': '#60A875',
      'Image Generation': '#59B1E3',
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
      
      // OLD names
      'Language Models': '#60A875',
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
    return colorMap[sectionName] || '#60A875'
  }
}