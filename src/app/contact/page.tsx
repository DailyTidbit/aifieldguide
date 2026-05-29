import type { Metadata } from 'next'
import Link from 'next/link'
import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: 'Get in Touch – AI Field Guide',
  description: 'Have a question or feedback? Send us a message and we\'ll get back to you.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-green-200 via-green-100 to-blue-200" />

      <main className="relative z-10">
        <section className="py-12 sm:py-16">
          <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Back link */}
            <Link
              href="/field-guide"
              className="inline-flex items-center gap-2 text-brand-blue hover:text-brand-blue/80 transition-colors mb-8 group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm font-medium">Back to AI Field Guide</span>
            </Link>

            {/* Title */}
            <div className="text-center mb-10">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#60A875' }}>
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <h1 className="heading-hero text-gray-900 mb-3 font-serif">Get in Touch</h1>
              <p className="text-gray-600 text-lg font-sans">
                Questions, feedback, or just want to say hi? We'd love to hear from you.
              </p>
            </div>

            {/* Form card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 md:p-10">
              <ContactForm />
            </div>

          </div>
        </section>
      </main>
    </div>
  )
}
