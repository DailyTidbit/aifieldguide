import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FieldGuideServerAPI, toolToSlug } from '../../lib/field-guide-server'
import { getSectionHexColor, getSectionEmoji } from '../../lib/field-guide-types'

export const revalidate = 600

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aifieldguide.org'

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const tool = await FieldGuideServerAPI.getToolBySlug(slug)

  if (!tool) {
    return {
      title: 'Tool Not Found | AI Field Guide',
      description: 'The requested AI tool could not be found.',
    }
  }

  const title = `${tool.name} — ${tool.tagline || tool.description.slice(0, 60)}`
  const description = tool.tagline
    ? `${tool.tagline}. ${tool.description}`
    : tool.description
  const trimmedDesc = description.length > 160 ? description.slice(0, 157) + '…' : description
  const canonical = `${BASE_URL}/tool/${slug}`

  return {
    title: `${tool.name} | AI Field Guide`,
    description: trimmedDesc,
    keywords: [
      tool.name,
      tool.category,
      `${tool.name} review`,
      `${tool.name} pricing`,
      'AI tools',
      tool.category.toLowerCase(),
    ],
    authors: [{ name: 'AI Field Guide' }],
    creator: 'AI Field Guide',
    publisher: 'Daily Tidbit LLC',
    alternates: { canonical },
    openGraph: {
      title,
      description: trimmedDesc,
      url: canonical,
      siteName: 'AI Field Guide',
      images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: trimmedDesc,
      images: ['/opengraph-image.png'],
      site: '@dailytidbit',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
  }
}

// ── Static params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  try {
    const tools = await FieldGuideServerAPI.getAllPublicTools()
    return tools.map(t => ({ slug: toolToSlug(t.name) }))
  } catch {
    return []
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold"
      style={{ backgroundColor: `${color}18`, color }}
    >
      {children}
    </span>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{label}</h2>
      <div className="text-gray-700 leading-relaxed">{children}</div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tool = await FieldGuideServerAPI.getToolBySlug(slug)
  if (!tool) notFound()

  const categoryColor = getSectionHexColor(tool.category)
  const categoryEmoji = getSectionEmoji(tool.category)
  const categorySlug = (await FieldGuideServerAPI.getAllSectionsWithCounts())
    .find(s => s.section_name === tool.category)?.slug ?? null

  const useCasesList: string[] = tool.use_cases_list?.length
    ? tool.use_cases_list
    : tool.use_cases
      ? tool.use_cases.split(',').map(s => s.trim()).filter(Boolean)
      : []

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${BASE_URL}/tool/${slug}`,
    name: tool.name,
    description: tool.description,
    url: `${BASE_URL}/tool/${slug}`,
    ...(tool.website && { sameAs: tool.website }),
    applicationCategory: tool.category,
    operatingSystem: 'Web',
    ...(tool.company && { author: { '@type': 'Organization', name: tool.company } }),
    offers: {
      '@type': 'Offer',
      price: tool.free_tier ? '0' : undefined,
      priceCurrency: 'USD',
      availability: 'https://schema.org/OnlineOnly',
    },
    isPartOf: {
      '@type': 'WebSite',
      name: 'AI Field Guide',
      url: BASE_URL,
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Field Guide', item: `${BASE_URL}/field-guide` },
        ...(categorySlug
          ? [{ '@type': 'ListItem', position: 2, name: tool.category, item: `${BASE_URL}/field-guide/${categorySlug}` }]
          : []),
        { '@type': 'ListItem', position: categorySlug ? 3 : 2, name: tool.name, item: `${BASE_URL}/tool/${slug}` },
      ],
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

      {/* Header */}
      <section
        className="px-6 md:px-12 pt-10 pb-8"
        style={{ background: `linear-gradient(135deg, ${categoryColor}10, ${categoryColor}05)` }}
      >
        <div className="max-w-4xl mx-auto">

          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-sm flex-wrap" aria-label="Breadcrumb">
            <Link
              href="/field-guide"
              className="text-gray-500 hover:text-gray-800 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green rounded"
            >
              <span aria-hidden="true">🧭</span> Field Guide
            </Link>
            <span className="text-gray-300" aria-hidden="true">/</span>
            {categorySlug ? (
              <Link
                href={`/field-guide/${categorySlug}`}
                className="hover:text-gray-800 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 rounded px-1"
                style={{ color: categoryColor }}
              >
                <span aria-hidden="true">{categoryEmoji}</span> {tool.category}
              </Link>
            ) : (
              <span style={{ color: categoryColor }} className="font-medium">
                <span aria-hidden="true">{categoryEmoji}</span> {tool.category}
              </span>
            )}
            <span className="text-gray-300" aria-hidden="true">/</span>
            <span className="text-gray-700 font-semibold" aria-current="page">{tool.name}</span>
          </nav>

          {/* Title block */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold font-serif text-gray-900 mb-2 leading-tight">
                {tool.name}
              </h1>
              {tool.company && (
                <p className="text-gray-500 text-lg mb-3">by {tool.company}</p>
              )}
              {tool.tagline && (
                <p className="text-xl text-gray-700 font-medium mb-4 leading-snug">{tool.tagline}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {tool.free_tier && <Badge color="#60A875">✓ Free tier</Badge>}
                {tool.paid_tier && <Badge color="#59B1E3">Paid plans</Badge>}
                {tool.login_required && <Badge color="#9CA3AF">Login required</Badge>}
                {tool.is_sponsored && <Badge color="#F59E0B">Sponsored</Badge>}
              </div>
            </div>

            {tool.website && (
              <a
                href={tool.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:opacity-90 hover:scale-105 transition-all duration-200 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ backgroundColor: categoryColor }}
              >
                Try {tool.name}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span className="sr-only">(opens in new tab)</span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="px-6 md:px-12 py-10">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Description */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <Section label="About">
              {tool.detailed_description
                ? tool.detailed_description.split('\n\n').map((para, i) => (
                    <p key={i} className={i > 0 ? 'mt-4' : ''}>{para}</p>
                  ))
                : <p>{tool.description}</p>
              }
            </Section>
          </div>

          {/* Use cases */}
          {useCasesList.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <Section label="What you can do with it">
                <ul className="space-y-2 mt-1">
                  {useCasesList.map((uc, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-brand-green mt-1 flex-shrink-0" aria-hidden="true">✓</span>
                      <span>{uc}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            </div>
          )}

          {/* Pricing & Access — two-col on desktop */}
          {(tool.pricing_breakdown || tool.access_method || tool.access_notes) && (
            <div className="grid md:grid-cols-2 gap-6">
              {tool.pricing_breakdown && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <Section label="Pricing">
                    <pre className="whitespace-pre-wrap font-sans text-sm">{tool.pricing_breakdown}</pre>
                  </Section>
                </div>
              )}
              {(tool.access_method || tool.access_notes) && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <Section label="How to access">
                    {tool.access_method && <p className="mb-2">{tool.access_method}</p>}
                    {tool.access_notes && <p className="text-sm text-gray-600">{tool.access_notes}</p>}
                  </Section>
                </div>
              )}
            </div>
          )}

          {/* Workflow notes */}
          {tool.workflow_notes && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <Section label="Tips for getting the best results">
                <p>{tool.workflow_notes}</p>
              </Section>
            </div>
          )}

          {/* Limitations */}
          {tool.limitations && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <Section label="Known limitations">
                <p>{tool.limitations}</p>
              </Section>
            </div>
          )}

          {/* Technical / policy — two-col */}
          {(tool.model_type || tool.commercial_use_policy || tool.training_data) && (
            <div className="grid md:grid-cols-2 gap-6">
              {tool.model_type && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <Section label="Model / Technology">
                    <p>{tool.model_type}</p>
                  </Section>
                </div>
              )}
              {tool.commercial_use_policy && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <Section label="Commercial use">
                    <p>{tool.commercial_use_policy}</p>
                  </Section>
                </div>
              )}
              {tool.training_data && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:col-span-2">
                  <Section label="Training data">
                    <p>{tool.training_data}</p>
                  </Section>
                </div>
              )}
            </div>
          )}

          {/* Promo */}
          {tool.is_sponsored && tool.promo_code && (
            <div
              className="rounded-2xl border p-6"
              style={{ backgroundColor: '#F59E0B18', borderColor: '#F59E0B40' }}
            >
              <p className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-1">Promo code</p>
              <p className="font-mono text-lg font-bold text-amber-900">{tool.promo_code}</p>
              {tool.promo_code_description && (
                <p className="text-sm text-amber-800 mt-1">{tool.promo_code_description}</p>
              )}
            </div>
          )}

          {/* Back to category */}
          {categorySlug && (
            <div className="pt-4 border-t border-gray-200">
              <Link
                href={`/field-guide/${categorySlug}`}
                className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green rounded"
                style={{ color: categoryColor }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to {tool.category}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  )
}
