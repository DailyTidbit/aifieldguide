import type { Metadata } from 'next'
import Link from 'next/link'
import { FieldGuideServerAPI } from '../lib/field-guide-server'

export const metadata: Metadata = {
  title: 'Start Here — AI Field Guide',
  description: 'New to AI tools? This is the best place to begin. Learn how to navigate AI Field Guide and find the right tools for you.',
  alternates: { canonical: 'https://www.aifieldguide.org/start-here' },
  openGraph: {
    title: 'Start Here — AI Field Guide',
    description: 'New to AI tools? This is the best place to begin.',
    url: 'https://www.aifieldguide.org/start-here',
    siteName: 'AI Field Guide',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Start Here — AI Field Guide',
    description: 'New to AI tools? This is the best place to begin.',
    images: ['/opengraph-image.png'],
    site: '@dailytidbit',
  },
  robots: { index: true, follow: true },
}

const BEGINNER_CATEGORIES = [
  { name: 'AI Assistants',              emoji: '🤖', why: 'The easiest place to start — just type and ask anything.' },
  { name: 'Image Generation',           emoji: '🎨', why: 'Turn a sentence into a picture in seconds.' },
  { name: 'Productivity Tools',         emoji: '⚡', why: 'Save time on emails, summaries, and everyday tasks.' },
  { name: 'Creative Writing & Storytelling', emoji: '✏️', why: 'Beat writer\'s block and generate ideas instantly.' },
]

const STEPS = [
  {
    number: '1',
    heading: 'Pick a category that sounds interesting',
    body: 'Don\'t overthink it. There\'s no wrong door. Each of the 14 categories covers a different slice of what AI can do.',
  },
  {
    number: '2',
    heading: 'Browse the tools inside',
    body: 'Every tool has a plain-English description, what it\'s good for, and whether it has a free tier. No jargon.',
  },
  {
    number: '3',
    heading: 'Try one',
    body: 'Click "Try" on any tool and you\'re there. Most have a free plan. Most take under a minute to get started.',
  },
]

export default async function StartHerePage() {
  let sections: { section_name: string; slug: string; toolCount?: number }[] = []
  try {
    sections = await FieldGuideServerAPI.getAllSectionsWithCounts()
  } catch {
    // non-fatal — page renders without live counts
  }

  const totalTools = sections.reduce((sum, s) => sum + (s.toolCount ?? 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">

      {/* Hero */}
      <section className="px-6 md:px-12 pt-12 pb-10">
        <div className="max-w-3xl mx-auto text-center">
          <Link
            href="/field-guide"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to AI Field Guide
          </Link>

          <div className="text-6xl mb-6" aria-hidden="true">🧭</div>
          <h1 className="text-4xl md:text-5xl font-bold font-serif text-gray-900 mb-4 leading-tight">
            New to AI tools?<br />
            <span className="text-brand-green">You&apos;re in the right place.</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            AI Field Guide is a hand-picked directory of{totalTools > 0 ? ` ${totalTools}` : ' 100+'} AI tools,
            organized into {sections.length > 0 ? sections.length : 14} simple categories.
            No hype, no jargon — just tools that actually work for everyday people.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 md:px-12 py-12">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold font-serif text-gray-900 mb-8 text-center">How to use this guide</h2>
          <div className="space-y-6">
            {STEPS.map(step => (
              <div key={step.number} className="flex gap-5 items-start">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{ backgroundColor: '#60A875' }}
                  aria-hidden="true"
                >
                  {step.number}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{step.heading}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Good starting points */}
      <section className="px-6 md:px-12 py-12">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold font-serif text-gray-900 mb-2 text-center">Good places to start</h2>
          <p className="text-gray-500 text-center mb-8">If you&apos;re not sure where to begin, these four categories are beginner-friendly.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {BEGINNER_CATEGORIES.map(cat => {
              const section = sections.find(s => s.section_name === cat.name)
              const href = section ? `/field-guide/${section.slug}` : '/field-guide'
              return (
                <Link
                  key={cat.name}
                  href={href}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-brand-green/30 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
                >
                  <div className="text-3xl mb-3" aria-hidden="true">{cat.emoji}</div>
                  <h3 className="font-bold text-gray-900 mb-1 group-hover:text-brand-green transition-colors">{cat.name}</h3>
                  <p className="text-sm text-gray-500">{cat.why}</p>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Reassurance */}
      <section className="px-6 md:px-12 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="text-4xl mb-4" aria-hidden="true">🌺</div>
            <h2 className="text-2xl font-bold font-serif text-gray-900 mb-3">
              Don&apos;t worry about getting it wrong
            </h2>
            <p className="text-gray-600 leading-relaxed max-w-xl mx-auto mb-6">
              AI tools are more accessible than ever. You don&apos;t need a technical background,
              a big budget, or hours of free time. Most of what&apos;s in this guide has a free plan
              and takes minutes to try.
            </p>
            <Link
              href="/field-guide"
              className="inline-flex items-center gap-2 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg hover:opacity-90 hover:scale-105 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2"
              style={{ backgroundColor: '#60A875' }}
            >
              Explore the Field Guide
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
