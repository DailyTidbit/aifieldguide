// src/app/hooks/useFieldGuide.ts - FIXED VERSION
import { useState, useEffect, useCallback, useMemo } from 'react'
import { FieldGuideSection, AITool } from '../lib/field-guide-types'
import { FieldGuideAPI } from '../lib/field-guide-api'
import { useMounted } from '../lib/clientUtils'

interface UseFieldGuideState {
  sections: FieldGuideSection[]
  totalTools: number
  loading: boolean
  error: string | null
}

interface UseSectionState {
  section: FieldGuideSection | null
  tools: AITool[]
  loading: boolean
  error: string | null
}

interface UseToolState {
  tool: AITool | null
  loading: boolean
  error: string | null
}

interface UseToolSearchState {
  allTools: AITool[]
  loading: boolean
  error: string | null
}

// Custom hook for auto-clearing error messages
function useAutoErrorClear(error: string | null, delay = 5000) {
  const [clearableError, setClearableError] = useState<string | null>(null)

  useEffect(() => {
    if (error) {
      setClearableError(error)
      const timer = setTimeout(() => setClearableError(null), delay)
      return () => clearTimeout(timer)
    } else {
      setClearableError(null)
    }
  }, [error, delay])

  return clearableError
}

// Hook for getting all sections and total tools count
export function useFieldGuide() {
  const mounted = useMounted()
  const [state, setState] = useState<UseFieldGuideState>({
    sections: [],
    totalTools: 0,
    loading: true,
    error: null
  })

  const fetchData = useCallback(async () => {
    if (!mounted) {
      console.log('🔄 useFieldGuide: Not mounted yet, skipping fetch')
      return
    }

    try {
      console.log('🚀 useFieldGuide: Starting data fetch')
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      // CRITICAL FIX: Set mounted status on API
      FieldGuideAPI.setMounted(true)
      
      const [sectionsData, toolsCount] = await Promise.all([
        FieldGuideAPI.getAllSections(),
        FieldGuideAPI.getAllToolsCount()
      ])
      
      console.log('✅ useFieldGuide: Data fetched successfully', {
        sections: sectionsData?.length || 0,
        totalTools: toolsCount || 0
      })
      
      setState({
        sections: sectionsData || [],
        totalTools: toolsCount || 0,
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('❌ useFieldGuide: Error fetching field guide data:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load field guide data'
      }))
    }
  }, [mounted])

  useEffect(() => {
    if (mounted) {
      fetchData()
    }
  }, [mounted, fetchData])

  const clearableError = useAutoErrorClear(state.error)

  return {
    ...state,
    error: clearableError,
    retry: fetchData,
    refetch: fetchData
  }
}

// Hook for getting a specific section and its tools
export function useSection(slug: string) {
  const mounted = useMounted()
  const [state, setState] = useState<UseSectionState>({
    section: null,
    tools: [],
    loading: true,
    error: null
  })

  const fetchSectionData = useCallback(async () => {
    if (!mounted) {
      console.log('🔄 useSection: Not mounted yet, skipping fetch')
      return
    }

    if (!slug || typeof slug !== 'string') {
      setState({
        section: null,
        tools: [],
        loading: false,
        error: 'Invalid section slug provided'
      })
      return
    }

    try {
      console.log('🚀 useSection: Fetching section:', slug)
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      // CRITICAL FIX: Set mounted status on API
      FieldGuideAPI.setMounted(true)
      
      const sectionData = await FieldGuideAPI.getSectionBySlug(slug)
      
      if (!sectionData) {
        setState({
          section: null,
          tools: [],
          loading: false,
          error: `Section "${slug}" not found`
        })
        return
      }

      // Get tools for this section
      const toolsData = await FieldGuideAPI.getToolsForSection(sectionData.section_name)
      
      console.log('✅ useSection: Section data fetched successfully', {
        sectionName: sectionData.section_name,
        toolsCount: toolsData?.length || 0
      })
      
      setState({
        section: sectionData,
        tools: toolsData || [],
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('❌ useSection: Error fetching section data:', error)
      setState({
        section: null,
        tools: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load section data'
      })
    }
  }, [slug, mounted])

  useEffect(() => {
    if (mounted) {
      fetchSectionData()
    }
  }, [mounted, fetchSectionData])

  const clearableError = useAutoErrorClear(state.error)

  return {
    ...state,
    error: clearableError,
    retry: fetchSectionData,
    refetch: fetchSectionData
  }
}

// Hook for getting a specific tool by ID
export function useTool(toolId: string) {
  const mounted = useMounted()
  const [state, setState] = useState<UseToolState>({
    tool: null,
    loading: true,
    error: null
  })

  const fetchTool = useCallback(async () => {
    if (!mounted) {
      console.log('🔄 useTool: Not mounted yet, skipping fetch')
      return
    }

    if (!toolId || typeof toolId !== 'string') {
      setState({
        tool: null,
        loading: false,
        error: 'Invalid tool ID provided'
      })
      return
    }

    try {
      console.log('🚀 useTool: Fetching tool:', toolId)
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      // CRITICAL FIX: Set mounted status on API
      FieldGuideAPI.setMounted(true)
      
      const toolData = await FieldGuideAPI.getToolById(toolId)
      
      console.log('✅ useTool: Tool data fetched', toolData ? 'successfully' : 'not found')
      
      setState({
        tool: toolData || null,
        loading: false,
        error: toolData ? null : `Tool "${toolId}" not found`
      })
    } catch (error) {
      console.error('❌ useTool: Error fetching tool:', error)
      setState({
        tool: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load tool data'
      })
    }
  }, [toolId, mounted])

  useEffect(() => {
    if (mounted) {
      fetchTool()
    }
  }, [mounted, fetchTool])

  const clearableError = useAutoErrorClear(state.error)

  return {
    ...state,
    error: clearableError,
    retry: fetchTool,
    refetch: fetchTool
  }
}

// Hook for searching tools across all categories with optimizations - FIXED
export function useToolSearch() {
  const mounted = useMounted()
  const [state, setState] = useState<UseToolSearchState>({
    allTools: [],
    loading: true,
    error: null
  })

  const fetchAllTools = useCallback(async () => {
    if (!mounted) {
      console.log('🔄 useToolSearch: Not mounted yet, skipping fetch')
      return
    }

    try {
      console.log('🚀 useToolSearch: Starting getAllTools fetch')
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      // CRITICAL FIX: Set mounted status on API
      FieldGuideAPI.setMounted(true)
      
      const toolsData = await FieldGuideAPI.getAllTools()
      
      console.log('✅ useToolSearch: Tools data fetched successfully', {
        toolsCount: toolsData?.length || 0,
        sampleTool: toolsData?.[0]
      })
      
      setState({
        allTools: toolsData || [],
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('❌ useToolSearch: Error fetching all tools:', error)
      setState({
        allTools: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load tools'
      })
    }
  }, [mounted])

  useEffect(() => {
    if (mounted) {
      fetchAllTools()
    }
  }, [mounted, fetchAllTools])

  // Memoized search function to prevent unnecessary re-computations
  const searchTools = useCallback((query: string): AITool[] => {
    if (!query || typeof query !== 'string') return state.allTools

    const trimmedQuery = query.trim()
    if (!trimmedQuery) return state.allTools

    const lowercaseQuery = trimmedQuery.toLowerCase()
    
    return state.allTools.filter(tool => {
      // Search in multiple fields with null safety
      return (
        tool.name?.toLowerCase().includes(lowercaseQuery) ||
        tool.description?.toLowerCase().includes(lowercaseQuery) ||
        tool.company?.toLowerCase().includes(lowercaseQuery) ||
        tool.category?.toLowerCase().includes(lowercaseQuery) ||
        tool.detailed_description?.toLowerCase().includes(lowercaseQuery) ||
        tool.use_cases?.toLowerCase().includes(lowercaseQuery)
      )
    })
  }, [state.allTools])

  // Memoized category filtering
  const getToolsByCategory = useCallback((category: string): AITool[] => {
    if (!category || typeof category !== 'string') return []
    
    const normalizedCategory = category.trim().toLowerCase()
    return state.allTools.filter(tool => 
      tool.category?.toLowerCase() === normalizedCategory
    )
  }, [state.allTools])

  // Memoized statistics
  const stats = useMemo(() => {
    const categories = new Map<string, number>()
    const companies = new Map<string, number>()
    let freeToolsCount = 0
    let paidToolsCount = 0

    state.allTools.forEach(tool => {
      // Category stats
      if (tool.category) {
        categories.set(tool.category, (categories.get(tool.category) || 0) + 1)
      }
      
      // Company stats
      if (tool.company) {
        companies.set(tool.company, (companies.get(tool.company) || 0) + 1)
      }
      
      // Pricing stats
      if (tool.free_tier) freeToolsCount++
      if (tool.paid_tier) paidToolsCount++
    })

    return {
      totalTools: state.allTools.length,
      categoriesCount: categories.size,
      companiesCount: companies.size,
      freeToolsCount,
      paidToolsCount,
      topCategories: Array.from(categories.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10),
      topCompanies: Array.from(companies.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
    }
  }, [state.allTools])

  const clearableError = useAutoErrorClear(state.error)

  return {
    ...state,
    error: clearableError,
    searchTools,
    getToolsByCategory,
    stats,
    retry: fetchAllTools,
    refetch: fetchAllTools
  }
}

// Advanced search hook with filters and pagination
export function useAdvancedToolSearch() {
  const { allTools, loading, error, retry } = useToolSearch()
  const [filters, setFilters] = useState({
    query: '',
    categories: [] as string[],
    freeTier: null as boolean | null,
    paidTier: null as boolean | null,
    loginRequired: null as boolean | null
  })

  const filteredTools = useMemo(() => {
    let result = allTools

    // Text search
    if (filters.query?.trim()) {
      const query = filters.query.trim().toLowerCase()
      result = result.filter(tool =>
        tool.name?.toLowerCase().includes(query) ||
        tool.description?.toLowerCase().includes(query) ||
        tool.company?.toLowerCase().includes(query) ||
        tool.category?.toLowerCase().includes(query) ||
        tool.detailed_description?.toLowerCase().includes(query) ||
        tool.use_cases?.toLowerCase().includes(query)
      )
    }

    // Category filter
    if (filters.categories.length > 0) {
      result = result.filter(tool => 
        tool.category && filters.categories.includes(tool.category)
      )
    }

    // Boolean filters
    if (filters.freeTier !== null) {
      result = result.filter(tool => tool.free_tier === filters.freeTier)
    }

    if (filters.paidTier !== null) {
      result = result.filter(tool => tool.paid_tier === filters.paidTier)
    }

    if (filters.loginRequired !== null) {
      result = result.filter(tool => tool.login_required === filters.loginRequired)
    }

    return result
  }, [allTools, filters])

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      query: '',
      categories: [],
      freeTier: null,
      paidTier: null,
      loginRequired: null
    })
  }, [])

  return {
    allTools,
    filteredTools,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    retry,
    totalResults: filteredTools.length,
    hasFilters: !!(
      filters.query ||
      filters.categories.length > 0 ||
      filters.freeTier !== null ||
      filters.paidTier !== null ||
      filters.loginRequired !== null
    )
  }
}