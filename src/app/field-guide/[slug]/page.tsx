// app/field-guide/[slug]/page.tsx - FIXED MOBILE NAVIGATION SPACING
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FieldGuideServerAPI } from '../../lib/field-guide-server'
import FieldGuideSectionClient from '../../components/FieldGuideSectionClient'
import CTASection from '../../components/CTASection'

// ISR caching
export const revalidate = 600

// Generate metadata with server data
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    // ✅ Fixed: Await params before using
    const { slug } = await params
    const section = await FieldGuideServerAPI.getSectionBySlug(slug)

    if (!section) {
      return {
        title: 'Section Not Found | Daily Tidbit Field Guide',
        description: 'The requested field guide section could not be found.',
      }
    }

    const sectionTools = await FieldGuideServerAPI.getToolsForSection(section.section_name)
    const emoji = FieldGuideServerAPI.getSectionEmoji(section.section_name)
    
    return {
      title: `${emoji} ${section.section_name} - AI Tools & Guide | Daily Tidbit`,
      description: section.summary || section.intro || `Explore ${sectionTools.length} AI tools for ${section.section_name.toLowerCase()}. Hand-picked tools with real-world use cases and detailed guides.`,
      keywords: [
        section.section_name,
        'AI tools',
        `${section.section_name.toLowerCase()} AI`,
        'artificial intelligence',
        'productivity tools',
        'AI guide'
      ],
      openGraph: {
        title: `${section.section_name} AI Tools & Guide`,
        description: section.summary || section.intro || `Comprehensive guide to ${section.section_name.toLowerCase()} AI tools`,
        url: `https://dailytidbit.org/field-guide/${section.slug}`,
        images: [
          {
            url: `https://cdn.dailytidbit.org/field-guide/${section.slug}-og.png`,
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
        images: [`https://cdn.dailytidbit.org/field-guide/${section.slug}-og.png`],
        card: 'summary_large_image'
      },
      alternates: {
        canonical: `https://dailytidbit.org/field-guide/${section.slug}`,
      }
    }
  } catch (error) {
    console.error('Metadata generation error:', error)
    return {
      title: 'AI Tools Guide | Daily Tidbit Field Guide',
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

// Server component
export default async function SectionPage({ params }: { params: Promise<{ slug: string }> }) {
  // ✅ Fixed: Await params at the top level so slug is available everywhere
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
        {/* Enhanced Header Section with proper mobile spacing */}
        <section className="px-6 md:px-12 pt-12 pb-4 md:py-12 bg-gradient-to-br from-green-50 to-green-100">
          <div className="max-w-6xl mx-auto">
            {/* Enhanced Breadcrumb */}
            <nav className="mb-6 md:mb-8" aria-label="Breadcrumb">
              <div className="flex items-center space-x-3 text-lg md:text-xl">
                <Link 
                  href="/field-guide" 
                  className="text-gray-700 hover:text-gray-900 transition-colors font-semibold bg-white/40 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm hover:shadow-md"
                  style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}
                >
                  🧭 Field Guide
                </Link>
                <span className="text-gray-600 text-2xl" aria-hidden="true">/</span>
                <span 
                  className="font-bold bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm"
                  style={{ 
                    color: sectionColor,
                    fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"
                  }}
                  aria-current="page"
                >
                  {section.section_name}
                </span>
              </div>
            </nav>

            {/* Section Header - Reduced margin on mobile */}
            <div className="text-center mb-6 md:mb-16">
              <h1 
                className="heading-hero text-3xl md:text-4xl lg:text-6xl leading-tight mb-4 md:mb-8 flex items-center justify-center gap-3 md:gap-4"
                style={{
                  fontFamily: "var(--font-playfair, 'Playfair Display'), serif", 
                  fontWeight: 700,
                  color: sectionColor
                }}
              >
                <span className="text-4xl md:text-5xl lg:text-7xl" aria-hidden="true">{sectionEmoji}</span>
                <span className="break-words">{section.section_name}</span>
              </h1>
            </div>

            {/* Component with mobile-friendly spacing */}
            <div className="md:pt-0">
              <FieldGuideSectionClient initialData={initialData} />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <CTASection variant="transparent" />

        {/* Structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["WebPage", "CollectionPage"],
              "@id": `https://dailytidbit.org/field-guide/${section.slug}`,
              "name": `${section.section_name} AI Tools`,
              "description": section.summary || section.intro,
              "url": `https://dailytidbit.org/field-guide/${section.slug}`,
              "inLanguage": "en",
              "isPartOf": {
                "@type": "WebSite",
                "@id": "https://dailytidbit.org",
                "name": "Daily Tidbit"
              },
              "breadcrumb": {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "@id": "https://dailytidbit.org/field-guide#breadcrumb1",
                    "position": 1,
                    "name": "Field Guide",
                    "item": "https://dailytidbit.org/field-guide"
                  },
                  {
                    "@type": "ListItem",
                    "@id": `https://dailytidbit.org/field-guide/${section.slug}#breadcrumb2`,
                    "position": 2,
                    "name": section.section_name,
                    "item": `https://dailytidbit.org/field-guide/${section.slug}`
                  }
                ]
              },
              "publisher": {
                "@type": "Organization",
                "name": "Daily Tidbit",
                "url": "https://dailytidbit.org"
              },
              "mainEntity": {
                "@type": "ItemList",
                "name": `${section.section_name} AI Tools`,
                "numberOfItems": tools.length,
                "itemListElement": tools.map((tool, index) => ({
                  "@type": "SoftwareApplication",
                  "@id": `https://dailytidbit.org/field-guide/${section.slug}#tool-${tool.id}`,
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
    
    // Fallback for errors
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Section Temporarily Unavailable</h1>
            <p className="text-gray-700 mb-6">
              We're having trouble loading this section. Please try refreshing the page.
            </p>
            <div className="flex gap-4 justify-center">
              <a 
                href={`/field-guide/${slug}`}
                className="px-6 py-3 bg-[#60A875] text-white rounded-xl hover:bg-green-600 transition-colors"
              >
                Refresh Page
              </a>
              <Link 
                href="/field-guide"
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
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