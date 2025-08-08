import Link from 'next/link'
import { ArrowLeft, Eye, Mail } from 'lucide-react'

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
              className="inline-flex items-center gap-2 text-[#59B1E3] hover:text-[#4A9FD1] transition-colors mb-8 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Daily Tidbit</span>
            </Link>

            {/* Title */}
            <div className="text-center mb-12">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-[#59B1E3] rounded-full flex items-center justify-center">
                  <Eye className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 
                className="text-4xl md:text-5xl font-bold text-[#59B1E3] mb-4"
                style={{fontFamily: "var(--font-playfair, 'Playfair Display'), serif"}}
              >
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
              <div className="text-sm text-gray-600 mb-8 pb-6 border-b border-gray-200">
                <strong>Last updated:</strong> August 7, 2025
              </div>

              {/* Content Area */}
              <div 
                className="prose prose-lg max-w-none"
                style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}
              >
                <p className="text-gray-700 leading-relaxed mb-8 text-lg">
                  At Daily Tidbit, we are committed to making our website accessible to all individuals, regardless of ability. We believe everyone should have equal access to the power of artificial intelligence — and that includes a website experience that's inclusive, usable, and barrier-free.
                </p>

                <h2 className="text-2xl font-bold text-[#59B1E3] mt-8 mb-4">Our Commitment to Accessibility</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                  We are working to ensure that Daily Tidbit complies with the Web Content Accessibility Guidelines (WCAG) 2.1, Level AA, as well as applicable accessibility regulations such as the Americans with Disabilities Act (ADA) and Section 508. Accessibility is not just a legal requirement — it's part of our mission to make AI approachable and helpful for real people.
                </p>

                <h2 className="text-2xl font-bold text-[#59B1E3] mt-8 mb-4">What We're Doing</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We continue to test and refine our site to ensure it meets — and exceeds — industry standards. Accessibility is an ongoing effort, and we are committed to continual improvement. Our current accessibility features include:
                </p>

                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-3">
                  <li><strong>Semantic HTML and proper heading structure</strong> for clear content organization</li>
                  <li><strong>Alt text for images and descriptive labels</strong> for all interactive elements</li>
                  <li><strong>Keyboard navigability</strong> across key pages and features</li>
                  <li><strong>Color contrast compliance and readable typography</strong> for visual accessibility</li>
                  <li><strong>Compatibility with screen readers</strong> and other assistive technologies</li>
                  <li><strong>Mobile responsiveness and adaptive layout behavior</strong> for all devices</li>
                </ul>

                <h2 className="text-2xl font-bold text-[#59B1E3] mt-8 mb-4">Feedback and Contact</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                  If you experience any difficulty accessing any part of our site, or need information in a different format for accessibility, please let us know so we can fix it right away.
                </p>

                <p className="text-gray-700 leading-relaxed mb-6">
                  <strong>Email:</strong> <a href="mailto:mike@dailytidbit.org?subject=Accessibility%20Feedback" className="text-[#59B1E3] hover:text-[#4A9FD1] underline">mike@dailytidbit.org</a> (Subject: Accessibility Feedback)
                </p>

                <h2 className="text-2xl font-bold text-[#59B1E3] mt-8 mb-4">A Note on Our Values</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                  Daily Tidbit is designed for real people — and that means everyone. Accessibility is not a checklist for us — it's a core part of how we build, communicate, and serve our community.
                </p>
              </div>

              {/* Contact Section */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail className="w-5 h-5" />
                  <span>Need accessibility support? Email us at </span>
                  <a 
                    href="mailto:mike@dailytidbit.org" 
                    className="text-[#59B1E3] hover:text-[#4A9FD1] transition-colors"
                  >
                    mike@dailytidbit.org
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