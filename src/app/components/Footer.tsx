'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useMounted, getCurrentYear } from '../lib/clientUtils'
import { useAnalytics } from '../lib/analytics'

function FooterSkeleton() {
  return (
    <footer className="relative z-10 bg-gradient-to-br from-gray-200 via-gray-100 to-brand-blue/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center space-y-6">
          <div className="pt-4 border-t border-gray-300 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto animate-pulse"></div>
          </div>
        </div>
      </div>
    </footer>
  )
}

function VisitorCounter({ count }: { count: number | null }) {
  const digits = count !== null
    ? String(count).padStart(7, '0').split('')
    : '-------'.split('')

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-mono">
        You are visitor
      </p>
      <div
        className="flex items-stretch rounded-sm overflow-hidden border border-gray-700 shadow-lg"
        style={{ background: '#0d0d0d' }}
        aria-label={count !== null ? `Visitor number ${count}` : 'Loading visitor count'}
        role="img"
      >
        {digits.map((digit, i) => (
          <div
            key={i}
            className="w-8 h-11 flex items-center justify-center font-mono text-xl font-bold border-r border-gray-800 last:border-r-0 select-none"
            style={{
              color: count !== null ? '#4ade80' : '#1f2937',
              textShadow: count !== null ? '0 0 8px #4ade80, 0 0 20px #16a34a' : 'none',
              background: 'linear-gradient(180deg, #111 0%, #0d0d0d 50%, #111 100%)',
            }}
          >
            {digit}
          </div>
        ))}
      </div>
      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-mono">
        since 5-28-2026 launch
      </p>
    </div>
  )
}

export default function Footer() {
  const mounted = useMounted()
  const [visitorCount, setVisitorCount] = useState<number | null>(null)
  const { track } = useAnalytics()

  useEffect(() => {
    if (!mounted) return
    fetch('/api/visits', { method: 'POST' })
      .then(r => r.json())
      .then(data => { if (data.count !== null) setVisitorCount(data.count) })
      .catch(() => {})
  }, [mounted])

  if (!mounted) {
    return <FooterSkeleton />
  }

  const handleFooterLinkClick = (label: string, url: string) => {
    track('cta_click', {
      cta_type: label,
      cta_location: 'footer',
      target_url: url,
      link_type: 'footer_navigation'
    })
  }

  return (
    <footer className="relative z-10 bg-gradient-to-br from-gray-200 via-gray-100 to-brand-blue/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center space-y-6">

          {/* Retro Visitor Counter */}
          <VisitorCounter count={visitorCount} />

          {/* Legal + Get in Touch link */}
          <div className="pt-4 border-t border-gray-300 space-y-2">
            <nav className="flex flex-wrap items-center justify-center gap-3 text-sm text-brand-blue" aria-label="Footer">
              <Link href="/privacy" className="hover:underline hover:text-brand-blue-dark transition-colors"
                onClick={() => handleFooterLinkClick('privacy_policy', '/privacy')}>
                Privacy Policy
              </Link>
              <span className="text-gray-400 text-sm" aria-hidden="true">•</span>
              <Link href="/accessibility" className="hover:underline hover:text-brand-blue-dark transition-colors"
                onClick={() => handleFooterLinkClick('accessibility_statement', '/accessibility')}>
                Accessibility
              </Link>
              <span className="text-gray-400 text-sm" aria-hidden="true">•</span>
              <Link href="/terms" className="hover:underline hover:text-brand-blue-dark transition-colors"
                onClick={() => handleFooterLinkClick('terms_conditions', '/terms')}>
                Terms
              </Link>
              <span className="text-gray-400 text-sm" aria-hidden="true">•</span>
              <Link
                href="/contact"
                className="hover:underline hover:text-brand-blue-dark transition-colors"
                onClick={() => handleFooterLinkClick('contact_page', '/contact')}
              >
                Get in Touch
              </Link>
            </nav>
            <p className="text-xs text-gray-500">© {getCurrentYear()} Daily Tidbit LLC. All rights reserved.</p>
            <p className="text-[11px] text-gray-400">Independently run. Not affiliated with any listed tools unless marked as sponsored.</p>
          </div>
        </div>
      </div>
      <div className="pb-[env(safe-area-inset-bottom)]" />
    </footer>
  )
}
