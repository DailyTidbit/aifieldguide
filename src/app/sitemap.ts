import { MetadataRoute } from 'next'
import { FieldGuideServerAPI, toolToSlug } from './lib/field-guide-server'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aifieldguide.org'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/field-guide`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/accessibility`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  try {
    const [sections, tools] = await Promise.all([
      FieldGuideServerAPI.getAllSectionsWithCounts(),
      FieldGuideServerAPI.getAllPublicTools(),
    ])

    const sectionPages: MetadataRoute.Sitemap = sections.map((section) => ({
      url: `${BASE_URL}/field-guide/${section.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    const toolPages: MetadataRoute.Sitemap = tools.map((tool) => ({
      url: `${BASE_URL}/tool/${toolToSlug(tool.name)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    return [...staticPages, ...sectionPages, ...toolPages]
  } catch {
    return staticPages
  }
}
