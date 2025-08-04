// src/app/field-guide/[slug]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useSection } from '../../hooks/useFieldGuide'
import { AITool } from '../../lib/field-guide-types'

// Helper functions
function getSectionEmoji(sectionName: string): string {
  const emojiMap: Record<string, string> = {
    'Language Models': '💬',
    'Image Generation': '🎨',
    'Video Generation': '🎬',
    'Voice Synthesis': '🎤',
    'Image Editing': '🖼️',
    'Video Editing & Avatars': '👤',
    'Music & Audio Tools': '🎵',
    'AI Agents & Automation': '🤖',
    'AI Search Tools': '🔍',
    'Educational & Learning Tools': '📚'
  }
  return emojiMap[sectionName] || '🤖'
}

function getSectionColor(sectionName: string): string {
  const colorMap: Record<string, string> = {
    'Language Models': '#60A875',
    'Image Generation': '#59B1E3',
    'Video Generation': '#F7936F',
    'Voice Synthesis': '#4A9B8E',
    'Image Editing': '#9B59B6',
    'Video Editing & Avatars': '#E74C3C',
    'Music & Audio Tools': '#F39C12',
    'AI Agents & Automation': '#2ECC71',
    'AI Search Tools': '#3498DB',
    'Educational & Learning Tools': '#E67E22'
  }
  return colorMap[sectionName] || '#60A875'
}

export default function SectionPage() {
  const params = useParams()
  const slug = params?.slug as string

  // ✅ Properly use the useSection hook at component level
  const { section, tools, loading } = useSection(slug || '')
  
  const [isVisible, setIsVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredTools, setFilteredTools] = useState<AITool[]>([])

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // ✅ Filter tools when tools or searchQuery changes
  useEffect(() => {
    if (tools) {
      const filtered = searchQuery 
        ? tools.filter(tool => 
            tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tool.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tool.company?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : tools
      setFilteredTools(filtered)
    }
  }, [tools, searchQuery])

  // Debug logging
  useEffect(() => {
    console.log('Slug:', slug)
    console.log('Section:', section)
    console.log('Tools:', tools)
    console.log('Loading:', loading)
  }, [slug, section, tools, loading])

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 md:px-12 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-[#60A875] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading section...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!section) {
    return (
      <main className="min-h-screen bg-white px-6 md:px-12 py-20">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Section Not Found</h1>
          <p className="text-gray-700 mb-4">
            We couldn't find the section "{slug}" in the field guide.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            This might be a database connectivity issue or the slug doesn't exist.
          </p>
          <Link 
            href="/field-guide"
            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
          >
            Back to Field Guide
          </Link>
        </div>
      </main>
    )
  }

  const sectionColor = getSectionColor(section.section_name)
  const sectionEmoji = getSectionEmoji(section.section_name)

  return (
    <main className="min-h-screen bg-white">
      {/* Header Section */}
      <section className="bg-white px-6 md:px-12 py-20 relative overflow-hidden border-b border-gray-100">
        <div 
          className="absolute top-20 right-10 w-32 h-32 rounded-full blur-xl animate-pulse opacity-5"
          style={{ backgroundColor: sectionColor }}
        ></div>
        <div 
          className="absolute bottom-20 left-10 w-24 h-24 rounded-full blur-xl animate-pulse delay-1000 opacity-5"
          style={{ backgroundColor: sectionColor }}
        ></div>
        
        <div className={`max-w-6xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Breadcrumb */}
          <nav className="mb-8 animate-fade-in-up">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Link href="/field-guide" className="hover:text-gray-800 transition-colors">
                Field Guide
              </Link>
              <span>/</span>
              <span className="font-medium" style={{ color: sectionColor }}>
                {section.section_name}
              </span>
            </div>
          </nav>

          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="text-6xl mb-6 animate-fade-in-up delay-300">
              {sectionEmoji}
            </div>
            
            <h1 
              className="heading-hero text-4xl md:text-5xl lg:text-6xl leading-tight mb-8 animate-fade-in-up delay-500"
              style={{
                fontFamily: "var(--font-playfair, 'Playfair Display'), serif", 
                fontWeight: 700,
                color: sectionColor
              }}
            >
              {section.section_name}
            </h1>
            
            {section.intro && (
              <div 
                className="body-large text-xl md:text-2xl text-gray-700 leading-relaxed max-w-4xl mx-auto mb-8 animate-fade-in-up delay-700 whitespace-pre-line"
                style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}
              >
                <p>{section.intro}</p>
              </div>
            )}

            {/* Tools count */}
            <div className="animate-fade-in-up delay-1000">
              <div 
                className="inline-flex items-center bg-gray-50 px-6 py-3 rounded-full shadow-sm border"
                style={{ borderColor: `${sectionColor}20` }}
              >
                <span className="text-2xl font-bold mr-2" style={{ color: sectionColor }}>
                  {tools.length}
                </span>
                <span className="text-gray-700 font-medium">
                  curated tools in this category
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      {section.use_cases && (
        <section className="bg-gray-50 px-6 md:px-12 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 
              className="text-3xl md:text-4xl font-bold mb-8 text-center"
              style={{
                fontFamily: "var(--font-playfair, 'Playfair Display'), serif",
                color: sectionColor
              }}
            >
              💡 What You Can Do
            </h2>
            <div 
              className="text-lg text-gray-700 leading-relaxed prose prose-lg max-w-none whitespace-pre-line"
              style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}
            >
              <p>{section.use_cases}</p>
            </div>
          </div>
        </section>
      )}

      {/* Tools Section */}
      <section className="bg-white px-6 md:px-12 py-20">
        <div className="max-w-7xl mx-auto">
          {/* Search */}
          <div className="mb-12">
            <div className="max-w-md mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-200 focus:border-blue-500 focus:outline-none shadow-sm text-gray-900"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Results count */}
          {searchQuery && (
            <div className="mb-8 text-center">
              <p className="text-gray-600">
                Found <span className="font-bold text-gray-800">{filteredTools.length}</span> tools
                {searchQuery && ` for "${searchQuery}"`}
              </p>
            </div>
          )}

          {/* Tools Grid */}
          {filteredTools.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTools.map((tool, index) => (
                <ToolCard 
                  key={tool.id} 
                  tool={tool} 
                  sectionColor={sectionColor}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">
                {searchQuery ? 'No tools found' : 'No tools available'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Tools for this section are being added soon!'
                }
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Summary Section */}
      {section.summary && (
        <section className="bg-gray-50 px-6 md:px-12 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h2 
              className="text-3xl md:text-4xl font-bold mb-8"
              style={{
                fontFamily: "var(--font-playfair, 'Playfair Display'), serif",
                color: sectionColor
              }}
            >
              🎯 Summary
            </h2>
            <div 
              className="text-lg text-gray-700 leading-relaxed whitespace-pre-line"
              style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}
            >
              <p>{section.summary}</p>
            </div>
          </div>
        </section>
      )}

      {/* Navigation */}
      <section className="bg-white px-6 md:px-12 py-16 border-t border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <Link 
            href="/field-guide"
            className="bg-[#60A875] text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-2xl hover:bg-green-600 hover:scale-105 transition-all duration-300 inline-flex items-center gap-3 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
            <span className="font-bold text-lg">Back to Field Guide</span>
          </Link>
        </div>
      </section>
    </main>
  )
}

// Tool Card Component
function ToolCard({ 
  tool, 
  sectionColor, 
  index 
}: { 
  tool: AITool; 
  sectionColor: string; 
  index: number;
}) {
  const delayClass = `delay-${Math.min(index * 100 + 300, 1200)}`
  
  return (
    <div className={`group animate-fade-in-up ${delayClass}`}>
      <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border border-gray-100 h-full flex flex-col">
        
        {/* Header */}
        <div className="mb-4">
          <h4 
            className="text-xl font-bold mb-1 group-hover:text-opacity-80 transition-colors"
            style={{
              fontFamily: "var(--font-playfair, 'Playfair Display'), serif",
              color: sectionColor
            }}
          >
            {tool.name}
          </h4>
          {tool.company && (
            <p className="text-sm text-gray-500 font-medium">
              by {tool.company}
            </p>
          )}
        </div>

        {/* Description */}
        <p 
          className="text-gray-700 leading-relaxed mb-4 flex-1"
          style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}
        >
          {tool.description}
        </p>

        {/* Use Cases */}
        {tool.use_cases && (
          <p 
            className="text-sm text-gray-600 mb-4 italic bg-gray-50 p-3 rounded-lg"
            style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}
          >
            {tool.use_cases}
          </p>
        )}

        {/* Pricing Info */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              {tool.free_tier ? (
                <span className="text-green-600 font-semibold flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Free Tier
                </span>
              ) : (
                <span className="text-gray-500 font-medium">Paid Only</span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {tool.login_required ? (
                <span className="text-orange-600 font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Login Required
                </span>
              ) : (
                <span className="text-green-600 font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  No Login
                </span>
              )}
            </div>
          </div>

          {/* Access notes */}
          {tool.access_notes && (
            <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
              {tool.access_notes}
            </p>
          )}
        </div>

        {/* CTA Button */}
        {tool.website && (
          <a
            href={tool.website}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-3 rounded-xl font-semibold text-center transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 group"
          >
            <span>Try {tool.name}</span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>
    </div>
  )
}