import Link from 'next/link'
import { ArrowLeft, Shield, Mail } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | AI Field Guide',
  description: 'Privacy policy for AI Field Guide — what limited information we collect, how we use it, and your rights.',
  alternates: { canonical: 'https://www.aifieldguide.org/privacy' },
  openGraph: {
    title: 'Privacy Policy | AI Field Guide',
    description: 'Privacy policy for AI Field Guide — what limited information we collect, how we use it, and your rights.',
    url: 'https://www.aifieldguide.org/privacy',
    siteName: 'AI Field Guide',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | AI Field Guide',
    description: 'Privacy policy for AI Field Guide — what limited information we collect, how we use it, and your rights.',
    images: ['/opengraph-image.png'],
    site: '@dailytidbit',
  },
  robots: { index: true, follow: true },
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-green-200 via-green-100 to-blue-200"></div>

      <main className="relative z-10">
        <section className="py-12 sm:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href="/field-guide"
              className="inline-flex items-center gap-2 text-brand-blue hover:text-blue-700 transition-colors mb-8 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 rounded-lg px-2 py-1"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="body-bold">Back to AI Field Guide</span>
            </Link>

            <div className="text-center mb-12">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-brand-green rounded-full flex items-center justify-center shadow-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="heading-hero text-brand-green mb-4">Privacy Policy</h1>
            </div>
          </div>
        </section>

        <section className="pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 md:p-12">

              <div className="body-small text-gray-600 mb-8 pb-6 border-b border-gray-200">
                <strong>Effective Date:</strong> May 25, 2026
              </div>

              <div className="prose prose-lg max-w-none">

                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  Daily Tidbit LLC ("Daily Tidbit," "we," "us," or "our") operates AI Field Guide at
                  AIFieldGuide.org (the "Site"). This Privacy Policy explains what limited information we
                  collect, how we use it, and your rights.
                </p>
                <p className="body-large text-gray-700 leading-relaxed mb-8">
                  By using the Site, you agree to this Privacy Policy. We may update it periodically;
                  continued use after changes constitutes acceptance.
                </p>

                {/* 1 */}
                <h2 className="heading-section text-brand-green mt-8 mb-4">1. WHAT THIS SITE IS — AND IS NOT</h2>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  AI Field Guide is a read-only reference resource. We do not offer user accounts,
                  registration, login, community features, or the ability to submit content. Because of
                  this, the amount of personal information we collect is minimal.
                </p>

                {/* 2 */}
                <h2 className="heading-section text-brand-green mt-8 mb-4">2. INFORMATION WE COLLECT</h2>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">A. Information Collected Automatically</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-4">
                  When you visit the Site, we may automatically collect:
                </p>
                <ul className="list-disc list-inside body-large text-gray-700 mb-4 space-y-2">
                  <li>IP address and general geographic location (city/region level, not precise)</li>
                  <li>Browser type, device type, and operating system</li>
                  <li>Referring URLs, pages viewed, and session duration</li>
                  <li>Date and time of access</li>
                </ul>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  This data is collected through standard web server logs and analytics tools.
                </p>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">B. Analytics</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  We use analytics services (such as Google Analytics or similar) to understand how
                  visitors use the Site in aggregate. These services may set cookies or use similar
                  tracking technologies. Analytics data is used only to improve the Site and is not sold
                  or shared for marketing purposes.
                </p>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">C. Information You Voluntarily Provide</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  If you contact us directly (e.g., by email), we collect the information you choose to
                  share, such as your name and email address, solely to respond to your inquiry.
                </p>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">D. What We Do NOT Collect</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-4">We do not collect:</p>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li>Account credentials or passwords</li>
                  <li>Payment or financial information</li>
                  <li>User-generated content of any kind</li>
                  <li>Sensitive personal information (health data, SSNs, biometric data, etc.)</li>
                </ul>

                {/* 3 */}
                <h2 className="heading-section text-brand-green mt-8 mb-4">3. HOW WE USE YOUR INFORMATION</h2>
                <p className="body-large text-gray-700 leading-relaxed mb-4">
                  We use the limited information we collect to:
                </p>
                <ul className="list-disc list-inside body-large text-gray-700 mb-4 space-y-2">
                  <li>Monitor and improve Site performance and reliability</li>
                  <li>Understand aggregate usage patterns to improve content</li>
                  <li>Respond to direct inquiries you send us</li>
                  <li>Comply with legal obligations</li>
                </ul>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  We do not use your information for targeted advertising, profiling, or sale to third
                  parties.
                </p>

                {/* 4 */}
                <h2 className="heading-section text-brand-green mt-8 mb-4">4. COOKIES AND TRACKING</h2>
                <p className="body-large text-gray-700 leading-relaxed mb-4">
                  We use a minimal number of cookies:
                </p>
                <ul className="list-disc list-inside body-large text-gray-700 mb-4 space-y-2">
                  <li>Analytics cookies (e.g., Google Analytics) to understand aggregate site usage</li>
                  <li>Essential cookies if required for basic site functionality</li>
                </ul>
                <p className="body-large text-gray-700 leading-relaxed mb-4">
                  You can disable cookies through your browser settings. Doing so will not affect your
                  ability to use the Site, as it has no login or account features.
                </p>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  For Google Analytics specifically, you can opt out using the{' '}
                  <a
                    href="https://tools.google.com/dlpage/gaoptout"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-green hover:text-green-700 underline underline-offset-2"
                  >
                    Google Analytics Opt-Out Browser Add-On
                  </a>
                  .
                </p>

                {/* 5 */}
                <h2 className="heading-section text-brand-green mt-8 mb-4">5. THIRD-PARTY LINKS AND TOOLS</h2>
                <p className="body-large text-gray-700 leading-relaxed mb-4">
                  The Site links to third-party AI tools and services. This Privacy Policy does not apply
                  to those external sites. When you click through to any third-party tool, you are subject
                  to that tool's own privacy policy. We encourage you to review the privacy practices of
                  any tool you choose to use.
                </p>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  We are not responsible for the privacy practices or content of any third-party site.
                </p>

                {/* 6 */}
                <h2 className="heading-section text-brand-green mt-8 mb-4">6. HOW WE SHARE YOUR INFORMATION</h2>
                <p className="body-large text-gray-700 leading-relaxed mb-4">
                  We do not sell, rent, or trade your personal information.
                </p>
                <p className="body-large text-gray-700 leading-relaxed mb-4">
                  We may share limited information with:
                </p>
                <ul className="list-disc list-inside body-large text-gray-700 mb-4 space-y-2">
                  <li>Analytics providers (e.g., Google Analytics) to process aggregate usage data on our behalf</li>
                  <li>Hosting and infrastructure providers who operate the Site under confidentiality obligations</li>
                  <li>Legal authorities if required by law, court order, or to protect our legal rights</li>
                </ul>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  <strong>Business Transfers:</strong> If Daily Tidbit LLC undergoes a merger, acquisition,
                  or asset sale, your information may transfer to the acquiring entity. You will be notified
                  of any such transfer.
                </p>

                {/* 7 */}
                <h2 className="heading-section text-brand-green mt-8 mb-4">7. DATA RETENTION</h2>
                <ul className="list-disc list-inside body-large text-gray-700 mb-4 space-y-2">
                  <li><strong>Analytics data:</strong> Typically retained for 12–24 months in aggregate/anonymized form</li>
                  <li><strong>Email inquiries:</strong> Retained as needed to respond and for our records</li>
                  <li><strong>Server logs:</strong> Typically retained for 30–90 days</li>
                </ul>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  We may retain information longer if required for legal compliance or dispute resolution.
                </p>

                {/* 8 */}
                <h2 className="heading-section text-brand-green mt-8 mb-4">8. DATA SECURITY</h2>
                <p className="body-large text-gray-700 leading-relaxed mb-4">
                  We use industry-standard measures including HTTPS/SSL encryption, limited staff access,
                  and secure hosting infrastructure. However, no system is 100% secure. We cannot guarantee
                  absolute security and are not liable for breaches beyond our direct control.
                </p>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  If a breach occurs, we will notify affected users and authorities as required by
                  applicable law.
                </p>

                {/* 9 */}
                <h2 className="heading-section text-brand-green mt-8 mb-4">9. YOUR RIGHTS AND CHOICES</h2>
                <p className="body-large text-gray-700 leading-relaxed mb-4">
                  Regardless of where you live, you may:
                </p>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li><strong>Access:</strong> Request a copy of personal information we hold about you</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                  <li><strong>Opt-Out of Analytics:</strong> Use your browser settings or the Google Analytics opt-out tool</li>
                </ul>

                <p className="body-large text-gray-700 leading-relaxed mb-4">
                  <strong>California Residents (CCPA/CPRA):</strong> You have the right to know what
                  personal information is collected, request deletion, and opt out of any sale of personal
                  information. We do not sell personal information.
                </p>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  <strong>EEA/UK Residents (GDPR):</strong> You have rights of access, rectification,
                  erasure, restriction, portability, and the right to lodge a complaint with your local
                  data protection authority.
                </p>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  To exercise any right, contact us at{' '}
                  <a
                    href="mailto:hello@aifieldguide.org?subject=Privacy%20Inquiry"
                    className="text-brand-green hover:text-green-700 underline underline-offset-2"
                  >
                    hello@aifieldguide.org
                  </a>
                  .
                </p>

                {/* 10 */}
                <h2 className="heading-section text-brand-green mt-8 mb-4">10. CHILDREN'S PRIVACY</h2>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  This Site is not directed to children under 13. We do not knowingly collect personal
                  information from children under 13. If you believe a child under 13 has provided us
                  information, contact us immediately at{' '}
                  <a
                    href="mailto:hello@aifieldguide.org"
                    className="text-brand-green hover:text-green-700 underline underline-offset-2"
                  >
                    hello@aifieldguide.org
                  </a>{' '}
                  and we will promptly delete it.
                </p>

                {/* 11 */}
                <h2 className="heading-section text-brand-green mt-8 mb-4">11. INTERNATIONAL USERS</h2>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  The Site is operated from the United States. By using the Site, international users
                  consent to their information being processed in the US. We maintain appropriate
                  safeguards for international data transfers where required by law.
                </p>

                {/* 12 */}
                <h2 className="heading-section text-brand-green mt-8 mb-4">12. DISPUTE RESOLUTION</h2>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  Any disputes arising from this Privacy Policy are subject to the binding arbitration and
                  class action waiver provisions in our{' '}
                  <Link href="/terms" className="text-brand-green hover:text-green-700 underline underline-offset-2">
                    Terms and Conditions
                  </Link>
                  , incorporated here by reference. You may opt out of arbitration by emailing{' '}
                  <a
                    href="mailto:hello@aifieldguide.org?subject=Privacy%20Arbitration%20Opt-Out"
                    className="text-brand-green hover:text-green-700 underline underline-offset-2"
                  >
                    hello@aifieldguide.org
                  </a>{' '}
                  with "Privacy Arbitration Opt-Out" in the subject line within 30 days of first accepting
                  this Privacy Policy.
                </p>

                {/* 13 */}
                <h2 className="heading-section text-brand-green mt-8 mb-4">13. CONTACT INFORMATION</h2>
                <p className="body-large text-gray-700 leading-relaxed mb-2">
                  <strong>Daily Tidbit LLC</strong>
                </p>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  <strong>Email:</strong>{' '}
                  <a
                    href="mailto:hello@aifieldguide.org?subject=Privacy%20Inquiry"
                    className="text-brand-green hover:text-green-700 underline underline-offset-2"
                  >
                    hello@aifieldguide.org
                  </a>{' '}
                  (Subject: Privacy Inquiry)
                </p>

                <div className="bg-gray-100 border border-gray-300 rounded-lg p-6 mt-8">
                  <p className="text-gray-800 body-bold text-center heading-subsection">
                    By using AI Field Guide, you acknowledge you have read, understood, and agree to this
                    Privacy Policy. For the most current version, visit AIFieldGuide.org/privacy.
                  </p>
                </div>

              </div>

              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex items-center gap-3 text-gray-600 body-large">
                  <Mail className="w-5 h-5" />
                  <span>Privacy questions? Email us at </span>
                  <a
                    href="mailto:hello@aifieldguide.org?subject=Privacy%20Inquiry"
                    className="text-brand-green hover:text-green-700 transition-colors underline underline-offset-2"
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
