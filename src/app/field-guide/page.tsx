// app/field-guide/page.tsx - TIGHTENED SPACING & REMOVED DESCRIPTIVE TEXT
import { Metadata } from 'next'
import { FieldGuideServerAPI } from '../lib/field-guide-server'
import FieldGuideClient from '../components/FieldGuideClient'
import CTASection from '../components/CTASection'

// ISR caching - revalidate every 10 minutes (field guide changes less frequently)
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

// ✅ Improved sorting with stable fallback
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
    
    return {
      title: `AI Field Guide - ${sectionCount} Categories, ${totalTools} Tools | Daily Tidbit`,
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
      openGraph: {
        title: `AI Field Guide - ${totalTools} Tools Across ${sectionCount} Categories`,
        description: `Your comprehensive guide to AI tools. From writing and creating to automating and learning.`,
        url: 'https://dailytidbit.org/field-guide',
        images: [
          {
            url: 'https://cdn.dailytidbit.org/field-guide-og.png',
            width: 1200,
            height: 630,
            alt: `AI Field Guide - ${totalTools} Tools`,
          }
        ],
        type: 'website',
        siteName: 'Daily Tidbit'
      },
      twitter: {
        title: `AI Field Guide - ${totalTools} AI Tools`,
        description: `Explore ${sectionCount} categories of hand-picked AI tools for every use case.`,
        images: ['https://cdn.dailytidbit.org/field-guide-og.png'],
        card: 'summary_large_image'
      },
      alternates: {
        canonical: 'https://dailytidbit.org/field-guide',
      }
    }
  } catch (error) {
    console.error('Metadata generation error:', error)
    return {
      title: 'AI Field Guide - Your Complete Guide to AI Tools | Daily Tidbit',
      description: 'Explore our comprehensive field guide to AI tools. Hand-picked tools organized by category for productivity, creativity, and automation.',
    }
  }
}

// Server component - renders immediately with data
export default async function FieldGuidePage() {
  try {
    // Fetch data server-side
    const [sectionsWithCounts, totalTools] = await Promise.all([
      FieldGuideServerAPI.getAllSectionsWithCounts(),
      FieldGuideServerAPI.getTotalToolsCount()
    ])

    // Sort sections according to defined order
    const sortedSections = sortSections(sectionsWithCounts)

    const initialData = {
      sections: sortedSections,
      totalTools,
      sectionCount: sortedSections.length
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
        {/* ✅ TIGHTENED HERO SECTION - Removed descriptive text & reduced spacing */}
        <section className="px-6 md:px-12 py-12 md:py-16">
          <div className="max-w-6xl mx-auto text-center">
            <h1 
              className="heading-hero text-5xl md:text-6xl lg:text-7xl leading-tight mb-8"
              style={{fontFamily: "var(--font-playfair, 'Playfair Display'), serif", fontWeight: 700}}
            >
              <span className="text-[#60A875]">🧭</span> Your <span className="text-[#59B1E3]">AI Field Guide</span>
            </h1>

            {/* Server-rendered stats - moved closer to title */}
            <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto">
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
                <div className="text-3xl font-bold text-[#60A875]" style={{fontFamily: "var(--font-playfair, 'Playfair Display'), serif"}}>
                  {sortedSections.length}
                </div>
                <div className="text-gray-600 font-medium">Categories</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
                <div className="text-3xl font-bold text-[#59B1E3]" style={{fontFamily: "var(--font-playfair, 'Playfair Display'), serif"}}>
                  {totalTools}
                </div>
                <div className="text-gray-600 font-medium">AI Tools</div>
              </div>
            </div>
          </div>
        </section>

        {/* Pass server data to client component */}
        <FieldGuideClient initialData={initialData} />

        {/* CTA Section */}
        <CTASection variant="transparent" />

        {/* Structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "AI Field Guide",
              "description": `Comprehensive guide to ${totalTools} AI tools across ${sortedSections.length} categories`,
              "url": "https://dailytidbit.org/field-guide",
              "publisher": {
                "@type": "Organization",
                "name": "Daily Tidbit",
                "url": "https://dailytidbit.org"
              },
              "mainEntity": {
                "@type": "ItemList",
                "name": "AI Tool Categories",
                "numberOfItems": sortedSections.length,
                "itemListElement": sortedSections.map((section, index) => ({
                  "@type": "ListItem",
                  "@id": `https://dailytidbit.org/field-guide/${section.slug}#listitem`,
                  "position": index + 1,
                  "name": section.section_name,
                  "description": section.summary || section.intro,
                  "url": `https://dailytidbit.org/field-guide/${section.slug}`
                }))
              }
            })
          }}
        />
      </div>
    )
  } catch (error) {
    console.error('Server-side fetch error:', error)
    
    // Fallback for errors - still server-rendered
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Field Guide Temporarily Unavailable</h1>
            <p className="text-gray-700 mb-6">
              We're having trouble loading the field guide. Please try refreshing the page.
            </p>
            <a 
              href="/field-guide"
              className="inline-block px-6 py-3 bg-[#60A875] text-white rounded-xl hover:bg-green-600 transition-colors focus:ring-2 focus:ring-[#60A875]/20 focus:outline-none"
            >
              Refresh Page
            </a>
          </div>
        </div>
      </div>
    )
  }
}