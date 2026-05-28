// app/components/FieldGuideSectionClient.tsx - Updated for CSS class colors
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import ToolModal from './ToolModal'
import React from 'react'
import { useMounted } from '../lib/clientUtils'
import { getSectionColorClasses, getSectionHexColor } from '../lib/field-guide-types'
import { useAnalytics } from '../lib/analytics'

// Types
interface FieldGuideSection {
  id: string
  section_number: number
  section_name: string
  slug: string
  intro?: string | null
  summary?: string | null
  use_cases?: string | null
  how_they_work?: string | null
  what_you_can_do?: string | null
  better_results?: string | null
  strengths?: string | null
  limitations?: string | null
  pro_tips?: string | null
}

interface AITool {
  id: string
  name: string
  company?: string | null
  category: string
  description: string
  detailed_description?: string | null
  use_cases?: string | null
  access_notes?: string | null
  website?: string | null
  free_tier: boolean | null
  paid_tier: boolean | null
  login_required: boolean | null
  is_public: boolean | null
  tagline?: string | null
  model_type?: string | null
  access_method?: string | null
  pricing_breakdown?: string | null
  commercial_use_policy?: string | null
  training_data?: string | null
  workflow_notes?: string | null
  limitations?: string | null
  use_cases_list?: string[] | null
  is_sponsored?: boolean | null
  promo_code?: string | null
  promo_code_description?: string | null
}

interface SectionClientProps {
  initialData: {
    section: FieldGuideSection
    tools: AITool[]
    sectionColor: string
    sectionEmoji: string
  }
}

export default function FieldGuideSectionClient({ initialData }: SectionClientProps) {
  const { section, tools, sectionEmoji } = initialData
  const mounted = useMounted()
  const { track, hasConsent } = useAnalytics()
  
  // Get color classes for this section
  const colorClasses = useMemo(() => getSectionColorClasses(section.section_name), [section.section_name])
  const sectionHexColor = useMemo(() => getSectionHexColor(section.section_name), [section.section_name])
  
  // State management
  const [isVisible, setIsVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Simplified modal state - no navigation between tools
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTool, setSelectedTool] = useState<AITool | null>(null)

  // Memoized filtered tools for better performance
  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return tools
    
    const query = searchQuery.toLowerCase()
    return tools.filter(tool => 
      tool.name.toLowerCase().includes(query) ||
      tool.description?.toLowerCase().includes(query) ||
      tool.company?.toLowerCase().includes(query) ||
      tool.use_cases?.toLowerCase().includes(query)
    )
  }, [searchQuery, tools])

  // Safe analytics tracking functions
  const trackSectionView = useCallback((sectionName: string, slug: string, toolsCount: number) => {
    if (!mounted || !hasConsent || !track) return
    track('field_guide_section_view', {
      section_name: sectionName,
      section_slug: slug,
      tools_count: toolsCount
    })
  }, [mounted, hasConsent, track])

  const trackToolSearch = useCallback((sectionName: string, searchTerm: string, resultsCount: number) => {
    if (!mounted || !hasConsent || !track) return
    track('field_guide_tool_search', {
      section_name: sectionName,
      search_term: searchTerm,
      results_count: resultsCount
    })
  }, [mounted, hasConsent, track])

  const trackToolModalOpen = useCallback((toolName: string, toolId: string, sectionName: string) => {
    if (!mounted || !hasConsent || !track) return
    track('tool_modal_open', {
      tool_name: toolName,
      tool_id: toolId,
      section_name: sectionName
    })
  }, [mounted, hasConsent, track])

  const trackToolModalClose = useCallback((sectionName: string, toolName?: string) => {
    if (!mounted || !hasConsent || !track) return
    track('tool_modal_close', {
      section_name: sectionName,
      tool_name: toolName
    })
  }, [mounted, hasConsent, track])

  const trackToolInteraction = useCallback((toolName: string, toolId: string, action: string, sectionName: string, hasFreeTier: boolean, targetUrl?: string) => {
    if (!mounted || !hasConsent || !track) return
    track('tool_interaction', {
      tool_name: toolName,
      tool_id: toolId,
      action: action,
      section_name: sectionName,
      has_free_tier: hasFreeTier,
      ...(targetUrl && { target_url: targetUrl })
    })
  }, [mounted, hasConsent, track])

  const trackNavigateBack = useCallback((fromSection: string) => {
    if (!mounted || !hasConsent || !track) return
    track('navigate_back', { from_section: fromSection })
  }, [mounted, hasConsent, track])

  // Track page view on mount
  useEffect(() => {
    if (!mounted) return
    
    setIsVisible(true)
    trackSectionView(section.section_name, section.slug, tools.length)
  }, [mounted, section.section_name, section.slug, tools.length, trackSectionView])

  // Track search with debouncing effect
  useEffect(() => {
    if (!mounted || !searchQuery.trim()) return
    
    trackToolSearch(section.section_name, searchQuery, filteredTools.length)
  }, [mounted, searchQuery, section.section_name, filteredTools.length, trackToolSearch])

  // Simplified modal handlers - single tool only
  const handleOpenModal = useCallback((tool: AITool) => {
    if (!mounted) return
    setSelectedTool(tool)
    setIsModalOpen(true)
    trackToolModalOpen(tool.name, tool.id, section.section_name)
  }, [mounted, trackToolModalOpen, section.section_name])

  const handleCloseModal = useCallback(() => {
    if (!mounted) return
    setIsModalOpen(false)
    setSelectedTool(null)
    trackToolModalClose(section.section_name, selectedTool?.name)
  }, [mounted, trackToolModalClose, section.section_name, selectedTool])

  const handleToolClick = useCallback((tool: AITool, action: 'modal' | 'website') => {
    if (!mounted) return
    const targetUrl = action === 'website' ? (tool.website ?? undefined) : undefined
    trackToolInteraction(tool.name, tool.id, action, section.section_name, tool.free_tier ?? false, targetUrl)
  }, [mounted, trackToolInteraction, section.section_name])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  const handleNavigateBack = useCallback(() => {
    if (!mounted) return
    
    trackNavigateBack(section.section_name)
  }, [mounted, trackNavigateBack, section.section_name])

  // Safety check AFTER all hooks
  if (!section) {
    return (
      <div className="text-center py-20">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md mx-auto">
          <h3 className="text-xl font-semibold text-red-800 mb-2">Section Data Missing</h3>
          <p className="text-red-600">
            Unable to load section information. Please try refreshing the page.
          </p>
        </div>
      </div>
    )
  }

  // HYDRATION FIX: don't render interactive elements until mounted
  if (!mounted) {
    return (
      <div className="bg-white px-6 md:px-12 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 flex items-center justify-center gap-6">
              <span className="text-4xl md:text-5xl" aria-hidden="true">🛠️</span>
              Loading Tools...
            </h2>
          </div>
          <div className="animate-pulse">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-gray-200 h-64 rounded-3xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Tools Section */}
      <section id="tools-section" className="bg-white px-6 md:px-12 py-20">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h1 className={`text-5xl md:text-6xl font-bold mb-6 flex items-center justify-center gap-6 font-serif ${colorClasses.text}`}>
              <span className="text-4xl md:text-5xl" aria-hidden="true">{sectionEmoji}</span>
              {section.section_name}
            </h1>
            
            <div className={`w-32 h-2 mx-auto rounded-full mb-8 ${colorClasses.bg}`}></div>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8 font-sans">
              Hand-picked AI tools to supercharge your {section.section_name.toLowerCase()} workflow
            </p>

            {/* Search tools */}
            {tools.length > 6 && (
              <div className="max-w-md mx-auto">
                <label htmlFor="tool-search" className="sr-only">Search tools</label>
                <div className="relative">
                  <input
                    id="tool-search"
                    type="text"
                    placeholder="Search tools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full px-4 py-3 pl-12 rounded-xl border border-gray-300 focus:ring-2 focus:border-current bg-white shadow-sm transition-all ${colorClasses.text}`}
                    style={{ '--tw-ring-color': `${sectionHexColor}33` } as any}
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Results count */}
            {searchQuery && (
              <p className="text-gray-600 mt-4" aria-live="polite">
                {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''} found
              </p>
            )}
          </div>

          {/* Tools Grid */}
          {filteredTools.length > 0 ? (
            <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-8 transition-opacity transition-transform duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              {filteredTools.map((tool, index) => (
                <ToolCard 
                  key={tool.id} 
                  tool={tool} 
                  colorClasses={colorClasses}
                  sectionHexColor={sectionHexColor}
                  index={index}
                  onToolClick={handleToolClick}
                  onOpenModal={() => handleOpenModal(tool)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              {searchQuery ? (
                <>
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No tools found</h3>
                  <p className="text-gray-600 mb-6">
                    No tools match "{searchQuery}". Try a different search term.
                  </p>
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className={`px-6 py-3 text-white rounded-xl hover:opacity-90 transition-opacity ${colorClasses.bg}`}
                  >
                    Clear search
                  </button>
                </>
              ) : (
                <>
                  <div 
                    className="inline-flex items-center justify-center w-32 h-32 rounded-full mb-8 shadow-lg"
                    style={{ backgroundColor: `${sectionHexColor}10`, border: `3px solid ${sectionHexColor}20` }}
                  >
                    <span className="text-5xl">🚀</span>
                  </div>
                  
                  <h3 className={`text-4xl font-bold mb-6 font-serif ${colorClasses.text}`}>
                    Tools Coming Soon
                  </h3>
                  
                  <p className="text-xl text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed font-sans">
                    We're carefully curating the best AI tools for this section. Check back soon!
                  </p>
                  
                  <Link
                    href="/field-guide"
                    className="inline-flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-10 py-5 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg group text-lg"
                    onClick={handleNavigateBack}
                  >
                    <span>Explore Other Categories</span>
                    <svg className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </>
              )}
            </div>
          )}

          {/* Back to Field Guide Link */}
          <div className="text-center mt-20">
            <Link
              href="/field-guide"
              className="inline-flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg group text-lg"
              onClick={handleNavigateBack}
            >
              <svg className="w-6 h-6 mr-3 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              <span>Back to Field Guide</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Simplified Modal - no gesture support */}
      <ToolModal
        tool={selectedTool}
        sectionColor={sectionHexColor}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  )
}

// Updated Tool Card Component
const ToolCard = React.memo(function ToolCard({ 
  tool, 
  colorClasses,
  sectionHexColor,
  index,
  onToolClick,
  onOpenModal
}: { 
  tool: AITool; 
  colorClasses: { bg: string; text: string; border: string; suffix: string };
  sectionHexColor: string;
  index: number;
  onToolClick: (tool: AITool, action: 'modal' | 'website') => void;
  onOpenModal: () => void;
}) {
  const staggerDelay = `${Math.min(index * 80, 640)}ms`

  const handleOpenModal = useCallback(() => {
    onOpenModal()
    onToolClick(tool, 'modal')
  }, [tool, onToolClick, onOpenModal])

  const handleWebsiteClick = useCallback(() => {
    onToolClick(tool, 'website')
  }, [tool, onToolClick])
  
  return (
    <div className="group animate-fade-in-up" style={{ animationDelay: staggerDelay }}>
      <article className={`bg-white p-8 rounded-3xl shadow-lg transition-shadow transition-transform duration-300 hover:scale-[1.02] h-full flex flex-col relative overflow-hidden ${tool.is_sponsored ? 'border-2 border-amber-400 hover:shadow-amber-100 hover:shadow-2xl' : 'border border-gray-100 hover:shadow-2xl'}`}>

        {/* Top accent bar */}
        {tool.is_sponsored ? (
          <div className="absolute top-0 left-0 w-full h-2 rounded-t-3xl" style={{ background: 'linear-gradient(to right, #fbbf24, #fde68a)' }} />
        ) : (
          <div className={`absolute top-0 left-0 w-full h-2 rounded-t-3xl ${colorClasses.bg}`} />
        )}

        {/* Sponsored badge */}
        {tool.is_sponsored && (
          <div className="absolute top-3 right-3 bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <span>★</span>
            <span>Sponsored</span>
          </div>
        )}
        
        {/* Header */}
        <div className="mb-6">
          <h3 className={`text-2xl font-bold mb-2 group-hover:text-opacity-80 transition-colors font-serif ${colorClasses.text}`}>
            {tool.name}
          </h3>
          {tool.company && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-sm text-gray-600 font-medium">
                by {tool.company}
              </p>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-700 leading-relaxed mb-6 flex-1 text-lg font-sans">
          {tool.description}
        </p>

        {/* Promo code teaser */}
        {tool.is_sponsored && tool.promo_code && (
          <div className="mb-4 flex items-center justify-center">
            <span className="inline-flex items-center gap-2 bg-amber-400 text-amber-900 px-4 py-2 rounded-full text-sm font-semibold">
              <span>🏷️</span>
              Promo Code Available
            </span>
          </div>
        )}

        {/* Use Cases */}
        {tool.use_cases && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Use Cases</span>
            </div>
            <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100 italic font-sans">
              {tool.use_cases}
            </p>
          </div>
        )}

        {/* Pricing Info */}
        <div className="mb-6">
          <div className="flex items-center justify-center">
            {tool.free_tier ? (
              <span className="inline-flex items-center bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Free Tier Available
              </span>
            ) : (
              <span className="inline-flex items-center bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Paid Only
              </span>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          {/* Learn More Button */}
          <button
            type="button"
            onClick={handleOpenModal}
            aria-label={`Learn more about ${tool.name}`}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold text-center transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 group border border-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Learn More</span>
          </button>

          {/* CTA Button */}
          {tool.website && (
            <a
              href={tool.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWebsiteClick}
              aria-label={`Try ${tool.name} (opens in new tab)`}
              className="w-full text-white px-6 py-3 rounded-xl font-bold text-center transition-transform duration-300 hover:scale-[1.02] hover:opacity-90 flex items-center justify-center gap-3 group shadow-lg hover:shadow-xl"
              style={{
                background: `linear-gradient(135deg, ${sectionHexColor}, ${sectionHexColor}dd)`,
              }}
            >
              <span>Try {tool.name}</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>

        {/* Screen reader content */}
        <div className="sr-only">
          <h4>{tool.name}</h4>
          {tool.company && <p>By {tool.company}</p>}
          <p>{tool.description}</p>
          {tool.use_cases && <p>Use cases: {tool.use_cases}</p>}
          <p>Pricing: {tool.free_tier ? 'Free tier available' : 'Paid only'}</p>
          {tool.access_notes && <p>Access notes: {tool.access_notes}</p>}
        </div>
      </article>
    </div>
  )
})