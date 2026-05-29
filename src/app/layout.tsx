import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Space_Grotesk } from "next/font/google";
import CookieConsentManager from "./components/CookieConsentManager";
import Footer from "./components/Footer";
import "./globals.css";
import './lib/startup-validator';

// Environment validation - runs on startup in development
if (process.env.NODE_ENV === 'development') {
  import('./lib/env-check')
    .then(() => console.log('Environment validation complete'))
    .catch(err => console.error('Environment validation failed:', err))
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.aifieldguide.org"),
  title: "AI Field Guide — Your Guide to AI Tools",
  description: "Browse 100+ hand-picked AI tools organized into simple categories — writing, images, video, productivity, and more. Built for everyday people at aifieldguide.org.",
  keywords: [
    "AI",
    "artificial intelligence",
    "daily tips",
    "productivity",
    "creativity",
    "AI tools",
    "machine learning",
    "AI education",
    "practical AI",
    "AI for beginners",
  ],
  authors: [{ name: "AI Field Guide", url: "https://www.aifieldguide.org" }],
  creator: "AI Field Guide",
  publisher: "Daily Tidbit LLC",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "AI Field Guide — Your Guide to AI Tools",
    description: "Browse 100+ hand-picked AI tools organized into simple categories — writing, images, video, productivity, and more. Built for everyday people at aifieldguide.org.",
    type: "website",
    url: "https://www.aifieldguide.org",
    siteName: "AI Field Guide",
    locale: "en_US",
    images: [
      {
        url: "https://cdn.dailytidbit.org/og-image.png",
        width: 1200,
        height: 630,
        alt: "AI Field Guide — Your Guide to AI Tools",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Field Guide — Your Guide to AI Tools",
    description: "Browse 100+ hand-picked AI tools organized into simple categories — writing, images, video, productivity, and more. Built for everyday people at aifieldguide.org.",
    images: ["https://cdn.dailytidbit.org/og-image.png"],
    creator: "@dailytidbit",
    site: "@dailytidbit",
  },
  alternates: {
    canonical: "https://www.aifieldguide.org",
  },
  category: "Education",
  classification: "AI Education Platform",
  icons: {
    icon: [
      { url: '/96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: '/favicon.ico',
    other: [
      {
        rel: 'icon',
        url: '/192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        rel: 'icon', 
        url: '/512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  },
  manifest: '/manifest.json',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* CRITICAL FIX: Theme prevention script with proper hydration safety */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (typeof localStorage !== 'undefined') {
                    const theme = localStorage.getItem('theme') || 
                      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                    if (theme && document.documentElement) {
                      document.documentElement.classList.add(theme);
                    }
                  }
                } catch (e) {
                  // Silent fail for localStorage blocking
                }
              })()
            `,
          }}
        />

        {/* Google Consent Mode v2 — must run before gtag.js loads */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                analytics_storage: 'denied',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                wait_for_update: 500
              });
              try {
                var _c = localStorage.getItem('dt_cookie_consent');
                var _t = localStorage.getItem('dt_cookie_consent_ts');
                if (_c === 'accepted' && _t && (Date.now() - parseInt(_t, 10)) < 15552000000) {
                  gtag('consent', 'update', { analytics_storage: 'granted' });
                }
              } catch(e) {}
            `,
          }}
        />

        {/* Preconnections for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.dailytidbit.org" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        
        {/* Core viewport and compatibility meta tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="color-scheme" content="light" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="renderer" content="webkit" />
        <meta name="force-rendering" content="webkit" />
        
        {/* PWA Configuration */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="application-name" content="AI Field Guide" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AI Field Guide" />
        
        {/* Theme colors - using actual hex values to prevent hydration mismatch */}
        <meta name="theme-color" content="#60A875" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#60A875" />
        
        {/* Microsoft specific */}
        <meta name="msapplication-TileColor" content="#60A875" />
        <meta name="msapplication-TileImage" content="/192.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Safari specific */}
        <link rel="mask-icon" href="/96.png" color="#60A875" />

        {/* HYDRATION SAFE: Static structured data to prevent hydration issues */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "@id": "https://www.aifieldguide.org#organization",
              name: "AI Field Guide",
              url: "https://www.aifieldguide.org",
              logo: "https://cdn.dailytidbit.org/logo.png",
              description: "Learn how to use AI to make life easier, more creative, and more fun. One smart tip a day.",
              foundingDate: "2024",
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer service",
                availableLanguage: "English",
              },
            }),
          }}
        />
      </head>
      <body 
        className="antialiased min-h-screen bg-white flex flex-col font-sans" 
        suppressHydrationWarning
      >
        {/* Skip to main content link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 px-4 py-2 rounded-md z-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          style={{ backgroundColor: '#60A875', color: 'white' }}
        >
          Skip to main content
        </a>

        <main id="main-content" role="main" className="flex-1">
          {children}
        </main>

        <Footer />
        <CookieConsentManager />

      </body>
    </html>
  );
}