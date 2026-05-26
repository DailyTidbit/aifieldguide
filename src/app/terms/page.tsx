import Link from 'next/link'
import { ArrowLeft, FileText, Mail } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms & Conditions | AI Field Guide',
  description: 'Terms and conditions for using AI Field Guide by Daily Tidbit LLC.',
  openGraph: {
    title: 'Terms & Conditions | AI Field Guide',
    description: 'Terms and conditions for using AI Field Guide by Daily Tidbit LLC.',
    type: 'website',
  },
}

export default function TermsConditionsPage() {
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
                <div className="w-16 h-16 bg-brand-orange rounded-full flex items-center justify-center shadow-lg">
                  <FileText className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="heading-hero text-brand-orange mb-4">Terms &amp; Conditions</h1>
            </div>
          </div>
        </section>

        <section className="pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 md:p-12">

              <div className="body-small text-gray-600 mb-8 pb-6 border-b border-gray-200">
                <strong>Last Updated:</strong> May 25, 2026
              </div>

              <div className="prose prose-lg max-w-none">

                {/* 1 */}
                <h2 className="heading-section text-brand-orange mt-8 mb-4">1. ACCEPTANCE OF TERMS</h2>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-6">
                  <p className="body-large text-gray-800 leading-relaxed body-bold">
                    IMPORTANT ARBITRATION NOTICE: BY USING THIS SITE, YOU AGREE TO RESOLVE ALL DISPUTES
                    THROUGH BINDING INDIVIDUAL ARBITRATION RATHER THAN COURT PROCEEDINGS. YOU ALSO WAIVE
                    YOUR RIGHT TO PARTICIPATE IN CLASS ACTIONS. PLEASE READ SECTION 7 CAREFULLY.
                  </p>
                </div>

                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  Welcome to AI Field Guide (the "Site"). By accessing or using the Site, you agree to be
                  bound by these Terms and Conditions ("Terms") and all applicable laws and regulations.
                </p>

                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li><strong>Age Requirement:</strong> You must be at least 13 years old to use this Site.</li>
                  <li><strong>Binding Contract:</strong> These Terms constitute a legally binding agreement between you and Daily Tidbit LLC. Your use of the Site constitutes acceptance.</li>
                  <li><strong>Updates:</strong> We may modify these Terms at any time. Material changes will be posted prominently. Continued use constitutes acceptance of updated Terms.</li>
                </ul>

                {/* 2 */}
                <h2 className="heading-section text-brand-orange mt-8 mb-4">2. ABOUT THIS SITE</h2>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  AI Field Guide is a read-only reference resource providing informational content about AI
                  tools, including descriptions, use cases, and links to third-party AI tools and services.
                  The Site does not offer user accounts, community features, user-generated content, or paid
                  subscriptions.
                </p>

                {/* 3 */}
                <h2 className="heading-section text-brand-orange mt-8 mb-4">3. INTELLECTUAL PROPERTY</h2>
                <p className="body-large text-gray-700 leading-relaxed mb-4">
                  All content on this Site — including text, graphics, logos, and layout — is owned by or
                  licensed to Daily Tidbit LLC and is protected by applicable copyright and intellectual
                  property laws.
                </p>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  You may view and read Site content for personal, non-commercial use and share links to the
                  Site. You may not copy, reproduce, redistribute, or use Site content for commercial purposes
                  without written permission.
                </p>

                {/* 4 */}
                <h2 className="heading-section text-brand-orange mt-8 mb-4">4. THIRD-PARTY TOOLS AND EXTERNAL LINKS</h2>
                <p className="body-large text-gray-700 leading-relaxed mb-4">
                  The Site contains links to and descriptions of third-party AI tools and services, provided
                  for informational purposes only.
                </p>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li><strong>No Endorsement:</strong> Inclusion of a tool does not constitute endorsement by Daily Tidbit or Daily Tidbit LLC.</li>
                  <li><strong>No Affiliation:</strong> Unless explicitly stated, Daily Tidbit has no affiliation with or financial interest in any listed tool.</li>
                  <li><strong>Third-Party Terms Apply:</strong> When you click through to any external tool or service, you are subject to that tool's own terms and privacy policy. We have no control over and assume no responsibility for those sites.</li>
                  <li><strong>Accuracy:</strong> Tool information (pricing, features, availability) changes frequently. We make no guarantee that any information is current or accurate. Always verify directly with the tool provider.</li>
                </ul>

                {/* 5 */}
                <h2 className="heading-section text-brand-orange mt-8 mb-4">5. AI CONTENT AND PROFESSIONAL ADVICE DISCLAIMERS</h2>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">A. AI Content</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  Some Site content may be generated or enhanced by artificial intelligence. AI content may
                  be inaccurate, incomplete, biased, or outdated. We make no representations about its
                  accuracy.
                </p>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">B. No Professional Advice</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  Nothing on this Site constitutes medical, financial, legal, or professional advice of any
                  kind. Always consult qualified professionals before making important decisions.
                </p>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">C. No Professional Relationship</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  Using this Site does not create any professional-client relationship of any kind.
                </p>

                {/* 6 */}
                <h2 className="heading-section text-brand-orange mt-8 mb-4">6. LIMITATION OF LIABILITY</h2>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">A. Comprehensive Liability Exclusion</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6 body-bold">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, DAILY TIDBIT LLC AND ITS AFFILIATES, OFFICERS,
                  DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
                  SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSSES ARISING
                  FROM YOUR USE OF OR RELIANCE ON ANY INFORMATION ON THE SITE, YOUR USE OF ANY THIRD-PARTY
                  TOOL OR SERVICE LINKED FROM THE SITE, LOSS OF DATA, REVENUE, OR BUSINESS OPPORTUNITY, OR
                  PERSONAL INJURY OR PROPERTY DAMAGE — WHETHER ARISING FROM CONTRACT, TORT, STRICT LIABILITY,
                  OR ANY OTHER LEGAL THEORY, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
                </p>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">B. Damage Cap</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  Our total aggregate liability for all claims shall not exceed $100 USD.
                </p>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">C. Time Limitation</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  All claims must be brought within one (1) year of when the cause of action arose.
                </p>

                {/* 7 */}
                <h2 className="heading-section text-brand-orange mt-8 mb-4">7. BINDING ARBITRATION AND CLASS ACTION WAIVER</h2>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">A. Agreement to Arbitrate</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6 body-bold">
                  YOU AND DAILY TIDBIT LLC AGREE THAT ALL DISPUTES, CLAIMS, OR CONTROVERSIES ARISING OUT OF
                  OR RELATING TO THESE TERMS OR YOUR USE OF THE SITE SHALL BE RESOLVED EXCLUSIVELY THROUGH
                  BINDING INDIVIDUAL ARBITRATION, NOT IN COURT.
                </p>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">B. Arbitration Procedures</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li><strong>Administrator:</strong> American Arbitration Association (AAA) under its Consumer Arbitration Rules</li>
                  <li><strong>Location:</strong> Massachusetts, USA, or remotely by videoconference</li>
                  <li><strong>Decision:</strong> Final and binding on all parties</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">C. Class Action Waiver</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6 body-bold">
                  YOU WAIVE ANY RIGHT TO PARTICIPATE IN CLASS ACTIONS OR REPRESENTATIVE PROCEEDINGS. ALL
                  DISPUTES MUST BE BROUGHT INDIVIDUALLY.
                </p>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">D. Exceptions</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  Small claims court (if claim qualifies), intellectual property disputes, and injunctive
                  relief for Terms violations are exempt from arbitration.
                </p>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">E. Opt-Out Right</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  You may opt out of arbitration by emailing{' '}
                  <a href="mailto:mike@dailytidbit.org" className="text-brand-orange hover:text-orange-600 underline underline-offset-2">
                    mike@dailytidbit.org
                  </a>{' '}
                  with "Arbitration Opt-Out" in the subject line within 30 days of first accepting these Terms.
                </p>

                {/* 8 */}
                <h2 className="heading-section text-brand-orange mt-8 mb-4">8. WARRANTY DISCLAIMER</h2>
                <p className="body-large text-gray-700 leading-relaxed mb-6 body-bold">
                  THE SITE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR
                  IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE,
                  AND NON-INFRINGEMENT. We do not warrant that the Site will be uninterrupted, error-free, or
                  that information is accurate, complete, or current.
                </p>

                {/* 9 */}
                <h2 className="heading-section text-brand-orange mt-8 mb-4">9. INDEMNIFICATION</h2>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  You agree to indemnify and hold harmless Daily Tidbit LLC, its affiliates, officers,
                  employees, and agents from any claims, damages, losses, and expenses (including reasonable
                  attorneys' fees) arising from your use of the Site or violation of these Terms.
                </p>

                {/* 10 */}
                <h2 className="heading-section text-brand-orange mt-8 mb-4">10. MISCELLANEOUS</h2>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li><strong>Governing Law:</strong> Massachusetts law, excluding conflict of law principles.</li>
                  <li><strong>Entire Agreement:</strong> These Terms and our Privacy Policy constitute the entire agreement between you and Daily Tidbit LLC regarding use of the Site.</li>
                  <li><strong>Severability:</strong> If any provision is unenforceable, the remainder stays in full effect.</li>
                  <li><strong>No Waiver:</strong> Failure to enforce any provision does not waive our right to do so later.</li>
                  <li><strong>Assignment:</strong> We may assign these Terms without notice. You may not assign your rights without our written consent.</li>
                </ul>

                {/* 11 */}
                <h2 className="heading-section text-brand-orange mt-8 mb-4">11. CONTACT INFORMATION</h2>
                <p className="body-large text-gray-700 leading-relaxed mb-2">
                  <strong>Daily Tidbit LLC</strong>
                </p>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  <strong>Email:</strong>{' '}
                  <a
                    href="mailto:mike@dailytidbit.org?subject=Terms%20and%20Conditions"
                    className="text-brand-orange hover:text-orange-600 underline underline-offset-2"
                  >
                    mike@dailytidbit.org
                  </a>
                </p>

                <div className="bg-gray-100 border border-gray-300 rounded-lg p-6 mt-8">
                  <p className="text-gray-800 body-bold text-center heading-subsection">
                    BY USING AI FIELD GUIDE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO
                    BE BOUND BY THESE TERMS AND CONDITIONS.
                  </p>
                </div>

              </div>

              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex items-center gap-3 text-gray-600 body-large">
                  <Mail className="w-5 h-5" />
                  <span>Questions about these terms? Email us at </span>
                  <a
                    href="mailto:mike@dailytidbit.org?subject=Terms%20and%20Conditions"
                    className="text-brand-orange hover:text-orange-600 transition-colors underline underline-offset-2"
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
