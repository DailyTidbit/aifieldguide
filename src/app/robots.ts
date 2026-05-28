import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aifieldguide.org'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/field-guide', '/privacy', '/terms', '/accessibility'],
        disallow: [
          '/admin',
          '/partners',
          '/bitboard',
          '/TidbitLibrary',
          '/start-here',
          '/day',
          '/post',
          '/search',
          '/auth',
          '/debug-cookies',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
