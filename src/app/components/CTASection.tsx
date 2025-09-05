// app/components/CTASection.tsx - Updated for Tailwind v4
'use client'

import Link from 'next/link'
import { useMounted } from '../lib/clientUtils'
import { useAnalytics } from '../lib/analytics'

interface CTASectionProps {
  variant?: 'default' | 'transparent'
}

function CTASectionSkeleton({ variant = 'default' }: CTASectionProps) {
  return (
    <section className={`py-8 sm:py-12 ${variant === 'transparent' ? '' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-brand-green/20 to-brand-blue/20 p-8 lg:p-10 rounded-3xl shadow-lg">
          <div className="text-center max-w-4xl mx-auto mb-10">
            <div className="h-12 bg-gray-200 rounded w-3/4 mx-auto mb-8 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="bg-gray-300 rounded-xl h-32 animate-pulse"></div>
            <div className="bg-gray-300 rounded-xl h-32 animate-pulse"></div>
            <div className="bg-gray-300 rounded-xl h-32 animate-pulse"></div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function CTASection({ variant = 'default' }: CTASectionProps) {
  const mounted = useMounted()
  const { track } = useAnalytics()

  // MANDATORY: Show skeleton until mounted
  if (!mounted) {
    return <CTASectionSkeleton variant={variant} />
  }

  // Analytics tracking function
  const trackCTAClick = (ctaName: string, section: string, url: string) => {
    track('cta_click', {
      cta_name: ctaName,
      cta_section: section,
      cta_url: url
    })
  }

  return (
    <section className={`py-8 sm:py-12 ${variant === 'transparent' ? '' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Gradient panel */}
        <div className="bg-gradient-to-br from-brand-green/20 to-brand-blue/20 p-8 lg:p-10 rounded-3xl shadow-lg relative overflow-hidden">
          {/* Impact line */}
          <div className="text-center max-w-4xl mx-auto relative z-10 mb-10">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-brand-green/10 to-brand-blue/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-br from-brand-blue/10 to-purple-400/10 rounded-full blur-xl" />
            <p className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight relative z-10 mb-8 font-serif">
              Simple ideas. Real results. For real people.
            </p>
          </div>

          {/* 3 CTA cards */}
          <div className="text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-4">
              {/* Today's Tidbit */}
              <Link
                href="/day/today"
                aria-label="Go to Today's Tidbit"
                onClick={() => trackCTAClick("Today's Tidbit", 'CTA Section', '/day/today')}
                className="cursor-pointer block rounded-xl bg-brand-green text-white px-6 py-5 shadow-lg transition-all duration-300 hover:bg-brand-green-dark hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-green group min-h-[120px]"
              >
                <div className="flex flex-col items-center justify-center gap-2 font-semibold">
                  <div className="text-3xl mb-1 group-hover:scale-110 group-hover:animate-pulse transition-all duration-300 drop-shadow-sm">🌺</div>
                  <div className="text-lg font-bold">Today's Tidbit</div>
                  <div className="text-sm opacity-90 flex items-center gap-2">
                    Jump into today's AI tip
                    <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                  </div>
                </div>
              </Link>

              {/* Tidbit Library */}
              <Link
                href="/TidbitLibrary"
                aria-label="Explore the Tidbit Library"
                onClick={() => trackCTAClick('Tidbit Library', 'CTA Section', '/TidbitLibrary')}
                className="cursor-pointer block rounded-xl bg-brand-blue text-white px-6 py-5 shadow-lg transition-all duration-300 hover:bg-brand-blue-dark hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-blue group min-h-[120px]"
              >
                <div className="flex flex-col items-center justify-center gap-2 font-semibold">
                  <div className="text-3xl mb-1 group-hover:scale-110 group-hover:animate-pulse transition-all duration-300 drop-shadow-sm">🐚</div>
                  <div className="text-lg font-bold">Tidbit Library</div>
                  <div className="text-sm opacity-90 flex items-center gap-2">
                    Explore all past tips
                    <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                  </div>
                </div>
              </Link>

              {/* BitBoard */}
              <Link
                href="/bitboard"
                aria-label="Visit BitBoard"
                onClick={() => trackCTAClick('BitBoard', 'CTA Section', '/bitboard')}
                className="cursor-pointer block rounded-xl text-gray-800 px-6 py-5 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 group min-h-[120px]"
                style={{ backgroundColor: '#F5C26B' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F4B942'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F5C26B'
                }}
              >
                <div className="flex flex-col items-center justify-center gap-2 font-semibold">
                  <div className="text-3xl mb-1 group-hover:scale-110 group-hover:animate-pulse transition-all duration-300 drop-shadow-sm">🌴</div>
                  <div className="text-lg font-bold">BitBoard</div>
                  <div className="text-sm opacity-80 flex items-center gap-2">
                    See what people are making
                    <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                  </div>
                </div>
              </Link>
            </div>

            <p className="text-gray-700 italic text-lg font-sans">
              Feel the rhythm. Hit the keys.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}