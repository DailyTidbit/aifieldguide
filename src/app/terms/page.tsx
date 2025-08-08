import Link from 'next/link'
import { ArrowLeft, FileText, Mail } from 'lucide-react'

export default function TermsConditionsPage() {
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
                <div className="w-16 h-16 bg-[#F7936F] rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 
                className="text-4xl md:text-5xl font-bold text-[#F7936F] mb-4"
                style={{fontFamily: "var(--font-playfair, 'Playfair Display'), serif"}}
              >
                Terms & Conditions
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
                <strong>Last updated:</strong> August 8, 2025
              </div>

              {/* Content Area */}
              <div 
                className="prose prose-lg max-w-none"
                style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}
              >
                <h2 className="text-2xl font-bold text-[#F7936F] mt-8 mb-4">1. ACCEPTANCE OF TERMS AND BINDING ARBITRATION NOTICE</h2>
                
                <p className="text-gray-700 leading-relaxed mb-4 font-bold">
                  IMPORTANT ARBITRATION AND CLASS ACTION WAIVER NOTICE: BY USING THIS SITE, YOU AGREE TO RESOLVE ALL DISPUTES THROUGH BINDING INDIVIDUAL ARBITRATION RATHER THAN COURT PROCEEDINGS. YOU ALSO WAIVE YOUR RIGHT TO PARTICIPATE IN CLASS ACTIONS. PLEASE READ SECTION 9 CAREFULLY.
                </p>
                
                <p className="text-gray-700 leading-relaxed mb-6">
                  Daily Tidbit is a curated, positive-only space. By using this Site, you agree to our strict community standards and content moderation policies. We use artificial intelligence extensively throughout the platform—please read Section 10 for important disclaimers about AI accuracy and professional advice limitations.
                </p>

                <p className="text-gray-700 leading-relaxed mb-6">
                  Welcome to Daily Tidbit! By accessing, using, registering for, or otherwise interacting with our website, services, mobile applications, APIs, or any related features (collectively, the "Site"), you agree to be bound by these Terms and Conditions ("Terms"), our Privacy Policy, and all applicable laws and regulations.
                </p>

                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li><strong>Age Requirement:</strong> You must be at least 13 years old to use this Site. Users between 13-17 must have parental/guardian consent.</li>
                  <li><strong>Binding Legal Contract:</strong> These Terms constitute a legally binding contract between you and Daily Tidbit LLC. Your use of the Site constitutes acceptance regardless of whether you create an account.</li>
                  <li><strong>Updates:</strong> We may modify these Terms at any time without prior notice. Material changes will be posted prominently. Continued use constitutes acceptance of updated Terms.</li>
                </ul>

                <h2 className="text-2xl font-bold text-[#F7936F] mt-8 mb-4">2. DEFINITIONS AND SCOPE</h2>
                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li><strong>"Site"</strong> includes the website, mobile applications, APIs, social media features, BitBoard, all content, services, and functionality</li>
                  <li><strong>"Content"</strong> means all text, images, videos, audio, software, data, and other materials</li>
                  <li><strong>"User Content"</strong> means content you submit, post, upload, or transmit through any Site feature</li>
                  <li><strong>"Services"</strong> includes all features, tools, social networking capabilities, AI assistance, and functionality</li>
                  <li><strong>"Social Features"</strong> includes but is not limited to: user profiles, messaging, following/followers, social sharing, community forums, live chat, video/audio calls, groups, events, and any interactive capabilities</li>
                </ul>

                <h2 className="text-2xl font-bold text-[#F7936F] mt-8 mb-4">3. USER CONTENT AND INTELLECTUAL PROPERTY RIGHTS</h2>
                
                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">A. Comprehensive License Grant</h3>
                <p className="text-gray-700 leading-relaxed mb-4 italic">
                  In simple terms: By posting content to Daily Tidbit, you give us broad rights to use it forever, including in marketing, across the site, and with partners or sponsors.
                </p>
                <p className="text-gray-700 leading-relaxed mb-6">
                  By submitting any User Content, you grant Daily Tidbit and its successors, assigns, affiliates, and partners a worldwide, perpetual, irrevocable, royalty-free, fully sublicensable, transferable license to: Use, reproduce, modify, adapt, publish, translate, create derivative works, distribute, perform, display, broadcast, transmit, and exploit your User Content; Use your name, likeness, voice, and biographical information in connection with your User Content; Incorporate your User Content into any media, technology, or distribution method now known or later developed; Use your User Content for any purpose including commercial, advertising, marketing, promotional, research, and development purposes; Grant sublicenses to third parties including sponsors, partners, and service providers. This license survives termination of your account and these Terms.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">B. Content Ownership and Moral Rights Waiver</h3>
                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li>You retain copyright ownership but grant the comprehensive license above</li>
                  <li>You waive all moral rights (including attribution and integrity rights) to the fullest extent permitted by law</li>
                  <li>You cannot revoke the licenses granted herein</li>
                  <li>We may use your User Content without attribution or payment</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">C. User Content Representations and Warranties</h3>
                <p className="text-gray-700 leading-relaxed mb-4">You represent and warrant that:</p>
                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li>You own all rights to your User Content or have obtained all necessary permissions</li>
                  <li>Your User Content does not infringe any third-party rights</li>
                  <li>You have authority to grant the licenses described above</li>
                  <li>Your User Content complies with all applicable laws and these Terms</li>
                  <li>You will not submit content containing personal information of third parties without consent</li>
                </ul>

                <h2 className="text-2xl font-bold text-[#F7936F] mt-8 mb-4">4. COMPREHENSIVE COMMUNITY GUIDELINES AND PROHIBITED CONDUCT</h2>
                
                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">A. Prohibited Content (Zero Tolerance)</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  You shall NOT post, upload, transmit, or otherwise make available any content that:
                </p>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <p className="font-semibold text-gray-800">1. Hate Speech, Harassment, and Discrimination:</p>
                    <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
                      <li>Promotes hatred, violence, or discrimination based on any protected characteristic</li>
                      <li>Constitutes harassment, bullying, intimidation, or threats</li>
                      <li>Contains slurs, epithets, or derogatory language targeting individuals or groups</li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="font-semibold text-gray-800">2. Violent and Harmful Content:</p>
                    <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
                      <li>Depicts, promotes, or glorifies violence, self-harm, or dangerous activities</li>
                      <li>Contains graphic violence, gore, or disturbing imagery</li>
                      <li>Promotes eating disorders, substance abuse, or self-destructive behavior</li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="font-semibold text-gray-800">3. Sexual and Adult Content:</p>
                    <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
                      <li>Contains nudity, pornography, or sexually explicit material</li>
                      <li>Sexualizes minors or promotes exploitation</li>
                      <li>Contains sexually suggestive content involving minors</li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="font-semibold text-gray-800">4. Illegal Activities and Fraud:</p>
                    <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
                      <li>Promotes, facilitates, or provides instructions for illegal activities</li>
                      <li>Involves fraud, scams, pyramid schemes, or deceptive practices</li>
                      <li>Violates any local, state, national, or international laws</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-800">5. Intellectual Property Violations:</p>
                    <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
                      <li>Infringes copyrights, trademarks, patents, or other IP rights</li>
                      <li>Contains unauthorized use of protected content</li>
                      <li>Violates publicity or privacy rights</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-800">6. Misinformation and Harmful False Information:</p>
                    <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
                      <li>Spreads deliberate misinformation or disinformation</li>
                      <li>Contains health misinformation that could cause harm</li>
                      <li>Includes false information about elections, disasters, or public safety</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-800">7. Spam and Commercial Violations:</p>
                    <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
                      <li>Constitutes spam, repetitive messaging, or unsolicited commercial content</li>
                      <li>Contains unauthorized affiliate links or promotional codes</li>
                      <li>Involves unauthorized advertising or marketing</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-800">8. Privacy Violations:</p>
                    <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
                      <li>Shares personal information without consent (doxxing)</li>
                      <li>Contains private communications shared without permission</li>
                      <li>Violates reasonable expectations of privacy</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-800">9. Platform Manipulation:</p>
                    <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
                      <li>Attempts to manipulate platform algorithms or features</li>
                      <li>Creates fake accounts or impersonates others</li>
                      <li>Engages in coordinated inauthentic behavior</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-800">10. Technical Violations:</p>
                    <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
                      <li>Contains malware, viruses, or harmful code</li>
                      <li>Attempts to hack, disrupt, or compromise Site security</li>
                      <li>Circumvents or attempts to circumvent Site restrictions</li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">B. Social Media Specific Prohibitions</h3>
                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li>Creating fake profiles or impersonating others</li>
                  <li>Engaging in coordinated harassment campaigns</li>
                  <li>Manipulating follower counts or engagement metrics</li>
                  <li>Sharing private messages or communications without consent</li>
                  <li>Using automated tools (bots) for interaction or content creation</li>
                  <li>Creating multiple accounts to evade restrictions</li>
                  <li>Attempting to monetize the platform without authorization</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">C. Enforcement and Sanctions</h3>
                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li><strong>Immediate Content Removal:</strong> Violating content will be removed without notice</li>
                  <li><strong>Account Sanctions:</strong> May include warnings, temporary suspensions, or permanent bans</li>
                  <li><strong>Collateral Consequences:</strong> May include removal of all associated content and accounts</li>
                  <li><strong>Law Enforcement:</strong> Serious violations will be reported to appropriate authorities</li>
                  <li><strong>No Appeal Process:</strong> All moderation decisions are final and not subject to appeal</li>
                  <li><strong>Proactive Monitoring:</strong> We use automated systems and human review for enforcement</li>
                </ul>

                <h2 className="text-2xl font-bold text-[#F7936F] mt-8 mb-4">5. SPONSORED CONTENT, AFFILIATE RELATIONSHIPS, AND MONETIZATION</h2>
                
                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">A. Sponsored Content</h3>
                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li><strong>Clear Labeling:</strong> All sponsored content is clearly marked as "Sponsored," "Promoted," "Paid Partnership," or similar</li>
                  <li><strong>Editorial Independence:</strong> Sponsors pay for placement but do not control editorial opinions or recommendations</li>
                  <li><strong>Quality Standards:</strong> All sponsored content aligns with our positive community values</li>
                  <li><strong>FTC Compliance:</strong> We follow Federal Trade Commission guidelines for sponsored content disclosure</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">B. Affiliate Relationships</h3>
                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li><strong>Affiliate Links:</strong> The Site contains affiliate links that may earn us commissions on purchases</li>
                  <li><strong>Clear Disclosure:</strong> Affiliate relationships are disclosed conspicuously (e.g., "Daily Tidbit may earn a commission from purchases made through links on this page")</li>
                  <li><strong>No Additional Cost:</strong> Affiliate links do not increase costs to users</li>
                  <li><strong>Product Recommendations:</strong> Our affiliate partnerships do not compromise the integrity of our recommendations</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">C. Promotional Codes and Offers</h3>
                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li><strong>Third-Party Codes:</strong> We may distribute promotional codes from sponsors and partners</li>
                  <li><strong>Terms Apply:</strong> All promotional codes are subject to sponsor terms, expiration dates, and availability</li>
                  <li><strong>No Guarantees:</strong> We do not guarantee the validity, availability, or value of any promotional codes</li>
                  <li><strong>Tracking:</strong> Promotional code usage may be tracked for analytical and commission purposes</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">D. Revenue Model and Additional Transparency</h3>
                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li><strong>Free to Users:</strong> The Site remains free through sponsorships, affiliate commissions, and promotional partnerships</li>
                  <li><strong>Future Changes:</strong> We reserve the right to introduce paid features or subscriptions with appropriate notice</li>
                  <li><strong>Transparency:</strong> We maintain transparency about our revenue sources and business model</li>
                </ul>

                <p className="text-gray-700 leading-relaxed mb-6">
                  <strong>Additional Transparency Notice:</strong> Sponsored content and affiliate links may appear throughout the site, including within daily tidbits, BitBoard posts, and AI-generated recommendations. We only promote tools or services we believe may be useful to our community, but Daily Tidbit is not responsible for any third-party offerings, their quality, performance, or fulfillment.
                </p>

                <h2 className="text-2xl font-bold text-[#F7936F] mt-8 mb-4">6. SOCIAL MEDIA FEATURES AND INTERACTIONS</h2>
                
                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">A. Social Features Disclaimer</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Any social networking, messaging, or interactive features are provided "as is" and at your own risk. We are not responsible for:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li>User interactions or communications</li>
                  <li>Content shared through social features</li>
                  <li>Harm arising from social connections or relationships</li>
                  <li>Accuracy of user profiles or information</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">B. User Interactions</h3>
                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li><strong>No Screening:</strong> We do not screen users or verify user identities</li>
                  <li><strong>No Endorsement:</strong> We do not endorse any user or their content</li>
                  <li><strong>Risk Assumption:</strong> You assume all risks from interactions with other users</li>
                  <li><strong>Safety Responsibility:</strong> You are responsible for your own safety and privacy</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">C. Social Feature Modifications</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  We may modify, suspend, or discontinue any social features at any time without notice or liability.
                </p>

                <h2 className="text-2xl font-bold text-[#F7936F] mt-8 mb-4">7. EXTREME LIMITATION OF LIABILITY</h2>
                
                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">A. Comprehensive Liability Exclusion</h3>
                <p className="text-gray-700 leading-relaxed mb-4 font-bold">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, DAILY TIDBIT AND ITS AFFILIATES, OFFICERS, DIRECTORS, SHAREHOLDERS, EMPLOYEES, AGENTS, PARTNERS, LICENSORS, AND SUPPLIERS SHALL NOT BE LIABLE FOR ANY:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li>Direct, indirect, incidental, special, consequential, exemplary, or punitive damages</li>
                  <li>Lost profits, revenue, data, use, goodwill, or other economic advantage</li>
                  <li>Business interruption, work stoppage, or loss of business information</li>
                  <li>Personal injury, emotional distress, or mental anguish</li>
                  <li>Property damage or theft</li>
                  <li>Legal fees, court costs, or litigation expenses</li>
                  <li>Damage to reputation or loss of privacy</li>
                  <li>Loss or corruption of data or files</li>
                  <li>Unauthorized access to or alteration of transmissions or data</li>
                  <li>Cost of substitute goods or services</li>
                  <li>Failure of essential purpose of any exclusive remedy</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mb-6 font-bold">
                  WHETHER ARISING FROM CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY, WARRANTY, OR ANY OTHER LEGAL THEORY, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">B. Damage Cap</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  Our total aggregate liability for all claims shall not exceed the greater of: $100 USD or the amount you have paid us in the preceding 12 months (if applicable).
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">C. Time Limitation</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  All claims must be brought within ONE (1) YEAR of when the cause of action arose, regardless of when discovered.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">D. Essential Purpose</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  The limitations in this section are essential elements of the agreement between us. The Site would not be provided without these limitations.
                </p>

                <h2 className="text-2xl font-bold text-[#F7936F] mt-8 mb-4">8. COMPREHENSIVE INDEMNIFICATION</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  You agree to indemnify, defend, and hold harmless Daily Tidbit, its affiliates, subsidiaries, officers, directors, shareholders, employees, agents, partners, licensors, suppliers, contractors, and assigns from and against ANY AND ALL:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Claims, demands, suits, or proceedings</li>
                  <li>Damages, losses, costs, liabilities, and expenses (including reasonable attorneys' fees)</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Arising from or related to:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li>Your use or misuse of the Site</li>
                  <li>Your User Content or any claims it infringes third-party rights</li>
                  <li>Your violation of these Terms or applicable laws</li>
                  <li>Your interactions with other users</li>
                  <li>Your breach of any representations, warranties, or covenants</li>
                  <li>Any negligent or wrongful act or omission by you</li>
                  <li>Any content you access through the Site</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mb-6">
                  This indemnification obligation survives termination of these Terms and your use of the Site.
                </p>

                <h2 className="text-2xl font-bold text-[#F7936F] mt-8 mb-4">9. BINDING ARBITRATION AND CLASS ACTION WAIVER</h2>
                
                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">A. Agreement to Arbitrate</h3>
                <p className="text-gray-700 leading-relaxed mb-4 font-bold">
                  YOU AND DAILY TIDBIT AGREE THAT ALL DISPUTES, CLAIMS, OR CONTROVERSIES ARISING OUT OF OR RELATING TO:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>These Terms or their interpretation</li>
                  <li>Your use of the Site</li>
                  <li>Any products or services provided</li>
                  <li>Any privacy or data practices</li>
                  <li>Any content or communications</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mb-6 font-bold">
                  SHALL BE RESOLVED EXCLUSIVELY THROUGH BINDING INDIVIDUAL ARBITRATION, NOT IN COURT.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">B. Arbitration Procedures</h3>
                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li><strong>Administrator:</strong> American Arbitration Association (AAA) under its Consumer Arbitration Rules</li>
                  <li><strong>Location:</strong> Massachusetts, USA, or remotely by videoconference</li>
                  <li><strong>Arbitrator:</strong> Single neutral arbitrator selected per AAA rules</li>
                  <li><strong>Decision:</strong> Final and binding on all parties</li>
                  <li><strong>Fees:</strong> Governed by AAA rules with fee-shifting protections for consumers</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">C. CLASS ACTION WAIVER</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  YOU AND DAILY TIDBIT AGREE THAT:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li>All disputes must be brought individually, not as a class action</li>
                  <li>You waive any right to participate in class actions or representative proceedings</li>
                  <li>You may not serve as a class representative or participate in a class settlement</li>
                  <li>Claims may not be consolidated with claims of other users</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">D. Exceptions</h3>
                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li>Small claims court (if claim qualifies and is brought individually)</li>
                  <li>Intellectual property disputes</li>
                  <li>Injunctive relief for Terms violations</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">E. Opt-Out Right</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  You may opt out of arbitration by emailing mike@dailytidbit.org with "Arbitration Opt-Out" in the subject line within 30 days of first accepting these Terms. Include your name and clear statement that you opt out.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">F. Severability</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  If any part of this arbitration clause is found unenforceable, the remainder remains in effect.
                </p>

                <h2 className="text-2xl font-bold text-[#F7936F] mt-8 mb-4">10. AI CONTENT AND PROFESSIONAL ADVICE DISCLAIMERS</h2>
                
                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">A. AI Content Warning</h3>
                <p className="text-gray-700 leading-relaxed mb-6 font-bold">
                  IMPORTANT: Some Site content may be generated or enhanced by artificial intelligence. AI CONTENT MAY BE INACCURATE, INCOMPLETE, BIASED, OR HARMFUL. WE MAKE NO REPRESENTATIONS ABOUT AI CONTENT ACCURACY.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">B. No Professional Advice</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  NOTHING ON THE SITE CONSTITUTES:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li>Medical, health, or therapeutic advice</li>
                  <li>Financial, investment, or tax advice</li>
                  <li>Legal advice or counsel</li>
                  <li>Professional consulting in any field</li>
                  <li>Recommendations for specific products or services</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">C. No Professional Relationship</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  Using the Site does not create any professional-client relationship. Always consult qualified professionals before making important decisions.
                </p>

                <h2 className="text-2xl font-bold text-[#F7936F] mt-8 mb-4">11. MAXIMUM WARRANTY DISCLAIMERS</h2>
                
                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">A. "AS IS" Provision</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  THE SITE IS PROVIDED "AS IS," "AS AVAILABLE," AND "WITH ALL FAULTS." TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li>Merchantability, fitness for a particular purpose, title, and non-infringement</li>
                  <li>That the Site will be uninterrupted, error-free, or secure</li>
                  <li>That defects will be corrected</li>
                  <li>The accuracy, reliability, or currency of any information</li>
                  <li>The quality, safety, or legality of User Content</li>
                  <li>Compatibility with your devices or software</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">B. Third-Party Content</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  We disclaim all responsibility for third-party content, including User Content, advertisements, and linked websites.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">C. AI and Automated Systems</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  We make no warranties regarding AI-generated content, automated systems, or algorithmic recommendations.
                </p>

                <h2 className="text-2xl font-bold text-[#F7936F] mt-8 mb-4">12. ACCOUNT TERMINATION AND SITE MODIFICATIONS</h2>
                
                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">A. Termination Rights</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We may, in our sole discretion and without notice:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li>Suspend or terminate accounts</li>
                  <li>Remove or disable content</li>
                  <li>Modify or discontinue Site features</li>
                  <li>Block access from specific locations</li>
                  <li>Refuse service to anyone for any reason</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">B. Effect of Termination</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Upon termination:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li>Your license to use the Site immediately ceases</li>
                  <li>We may delete your account and content</li>
                  <li>Licenses you granted to us survive termination</li>
                  <li>Your indemnification obligations continue</li>
                </ul>

                <h2 className="text-2xl font-bold text-[#F7936F] mt-8 mb-4">13. DMCA AND IP COMPLIANCE</h2>
                
                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">A. Copyright Policy</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  We respond to proper DMCA takedown notices sent to: mike@dailytidbit.org
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">B. Repeat Infringer Policy</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  Accounts of repeat infringers will be terminated.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">C. Counter-Notifications</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  Users may submit counter-notifications following DMCA procedures.
                </p>

                <h2 className="text-2xl font-bold text-[#F7936F] mt-8 mb-4">14. INTERNATIONAL USE AND EXPORT CONTROL</h2>
                
                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">A. Global Access</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  The Site is controlled from the United States but accessible worldwide.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">B. Export Compliance</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  You agree not to use the Site in violation of U.S. export control laws.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">C. Local Law Compliance</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  You are responsible for compliance with all applicable local laws.
                </p>

                <h2 className="text-2xl font-bold text-[#F7936F] mt-8 mb-4">15. FORCE MAJEURE AND UNAVOIDABLE CIRCUMSTANCES</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We shall not be liable for any failure or delay in performance due to events beyond our reasonable control, including:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                  <li>Natural disasters, pandemics, or acts of God</li>
                  <li>Government actions, laws, or regulations</li>
                  <li>Internet or telecommunications failures</li>
                  <li>Cyberattacks or security breaches</li>
                  <li>Labor disputes or supplier failures</li>
                </ul>

                <h2 className="text-2xl font-bold text-[#F7936F] mt-8 mb-4">16. ADDITIONAL PROTECTIONS AND MISCELLANEOUS</h2>
                
                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">A. Entire Agreement</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  These Terms, together with our Privacy Policy, constitute the entire agreement and supersede all prior agreements.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">B. Governing Law</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  These Terms are governed by Massachusetts law, excluding conflict of law principles.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">C. Severability</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  If any provision is unenforceable, the remainder remains in full effect.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">D. No Waiver</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  Our failure to enforce any provision does not waive our right to do so later.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">E. Assignment</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  We may assign these Terms without notice. You may not assign your rights without our written consent.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">F. Survival</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  All provisions that should survive termination (including liability limitations, indemnification, arbitration, and IP licenses) shall survive.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">G. Electronic Communications</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  You consent to receive communications electronically and agree such communications satisfy legal requirements.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">H. No Third-Party Beneficiaries</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  These Terms create no third-party beneficiary rights.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">I. Headings</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  Section headings are for convenience only and do not affect interpretation.
                </p>

                <h2 className="text-2xl font-bold text-[#F7936F] mt-8 mb-4">17. CONTACT INFORMATION</h2>
                <p className="text-gray-700 leading-relaxed mb-2">
                  <strong>Daily Tidbit LLC</strong>
                </p>
                <p className="text-gray-700 leading-relaxed mb-2">
                  <strong>Email:</strong> <a href="mailto:mike@dailytidbit.org?subject=Terms%20and%20Conditions" className="text-[#F7936F] hover:text-[#E6845F] underline">mike@dailytidbit.org</a>
                </p>
                <p className="text-gray-700 leading-relaxed mb-2">
                  <strong>Subject Line:</strong> Terms and Conditions
                </p>
                <p className="text-gray-700 leading-relaxed mb-6">
                  <strong>Mailing Address:</strong> 4 S Edlin St Worcester MA 01603
                </p>
                <p className="text-gray-700 leading-relaxed mb-6">
                  <strong>For Legal Notices:</strong> Use certified mail to the address above, with "Legal Notice" clearly marked on the envelope.
                </p>

                <div className="bg-gray-100 border border-gray-300 rounded-lg p-6 mt-8">
                  <p className="text-gray-800 font-bold text-center text-lg">
                    BY USING DAILY TIDBIT, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS AND CONDITIONS. IF YOU DO NOT AGREE, DO NOT USE THE SITE.
                  </p>
                </div>
              </div>

              {/* Contact Section */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail className="w-5 h-5" />
                  <span>Questions about these terms? Email us at </span>
                  <a 
                    href="mailto:mike@dailytidbit.org?subject=Terms%20and%20Conditions" 
                    className="text-[#F7936F] hover:text-[#E6845F] transition-colors"
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