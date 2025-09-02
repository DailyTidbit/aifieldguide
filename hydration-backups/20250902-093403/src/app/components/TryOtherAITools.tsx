'use client'

import Link from 'next/link'
import React, { useMemo } from 'react'
import { useToolSearch } from '../hooks/useFieldGuide' // <- use this to get allTools

// Hardcoded featured sections with fixed colors + emojis
const FEATURED_SECTIONS = [
  {
    slug: 'ai-assistants',
    title: 'AI Assistants',
    emoji: '🤖',
    color: 'var(--brand-green)',
    category: 'AI Assistants',
  },
  {
    slug: 'image-generation',
    title: 'Image Generation',
    emoji: '🎨',
    color: 'var(--brand-blue)',
    category: 'Image Generation',
  },
  {
    slug: 'video-generation',
    title: 'Video Generation',
    emoji: '🎬',
    color: '#F7936F',
    category: 'Video Generation',
  },
  {
    slug: 'music-creation',
    title: 'Music Creation',
    emoji: '🎵',
    color: '#F39C12',
    category: 'Music Creation',
  },
  {
    slug: 'creative-writing-storytelling',
    title: 'Creative Writing & Storytelling',
    emoji: '✍️',
    color: '#8E44AD',
    category: 'Creative Writing & Storytelling',
  },
  {
    slug: 'education-learning',
    title: 'Education & Learning',
    emoji: '📚',
    color: '#E67E22',
    category: 'Education & Learning',
  },
] as const

export default function TryOtherAITools() {
  // Hook provides every tool; we'll derive counts by category
  const { allTools, loading } = useToolSearch()

  // Build counts by category once
  const countsByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    for (const t of allTools ?? []) {
      const key = (t.category || '').trim()
      if (!key) continue
      map[key] = (map[key] || 0) + 1
    }
    return map
  }, [allTools])

  if (loading) {
    return (
      <div className="mt-8 rounded-2xl border border-black/5 bg-white/80 p-6 text-center text-gray-600">
        Loading AI categories…
      </div>
    )
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
        {FEATURED_SECTIONS.map((s) => {
          const count = countsByCategory[s.category] ?? 0
          return (
            <Link
              key={s.slug}
              href={`/field-guide/${s.slug}`}
              className="group relative rounded-2xl border border-black/[0.06] bg-white shadow-sm transition-all
                         hover:shadow-[0_10px_28px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 focus:outline-none
                         focus:ring-2 focus:ring-brand-green/20"
              aria-label={`Open ${s.title}`}
            >
              {/* Accent bar */}
              <div
                className="h-1.5 w-full rounded-t-2xl"
                style={{ background: s.color }}
                aria-hidden="true"
              />

              {/* Body */}
              <div className="p-5 md:p-6">
                <div className="flex items-start justify-between">
                  <span className="text-2xl" aria-hidden="true">
                    {s.emoji}
                  </span>

                  {/* Tool count chip */}
                  <span className="inline-flex items-center rounded-full border border-black/[0.08] bg-black/[0.03] px-2 py-0.5 text-xs font-medium text-gray-700">
                    {count} tools
                  </span>
                </div>

                <h4
                  className="mt-3 text-lg md:text-xl font-semibold text-gray-900 leading-snug"
                  style={{ fontFamily: "var(--font-playfair, 'Playfair Display'), serif" }}
                >
                  {s.title}
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
          className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-brand-green text-white shadow hover:bg-brand-greenDark transition-colors"
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