// src/app/field-guide/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useFieldGuide } from '../hooks/useFieldGuide'
import { FieldGuideSection } from '../lib/field-guide-types'

// Helper function to get emoji for each section
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

// Helper function to get brand color for each section
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

// Define the desired order of sections (FINAL ORDER)
const SECTION_ORDER = [
  'AI Assistants',
  'Image Generation', 
  'Video Generation',
  'Music Creation',
  'Photo & Image Tools',
  'Video Editing',
  'AI Avatars',
  'Speech & Voice',
  'Creative Writing & Storytelling',
  'Productivity Tools',
  'AI Search Tools',
  'Education & Learning',
  'Coding Assistants',
  'Automation Tools'
]

export default function FieldGuidePage() {
  const { sections, totalTools, loading } = useFieldGuide()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Sort sections according to the defined order
  const sortedSections = sections.sort((a, b) => {
    const indexA = SECTION_ORDER.indexOf(a.section_name)
    const indexB = SECTION_ORDER.indexOf(b.section_name)
    
    // If section not found in order array, put it at the end
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    
    return indexA - indexB
  })

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 md:px-12 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-[#60A875] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading your AI field guide...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section - Much darker gradient */}
      <section className="bg-gradient-to-br from-green-200 via-green-100 to-blue-200 px-6 md:px-12 py-20">
        
        <div className={`max-w-6xl mx-auto text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h1 
            className="heading-hero text-5xl md:text-6xl lg:text-7xl leading-tight mb-8 animate-fade-in-up"
            style={{fontFamily: "var(--font-playfair, 'Playfair Display'), serif", fontWeight: 700}}
          >
            <span className="text-[#60A875]">🧭</span> Your <span className="text-[#59B1E3]">AI Field Guide</span>
          </h1>
          
          <div className="space-y-6 body-large text-xl md:text-2xl text-gray-800 leading-relaxed max-w-4xl mx-auto animate-fade-in-up delay-300">
            <p>
              <strong>Everything you need to know about AI tools — organized, explained, and ready to use.</strong>
            </p>
            <p>
              From writing and creating to automating and learning, we've mapped out the AI landscape so you don't have to.
            </p>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-6 max-w-2xl mx-auto animate-fade-in-up delay-500">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
              <div className="text-3xl font-bold text-[#60A875]" style={{fontFamily: "var(--font-playfair, 'Playfair Display'), serif"}}>
                {sortedSections.length}
              </div>
              <div className="text-gray-600 font-medium">Categories</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
              <div className="text-3xl font-bold text-[#59B1E3]" style={{fontFamily: "var(--font-playfair, 'Playfair Display'), serif"}}>
                {totalTools}
              </div>
              <div className="text-gray-600 font-medium">AI Tools</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg col-span-2 md:col-span-1">
              <div className="text-3xl font-bold text-[#F7936F]" style={{fontFamily: "var(--font-playfair, 'Playfair Display'), serif"}}>
                100%
              </div>
              <div className="text-gray-600 font-medium">Free Guide</div>
            </div>
          </div>
        </div>
      </section>

      {/* Field Guide Categories */}
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
              className="text-xl md:text-2xl text-gray-800 max-w-3xl mx-auto leading-relaxed font-medium"
              style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}
            >
              Pick your adventure — each section is packed with hand-picked tools and real-world use cases.
            </p>
          </div>

          {/* Categories Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedSections.map((section, index) => (
              <SectionCard 
                key={section.id} 
                section={section} 
                index={index} 
              />
            ))}
          </div>
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
            >
              <span className="font-bold text-lg">Start with AI Assistants</span>
              <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
            </Link>
            <Link 
              href="/"
              className="bg-[#59B1E3] text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-2xl hover:bg-blue-600 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 group"
            >
              <span className="font-bold text-lg">Back to Daily Tidbit</span>
              <span className="group-hover:translate-x-1 transition-transform duration-200">🏠</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

// Section Card Component
interface SectionCardProps {
  section: FieldGuideSection
  index: number
}

function SectionCard({ section, index }: SectionCardProps) {
  const delayClass = `delay-${Math.min(index * 100 + 300, 1200)}`
  const sectionColor = getSectionColor(section.section_name)
  const sectionEmoji = getSectionEmoji(section.section_name)
  
  return (
    <Link 
      href={`/field-guide/${section.slug}`}
      className={`group block animate-fade-in-up ${delayClass}`}
    >
      <div className="bg-white p-8 rounded-3xl shadow-md hover:shadow-xl transition-all duration-500 hover:scale-[1.02] border border-gray-100 relative overflow-hidden h-full">
        {/* Top accent bar */}
        <div 
          className="absolute top-0 left-0 w-full h-2"
          style={{ backgroundColor: sectionColor }}
        ></div>
        
        {/* Section emoji and number */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-4xl">{sectionEmoji}</div>
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ backgroundColor: sectionColor }}
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
        
        {/* CTA */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <span className="font-semibold text-gray-700">Explore tools</span>
          </div>
          <div className="text-sm font-semibold text-gray-500 group-hover:text-gray-700 transition-colors flex items-center gap-1">
            Learn more
            <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
          </div>
        </div>
      </div>
    </Link>
  )
}