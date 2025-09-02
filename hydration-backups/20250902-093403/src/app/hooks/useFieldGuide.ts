// src/app/hooks/useFieldGuide.ts
import { useState, useEffect } from 'react'
import { FieldGuideSection, AITool } from '../lib/field-guide-types'
import { FieldGuideAPI } from '../lib/field-guide-api'

// Hook for getting all sections and total tools count
export function useFieldGuide() {
  const [sections, setSections] = useState<FieldGuideSection[]>([])
  const [totalTools, setTotalTools] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [sectionsData, toolsCount] = await Promise.all([
          FieldGuideAPI.getAllSections(),
          FieldGuideAPI.getAllToolsCount()
        ])
        
        setSections(sectionsData)
        setTotalTools(toolsCount)
      } catch (error) {
        console.error('Error fetching field guide data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { sections, totalTools, loading }
}

// Hook for getting a specific section and its tools
export function useSection(slug: string) {
  const [section, setSection] = useState<FieldGuideSection | null>(null)
  const [tools, setTools] = useState<AITool[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return

    async function fetchSectionData() {
      try {
        setLoading(true)
        
        const sectionData = await FieldGuideAPI.getSectionBySlug(slug)
        setSection(sectionData)
        
        if (sectionData) {
          // Get tools for this section - detailed_description is now included automatically
          const toolsData = await FieldGuideAPI.getToolsForSection(sectionData.section_name)
          setTools(toolsData)
        }
      } catch (error) {
        console.error('Error fetching section data:', error)
        setSection(null)
        setTools([])
      } finally {
        setLoading(false)
      }
    }

    fetchSectionData()
  }, [slug])

  return { section, tools, loading }
}

// Hook for getting a specific tool by ID
export function useTool(toolId: string) {
  const [tool, setTool] = useState<AITool | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!toolId) return

    async function fetchTool() {
      try {
        setLoading(true)
        
        // Tool now includes detailed_description automatically
        const toolData = await FieldGuideAPI.getToolById(toolId)
        setTool(toolData)
      } catch (error) {
        console.error('Error fetching tool:', error)
        setTool(null)
      } finally {
        setLoading(false)
      }
    }

    fetchTool()
  }, [toolId])

  return { tool, loading }
}

// Hook for searching tools across all categories
export function useToolSearch() {
  const [allTools, setAllTools] = useState<AITool[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAllTools() {
      try {
        setLoading(true)
        
        // Get all tools - detailed_description is now included automatically
        const toolsData = await FieldGuideAPI.getAllTools()
        setAllTools(toolsData)
      } catch (error) {
        console.error('Error fetching all tools:', error)
        setAllTools([])
      } finally {
        setLoading(false)
      }
    }

    fetchAllTools()
  }, [])

  const searchTools = (query: string): AITool[] => {
    if (!query.trim()) return allTools

    const lowercaseQuery = query.toLowerCase()
    return allTools.filter(tool => 
      tool.name.toLowerCase().includes(lowercaseQuery) ||
      tool.description?.toLowerCase().includes(lowercaseQuery) ||
      tool.company?.toLowerCase().includes(lowercaseQuery) ||
      tool.category.toLowerCase().includes(lowercaseQuery) ||
      tool.detailed_description?.toLowerCase().includes(lowercaseQuery) ||
      tool.use_cases?.toLowerCase().includes(lowercaseQuery)
    )
  }

  return { allTools, searchTools, loading }
}