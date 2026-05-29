// ================================================================
// app/field-guide/[slug]/page.tsx - Enhanced Section Page
// ================================================================

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FieldGuideServerAPI } from '../../lib/field-guide-server'
import FieldGuideSectionClient from '../../components/FieldGuideSectionClient'

// ISR caching
export const revalidate = 600

// Generate metadata with server data
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params
    const section = await FieldGuideServerAPI.getSectionBySlug(slug)

    if (!section) {
      return {
        title: 'Section Not Found | AI Field Guide Field Guide',
        description: 'The requested field guide section could not be found.',
      }
    }

    const sectionTools = await FieldGuideServerAPI.getToolsForSection(section.section_name)
    const emoji = FieldGuideServerAPI.getSectionEmoji(section.section_name)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aifieldguide.org'
    
    return {
      title: `${emoji} ${section.section_name} - AI Tools & Guide | AI Field Guide`,
      description: section.summary || section.intro || `Explore ${sectionTools.length} AI tools for ${section.section_name.toLowerCase()}. Hand-picked tools with real-world use cases and detailed guides.`,
      keywords: [
        section.section_name,
        'AI tools',
        `${section.section_name.toLowerCase()} AI`,
        'artificial intelligence',
        'productivity tools',
        'AI guide'
      ],
      authors: [{ name: 'AI Field Guide' }],
      creator: 'AI Field Guide',
      publisher: 'Daily Tidbit LLC',
      openGraph: {
        title: `${section.section_name} AI Tools & Guide`,
        description: section.summary || section.intro || `Comprehensive guide to ${section.section_name.toLowerCase()} AI tools`,
        url: `${baseUrl}/field-guide/${section.slug}`,
        siteName: 'AI Field Guide',
        images: [
          {
            url: 'https://cdn.dailytidbit.org/og-image.png',
            width: 1200,
            height: 630,
            alt: `${section.section_name} AI Tools Guide`,
          }
        ],
        type: 'article'
      },
      twitter: {
        title: `${emoji} ${section.section_name} AI Tools`,
        description: `${sectionTools.length} hand-picked AI tools for ${section.section_name.toLowerCase()}`,
        images: ['https://cdn.dailytidbit.org/og-image.png'],
        card: 'summary_large_image',
        site: '@dailytidbit',
        creator: '@dailytidbit'
      },
      alternates: {
        canonical: `${baseUrl}/field-guide/${section.slug}`,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      }
    }
  } catch (error) {
    console.error('Metadata generation error:', error)
    return {
      title: 'AI Tools Guide | AI Field Guide Field Guide',
      description: 'Explore AI tools and guides for productivity, creativity, and automation.',
    }
  }
}

// Generate static params for popular sections (optional)
export async function generateStaticParams() {
  try {
    const sections = await FieldGuideServerAPI.getAllSectionsWithCounts()
    return sections.map((section) => ({
      slug: section.slug,
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

// Server component with enhanced design consistency
export default async function SectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  try {
    // Fetch section and tools server-side
    const section = await FieldGuideServerAPI.getSectionBySlug(slug)
    
    if (!section) {
      notFound()
    }

    const tools = await FieldGuideServerAPI.getToolsForSection(section.section_name)
    
    const sectionColor = FieldGuideServerAPI.getSectionColor(section.section_name)
    const sectionEmoji = FieldGuideServerAPI.getSectionEmoji(section.section_name)

    const initialData = {
      section,
      tools,
      sectionColor,
      sectionEmoji
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Enhanced Header Section with design system consistency */}
        <section className="px-6 md:px-12 pt-12 pb-4 md:py-12 bg-gradient-to-br from-green-50 to-green-100">
          <div className="max-w-6xl mx-auto">
            {/* Enhanced Breadcrumb with design system */}
            <nav className="mb-6 md:mb-8" aria-label="Breadcrumb">
              <div className="flex items-center space-x-3 text-lg md:text-xl">
                <Link 
                  href="/field-guide" 
                  className="body-large text-gray-700 hover:text-gray-900 transition-colors body-bold bg-white/40 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm hover:shadow-md border border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2"
                >
                  <span aria-hidden="true">🧭</span> Field Guide
                </Link>
                <span className="text-gray-600 text-2xl" aria-hidden="true">/</span>
                <span 
                  className="body-large body-bold bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm border border-white/30"
                  style={{ color: sectionColor }}
                  aria-current="page"
                >
                  {section.section_name}
                </span>
              </div>
            </nav>

            {/* Component with mobile-friendly spacing */}
            <div className="md:pt-0">
              <FieldGuideSectionClient initialData={initialData} />
            </div>
          </div>
        </section>

        {/* Enhanced structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["WebPage", "CollectionPage"],
              "@id": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aifieldguide.org'}/field-guide/${section.slug}`,
              "name": `${section.section_name} AI Tools`,
              "description": section.summary || section.intro,
              "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aifieldguide.org'}/field-guide/${section.slug}`,
              "inLanguage": "en",
              "isPartOf": {
                "@type": "WebSite",
                "@id": process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aifieldguide.org',
                "name": "AI Field Guide"
              },
              "breadcrumb": {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "@id": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aifieldguide.org'}/field-guide#breadcrumb1`,
                    "position": 1,
                    "name": "Field Guide",
                    "item": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aifieldguide.org'}/field-guide`
                  },
                  {
                    "@type": "ListItem",
                    "@id": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aifieldguide.org'}/field-guide/${section.slug}#breadcrumb2`,
                    "position": 2,
                    "name": section.section_name,
                    "item": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aifieldguide.org'}/field-guide/${section.slug}`
                  }
                ]
              },
              "publisher": {
                "@type": "Organization",
                "name": "AI Field Guide",
                "url": process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aifieldguide.org'
              },
              "mainEntity": {
                "@type": "ItemList",
                "name": `${section.section_name} AI Tools`,
                "numberOfItems": tools.length,
                "itemListElement": tools.map((tool, index) => ({
                  "@type": "SoftwareApplication",
                  "@id": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aifieldguide.org'}/field-guide/${section.slug}#tool-${tool.id}`,
                  "position": index + 1,
                  "name": tool.name,
                  "description": tool.description,
                  "applicationCategory": section.section_name,
                  "operatingSystem": "Web",
                  "offers": {
                    "@type": "Offer",
                    "price": tool.free_tier ? "0" : undefined,
                    "priceCurrency": "USD"
                  }
                }))
              }
            })
          }}
        />
      </div>
    )
  } catch (error) {
    console.error('Server-side fetch error:', error)
    
    // Enhanced fallback with design system consistency
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
            <h1 className="heading-section text-gray-900 mb-4">Section Temporarily Unavailable</h1>
            <p className="body-large text-gray-700 mb-6 max-w-2xl mx-auto">
              We're having trouble loading this section. Please try refreshing the page or return to the main Field Guide.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a 
                href={`/field-guide/${slug}`}
                className="px-6 py-3 bg-brand-green text-white rounded-xl hover:bg-green-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 body-bold"
              >
                Refresh Page
              </a>
              <Link 
                href="/field-guide"
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 body-bold"
              >
                Back to Field Guide
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }
}