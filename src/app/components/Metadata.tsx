import type { Metadata } from "next"

// Enhanced SEO metadata for the start-here page
export const metadata: Metadata = {
  title: "Start Here - Learn AI for Real People | Daily Tidbit",
  description: "New to AI? Start here! Learn how artificial intelligence can make your life easier, more creative, and fun. Quick 60-second videos, real tools, practical tips. Free forever.",
  keywords: [
    "AI for beginners",
    "artificial intelligence tutorial", 
    "learn AI basics",
    "AI tools for everyone",
    "daily AI tips",
    "practical AI applications",
    "AI productivity",
    "AI creativity tools",
    "free AI education",
    "AI onboarding"
  ],
  authors: [{ name: "Daily Tidbit", url: "https://dailytidbit.org" }],
  creator: "Daily Tidbit",
  publisher: "Daily Tidbit",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "Start Here - Learn AI for Real People | Daily Tidbit",
    description: "New to AI? Start here! Learn how artificial intelligence can make your life easier, more creative, and fun. Quick 60-second videos, real tools, practical tips.",
    type: "website",
    url: "https://dailytidbit.org/start-here",
    siteName: "Daily Tidbit",
    locale: "en_US",
    images: [
      {
        url: "https://cdn.dailytidbit.org/Hands-Uppp.png",
        width: 500,
        height: 400,
        alt: "Person celebrating AI success with arms wide open, representing the joy of learning AI",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Start Here - Learn AI for Real People | Daily Tidbit",
    description: "New to AI? Start here! Learn how artificial intelligence can make your life easier, more creative, and fun. Free 60-second videos.",
    images: ["https://cdn.dailytidbit.org/Hands-Uppp.png"],
    creator: "@dailytidbit",
    site: "@dailytidbit",
  },
  alternates: {
    canonical: "https://dailytidbit.org/start-here",
  },
  category: "Education",
  classification: "AI Education Platform",
  verification: {
    // Add your verification tokens when available
    // google: "your-google-verification-token",
    // yandex: "your-yandex-verification-token",
    // yahoo: "your-yahoo-verification-token",
  },
  other: {
    "application-name": "Daily Tidbit",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Daily Tidbit",
    "theme-color": "#60A875",
    "msapplication-TileColor": "#60A875",
    "msapplication-config": "/browserconfig.xml",
  },
}