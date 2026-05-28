import { MetadataRoute } from 'next'
import { FieldGuideServerAPI } from './lib/field-guide-server'

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
  ]

  try {
    const sections = await FieldGuideServerAPI.getAllSectionsWithCounts()
    const sectionPages: MetadataRoute.Sitemap = sections.map((section) => ({
      url: `${BASE_URL}/field-guide/${section.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
    return [...staticPages, ...sectionPages]
  } catch {
    return staticPages
  }
}
