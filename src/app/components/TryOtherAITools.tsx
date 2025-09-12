'use client'

import Link from 'next/link'
import React, { useMemo } from 'react'
import { useMounted } from '../lib/clientUtils'
import { useToolSearch } from '../hooks/useFieldGuide'

// Hardcoded featured sections with proper Tailwind v4 CSS variables
const FEATURED_SECTIONS = [
  {
    slug: 'ai-assistants',
    title: 'AI Assistants',
    emoji: '🤖',
    color: 'var(--color-brand-green)',
    bgClass: 'bg-category-ai-assistants',
    category: 'AI Assistants',
  },
  {
    slug: 'image-generation',
    title: 'Image Generation',
    emoji: '🎨',
    color: 'var(--color-brand-blue)',
    bgClass: 'bg-category-image-generation',
    category: 'Image Generation',
  },
  {
    slug: 'video-generation',
    title: 'Video Generation',
    emoji: '🎬',
    color: 'var(--color-video-generation)',
    bgClass: 'bg-category-video-generation',
    category: 'Video Generation',
  },
  {
    slug: 'music-creation',
    title: 'Music Creation',
    emoji: '🎵',
    color: 'var(--color-music-creation)',
    bgClass: 'bg-category-music-creation',
    category: 'Music Creation',
  },
  {
    slug: 'creative-writing-storytelling',
    title: 'Creative Writing & Storytelling',
    emoji: '✍️',
    color: 'var(--color-creative-writing)',
    bgClass: 'bg-category-creative-writing',
    category: 'Creative Writing & Storytelling',
  },
  {
    slug: 'education-learning',
    title: 'Education & Learning',
    emoji: '📚',
    color: 'var(--color-education-learning)',
    bgClass: 'bg-category-education-learning',
    category: 'Education & Learning',
  },
] as const

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <section
      aria-labelledby="mini-field-guide-title"
      className="mt-8 rounded-3xl border border-black/[0.06] bg-white/95 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-sm px-6 py-8 md:px-10 md:py-10"
    >
      {/* Header skeleton */}
      <div className="text-center mb-8 md:mb-10">
        <div className="h-8 bg-gray-200 rounded-lg w-64 mx-auto mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-96 mx-auto animate-pulse" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-black/[0.06] bg-white shadow-sm">
            <div className="h-1.5 bg-gray-200 rounded-t-2xl animate-pulse" />
            <div className="p-5 md:p-6">
              <div className="flex items-start justify-between">
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
                <div className="h-5 bg-gray-200 rounded-full w-16 animate-pulse" />
              </div>
              <div className="mt-3 h-6 bg-gray-200 rounded w-full animate-pulse" />
              <div className="mt-3 h-4 bg-gray-200 rounded w-20 animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Footer skeleton */}
      <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
        <div className="h-10 bg-gray-200 rounded-xl w-40 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded-xl w-40 animate-pulse" />
      </div>
    </section>
  )
}

// Error display component
function ErrorDisplay({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <section
      aria-labelledby="mini-field-guide-title"
      className="mt-8 rounded-3xl border border-red-200 bg-red-50 px-6 py-8 md:px-10 md:py-10"
    >
      <div className="text-center">
        <div className="text-red-600 text-4xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold text-red-800 mb-2">
          Failed to Load AI Categories
        </h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </section>
  )
}

export default function TryOtherAITools() {
  // MANDATORY: Hydration safety first
  const mounted = useMounted()
  
  // Hook provides every tool; we'll derive counts by category
  const { allTools, loading, error, retry } = useToolSearch()

  // Build counts by category once
  const countsByCategory = useMemo(() => {
    if (!allTools || allTools.length === 0) return {}
    
    const map: Record<string, number> = {}
    for (const tool of allTools) {
      const key = (tool.category || '').trim()
      if (!key) continue
      map[key] = (map[key] || 0) + 1
    }
    return map
  }, [allTools])

  // MANDATORY: Show skeleton until mounted
  if (!mounted) {
    return <LoadingSkeleton />
  }

  // Show loading state
  if (loading) {
    return <LoadingSkeleton />
  }

  // Show error state with retry
  if (error) {
    return <ErrorDisplay error={error} onRetry={retry} />
  }

  return (
    <section
      aria-labelledby="mini-field-guide-title"
      className="mt-8 rounded-3xl border border-black/[0.06] bg-white/95 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-sm px-6 py-8 md:px-10 md:py-10"
    >
      {/* Header */}
      <div className="text-center mb-8 md:mb-10">
        <h3
          id="mini-field-guide-title"
          className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight"
          style={{ fontFamily: "var(--font-playfair, 'Playfair Display'), serif" }}
        >
          🔍 Explore AI by Category
        </h3>
        <p
          className="mt-2 text-sm md:text-base text-gray-700"
          style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif" }}
        >
          Quick picks from our Field Guide. Dive into a section or browse everything.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
        {FEATURED_SECTIONS.map((section) => {
          const count = countsByCategory[section.category] ?? 0
          
          return (
            <Link
              key={section.slug}
              href={`/field-guide/${section.slug}`}
              className="group relative rounded-2xl border border-black/[0.06] bg-white shadow-sm transition-all
                         hover:shadow-[0_10px_28px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 focus:outline-none
                         focus:ring-2 focus:ring-brand-green/20"
              aria-label={`Open ${section.title} section with ${count} tools`}
            >
              {/* Accent bar using CSS variable */}
              <div
                className="h-1.5 w-full rounded-t-2xl"
                style={{ backgroundColor: section.color }}
                aria-hidden="true"
              />

              {/* Body */}
              <div className="p-5 md:p-6">
                <div className="flex items-start justify-between">
                  <span className="text-2xl" aria-hidden="true">
                    {section.emoji}
                  </span>

                  {/* Tool count chip */}
                  <span className="inline-flex items-center rounded-full border border-black/[0.08] bg-black/[0.03] px-2 py-0.5 text-xs font-medium text-gray-700">
                    {count} tool{count !== 1 ? 's' : ''}
                  </span>
                </div>

                <h4
                  className="mt-3 text-lg md:text-xl font-semibold text-gray-900 leading-snug"
                  style={{ fontFamily: "var(--font-playfair, 'Playfair Display'), serif" }}
                >
                  {section.title}
                </h4>

                {/* Explore affordance */}
                <div className="mt-3 inline-flex items-center text-sm font-semibold text-brand-green">
                  <span className="transition-transform group-hover:translate-x-0.5">
                    Explore →
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Footer CTAs */}
      <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/field-guide/ai-assistants"
          className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-brand-green text-white shadow hover:bg-brand-green-dark transition-colors"
        >
          Explore AI Assistants
        </Link>
        <Link
          href="/field-guide"
          className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-white text-gray-900 border border-black/10 hover:bg-black/[0.03] transition"
        >
          Browse all 14 sections
        </Link>
      </div>
    </section>
  )
}