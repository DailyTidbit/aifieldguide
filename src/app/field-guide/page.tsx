// app/field-guide/page.tsx - Enhanced with tools data
import { Metadata } from 'next'
import { FieldGuideServerAPI } from '../lib/field-guide-server'
import FieldGuideClient from '../components/FieldGuideClient'

// ISR caching - revalidate every 10 minutes
export const revalidate = 600

// Define section order with stable sorting for unknowns
const SECTION_ORDER = [
  'AI Assistants',
  'Image Generation', 
  'Video Generation',
  'Music Creation',
  'Photo & Image Tools',
  'Video Editing',
  'AI Avatars',
  'Speech & Voice',
  'Creative Writing & Storytelling',
  'Productivity Tools',
  'AI Search Tools',
  'Education & Learning',
  'Coding Assistants',
  'Automation Tools'
]

// Enhanced sorting with stable fallback
function sortSections(sections: any[]) {
  return sections.sort((a, b) => {
    const indexA = SECTION_ORDER.indexOf(a.section_name)
    const indexB = SECTION_ORDER.indexOf(b.section_name)
    
    // If both not found, sort alphabetically for stable order
    if (indexA === -1 && indexB === -1) {
      return a.section_name.localeCompare(b.section_name)
    }
    
    // If one not found, put it at the end
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    
    return indexA - indexB
  })
}

// Enhanced metadata with server-side data
export async function generateMetadata(): Promise<Metadata> {
  try {
    const [sectionsWithCounts, totalTools] = await Promise.all([
      FieldGuideServerAPI.getAllSectionsWithCounts(),
      FieldGuideServerAPI.getTotalToolsCount()
    ])
    
    const sectionCount = sectionsWithCounts.length
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aifieldguide.org'
    
    return {
      title: `AI Field Guide - ${sectionCount} Categories, ${totalTools} Tools | AI Field Guide`,
      description: `Your comprehensive guide to AI tools. Explore ${sectionCount} categories with ${totalTools} hand-picked AI tools for productivity, creativity, and automation.`,
      keywords: [
        'AI tools',
        'artificial intelligence guide',
        'AI productivity tools',
        'AI creative tools',
        'AI automation',
        'machine learning tools',
        'AI software directory',
        'AI tool recommendations'
      ],
      authors: [{ name: 'AI Field Guide' }],
      creator: 'AI Field Guide',
      publisher: 'Daily Tidbit LLC',
      openGraph: {
        title: `AI Field Guide — ${totalTools} Tools, ${sectionCount} Categories`,
        description: `Browse ${totalTools} hand-picked AI tools organized into ${sectionCount} simple categories — writing, images, video, productivity, and more. Built for everyday people.`,
        url: `${baseUrl}/field-guide`,
        siteName: 'AI Field Guide',
        images: [
          {
            url: 'https://cdn.dailytidbit.org/og-image.png',
            width: 1200,
            height: 630,
            alt: `AI Field Guide - ${totalTools} Tools`,
          }
        ],
        type: 'website'
      },
      twitter: {
        title: `AI Field Guide — ${totalTools} Tools, ${sectionCount} Categories`,
        description: `Browse ${totalTools} hand-picked AI tools organized into ${sectionCount} simple categories — writing, images, video, productivity, and more. Built for everyday people.`,
        images: ['https://cdn.dailytidbit.org/og-image.png'],
        card: 'summary_large_image',
        site: '@dailytidbit',
        creator: '@dailytidbit'
      },
      alternates: {
        canonical: `${baseUrl}/field-guide`,
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
      title: 'AI Field Guide - Your Complete Guide to AI Tools | AI Field Guide',
      description: 'Explore our comprehensive field guide to AI tools. Hand-picked tools organized by category for productivity, creativity, and automation.',
    }
  }
}

// Server component - renders immediately with data including tools
export default async function FieldGuidePage() {
  try {
    // Fetch sections and total tools count
    const [sectionsWithCounts, totalTools] = await Promise.all([
      FieldGuideServerAPI.getAllSectionsWithCounts(),
      FieldGuideServerAPI.getTotalToolsCount()
    ])

    // Sort sections according to defined order
    const sortedSections = sortSections(sectionsWithCounts)

    // Fetch tools for each section (for enhanced search)
    const sectionsWithTools = await Promise.all(
      sortedSections.map(async (section) => {
        try {
          const tools = await FieldGuideServerAPI.getToolsForSection(section.section_name)
          return {
            ...section,
            tools: tools || []
          }
        } catch (error) {
          console.warn(`Failed to load tools for ${section.section_name}:`, error)
          return {
            ...section,
            tools: []
          }
        }
      })
    )

    const initialData = {
      sections: sectionsWithTools,
      totalTools,
      sectionCount: sortedSections.length
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
        {/* Hero Section with design system consistency */}
        <section className="px-6 md:px-12 py-8 md:py-10">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="heading-hero text-5xl md:text-6xl lg:text-7xl leading-tight mb-6 font-serif">
              <span className="text-brand-green" aria-hidden="true">🧭</span> Your <span className="text-brand-blue">AI Field Guide</span>
            </h1>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
              <div className="bg-white/80 backdrop-blur-sm px-4 py-3 rounded-xl shadow border border-green-200/50">
                <div className="text-2xl font-bold text-brand-green font-serif">
                  {sortedSections.length}
                </div>
                <div className="text-sm text-gray-600">Categories</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm px-4 py-3 rounded-xl shadow border border-blue-200/50">
                <div className="text-2xl font-bold text-brand-blue font-serif">
                  {totalTools}
                </div>
                <div className="text-sm text-gray-600">AI Tools</div>
              </div>
            </div>
          </div>
        </section>

        {/* Pass server data with tools to client component */}
        <FieldGuideClient initialData={initialData} />

        {/* Enhanced structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "AI Field Guide",
              "description": `Comprehensive guide to ${totalTools} AI tools across ${sortedSections.length} categories`,
              "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aifieldguide.org'}/field-guide`,
              "inLanguage": "en",
              "publisher": {
                "@type": "Organization",
                "name": "AI Field Guide",
                "url": process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aifieldguide.org'
              },
              "mainEntity": {
                "@type": "ItemList",
                "name": "AI Tool Categories",
                "numberOfItems": sortedSections.length,
                "itemListElement": sortedSections.map((section, index) => ({
                  "@type": "ListItem",
                  "@id": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aifieldguide.org'}/field-guide/${section.slug}#listitem`,
                  "position": index + 1,
                  "name": section.section_name,
                  "description": section.summary || section.intro,
                  "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aifieldguide.org'}/field-guide/${section.slug}`
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
            <h1 className="heading-section text-gray-900 mb-4">Field Guide Temporarily Unavailable</h1>
            <p className="body-large text-gray-700 mb-6 max-w-2xl mx-auto">
              We're having trouble loading the field guide. Please try refreshing the page or check back in a few moments.
            </p>
            <a 
              href="/field-guide"
              className="inline-block px-6 py-3 bg-brand-green text-white rounded-xl hover:bg-brand-green-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 body-bold"
            >
              Refresh Page
            </a>
          </div>
        </div>
      </div>
    )
  }
}