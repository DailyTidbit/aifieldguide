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
              {/* All Categories */}
              <Link
                href="/field-guide"
                aria-label="Browse all AI categories"
                onClick={() => trackCTAClick('All Categories', 'CTA Section', '/field-guide')}
                className="cursor-pointer block rounded-xl bg-brand-green text-white px-6 py-5 shadow-lg transition-[background-color,transform,box-shadow] duration-300 hover:bg-brand-green-dark hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-green group min-h-[120px]"
              >
                <div className="flex flex-col items-center justify-center gap-2 font-semibold">
                  <div className="text-3xl mb-1 group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">🧭</div>
                  <div className="text-lg font-bold">All Categories</div>
                  <div className="text-sm opacity-90 flex items-center gap-2">
                    Browse every AI topic
                    <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                  </div>
                </div>
              </Link>

              {/* Community */}
              <a
                href="https://www.facebook.com/dailytidbit.org"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Join the AI Field Guide community on Facebook"
                onClick={() => trackCTAClick('Community', 'CTA Section', 'https://www.facebook.com/dailytidbit.org')}
                className="cursor-pointer block rounded-xl bg-brand-blue text-white px-6 py-5 shadow-lg transition-[background-color,transform,box-shadow] duration-300 hover:bg-brand-blue-dark hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-blue group min-h-[120px]"
              >
                <div className="flex flex-col items-center justify-center gap-2 font-semibold">
                  <div className="text-3xl mb-1 group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">👥</div>
                  <div className="text-lg font-bold">Join the Community</div>
                  <div className="text-sm opacity-90 flex items-center gap-2">
                    Connect on Facebook
                    <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                  </div>
                </div>
              </a>

              {/* Get in Touch */}
              <a
                href="mailto:mike@dailytidbit.org"
                aria-label="Get in touch with AI Field Guide"
                onClick={() => trackCTAClick('Get in Touch', 'CTA Section', 'mailto:mike@dailytidbit.org')}
                className="cursor-pointer block rounded-xl text-gray-800 px-6 py-5 shadow-lg transition-[opacity,transform,box-shadow] duration-300 hover:opacity-90 hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 group min-h-[120px]"
                style={{ backgroundColor: '#F5C26B' }}
              >
                <div className="flex flex-col items-center justify-center gap-2 font-semibold">
                  <div className="text-3xl mb-1 group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">✉️</div>
                  <div className="text-lg font-bold">Get in Touch</div>
                  <div className="text-sm opacity-80 flex items-center gap-2">
                    Questions or feedback
                    <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}