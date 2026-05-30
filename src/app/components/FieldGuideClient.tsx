// app/components/FieldGuideClient.tsx - Complete file with CSS class colors
'use client'

import { useState, useEffect, useDeferredValue, useCallback, useMemo } from 'react'
import Link from 'next/link'
import React from 'react'
import { useMounted } from '../lib/clientUtils'
import { getSectionColorClasses, getSectionHexColor } from '../lib/field-guide-types'
import { useAnalytics } from '../lib/analytics'

// Types
interface AITool {
  id: string
  name: string
  company?: string | null
  category: string
  description: string
  use_cases?: string | null
  website?: string | null
  free_tier: boolean | null
}

interface FieldGuideSection {
  id: string
  section_number: number
  section_name: string
  slug: string
  intro?: string | null
  summary?: string | null
  use_cases?: string | null
  toolCount: number
  tools?: AITool[]
}

interface FieldGuideClientProps {
  initialData: {
    sections: FieldGuideSection[]
    totalTools: number
    sectionCount: number
  }
}

// ── Rotating taglines ─────────────────────────────────────────────────────────

const TAGLINES = [
  "🌺 Don't Worry About AI Thing. Every little tool gonna be all right.",
  "🌺 No CS degree required. Just curiosity.",
  "🌺 100 tools. Zero overwhelm.",
  "🌺 AI is easier than you think. We promise.",
  "🌺 The right tool changes everything.",
  "🌺 AI for real people doing real things.",
  "🌺 No hype. Just tools that actually work.",
  "🌺 You don't need to understand AI to use it.",
  "🌺 Good vibes. Better tools.",
  "🌺 Every expert was once a beginner. Start here.",
  "🌺 The AI aisle, organized.",
  "🌺 Pick a tool. Change your day.",
  "🌺 Built for humans, not engineers.",
  "🌺 100 tools, hand-picked with love.",
  "🌺 AI doesn't have to be complicated. We checked.",
  "🌺 Your shortcut to the good stuff.",
  "🌺 Less scrolling. More doing.",
  "🌺 The tools are here. The vibe is free.",
  "🌺 Find your tool. Go make something.",
  "🌺 No gatekeeping. Just good tools.",
  "🌺 AI is having a moment. Might as well join it.",
  "🌺 Calm your AI anxiety. We've got you.",
  "🌺 One good tool can save you hours.",
  "🌺 Tools for the curious, the busy, and the bold.",
  "🌺 The internet has too many AI lists. This one's different.",
  "🌺 Explore at your own pace. No rush.",
  "🌺 14 trails. 100 tools. One good vibe.",
  "🌺 You belong here. So does AI.",
  "🌺 Not all AI tools are created equal. These ones are.",
  "🌺 Hand-picked so you don't have to.",
  "🌺 AI is your new favorite coworker.",
  "🌺 The best tools are the ones you actually use.",
  "🌺 Start anywhere. There's no wrong door.",
  "🌺 We tried them so you don't have to.",
  "🌺 Life's too short for bad AI tools.",
  "🌺 Everything's gonna be all right. Especially your workflow.",
  "🌺 100 tools walked into a bar. These are the ones worth talking to.",
  "🌺 Find the tool. Skip the tutorial. Make the thing.",
  "🌺 Somewhere in here is exactly what you need.",
  "🌺 No pressure. Just possibilities.",
  "🌺 The good tools, without the noise.",
  "🌺 AI got big fast. We sorted it out for you.",
  "🌺 Your new secret weapon is probably in here.",
  "🌺 Don't fear the robots. They're actually pretty helpful.",
  "🌺 Breathe. Pick a category. Change your life a little.",
  "🌺 Making AI feel less like homework since 2024.",
  "🌺 The field guide your future self will thank you for.",
  "🌺 Tools that slap. Vibes that stick.",
  "🌺 Welcome. You're exactly where you need to be.",
  "🌺 The shortcut your brain has been asking for.",
  "🌺 The AI revolution is friendlier than it looks.",
  "🌺 Your curiosity brought you here. Good instinct.",
  "🌺 Do more. Stress less. Use better tools.",
  "🌺 Every tool here passed the vibe check.",
  "🌺 AI is just a tool. A really good one.",
  "🌺 The cheat code for getting things done.",
  "🌺 Work smarter. Nap longer.",
  "🌺 Someone had to organize all this. You're welcome.",
  "🌺 The AI landscape, tamed.",
  "🌺 Pick a tool. Tell nobody. Seem like a genius.",
  "🌺 More tools than you need. Exactly the ones you want.",
  "🌺 Your unfair advantage starts here.",
  "🌺 Real tools for real results. No fluff.",
  "🌺 The future showed up early. Here's the map.",
  "🌺 Let AI handle the boring parts.",
  "🌺 Good things come to those who explore.",
  "🌺 The tools are ready when you are.",
  "🌺 You found the good part of the internet.",
  "🌺 AI for people with things to do.",
  "🌺 Browse like nobody's watching.",
  "🌺 Whatever you're building, there's a tool for that.",
  "🌺 The overwhelm stops here.",
  "🌺 Curated with care. Used with joy.",
  "🌺 Think of us as your AI-savvy friend.",
  "🌺 No algorithm. Just good judgment.",
  "🌺 Tools so good they feel like cheating.",
  "🌺 You're one tool away from your best day.",
  "🌺 The right tool at the right time changes everything.",
  "🌺 We did the research. You get the results.",
  "🌺 AI finally explained without the headache.",
  "🌺 Your workflow called. It wants an upgrade.",
  "🌺 Less friction. More flow.",
  "🌺 The tools the pros don't want you to know about.",
  "🌺 Organized chaos? No. Just organized.",
  "🌺 Every category is a rabbit hole worth falling into.",
  "🌺 Come for the tools. Stay for the vibes.",
  "🌺 Not intimidating. We checked.",
  "🌺 Your next favorite tool is two clicks away.",
  "🌺 AI tools, minus the LinkedIn energy.",
  "🌺 Made for the curious. Stays for the capable.",
  "🌺 The best time to start using AI was yesterday. Second best is now.",
  "🌺 Hand-picked. Human-approved.",
  "🌺 No fluff. No filler. Just tools.",
  "🌺 The map everyone needed but nobody made. Until now.",
  "🌺 Explore freely. There's no wrong answer.",
  "🌺 Calm, cool, and full of really useful tools.",
  "🌺 Your AI journey starts with one good tool.",
  "🌺 Less jargon. More results.",
  "🌺 The field guide that actually feels like a friend.",
  "🌺 AI tools, minus the corporate energy.",
  "🌺 Built for everyone. Not just the early adopters.",
  "🌺 Less tech bros, more tech toes — just dip in and try something.",
]

function resolveTagline(raw: string, totalTools: number, sectionCount: number): string {
  return raw
    .replace(/\b100 tools\b/g, `${totalTools} tools`)
    .replace(/\b14 trails\b/g, `${sectionCount} trails`)
}

// ── Section emoji map ─────────────────────────────────────────────────────────

const getSectionEmoji = (sectionName: string): string => {
  const emojiMap: Record<string, string> = {
    'AI Assistants': '🤖',
    'Image Generation': '🎨',
    'Video Generation': '🎬', 
    'Music Creation': '🎵',
    'Photo & Image Tools': '📸',
    'Video Editing': '🎞️',
    'AI Avatars': '👤',
    'Speech & Voice': '🎙️',
    'Creative Writing & Storytelling': '✏️',
    'Productivity Tools': '⚡',
    'AI Search Tools': '🔍',
    'Education & Learning': '📚',
    'Coding Assistants': '💻',
    'Automation Tools': '🔧',
    
    // OLD names (backward compatibility)
    'Language Models': '🤖',
    'Music': '🎵',
    'Music & Audio Tools': '🎵',
    'AI Photo & Image Editors': '📸',
    'Image Editing': '📸',
    'Video Editing & Avatars': '🎞️',
    'Video Editing & AI Avatars': '🎞️',
    'Voice Synthesis': '🎙️',
    'AI Agents & Automation': '🔧',
    'Educational & Learning Tools': '📚'
  }
  return emojiMap[sectionName] || '🔮'
}

export default function FieldGuideClient({ initialData }: FieldGuideClientProps) {
  const mounted = useMounted()
  const { track } = useAnalytics()
  
  const [isVisible, setIsVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const hasSearchQuery = searchQuery.trim().length > 0
  
  // Debounced search for better performance
  const deferredSearchQuery = useDeferredValue(searchQuery)
  
  // Enhanced filtering that searches both sections and tools
  // Pick once per mount — safe because the heading only renders after `mounted` is true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tagline = useMemo(
    () => resolveTagline(
      TAGLINES[Math.floor(Math.random() * TAGLINES.length)],
      initialData.totalTools,
      initialData.sectionCount,
    ),
    [],
  )

  const filteredSections = useMemo(() => {
    if (!deferredSearchQuery.trim()) return initialData.sections
    
    const query = deferredSearchQuery.toLowerCase()
    
    return initialData.sections.filter(section => {
      // Search in section fields
      const sectionMatch = 
        section.section_name.toLowerCase().includes(query) ||
        (section.summary && section.summary.toLowerCase().includes(query)) ||
        (section.intro && section.intro.toLowerCase().includes(query)) ||
        (section.use_cases && section.use_cases.toLowerCase().includes(query))
      
      // Search in tools for this section (if tools data is available)
      const toolMatch = section.tools?.some(tool => 
        tool.name.toLowerCase().includes(query) ||
        (tool.company && tool.company.toLowerCase().includes(query)) ||
        tool.description.toLowerCase().includes(query) ||
        (tool.use_cases && tool.use_cases.toLowerCase().includes(query))
      )
      
      return sectionMatch || toolMatch
    })
  }, [deferredSearchQuery, initialData.sections])

  // Safe analytics tracking functions
  const trackFieldGuideSearch = useCallback((searchTerm: string, resultsCount: number, searchType: 'enhanced') => {
    if (!mounted) return
    track('field_guide_search', {
      search_term: searchTerm,
      results_count: resultsCount,
      search_type: searchType
    })
  }, [mounted, track])

  const trackSectionClick = useCallback((sectionName: string, slug: string, toolCount: number, searchQuery?: string) => {
    if (!mounted) return
    track('field_guide_section_click', {
      section_name: sectionName,
      section_slug: slug,
      tool_count: toolCount,
      from_search: !!searchQuery,
      search_query: searchQuery
    })
  }, [mounted, track])

  // Trigger entry animation once mounted
  useEffect(() => {
    if (!mounted) return
    setIsVisible(true)
  }, [mounted])

  // Track search — only fire for meaningful queries (2+ chars)
  useEffect(() => {
    if (!mounted || deferredSearchQuery.trim().length < 2) return
    trackFieldGuideSearch(deferredSearchQuery, filteredSections.length, 'enhanced')
  }, [mounted, deferredSearchQuery, filteredSections.length, trackFieldGuideSearch])

  const handleSectionClick = useCallback((section: FieldGuideSection) => {
    if (!mounted) return
    
    trackSectionClick(section.section_name, section.slug, section.toolCount, deferredSearchQuery)
  }, [mounted, trackSectionClick, deferredSearchQuery])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  // Get matching tools for a section (for display in search results)
  const getMatchingTools = useCallback((section: FieldGuideSection, query: string): AITool[] => {
    if (!query.trim() || !section.tools) return []
    
    const lowerQuery = query.toLowerCase()
    return section.tools.filter(tool => 
      tool.name.toLowerCase().includes(lowerQuery) ||
      (tool.company && tool.company.toLowerCase().includes(lowerQuery)) ||
      tool.description.toLowerCase().includes(lowerQuery) ||
      (tool.use_cases && tool.use_cases.toLowerCase().includes(lowerQuery))
    )
  }, [])

  // Check if we have tools data for enhanced search
  const hasToolsData = initialData.sections.some(section => section.tools && section.tools.length > 0)

  // HYDRATION FIX: Return loading state until mounted to prevent mismatch
  if (!mounted) {
    return (
      <section className="bg-white px-6 md:px-12 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl text-brand-green mb-6 leading-tight font-bold">
              🔍 Loading Field Guide...
            </h2>
            <div className="animate-pulse">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-gray-200 h-64 rounded-3xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      {/* Categories Section */}
      <section id="categories" className="bg-white px-6 md:px-12 pt-4 pb-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="heading-section text-4xl md:text-5xl text-brand-green mb-6 leading-tight font-bold font-serif">
              {tagline}
            </h2>

            {/* Search */}
            <div className="max-w-md mx-auto mb-8">
              <label htmlFor="section-search" className="sr-only">
                {hasToolsData ? 'Search categories and tools' : 'Search categories'}
              </label>
              <div className="relative">
                <input
                  id="section-search"
                  type="text"
                  placeholder={hasToolsData ? "Search categories and tools..." : "Search categories..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoComplete="off"
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green bg-white shadow-sm transition-all min-h-[44px]"
                  aria-describedby="search-results"
                />
                {hasSearchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Results count */}
            {searchQuery && (
              <div id="search-results" className="mb-8" aria-live="polite" aria-atomic="true">
                <p className="text-gray-600">
                  {filteredSections.length} section{filteredSections.length !== 1 ? 's' : ''} found
                </p>
                {/* Show matching tools summary if we have tools data */}
                {hasToolsData && deferredSearchQuery && (
                  <div className="mt-2 text-sm text-gray-500">
                    {filteredSections.map(section => {
                      const matchingTools = getMatchingTools(section, deferredSearchQuery)
                      if (matchingTools.length === 0) return null
                      return (
                        <span key={section.id} className="inline-block mr-4">
                          {matchingTools.length} tool{matchingTools.length !== 1 ? 's' : ''} in {section.section_name}
                        </span>
                      )
                    }).filter(Boolean)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Categories Grid */}
          {filteredSections.length > 0 ? (
            <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-8 transition-opacity transition-transform duration-700 motion-reduce:transition-none ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              {filteredSections.map((section, index) => (
                <EnhancedSectionCard 
                  key={section.id} 
                  section={section} 
                  index={index}
                  searchQuery={deferredSearchQuery}
                  matchingTools={getMatchingTools(section, deferredSearchQuery)}
                  onClick={() => handleSectionClick(section)}
                  hasToolsData={hasToolsData}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No sections found</h3>
              <p className="text-gray-600 mb-6">
                No sections{hasToolsData ? ' or tools' : ''} match "{searchQuery}". Try a different search term.
              </p>
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-6 py-3 bg-brand-green text-white rounded-xl hover:bg-brand-green-dark transition-colors"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

// Enhanced Section Card Component that shows matching tools
const EnhancedSectionCard = React.memo(function EnhancedSectionCard({ 
  section, 
  index, 
  searchQuery,
  matchingTools,
  onClick,
  hasToolsData
}: { 
  section: FieldGuideSection; 
  index: number;
  searchQuery: string;
  matchingTools: AITool[];
  onClick: () => void;
  hasToolsData: boolean;
}) {
  // Memoize these calculations since they won't change during render
  const colorClasses = useMemo(() => getSectionColorClasses(section.section_name), [section.section_name])
  const sectionEmoji = useMemo(() => getSectionEmoji(section.section_name), [section.section_name])
  
  // Highlight search terms in text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 px-1 rounded">{part}</mark>
      ) : part
    )
  }
  
  const staggerDelay = `${Math.min(index * 80, 640)}ms`

  return (
    <Link
      href={`/field-guide/${section.slug}`}
      className="group block motion-safe:animate-fade-in-up motion-reduce:transition-none"
      style={{ animationDelay: staggerDelay }}
      onClick={onClick}
      aria-label={`Open ${section.section_name} – ${section.toolCount} tools available${matchingTools.length > 0 ? `, ${matchingTools.length} matching your search` : ''}`}
    >
      <article className="bg-white p-8 rounded-3xl shadow-md motion-safe:hover:shadow-xl transition-shadow transition-transform duration-300 motion-reduce:transform-none motion-safe:hover:scale-[1.02] border border-gray-100 relative overflow-hidden h-full">
        {/* Top accent bar */}
        <div className={`absolute top-0 left-0 w-full h-2 ${colorClasses.bg}`} />
        
        {/* Section emoji and number */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-4xl" aria-hidden="true">{sectionEmoji}</div>
          <div 
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${colorClasses.bg}`}
            aria-label={`Section ${section.section_number || index + 1}`}
          >
            {section.section_number || index + 1}
          </div>
        </div>
        
        {/* Section title */}
        <h3 className={`text-2xl font-bold mb-4 group-hover:text-opacity-80 transition-colors font-serif ${colorClasses.text}`}>
          {searchQuery ? highlightText(section.section_name, searchQuery) : section.section_name}
        </h3>
        
        {/* Summary */}
        <div className="text-gray-700 leading-relaxed mb-6 line-clamp-3 font-sans">
          {searchQuery ? 
            highlightText(section.summary || section.intro || 'Explore this category of AI tools', searchQuery) :
            (section.summary || section.intro || 'Explore this category of AI tools')
          }
        </div>
        
        {/* Matching tools preview - only show if we have tools data */}
        {hasToolsData && matchingTools.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-sm font-semibold text-yellow-800 mb-2">
              {matchingTools.length} matching tool{matchingTools.length !== 1 ? 's' : ''}:
            </div>
            <div className="text-sm text-yellow-700">
              {matchingTools.slice(0, 3).map(tool => (
                <span key={tool.id} className="inline-block mr-2 mb-1">
                  {searchQuery ? highlightText(tool.name, searchQuery) : tool.name}
                  {tool.company && (
                    <span className="text-yellow-600 ml-1">
                      ({searchQuery ? highlightText(tool.company, searchQuery) : tool.company})
                    </span>
                  )}
                </span>
              ))}
              {matchingTools.length > 3 && (
                <span className="text-yellow-600">+{matchingTools.length - 3} more</span>
              )}
            </div>
          </div>
        )}
        
        {/* Tool count and CTA */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <span className="font-semibold text-gray-700">{section.toolCount} tools</span>
            {hasToolsData && matchingTools.length > 0 && (
              <span className="ml-2 text-yellow-600 font-medium">
                ({matchingTools.length} match)
              </span>
            )}
          </div>
          <div className="text-sm font-semibold text-gray-500 group-hover:text-gray-700 transition-colors flex items-center gap-1">
            Explore
            <span className="group-hover:translate-x-1 transition-transform duration-200" aria-hidden="true">→</span>
          </div>
        </div>

        {/* Screen reader content */}
        <div className="sr-only">
          <p>Section {section.section_number}: {section.section_name}</p>
          <p>{section.toolCount} tools available</p>
          {hasToolsData && matchingTools.length > 0 && (
            <p>{matchingTools.length} tools match your search for "{searchQuery}"</p>
          )}
          <p>{section.summary || section.intro}</p>
        </div>
      </article>
    </Link>
  )
})