import Link from 'next/link'
import { ArrowLeft, Shield, Mail } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Daily Tidbit',
  description: 'Privacy policy for Daily Tidbit - how we collect, use, and protect your personal information when using our AI learning platform.',
  openGraph: {
    title: 'Privacy Policy | Daily Tidbit',
    description: 'Learn how Daily Tidbit protects your privacy and handles your personal information.',
    type: 'website',
  },
}

export default function PrivacyPolicyPage() {
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
              className="inline-flex items-center gap-2 text-brand-blue hover:text-blue-700 transition-colors mb-8 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 rounded-lg px-2 py-1"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="body-bold">Back to Daily Tidbit</span>
            </Link>

            {/* Title */}
            <div className="text-center mb-12">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-brand-green rounded-full flex items-center justify-center shadow-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="heading-hero text-brand-green mb-4">
                Privacy Policy
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
                <strong>Effective Date:</strong> August 8, 2025
              </div>

              {/* Content Area */}
              <div className="prose prose-lg max-w-none">
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  Daily Tidbit LLC ("Daily Tidbit," "we," "us," or "our") is committed to protecting your privacy and being transparent about how we collect, use, and protect your personal information when you use our website, services, and any related applications (collectively, the "Site" or "Services").
                </p>

                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  By using our Site, you agree to this Privacy Policy. If you do not agree, please discontinue use immediately. We may update this Privacy Policy periodically. Changes become effective immediately upon posting, with the updated date shown above. Your continued use after changes constitutes acceptance of the updated policy.
                </p>

                <h2 className="heading-section text-brand-green mt-8 mb-4">1. INFORMATION WE COLLECT</h2>
                
                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">A. Information You Provide Directly</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li><strong>Account Registration:</strong> Name, email address, username, password, date of birth, profile information, biography, profile photo/avatar</li>
                  <li><strong>User-Generated Content:</strong> Posts, "tidbits," comments, images, videos, or other media you upload or submit to our Site</li>
                  <li><strong>Communications:</strong> Information you provide when contacting us via support, feedback forms, or direct communication</li>
                  <li><strong>Newsletter/Updates:</strong> Email address and communication preferences when subscribing to our updates</li>
                  <li><strong>Survey/Contest Data:</strong> Responses to surveys, contests, or promotional activities</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">B. Information Collected Automatically</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li><strong>Device & Usage Data:</strong> IP address, browser type, device type, operating system, referring URLs, pages viewed, dates/times of access, clickstream data, session duration</li>
                  <li><strong>Location Information:</strong> General geographic location based on IP address (not precise geolocation unless explicitly consented)</li>
                  <li><strong>Cookies & Tracking:</strong> Session cookies, persistent cookies, web beacons, local storage, and similar tracking technologies for authentication, preferences, security, and analytics</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">C. Information from Third-Party Sources</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li><strong>Analytics Providers:</strong> Usage data and website performance metrics from Google Analytics and similar services</li>
                  <li><strong>Social Media Integration:</strong> If you connect social media accounts or use social login features</li>
                  <li><strong>Social Media Features:</strong> When you use social networking features (following, messaging, etc.), we collect interaction data, communication metadata, and relationship information to provide these services</li>
                  <li><strong>Public Sources:</strong> Publicly available information that may supplement your profile data</li>
                  <li><strong>Affiliate/Sponsor Data:</strong> Limited data from promotional partners when you use promo codes or affiliate links</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">D. AI-Generated and Enhanced Data</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li><strong>Content Analysis:</strong> We may use AI tools to analyze user content for moderation, categorization, and improvement purposes</li>
                  <li><strong>Personalization Data:</strong> Inferences drawn from your usage patterns to personalize content recommendations</li>
                  <li><strong>Content Enhancement:</strong> AI-assisted alt text, content summaries, or similar accessibility/functionality improvements</li>
                  <li><strong>AI Training:</strong> Your content may be used to train, improve, or develop our AI systems and algorithms. This includes using your posts, interactions, and usage patterns to enhance our AI capabilities</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">E. Sensitive Personal Information</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  We do not intentionally collect sensitive personal information (SSN, financial accounts, health data, biometric identifiers, precise location, racial/ethnic origin, religious beliefs, sexual orientation, etc.) unless explicitly provided by you. Do not submit sensitive information on our Site. If you voluntarily post such information, it will be subject to this Privacy Policy, but we disclaim liability for consequences of your voluntary sharing.
                </p>

                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  <strong>Biometric Information:</strong> We do not currently collect biometric identifiers (fingerprints, voiceprints, facial recognition data, etc.), but if we add such features in the future, collection will be subject to additional consent and disclosure requirements under applicable biometric privacy laws.
                </p>

                <h2 className="heading-section text-brand-green mt-8 mb-4">2. HOW WE USE YOUR INFORMATION</h2>
                
                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">A. Service Provision and Account Management</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li>Create, maintain, and authenticate user accounts</li>
                  <li>Provide site features (content creation, viewing, interaction)</li>
                  <li>Process and display your content according to your privacy settings</li>
                  <li>Deliver requested services, newsletters, and communications</li>
                  <li>Provide customer support and respond to inquiries</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">B. Content and Experience Enhancement</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li><strong>AI-Powered Features:</strong> Generate alt text for accessibility, moderate content, provide recommendations</li>
                  <li><strong>Personalization:</strong> Customize content, recommendations, and site experience based on your preferences and usage</li>
                  <li><strong>Content Quality:</strong> Analyze and improve content quality, detect spam or inappropriate material</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">C. Analytics, Performance, and Site Improvement</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li>Monitor site performance, diagnose technical issues, prevent fraud</li>
                  <li>Analyze usage patterns (individual and aggregate) to improve our Services</li>
                  <li>Conduct research and development for new features and improvements</li>
                  <li>Generate anonymized statistics for internal use or external reporting</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">D. Marketing and Communications</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li>Send service-related notifications (account verification, password resets, policy updates)</li>
                  <li>Deliver newsletters and promotional content (with your consent)</li>
                  <li>Send notifications about interactions with your content (comments, follows, etc.)</li>
                  <li>Opt-out available for marketing communications; service communications required for account functionality</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">E. Safety, Security, and Legal Compliance</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li>Enforce our Terms of Service and Community Guidelines</li>
                  <li>Detect, prevent, and investigate fraudulent, abusive, or illegal activities</li>
                  <li>Protect rights, privacy, safety, and property of Daily Tidbit, users, and third parties</li>
                  <li>Comply with legal obligations, court orders, and regulatory requirements</li>
                  <li>Respond to lawful requests from public authorities</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">F. Affiliate and Sponsor Operations</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li>Process affiliate links and track referrals for commission purposes</li>
                  <li>Display sponsored content and measure campaign effectiveness</li>
                  <li>Distribute and track promotional codes and offers</li>
                  <li>All affiliate/sponsor relationships are clearly disclosed</li>
                </ul>

                <h2 className="heading-section text-brand-green mt-8 mb-4">3. LEGAL BASES FOR PROCESSING (EEA/UK/International Users)</h2>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li><strong>Contract Performance:</strong> Processing necessary to provide Services under our Terms of Service</li>
                  <li><strong>Legitimate Interests:</strong> Site improvement, analytics, security, fraud prevention, direct marketing (balanced against your privacy rights)</li>
                  <li><strong>Consent:</strong> Newsletter subscriptions, optional analytics cookies, promotional communications (withdrawable at any time)</li>
                  <li><strong>Legal Obligation:</strong> Compliance with applicable laws, court orders, regulatory requirements</li>
                  <li><strong>Vital Interests:</strong> Protection of life or safety (rarely applicable)</li>
                  <li><strong>Public Interest:</strong> Rarely applicable to our services</li>
                </ul>

                <h2 className="heading-section text-brand-green mt-8 mb-4">4. HOW WE SHARE YOUR INFORMATION</h2>
                
                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">A. We DO NOT Sell Personal Information</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  Daily Tidbit does not sell, rent, or trade personal information to third parties for their marketing purposes.
                </p>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">B. Service Providers and Processors</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-4">
                  We share information with trusted third-party service providers who assist our operations:
                </p>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li>Website hosting and cloud storage providers</li>
                  <li>Email delivery and newsletter services</li>
                  <li>Analytics and performance monitoring tools</li>
                  <li>Customer support and communication platforms</li>
                  <li>Payment processors (for any future paid services)</li>
                  <li>AI and content moderation services</li>
                </ul>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  All service providers are contractually obligated to protect your information and use it only for authorized purposes.
                </p>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">C. Public User Content</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li><strong>Public Posts:</strong> Content you mark as public becomes available to all users and may be indexed by search engines</li>
                  <li><strong>Profile Information:</strong> Public profile elements are visible to other users and site visitors</li>
                  <li><strong>Featured Content:</strong> We may highlight public user posts on our platform or social media with attribution</li>
                  <li><strong>Search Engine Indexing:</strong> Public content may appear in external search results</li>
                </ul>
                <p className="body-large text-gray-700 leading-relaxed mb-6 body-bold">
                  Important: Once content is public, we cannot control how others use, share, or copy it. Exercise caution when posting personal information publicly.
                </p>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">D. Affiliate and Sponsor Partners</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li>Limited data sharing with affiliate partners to track referrals and measure campaign effectiveness</li>
                  <li>Aggregate/anonymized data may be shared with sponsors to demonstrate site metrics</li>
                  <li>No sharing of personally identifiable information with sponsors/affiliates without explicit consent</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">E. Legal Requirements and Safety</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li><strong>Legal compliance:</strong> Court orders, subpoenas, legal investigations, regulatory requests</li>
                  <li><strong>Safety protection:</strong> Preventing fraud, abuse, violations of law or our Terms</li>
                  <li><strong>Rights enforcement:</strong> Protecting our rights, property, and legal interests</li>
                  <li><strong>Emergency situations:</strong> Preventing death or serious bodily harm</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">F. Business Transfers</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  If Daily Tidbit undergoes merger, acquisition, bankruptcy, or asset sale, your information may be transferred to the acquiring entity. You will be notified via prominent site notice and/or email of any such transfer and your options regarding your personal information.
                </p>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">G. Aggregated and Anonymized Data</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  We may share aggregated, anonymized, or de-identified data that cannot reasonably identify individuals with any third parties for research, analytics, or business purposes.
                </p>

                <h2 className="heading-section text-brand-green mt-8 mb-4">5. USER-GENERATED CONTENT AND PUBLIC INFORMATION</h2>
                
                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">A. Public vs. Private Content</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li><strong>Public Content:</strong> Visible to all users and potentially indexed by search engines</li>
                  <li><strong>Private Content:</strong> Accessible only to you when logged in; stored securely on our servers</li>
                  <li><strong>Content Control:</strong> You control the visibility settings of your content</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">B. Content Removal and Persistence</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li><strong>Deletion:</strong> You can delete content using provided tools; it becomes inaccessible to other users</li>
                  <li><strong>Backup Retention:</strong> Deleted content may persist in backups temporarily but will be purged according to our retention schedule</li>
                  <li><strong>Third-Party Copying:</strong> Public content may have been copied or cached by third parties before deletion; we cannot control third-party copies</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">C. Staff Access to Private Content</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-4">
                  Our staff will only access private content in specific circumstances:
                </p>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li>Providing technical support at your request</li>
                  <li>Investigating Terms of Service violations</li>
                  <li>Legal compliance requirements</li>
                </ul>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  We respect your privacy and will not use private content for unauthorized purposes.
                </p>

                <h2 className="heading-section text-brand-green mt-8 mb-4">6. COOKIES AND TRACKING TECHNOLOGIES</h2>
                
                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">A. Types of Cookies We Use</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li><strong>Essential Cookies:</strong> Required for site functionality, security, and authentication</li>
                  <li><strong>Analytics Cookies:</strong> Track site usage and performance (Google Analytics, etc.)</li>
                  <li><strong>Preference Cookies:</strong> Remember your settings and customization choices</li>
                  <li><strong>Marketing Cookies:</strong> Used for promotional content and affiliate tracking (with consent where required)</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">B. Third-Party Analytics</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-4">
                  We use Google Analytics and similar services to understand site usage. These services may:
                </p>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li>Collect device and usage information through cookies</li>
                  <li>Store data on servers in various locations including the US</li>
                  <li>Provide aggregate reports on site performance and user behavior</li>
                  <li>Be subject to their own privacy policies (see Google's Privacy Policy)</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">C. Your Cookie Choices</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li><strong>Browser Settings:</strong> Modify your browser to accept/decline cookies</li>
                  <li><strong>Opt-Out Tools:</strong> Use Google Analytics opt-out browser add-on</li>
                  <li><strong>Site Settings:</strong> Manage cookie preferences through our cookie preference center (if available)</li>
                </ul>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  Note: Disabling cookies may affect site functionality.
                </p>

                <h2 className="heading-section text-brand-green mt-8 mb-4">7. DATA RETENTION</h2>
                
                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">A. Account and Profile Data</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li>Retained while your account is active</li>
                  <li>Deleted or anonymized within 90 days of account deletion (unless legal retention required)</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">B. Content Data</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li><strong>Public content:</strong> Available until you remove it or delete your account</li>
                  <li><strong>Private content:</strong> Deleted when you remove it or close your account</li>
                  <li><strong>Backup persistence:</strong> May remain in backups for limited periods before purging</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">C. Usage and Analytics Data</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li><strong>Individual usage logs:</strong> Typically retained for 12-24 months</li>
                  <li><strong>Aggregated analytics:</strong> May be retained indefinitely in anonymized form</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">D. Communications</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li><strong>Support communications:</strong> Retained as needed for ongoing support and our records</li>
                  <li><strong>Marketing communications:</strong> Retained until you opt-out or as needed for business purposes</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">E. Legal and Compliance</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  We may retain information longer when required for legal compliance, dispute resolution, or enforcement of our agreements.
                </p>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">F. Indefinite Retention for Legal Protection</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  Notwithstanding other retention periods, we may retain any data indefinitely if necessary for legal compliance, dispute resolution, fraud prevention, or protection of our rights and interests.
                </p>

                <h2 className="heading-section text-brand-green mt-8 mb-4">8. DATA SECURITY</h2>
                
                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">A. Security Measures</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li><strong>Encryption:</strong> HTTPS/SSL for data in transit, encryption for sensitive data at rest</li>
                  <li><strong>Access Controls:</strong> Limited staff access to personal data on need-to-know basis</li>
                  <li><strong>Authentication:</strong> Secure password requirements and account protection measures</li>
                  <li><strong>Infrastructure:</strong> Industry-standard hosting security and monitoring</li>
                  <li><strong>Regular Updates:</strong> Security patches and system updates</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">B. Security Limitations</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li>No system is 100% secure; we cannot guarantee absolute security</li>
                  <li>Use at your own risk with understanding of inherent internet security limitations</li>
                  <li><strong>Breach notification:</strong> We will notify users and authorities as required by law in case of data breaches</li>
                  <li><strong>Data Breach Risks:</strong> Despite our security measures, data breaches may occur due to factors beyond our control including cyberattacks, employee error, or third-party vulnerabilities. You acknowledge these risks and agree to hold us harmless for breach consequences beyond our direct control.</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">C. Your Security Responsibilities</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li>Use strong, unique passwords for your Daily Tidbit account</li>
                  <li>Log out from shared devices</li>
                  <li>Report suspicious activity immediately</li>
                  <li>Keep account information current</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">D. Limitation of Liability for Data Issues</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6 body-bold">
                  TO THE FULLEST EXTENT PERMITTED BY LAW, DAILY TIDBIT SHALL NOT BE LIABLE FOR ANY DAMAGES ARISING FROM DATA BREACHES, PRIVACY VIOLATIONS, OR SECURITY INCIDENTS, INCLUDING BUT NOT LIMITED TO IDENTITY THEFT, FINANCIAL LOSS, OR EMOTIONAL DISTRESS. OUR TOTAL LIABILITY FOR ANY PRIVACY-RELATED CLAIMS SHALL NOT EXCEED $100 USD.
                </p>

                <h2 className="heading-section text-brand-green mt-8 mb-4">9. INTERNATIONAL DATA TRANSFERS</h2>
                
                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">A. US-Based Operations</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  Daily Tidbit operates primarily from the United States. International users consent to data transfer and processing in the US.
                </p>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">B. Safeguards for International Transfers</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li>Standard Contractual Clauses with service providers in countries without adequacy decisions</li>
                  <li>Data Privacy Framework compliance where applicable</li>
                  <li>Contractual protections ensuring adequate data protection standards</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">C. EEA/UK User Rights</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  EEA and UK users retain all rights under GDPR/UK GDPR regardless of data transfer location.
                </p>

                <h2 className="heading-section text-brand-green mt-8 mb-4">10. YOUR RIGHTS AND CHOICES</h2>
                
                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">A. Account Access and Control</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li><strong>Profile Management:</strong> Update account information through account settings</li>
                  <li><strong>Content Management:</strong> Edit, delete, or modify your posts and profile content</li>
                  <li><strong>Privacy Settings:</strong> Control visibility of your content and profile</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">B. Data Rights (All Users)</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li><strong>Access:</strong> Request copy of personal information we hold about you</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate personal information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information (with some exceptions)</li>
                  <li><strong>Portability:</strong> Request data in portable format for transfer to another service</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">C. Communication Preferences</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li><strong>Marketing Opt-Out:</strong> Unsubscribe from promotional emails via unsubscribe links or account settings</li>
                  <li><strong>Newsletter Management:</strong> Modify email preferences or unsubscribe entirely</li>
                  <li><strong>Service Communications:</strong> Required account-related communications cannot be disabled</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">D. State-Specific Rights (US)</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-4">
                  <strong>California (CCPA/CPRA) Rights:</strong>
                </p>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li><strong>Right to Know:</strong> Categories and specific pieces of personal information collected</li>
                  <li><strong>Right to Delete:</strong> Request deletion of personal information (with exceptions)</li>
                  <li><strong>Right to Correct:</strong> Request correction of inaccurate information</li>
                  <li><strong>Right to Opt-Out:</strong> We don&apos;t sell data, but you can opt-out if this changes</li>
                  <li><strong>Right to Limit:</strong> Opt-out of sensitive personal information processing for certain purposes</li>
                  <li><strong>Non-Discrimination:</strong> No discrimination for exercising privacy rights</li>
                </ul>

                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  <strong>Other State Privacy Laws:</strong> We comply with comprehensive privacy laws in Virginia, Colorado, Connecticut, Utah, Delaware, Iowa, Nebraska, New Hampshire, New Jersey, Tennessee, Minnesota, Maryland, and other applicable state laws, providing similar rights including access, correction, deletion, and opt-out rights.
                </p>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">E. EEA/UK/International Rights (GDPR)</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li><strong>Right to Access:</strong> Obtain copy of your personal data</li>
                  <li><strong>Right to Rectification:</strong> Correct inaccurate data</li>
                  <li><strong>Right to Erasure:</strong> Request deletion ("right to be forgotten")</li>
                  <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
                  <li><strong>Right to Data Portability:</strong> Receive data in structured, machine-readable format</li>
                  <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
                  <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for consent-based processing</li>
                  <li><strong>Right to Lodge Complaint:</strong> File complaints with data protection authorities</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">F. Exercising Your Rights</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-4">
                  Contact us at: <a href="mailto:mike@dailytidbit.org" className="text-brand-blue hover:text-blue-700 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2">mike@dailytidbit.org</a> or Daily Tidbit LLC, Privacy Rights, 4 S Edlin St Worcester MA 01603
                </p>
                <p className="body-large text-gray-700 leading-relaxed mb-4">
                  We will:
                </p>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li>Respond within required timeframes (typically 30-45 days)</li>
                  <li>Verify your identity before processing requests</li>
                  <li>Provide clear information about any limitations or exceptions</li>
                  <li>Not discriminate against you for exercising rights</li>
                </ul>

                <h2 className="heading-section text-brand-green mt-8 mb-4">11. CHILDREN'S PRIVACY</h2>
                
                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">A. Age Restrictions</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  Our Site is not directed to children under 13. We do not knowingly collect personal information from children under 13.
                </p>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">B. COPPA Compliance</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  If we discover we have collected information from a child under 13 without parental consent, we will promptly delete it.
                </p>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">C. Minors (13-17)</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li>Parental supervision encouraged for minors using our Site</li>
                  <li>Content moderation may be enhanced for accounts believed to belong to minors</li>
                  <li>California Minors: Users under 18 in California can request removal of public content (see Section 10)</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">D. Parental Action</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  If you believe your child under 13 has provided information to us, contact us immediately at <a href="mailto:mike@dailytidbit.org" className="text-brand-blue hover:text-blue-700 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2">mike@dailytidbit.org</a>.
                </p>

                <h2 className="heading-section text-brand-green mt-8 mb-4">12. THIRD-PARTY LINKS AND INTEGRATIONS</h2>
                
                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">A. External Links</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  Our Site may contain links to third-party websites. This Privacy Policy does not apply to third-party sites. We are not responsible for third-party privacy practices.
                </p>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">B. Third-Party Services</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  We may integrate with third-party services (social media, analytics, etc.). Your interactions with these services are governed by their privacy policies.
                </p>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">C. Affiliate and Sponsor Links</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  Our Site includes affiliate links and sponsored content. Clicking these links takes you to external sites with their own privacy policies.
                </p>

                <h2 className="heading-section text-brand-green mt-8 mb-4">13. ADDITIONAL DISCLOSURES</h2>
                
                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">A. AI and Automated Decision-Making</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li><strong>AI Content Generation:</strong> We use AI for accessibility features (alt text), content moderation, and recommendations</li>
                  <li><strong>No Automated Decisions:</strong> We do not use AI for automated decision-making that significantly affects users</li>
                  <li><strong>Content Moderation:</strong> AI assists human moderators; appeals process available for content decisions</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">B. Marketing and Advertising</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li><strong>Affiliate Relationships:</strong> Clearly disclosed when content includes affiliate links</li>
                  <li><strong>Sponsored Content:</strong> Labeled as sponsored/promoted content</li>
                  <li><strong>No Targeted Advertising:</strong> We currently do not engage in targeted advertising based on personal profiles</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">C. Data Sharing Transparency</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  We maintain records of data sharing and can provide information about categories of third parties we share data with upon request.
                </p>

                <h2 className="heading-section text-brand-green mt-8 mb-4">14. COMPLIANCE AND REGULATORY INFORMATION</h2>
                
                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">A. Privacy Frameworks</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-4">
                  We comply with applicable privacy laws including:
                </p>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li>GDPR (European Union)</li>
                  <li>UK GDPR (United Kingdom)</li>
                  <li>CCPA/CPRA (California)</li>
                  <li>Comprehensive state privacy laws (Virginia, Colorado, Connecticut, Utah, and newer state laws)</li>
                  <li>COPPA (Children's privacy)</li>
                  <li>Sector-specific requirements as applicable</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">B. Data Processing Agreements</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  We maintain appropriate data processing agreements with all service providers who handle personal data on our behalf.
                </p>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">C. Privacy Impact Assessments</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  We conduct privacy impact assessments for high-risk data processing activities as required by applicable law.
                </p>

                <h2 className="heading-section text-brand-green mt-8 mb-4">15. CONTACT INFORMATION AND COMPLAINTS</h2>
                
                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">A. Privacy Contact</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-4">
                  For privacy questions, requests, or complaints:
                </p>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li><strong>Email:</strong> <a href="mailto:mike@dailytidbit.org?subject=Privacy%20Inquiry" className="text-brand-blue hover:text-blue-700 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2">mike@dailytidbit.org</a> (Subject: Privacy Inquiry)</li>
                  <li><strong>Mailing Address:</strong> Daily Tidbit LLC, Privacy Office, 4 S Edlin St Worcester MA 01603</li>
                  <li><strong>Response Time:</strong> We aim to respond within 5 business days for initial inquiries</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">B. Data Protection Officer</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  For EEA/UK users or complex privacy matters, you may request to speak with our privacy compliance team.
                </p>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">C. Regulatory Complaints</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-4">
                  You have the right to file complaints with applicable data protection authorities:
                </p>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li><strong>EEA/UK:</strong> Contact your local data protection authority</li>
                  <li><strong>US States:</strong> Contact your state's attorney general or consumer protection office</li>
                  <li><strong>California:</strong> California Privacy Protection Agency (cppa.ca.gov)</li>
                </ul>

                <h2 className="heading-section text-brand-green mt-8 mb-4">16. POLICY UPDATES AND NOTIFICATIONS</h2>
                
                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">A. Change Process</h3>
                <ul className="list-disc list-inside body-large text-gray-700 mb-6 space-y-2">
                  <li><strong>Material Changes:</strong> Prominent site notice and email notification (if available)</li>
                  <li><strong>Minor Changes:</strong> Updated policy posted with new effective date</li>
                  <li>Continued use after changes constitutes acceptance</li>
                </ul>

                <h3 className="heading-subsection text-gray-800 mt-6 mb-3">B. Version History</h3>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  We maintain records of policy versions and can provide information about changes upon request.
                </p>

                <h2 className="heading-section text-brand-green mt-8 mb-4">17. DISPUTE RESOLUTION AND ARBITRATION</h2>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  Any disputes arising from this Privacy Policy or our data practices are subject to the binding arbitration and class action waiver provisions in our Terms and Conditions, which are incorporated herein by reference. You agree to resolve all privacy-related disputes through individual arbitration rather than court proceedings.
                </p>
                <p className="body-large text-gray-700 leading-relaxed mb-6">
                  For disputes specifically related to privacy or data handling, you may opt out of arbitration by emailing <a href="mailto:mike@dailytidbit.org?subject=Privacy%20Arbitration%20Opt-Out" className="text-brand-blue hover:text-blue-700 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2">mike@dailytidbit.org</a> with "Privacy Arbitration Opt-Out" in the subject line within 30 days of first accepting this Privacy Policy.
                </p>

                <div className="bg-gray-100 border border-gray-300 rounded-lg p-6 mt-8">
                  <p className="text-gray-800 body-bold text-center heading-subsection">
                    This Privacy Policy is effective as of the date listed above and supersedes all previous versions. By using Daily Tidbit, you acknowledge you have read, understood, and agree to this Privacy Policy.
                  </p>
                  <p className="text-gray-800 text-center mt-4 body-large">
                    For the most current version of this Privacy Policy, visit https://www.dailytidbit.org/privacy
                  </p>
                </div>
              </div>

              {/* Contact Section */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex items-center gap-3 text-gray-600 body-large">
                  <Mail className="w-5 h-5" />
                  <span>Questions about this policy? Email us at </span>
                  <a 
                    href="mailto:mike@dailytidbit.org?subject=Privacy%20Policy%20Question" 
                    className="text-brand-blue hover:text-blue-700 transition-colors underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
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