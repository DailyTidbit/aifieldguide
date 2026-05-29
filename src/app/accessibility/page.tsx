import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Eye, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Accessibility | AI Field Guide',
  description: 'Our commitment to making AI Field Guide accessible to everyone, regardless of ability. WCAG 2.1 AA compliance statement.',
  alternates: { canonical: 'https://www.aifieldguide.org/accessibility' },
  openGraph: {
    title: 'Accessibility | AI Field Guide',
    description: 'Our commitment to making AI Field Guide accessible to everyone, regardless of ability.',
    url: 'https://www.aifieldguide.org/accessibility',
    siteName: 'AI Field Guide',
    images: [{ url: 'https://cdn.dailytidbit.org/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Accessibility | AI Field Guide',
    description: 'Our commitment to making AI Field Guide accessible to everyone, regardless of ability.',
    images: ['https://cdn.dailytidbit.org/og-image.png'],
    site: '@dailytidbit',
  },
  robots: { index: true, follow: true },
}

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Field Guide Inspired Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-green-200 via-green-100 to-blue-200"></div>

      <main className="relative z-10">
        {/* Header */}
        <section className="py-12 sm:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Back Button */}
            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-brand-blue hover:text-brand-blue/80 transition-colors mb-8 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to AI Field Guide</span>
            </Link>

            {/* Title */}
            <div className="text-center mb-12">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-brand-blue rounded-full flex items-center justify-center">
                  <Eye className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="heading-hero text-brand-blue mb-4">
                Accessibility Statement
              </h1>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 md:p-12">
              
              {/* Last Updated */}
              <div className="body-small text-gray-600 mb-8 pb-6 border-b border-gray-200">
                <strong>Last updated:</strong> August 31, 2025
              </div>

              {/* Content Area */}
              <div className="prose prose-lg max-w-none">
                <p className="body-large text-gray-700 mb-8">
                  At AI Field Guide, we are committed to making our website accessible to all individuals, regardless of ability. We believe everyone should have equal access to the power of artificial intelligence — and that includes a website experience that's inclusive, usable, and barrier-free.
                </p>

                <h2 className="heading-subsection text-brand-blue mt-8 mb-4">Our Commitment to Accessibility</h2>
                <p className="body-medium text-gray-700 mb-6">
                  We are working to ensure that AI Field Guide complies with the Web Content Accessibility Guidelines (WCAG) 2.1, Level AA, as well as applicable accessibility regulations such as the Americans with Disabilities Act (ADA) and Section 508. Accessibility is not just a legal requirement — it's part of our mission to make AI approachable and helpful for real people.
                </p>

                <h2 className="heading-subsection text-brand-blue mt-8 mb-4">What we're Doing</h2>
                <p className="body-medium text-gray-700 mb-4">
                  We continue to test and refine our site to ensure it meets — and exceeds — industry standards. Accessibility is an ongoing effort, and we are committed to continual improvement. Our current accessibility features include:
                </p>

                <ul className="list-disc list-inside body-medium text-gray-700 mb-6 space-y-3">
                  <li><strong>Semantic HTML and proper heading structure</strong> for clear content organization</li>
                  <li><strong>Alt text for images and descriptive labels</strong> for all interactive elements</li>
                  <li><strong>Keyboard navigability</strong> across key pages and features</li>
                  <li><strong>Color contrast compliance and readable typography</strong> for visual accessibility</li>
                  <li><strong>Compatibility with screen readers</strong> and other assistive technologies</li>
                  <li><strong>Mobile responsiveness and adaptive layout behavior</strong> for all devices</li>
                </ul>

                <h2 className="heading-subsection text-brand-blue mt-8 mb-4">Feedback and Contact</h2>
                <p className="body-medium text-gray-700 mb-6">
                  If you experience any difficulty accessing any part of our site, or need information in a different format for accessibility, please let us know so we can fix it right away.
                </p>

                <p className="body-medium text-gray-700 mb-6">
                  <strong>Email:</strong> <a 
                    href="mailto:hello@aifieldguide.org?subject=Accessibility%20Feedback" 
                    className="text-brand-blue hover:text-brand-blue/80 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
                  >
                    hello@aifieldguide.org
                  </a> (Subject: Accessibility Feedback)
                </p>

                <h2 className="heading-subsection text-brand-blue mt-8 mb-4">A Note on Our Values</h2>
                <p className="body-medium text-gray-700 mb-6">
                  AI Field Guide is designed for real people — and that means everyone. Accessibility is not a checklist for us — it's a core part of how we build, communicate, and serve our community.
                </p>
              </div>

              {/* Contact Section */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail className="w-5 h-5" />
                  <span className="body-medium">Need accessibility support? Email us at </span>
                  <a 
                    href="mailto:hello@aifieldguide.org" 
                    className="text-brand-blue hover:text-brand-blue/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
                  >
                    hello@aifieldguide.org
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}