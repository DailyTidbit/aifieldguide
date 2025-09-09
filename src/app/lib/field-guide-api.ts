// src/app/lib/field-guide-api.ts - SIMPLIFIED VERSION for actual database schema
'use client'

import { getSupabaseBrowserClient } from './supabaseClient'
import { FieldGuideSection, AITool, getCategoryForSection, validateTools, validateSections } from './field-guide-types'

export class FieldGuideAPI {
  private static isInitialized = false
  private static mounted = false

  // Safe Supabase client getter
  private static getClient() {
    try {
      return getSupabaseBrowserClient()
    } catch (error) {
      console.warn('Supabase client not available:', error)
      return null
    }
  }

  // Initialize only in browser
  private static async ensureInitialized(): Promise<boolean> {
    if (typeof window === 'undefined') return false
    if (!this.mounted) return false

    if (!this.isInitialized) {
      try {
        const client = this.getClient()
        if (!client) return false

        // Verify client is ready
        const { data, error } = await client.auth.getSession()
        this.isInitialized = true
      } catch (error) {
        console.warn('Field Guide API initialization failed:', error)
        return false
      }
    }

    return this.isInitialized
  }

  static setMounted(mounted: boolean = true) {
    this.mounted = mounted
  }

  static async getAllSections(): Promise<FieldGuideSection[]> {
    if (!(await this.ensureInitialized())) return []

    const client = this.getClient()
    if (!client) return []

    try {
      const { data, error } = await client
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
        .order('section_number', { ascending: true })

      if (error) throw error
      return validateSections(data || [])
    } catch (error) {
      console.error('Error fetching sections:', error)
      return []
    }
  }

  static async getSectionBySlug(slug: string): Promise<FieldGuideSection | null> {
    if (!(await this.ensureInitialized()) || !slug) return null

    const client = this.getClient()
    if (!client) return null

    try {
      const { data, error } = await client
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

      if (error) return null
      return data
    } catch (error) {
      console.error('Error fetching section by slug:', error)
      return null
    }
  }

  static async getToolsForSection(sectionName: string): Promise<AITool[]> {
    if (!(await this.ensureInitialized()) || !sectionName) return []

    const client = this.getClient()
    if (!client) return []

    const category = getCategoryForSection(sectionName)
    
    try {
      const { data, error } = await client
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
        .order('name', { ascending: true })

      if (error) throw error
      return validateTools(data || [])
    } catch (error) {
      console.error('Error fetching tools for section:', error)
      return []
    }
  }

  static async getAllToolsCount(): Promise<number> {
    if (!(await this.ensureInitialized())) return 0

    const client = this.getClient()
    if (!client) return 0

    try {
      const { count, error } = await client
        .from('ai_tools')
        .select('*', { count: 'exact', head: true })
        .eq('is_public', true)

      if (error) return 0
      return count || 0
    } catch (error) {
      console.error('Error getting tools count:', error)
      return 0
    }
  }

  static async getToolById(toolId: string): Promise<AITool | null> {
    if (!(await this.ensureInitialized()) || !toolId) return null

    const client = this.getClient()
    if (!client) return null

    try {
      const { data, error } = await client
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

      if (error) {
        console.log('Tool not found:', toolId)
        return null
      }
      return data
    } catch (error) {
      console.error('Error fetching tool by ID:', error)
      return null
    }
  }

  static async getToolsByCategory(category: string): Promise<AITool[]> {
    if (!(await this.ensureInitialized()) || !category) return []

    const client = this.getClient()
    if (!client) return []

    try {
      const { data, error } = await client
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
        .order('name', { ascending: true })

      if (error) throw error
      return validateTools(data || [])
    } catch (error) {
      console.error('Error fetching tools by category:', error)
      return []
    }
  }

  static async getAllTools(): Promise<AITool[]> {
    if (!(await this.ensureInitialized())) return []

    const client = this.getClient()
    if (!client) return []

    try {
      const { data, error } = await client
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
        .order('name', { ascending: true })

      if (error) throw error
      return validateTools(data || [])
    } catch (error) {
      console.error('Error fetching all tools:', error)
      return []
    }
  }

  // Utility methods
  static isReady(): boolean {
    return typeof window !== 'undefined' && this.mounted && this.isInitialized
  }

  static isClientAvailable(): boolean {
    return typeof window !== 'undefined' && this.getClient() !== null
  }
}

// React hook for hydration-safe Field Guide API usage
import { useState, useEffect } from 'react'

export function useFieldGuideAPI() {
  const [mounted, setMounted] = useState(false)
  const [clientReady, setClientReady] = useState(false)

  useEffect(() => {
    setMounted(true)
    FieldGuideAPI.setMounted(true)
    
    const checkClient = () => {
      const ready = FieldGuideAPI.isClientAvailable()
      setClientReady(ready)
    }
    
    checkClient()
    
    const interval = setInterval(checkClient, 1000)
    
    return () => {
      FieldGuideAPI.setMounted(false)
      clearInterval(interval)
    }
  }, [])

  // Return API only when mounted and ready
  if (!mounted || !clientReady) {
    return {
      getAllSections: async () => [],
      getSectionBySlug: async () => null,
      getToolsForSection: async () => [],
      getAllToolsCount: async () => 0,
      getToolById: async () => null,
      getToolsByCategory: async () => [],
      getAllTools: async () => [],
      isReady: () => false,
      mounted,
      clientReady
    }
  }

  return {
    ...FieldGuideAPI,
    mounted,
    clientReady
  }
}

// Alternative hook using existing Supabase hooks
import { useSupabaseBrowser } from './supabaseClient'

export function useFieldGuideAPIWithClient() {
  const { client, isReady, mounted } = useSupabaseBrowser()
  const [apiReady, setApiReady] = useState(false)

  useEffect(() => {
    if (mounted && isReady) {
      FieldGuideAPI.setMounted(true)
      setApiReady(true)
    }

    return () => {
      if (mounted) {
        FieldGuideAPI.setMounted(false)
        setApiReady(false)
      }
    }
  }, [mounted, isReady])

  // Return safe API functions
  const safeAPI = {
    getAllSections: async () => {
      if (!apiReady || !client) return []
      return FieldGuideAPI.getAllSections()
    },
    
    getSectionBySlug: async (slug: string) => {
      if (!apiReady || !client || !slug) return null
      return FieldGuideAPI.getSectionBySlug(slug)
    },
    
    getToolsForSection: async (sectionName: string) => {
      if (!apiReady || !client || !sectionName) return []
      return FieldGuideAPI.getToolsForSection(sectionName)
    },
    
    getAllToolsCount: async () => {
      if (!apiReady || !client) return 0
      return FieldGuideAPI.getAllToolsCount()
    },
    
    getToolById: async (toolId: string) => {
      if (!apiReady || !client || !toolId) return null
      return FieldGuideAPI.getToolById(toolId)
    },
    
    getToolsByCategory: async (category: string) => {
      if (!apiReady || !client || !category) return []
      return FieldGuideAPI.getToolsByCategory(category)
    },
    
    getAllTools: async () => {
      if (!apiReady || !client) return []
      return FieldGuideAPI.getAllTools()
    },
    
    isReady: () => apiReady && !!client,
    mounted,
    clientReady: !!client
  }

  return safeAPI
}