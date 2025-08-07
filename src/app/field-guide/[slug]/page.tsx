// src/app/field-guide/[slug]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useSection } from '../../hooks/useFieldGuide'
import { AITool } from '../../lib/field-guide-types'
import ToolModal from '../../components/ToolModal'

// Helper functions - FINAL NAMES
function getSectionEmoji(sectionName: string): string {
  const emojiMap: Record<string, string> = {
    // FINAL category names
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
    
    // OLD names (backward compatibility during migration)
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
    // FINAL category names
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
    
    // OLD names (backward compatibility during migration)
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

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-200 via-green-100 to-blue-200 px-6 md:px-12 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-[#60A875] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-700 text-lg font-semibold">Loading section...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!section) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-200 via-green-100 to-blue-200 px-6 md:px-12 py-20">
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
    <main className="min-h-screen">
      {/* Header Section - Matching main field guide style */}
      <section className="bg-gradient-to-br from-green-200 via-green-100 to-blue-200 px-6 md:px-12 py-20">
        <div className={`max-w-6xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Enhanced Breadcrumb */}
          <nav className="mb-12 animate-fade-in-up">
            <div className="flex items-center space-x-3 text-lg md:text-xl">
              <Link 
                href="/field-guide" 
                className="text-gray-700 hover:text-gray-900 transition-colors font-semibold bg-white/40 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm hover:shadow-md"
                style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}
              >
                🧭 Field Guide
              </Link>
              <span className="text-gray-600 text-2xl">/</span>
              <span 
                className="font-bold bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm"
                style={{ 
                  color: sectionColor,
                  fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"
                }}
              >
                {section.section_name}
              </span>
            </div>
          </nav>

          {/* Section Header */}
          <div className="text-center mb-16">
            <h1 
              className="heading-hero text-5xl md:text-6xl lg:text-7xl leading-tight mb-8 animate-fade-in-up delay-500 flex items-center justify-center gap-6"
              style={{
                fontFamily: "var(--font-playfair, 'Playfair Display'), serif", 
                fontWeight: 700,
                color: sectionColor
              }}
            >
              <span className="text-6xl md:text-7xl lg:text-8xl">{sectionEmoji}</span>
              {section.section_name}
            </h1>
            
            {section.intro && (
              <div 
                className="body-large text-xl md:text-2xl text-gray-800 leading-relaxed max-w-4xl mx-auto mb-8 animate-fade-in-up delay-700 whitespace-pre-line bg-white/30 backdrop-blur-sm rounded-2xl p-8 shadow-lg"
                style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}
              >
                <p>{section.intro}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tools Section - REORDERED TO COME SECOND */}
      <section className="bg-white px-6 md:px-12 py-20">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 
              className="text-5xl md:text-6xl font-bold mb-6 flex items-center justify-center gap-6"
              style={{
                fontFamily: "var(--font-playfair, 'Playfair Display'), serif",
                color: sectionColor
              }}
            >
              <span className="text-4xl md:text-5xl">🛠️</span>
              Explore Tools
            </h2>
            
            <div className="w-32 h-2 mx-auto rounded-full mb-8" style={{ backgroundColor: sectionColor }}></div>
            
            <p 
              className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
              style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}
            >
              Hand-picked AI tools to supercharge your {section.section_name.toLowerCase()} workflow
            </p>
          </div>

          {/* Tools Grid */}
          {filteredTools.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
            <div className="text-center py-20">
              <div 
                className="inline-flex items-center justify-center w-32 h-32 rounded-full mb-8 shadow-lg"
                style={{ backgroundColor: `${sectionColor}10`, border: `3px solid ${sectionColor}20` }}
              >
                <span className="text-5xl">🚀</span>
              </div>
              
              <h3 
                className="text-4xl font-bold mb-6"
                style={{
                  fontFamily: "var(--font-playfair, 'Playfair Display'), serif",
                  color: sectionColor
                }}
              >
                Tools Coming Soon
              </h3>
              
              <p 
                className="text-xl text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed"
                style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}
              >
                We're carefully curating the best AI tools for this section. Check back soon!
              </p>
              
              <Link
                href="/field-guide"
                className="inline-flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-10 py-5 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg group text-lg"
              >
                <span>Explore Other Categories</span>
                <svg className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Use Cases Section - REORDERED TO COME THIRD */}
      {section.use_cases && (
        <section className="bg-gray-100 px-6 md:px-12 py-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 
                className="text-5xl md:text-6xl font-bold mb-6 flex items-center justify-center gap-6"
                style={{
                  fontFamily: "var(--font-playfair, 'Playfair Display'), serif",
                  color: sectionColor
                }}
              >
                <span className="text-4xl md:text-5xl">💡</span>
                What You Can Do
              </h2>
              
              <div className="w-32 h-2 mx-auto rounded-full" style={{ backgroundColor: sectionColor }}></div>
            </div>
            
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-200 relative">
              <div 
                className="absolute top-0 left-0 w-full h-3 rounded-t-3xl"
                style={{ backgroundColor: sectionColor }}
              ></div>
              
              <div 
                className="text-lg md:text-xl text-gray-700 leading-relaxed space-y-6 whitespace-pre-line"
                style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}
              >
                {section.use_cases.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="text-gray-700 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Summary Section - REORDERED TO COME LAST */}
      {section.summary && (
        <section className="bg-gray-200 px-6 md:px-12 py-20">
          <div className="max-w-5xl mx-auto text-center">
            <div className="text-center mb-16">
              <h2 
                className="text-5xl md:text-6xl font-bold mb-6 flex items-center justify-center gap-6"
                style={{
                  fontFamily: "var(--font-playfair, 'Playfair Display'), serif",
                  color: sectionColor
                }}
              >
                <span className="text-4xl md:text-5xl">🎯</span>
                Key Takeaways
              </h2>
              
              <div className="w-32 h-2 mx-auto rounded-full mb-12" style={{ backgroundColor: sectionColor }}></div>
            </div>
            
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-200 relative">
              <div 
                className="absolute top-0 left-0 w-full h-3 rounded-t-3xl"
                style={{ backgroundColor: sectionColor }}
              ></div>
              
              <div 
                className="text-lg md:text-xl text-gray-700 leading-relaxed space-y-6 whitespace-pre-line max-w-4xl mx-auto"
                style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}
              >
                {section.summary.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="text-gray-700 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Navigation */}
      <section className="bg-white px-6 md:px-12 py-20 border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 md:p-12 shadow-lg">
            <h3 
              className="text-3xl md:text-4xl font-bold mb-6 text-gray-800"
              style={{fontFamily: "var(--font-playfair, 'Playfair Display'), serif"}}
            >
              Ready to explore more?
            </h3>
            
            <p 
              className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed"
              style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}
            >
              Discover other AI categories and find the perfect tools for your creative projects.
            </p>
            
            <Link 
              href="/field-guide"
              className="inline-flex items-center bg-[#60A875] hover:bg-green-600 text-white px-12 py-6 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group font-bold text-xl"
            >
              <svg className="w-7 h-7 mr-4 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Field Guide</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

// Tool Card Component with Modal Integration
function ToolCard({ 
  tool, 
  sectionColor, 
  index 
}: { 
  tool: AITool; 
  sectionColor: string; 
  index: number;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const delayClass = `delay-${Math.min(index * 100 + 300, 1200)}`
  
  return (
    <>
      <div className={`group animate-fade-in-up ${delayClass}`}>
        <div className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] border border-gray-100 h-full flex flex-col relative overflow-hidden">
          
          {/* Top accent bar */}
          <div 
            className="absolute top-0 left-0 w-full h-2 rounded-t-3xl"
            style={{ backgroundColor: sectionColor }}
          ></div>
          
          {/* Header */}
          <div className="mb-6">
            <h4 
              className="text-2xl font-bold mb-2 group-hover:text-opacity-80 transition-colors"
              style={{
                fontFamily: "var(--font-playfair, 'Playfair Display'), serif",
                color: sectionColor
              }}
            >
              {tool.name}
            </h4>
            {tool.company && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="text-sm text-gray-600 font-medium">
                  by {tool.company}
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <p 
            className="text-gray-700 leading-relaxed mb-6 flex-1 text-lg"
            style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}
          >
            {tool.description}
          </p>

          {/* Use Cases */}
          {tool.use_cases && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Use Cases</span>
              </div>
              <p 
                className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100 italic"
                style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}
              >
                {tool.use_cases}
              </p>
            </div>
          )}

          {/* Pricing Info */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {tool.free_tier ? (
                  <span className="inline-flex items-center bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Free Tier
                  </span>
                ) : (
                  <span className="inline-flex items-center bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    Paid Only
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {tool.login_required ? (
                  <span className="inline-flex items-center bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Login Required
                  </span>
                ) : (
                  <span className="inline-flex items-center bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    No Login
                  </span>
                )}
              </div>
            </div>

            {/* Access notes */}
            {tool.access_notes && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs text-blue-700 font-medium">
                    {tool.access_notes}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            {/* Learn More Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold text-center transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 group border border-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="w-full text-white px-6 py-3 rounded-xl font-bold text-center transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-3 group shadow-lg hover:shadow-xl"
                style={{
                  background: `linear-gradient(135deg, ${sectionColor}, ${sectionColor}dd)`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${sectionColor}ee, ${sectionColor}cc)`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${sectionColor}, ${sectionColor}dd)`
                }}
              >
                <span>Try {tool.name}</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <ToolModal
        tool={tool}
        sectionColor={sectionColor}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}