import type { Metadata } from 'next'
import StartHerePageClient from './StartHerePageClient'

export const metadata: Metadata = {
  title: 'Start Here — AI Field Guide',
  description: 'New to AI? A plain-english guide to what it is, how it works, and why everyone is talking about it. No jargon, no hype.',
  alternates: { canonical: 'https://www.aifieldguide.org/start-here' },
  openGraph: {
    title: 'Start Here — AI Field Guide',
    description: 'No jargon. No hype. Just a plain-english guide to the most interesting thing happening right now.',
    url: 'https://www.aifieldguide.org/start-here',
    siteName: 'AI Field Guide',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Start Here — AI Field Guide',
    description: 'No jargon. No hype. Just a plain-english guide to the most interesting thing happening right now.',
    images: ['/opengraph-image.png'],
    site: '@dailytidbit',
  },
  robots: { index: true, follow: true },
}

export default function StartHerePage() {
  return <StartHerePageClient />
}
