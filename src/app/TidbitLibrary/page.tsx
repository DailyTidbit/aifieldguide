// app/TidbitLibrary/page.tsx
import { Metadata } from 'next'
import { BookOpen } from 'lucide-react'
import { getTidbits } from '../lib/tidbits'              // ✅ use alias
import TidbitLibraryClient from './TidbitLibraryClient' // ✅ use alias

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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
        <header className="sticky top-0 z-40 bg-white/50 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center justify-center gap-3">
              <div className="bg-gradient-to-br from-[#60A875] to-[#59B1E3] p-3 rounded-2xl">
                <BookOpen className="w-7 h-7 text-white" aria-hidden="true" />
              </div>
              <h1 className="heading-hero text-5xl md:text-6xl lg:text-7xl leading-tight text-gray-900 text-center">
                Tidbit Library
              </h1>
            </div>
          </div>
        </header>

        <TidbitLibraryClient initialData={initialData} />

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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
        <header className="sticky top-0 z-40 bg-white/50 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center justify-center gap-3">
              <div className="bg-gradient-to-br from-[#60A875] to-[#59B1E3] p-3 rounded-2xl">
                <BookOpen className="w-7 h-7 text-white" aria-hidden="true" />
              </div>
              <h1 className="heading-hero text-5xl md:text-6xl lg:text-7xl leading-tight text-gray-900 text-center">
                Tidbit Library
              </h1>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-20" role="alert">
            <div className="bg-white/70 rounded-2xl p-8 w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-sm">
              <BookOpen className="w-10 h-10 text-gray-400" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to load tidbits</h2>
            <p className="text-gray-600 mb-6">
              There was an issue loading the library. Please try refreshing the page.
            </p>
            <a href="/TidbitLibrary" className="inline-block px-6 py-3 bg-[#60A875] text-white rounded-xl hover:bg-green-600 transition-colors focus:ring-2 focus:ring-[#60A875]/20 focus:outline-none">
              Refresh Page
            </a>
          </div>
        </main>
      </div>
    )
  }
}
