// app/components/FieldGuideClient.tsx - MINIMAL CLIENT COMPONENT
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// Types
interface FieldGuideSection {
  id: string
  section_number: number
  section_name: string
  slug: string
  intro?: string
  summary?: string
  use_cases?: string
  toolCount: number
}

interface FieldGuideClientProps {
  initialData: {
    sections: FieldGuideSection[]
    totalTools: number
    sectionCount: number
  }
}

// Helper functions (client-side for animations)
function getSectionEmoji(sectionName: string): string {
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
    
    // OLD names (backward compatibility)
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

function getSectionColor(sectionName: string): string {
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
    
    // OLD names (backward compatibility)
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

// Lazy import analytics
const loadAnalytics = () => import('../lib/gtag')

export default function FieldGuideClient({ initialData }: FieldGuideClientProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredSections, setFilteredSections] = useState(initialData.sections)

  // Track analytics
  const trackEvent = async (eventName: string, params: Record<string, any>) => {
    try {
      const { logEvent } = await loadAnalytics()
      logEvent(eventName, params)
    } catch {
      // Analytics not critical - fail silently
    }
  }

  // Track page view on mount
  useEffect(() => {
    setIsVisible(true)
    trackEvent('page_view', { 
      page_title: 'Field Guide', 
      page_location: '/field-guide',
      section_count: initialData.sectionCount,
      total_tools: initialData.totalTools
    })
  }, [initialData.sectionCount, initialData.totalTools])

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const filtered = initialData.sections.filter(section =>
        section.section_name.toLowerCase().includes(query) ||
        (section.summary && section.summary.toLowerCase().includes(query)) ||
        (section.intro && section.intro.toLowerCase().includes(query))
      )
      setFilteredSections(filtered)
      
      trackEvent('field_guide_search', {
        search_term: searchQuery,
        results_count: filtered.length
      })
    } else {
      setFilteredSections(initialData.sections)
    }
  }, [searchQuery, initialData.sections])

  const handleSectionClick = (section: FieldGuideSection) => {
    trackEvent('field_guide_section_click', {
      section_name: section.section_name,
      section_slug: section.slug,
      tool_count: section.toolCount
    })
  }

  return (
    <>
      {/* Categories Section */}
      <section className="bg-white px-6 md:px-12 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 
              className="heading-section text-4xl md:text-5xl text-[#60A875] mb-6 leading-tight font-bold"
              style={{fontFamily: "var(--font-playfair, 'Playfair Display'), serif"}}
            >
              🗺️ Explore AI by Category
            </h2>
            <p 
              className="text-xl md:text-2xl text-gray-800 max-w-3xl mx-auto leading-relaxed font-medium mb-8"
              style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}
            >
              Pick your adventure — each section is packed with hand-picked tools and real-world use cases.
            </p>

            {/* Search */}
            <div className="max-w-md mx-auto mb-8">
              <label htmlFor="section-search" className="sr-only">Search sections</label>
              <div className="relative">
                <input
                  id="section-search"
                  type="text"
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#60A875]/20 focus:border-[#60A875] bg-white shadow-sm transition-all"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Results count */}
            {searchQuery && (
              <p className="text-gray-600 mb-8" aria-live="polite">
                {filteredSections.length} section{filteredSections.length !== 1 ? 's' : ''} found
              </p>
            )}
          </div>

          {/* Categories Grid */}
          {filteredSections.length > 0 ? (
            <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              {filteredSections.map((section, index) => (
                <SectionCard 
                  key={section.id} 
                  section={section} 
                  index={index}
                  onClick={() => handleSectionClick(section)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No sections found</h3>
              <p className="text-gray-600 mb-6">
                No sections match "{searchQuery}". Try a different search term.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-6 py-3 bg-[#60A875] text-white rounded-xl hover:bg-green-600 transition-colors"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-br from-gray-200 via-gray-100 to-blue-100 px-6 md:px-12 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h3 
            className="text-4xl md:text-5xl mb-6 text-[#60A875] font-bold"
            style={{fontFamily: "var(--font-playfair, 'Playfair Display'), serif"}}
          >
            Ready to Get Started?
          </h3>
          <p 
            className="text-xl text-gray-700 mb-8 leading-relaxed"
            style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}
          >
            Jump into any section that interests you, or start from the beginning with AI Assistants — the foundation of modern AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/field-guide/ai-assistants"
              className="bg-[#60A875] text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-2xl hover:bg-green-600 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 group"
              onClick={() => trackEvent('cta_click', { cta_type: 'start_ai_assistants', location: 'field_guide_main' })}
            >
              <span className="font-bold text-lg">Start with AI Assistants</span>
              <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
            </Link>
            <Link 
              href="/"
              className="bg-[#59B1E3] text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-2xl hover:bg-blue-600 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 group"
              onClick={() => trackEvent('cta_click', { cta_type: 'back_home', location: 'field_guide_main' })}
            >
              <span className="font-bold text-lg">Back to Daily Tidbit</span>
              <span className="group-hover:translate-x-1 transition-transform duration-200">🏠</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

// Section Card Component
function SectionCard({ 
  section, 
  index, 
  onClick 
}: { 
  section: FieldGuideSection; 
  index: number;
  onClick: () => void;
}) {
  const delayClass = `delay-${Math.min(index * 100 + 300, 1200)}`
  const sectionColor = getSectionColor(section.section_name)
  const sectionEmoji = getSectionEmoji(section.section_name)
  
  return (
    <Link 
      href={`/field-guide/${section.slug}`}
      className={`group block animate-fade-in-up ${delayClass}`}
      onClick={onClick}
    >
      <article className="bg-white p-8 rounded-3xl shadow-md hover:shadow-xl transition-all duration-500 hover:scale-[1.02] border border-gray-100 relative overflow-hidden h-full">
        {/* Top accent bar */}
        <div 
          className="absolute top-0 left-0 w-full h-2"
          style={{ backgroundColor: sectionColor }}
        />
        
        {/* Section emoji and number */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-4xl" aria-hidden="true">{sectionEmoji}</div>
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ backgroundColor: sectionColor }}
            aria-label={`Section ${section.section_number}`}
          >
            {section.section_number}
          </div>
        </div>
        
        {/* Section title */}
        <h3 
          className="text-2xl font-bold mb-4 group-hover:text-opacity-80 transition-colors"
          style={{
            fontFamily: "var(--font-playfair, 'Playfair Display'), serif",
            color: sectionColor
          }}
        >
          {section.section_name}
        </h3>
        
        {/* Summary */}
        <p 
          className="text-gray-700 leading-relaxed mb-6 line-clamp-3"
          style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}
        >
          {section.summary || section.intro || 'Explore this category of AI tools'}
        </p>
        
        {/* Tool count and CTA */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <span className="font-semibold text-gray-700">{section.toolCount} tools</span>
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
          <p>{section.summary || section.intro}</p>
        </div>
      </article>
    </Link>
  )
}