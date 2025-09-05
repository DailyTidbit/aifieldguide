// app/TidbitLibrary/page.tsx - Fixed to use proper Tailwind v4 brand colors
import { Metadata } from 'next'
import { getTidbits } from '../lib/tidbits'
import TidbitLibraryClient from './TidbitLibraryClient'

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { count } = await getTidbits({ countOnly: true })
    const n = count ?? 0
    return {
      title: `Tidbit Library - ${n} AI Tips | Daily Tidbit`,
      description: `Browse ${n} practical AI tips and tutorials. Learn to use AI for productivity, creativity, and everyday tasks.`,
      openGraph: {
        title: `${n} AI Tips in Our Tidbit Library`,
        description: `Discover practical AI tutorials and tips for everyday use.`,
        url: 'https://dailytidbit.org/TidbitLibrary',
        images: [{ url: 'https://cdn.dailytidbit.org/tidbit-library-og.png', width: 1200, height: 630, alt: `Tidbit Library - ${n} AI Tips` }],
      },
      twitter: {
        title: `${n} AI Tips - Daily Tidbit Library`,
        description: `Browse our collection of practical AI tutorials and tips.`,
        images: ['https://cdn.dailytidbit.org/tidbit-library-og.png'],
      },
      alternates: { canonical: 'https://dailytidbit.org/TidbitLibrary' },
    }
  } catch {
    return {
      title: 'Tidbit Library - AI Tips & Tutorials | Daily Tidbit',
      description: 'Browse our collection of practical AI tips and tutorials.',
    }
  }
}

export default async function TidbitLibraryPage() {
  try {
    const initialData = await getTidbits({ page: 1, perPage: 24, sort: 'newest' })

    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-green/10 to-brand-blue/10">
        {/* Clean, minimal header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
          <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 font-serif">
                Tidbit Library
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                Explore every Daily Tidbit — one smart, simple AI idea per day.
              </p>
            </div>
          </div>
        </header>

        <div className="relative z-10">
          <TidbitLibraryClient initialData={initialData} />
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'CollectionPage',
              name: 'Tidbit Library',
              description: `${initialData.count ?? 0} practical AI tips and tutorials`,
              url: 'https://dailytidbit.org/TidbitLibrary',
              publisher: { '@type': 'Organization', name: 'Daily Tidbit', url: 'https://dailytidbit.org' },
              numberOfItems: initialData.count ?? 0,
            }),
          }}
        />
      </div>
    )
  } catch (error) {
    console.error('Server-side fetch error:', error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-green/10 to-brand-blue/10">
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
          <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 font-serif">
                Tidbit Library
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                Explore every Daily Tidbit — one smart, simple AI trick per day.
              </p>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-20" role="alert">
            <div className="bg-white/70 rounded-2xl p-8 w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-sm">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to load tidbits</h2>
            <p className="text-gray-600 mb-6">
              There was an issue loading the library. Please try refreshing the page.
            </p>
            <a href="/TidbitLibrary" className="inline-block px-6 py-3 bg-brand-green text-white rounded-xl hover:bg-brand-green-dark transition-colors focus:ring-2 focus:ring-brand-green/20 focus:outline-none">
              Refresh Page
            </a>
          </div>
        </main>
      </div>
    )
  }
}