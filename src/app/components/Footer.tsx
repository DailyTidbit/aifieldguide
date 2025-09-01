// app/components/Footer.tsx - Minor hydration improvements
'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { trackCTAClick } from '../lib/gtag'

export default function Footer() {
  const [interactions, setInteractions] = useState(0)
  const [mounted, setMounted] = useState(false)

  // Hydration safety for date
  useEffect(() => {
    setMounted(true)
  }, [])

  const bumpInteraction = () => setInteractions(p => p + 1)
  const year = mounted ? new Date().getFullYear() : 2024 // Fallback year to prevent hydration mismatch

  const handleSocialClick = (platform: string, url: string) => {
    if (mounted) {
      trackCTAClick(`social_${platform}`, 'footer', url)
      bumpInteraction()
    }
  }

  const handleFooterLinkClick = (label: string, url: string) => {
    if (mounted) {
      trackCTAClick(label, 'footer', url)
      bumpInteraction()
    }
  }

  return (
    <footer className="relative z-10 bg-gradient-to-br from-gray-200 via-gray-100 to-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center space-y-6">

          {/* Tagline */}
          <p className="mx-auto max-w-[32ch] text-center text-xl sm:text-2xl font-semibold leading-snug text-gray-800">
            Come for the tips. <span className="text-brand-blue">Stay for the community.</span> ✨
          </p>

          {/* Socials (blue hover, white icon) */}
          <div className="mt-2 flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            {/* Facebook */}
            <a
              href="https://www.facebook.com/dailytidbit.org"
              target="_blank" rel="noopener noreferrer" aria-label="Facebook Community"
              onClick={() => handleSocialClick('facebook', 'https://www.facebook.com/dailytidbit.org')}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-600
                         transition-all duration-200 hover:scale-110 social-icon
                         hover:bg-brand-blue hover:text-white
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-blue"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/dailytidbitorg/"
              target="_blank" rel="noopener noreferrer" aria-label="Instagram"
              onClick={() => handleSocialClick('instagram', 'https://www.instagram.com/dailytidbitorg/')}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-600
                         transition-all duration-200 hover:scale-110 social-icon
                         hover:bg-brand-blue hover:text-white
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-blue"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0 3.675a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm6.406-1.683a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z"/>
              </svg>
            </a>

            {/* YouTube */}
            <a
              href="https://www.youtube.com/@DailyTidbitOrg"
              target="_blank" rel="noopener noreferrer" aria-label="YouTube"
              onClick={() => handleSocialClick('youtube', 'https://www.youtube.com/@DailyTidbitOrg')}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-600
                         transition-all duration-200 hover:scale-110 social-icon
                         hover:bg-brand-blue hover:text-white
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-blue"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>

            {/* TikTok */}
            <a
              href="https://www.tiktok.com/@dailytidbit.org"
              target="_blank" rel="noopener noreferrer" aria-label="TikTok"
              onClick={() => handleSocialClick('tiktok', 'https://www.tiktok.com/@dailytidbit.org')}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-600
                         transition-all duration-200 hover:scale-110 social-icon
                         hover:bg-brand-blue hover:text-white
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-blue"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
              </svg>
            </a>

            {/* Pinterest */}
            <a
              href="https://www.pinterest.com/dailytidbitorg"
              target="_blank" rel="noopener noreferrer" aria-label="Pinterest"
              onClick={() => handleSocialClick('pinterest', 'https://www.pinterest.com/dailytidbitorg')}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-600
                         transition-all duration-200 hover:scale-110 social-icon
                         hover:bg-brand-blue hover:text-white
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-blue"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.083.402-.09.402-.294 1.116-.334 1.272-.051.201-.402.244-.402.244-.402-.06-2.477-1.647-2.477-3.956 0-4.915 3.568-9.425 10.294-9.425 5.401 0 9.6 3.848 9.6 8.987 0 5.36-3.38 9.674-8.069 9.674-1.574 0-3.056-.818-3.56-1.797l-.969 3.691c-.351 1.35-1.302 3.04-1.939 4.078C8.69 23.81 10.316 24.029 12.017 24.029c6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z"/>
              </svg>
            </a>

            {/* Twitter/X */}
            <a
              href="https://x.com/dailytidbitorg"
              target="_blank" rel="noopener noreferrer" aria-label="Twitter"
              onClick={() => handleSocialClick('twitter', 'https://x.com/dailytidbitorg')}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-600
                         transition-all duration-200 hover:scale-110 social-icon
                         hover:bg-brand-blue hover:text-white
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-blue"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
              </svg>
            </a>
          </div>

          {/* Legal + Get in Touch link */}
          <div className="pt-4 border-t border-gray-300 space-y-2">
            <nav className="flex flex-wrap items-center justify-center gap-3 text-sm text-blue-600" aria-label="Footer">
              <Link href="/privacy" className="hover:underline"
                onClick={() => handleFooterLinkClick('privacy_policy', '/privacy')}>
                Privacy Policy
              </Link>
              <span className="text-gray-400 text-sm" aria-hidden="true">•</span>
              <Link href="/accessibility" className="hover:underline"
                onClick={() => handleFooterLinkClick('accessibility_statement', '/accessibility')}>
                Accessibility
              </Link>
              <span className="text-gray-400 text-sm" aria-hidden="true">•</span>
              <Link href="/terms" className="hover:underline"
                onClick={() => handleFooterLinkClick('terms_conditions', '/terms')}>
                Terms
              </Link>
              <span className="text-gray-400 text-sm" aria-hidden="true">•</span>
              <a
                href="mailto:mike@dailytidbit.org"
                className="hover:underline"
                onClick={() => handleFooterLinkClick('email_contact', 'mailto:mike@dailytidbit.org')}
              >
                Get in Touch
              </a>
            </nav>
            <p className="text-xs text-gray-500">© {year} Daily Tidbit. All rights reserved.</p>
          </div>
        </div>
      </div>
      <div className="pb-[env(safe-area-inset-bottom)]" />
    </footer>
  )
}