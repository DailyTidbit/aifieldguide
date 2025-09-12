import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Space_Grotesk } from "next/font/google";
import Navigation from "./components/Navigation";
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
  metadataBase: new URL("https://dailytidbit.org"),
  title: "Daily Tidbit - AI for Real People",
  description: "Learn how to use AI to make life easier, more creative, and more fun. One smart tip a day.",
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
  authors: [{ name: "Daily Tidbit", url: "https://dailytidbit.org" }],
  creator: "Daily Tidbit",
  publisher: "Daily Tidbit",
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
    title: "Daily Tidbit - AI for Real People",
    description: "Learn how to use AI to make life easier, more creative, and more fun. One smart tip a day.",
    type: "website",
    url: "https://dailytidbit.org",
    siteName: "Daily Tidbit",
    locale: "en_US",
    images: [
      {
        url: "https://cdn.dailytidbit.org/og-image.png",
        width: 1200,
        height: 630,
        alt: "Daily Tidbit - AI for Real People",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Daily Tidbit - AI for Real People",
    description: "Learn how to use AI to make life easier, more creative, and more fun. One smart tip a day.",
    images: ["https://cdn.dailytidbit.org/og-image.png"],
    creator: "@dailytidbit",
    site: "@dailytidbit",
  },
  alternates: {
    canonical: "https://dailytidbit.org",
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
        <meta name="application-name" content="Daily Tidbit" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Daily Tidbit" />
        
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
              "@id": "https://dailytidbit.org#organization",
              name: "Daily Tidbit",
              url: "https://dailytidbit.org",
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

        <Navigation />

        <main id="main-content" role="main" className="flex-1">
          {children}
        </main>

        <Footer />
        <CookieConsentManager />

        {/* HYDRATION SAFE: Service worker registration with better guards */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
                  window.addEventListener('load', function() {
                    try {
                      const isProduction = !window.location.hostname.includes('localhost') && 
                                          !window.location.hostname.includes('127.0.0.1');
                      
                      if (isProduction && 'serviceWorker' in navigator) {
                        navigator.serviceWorker.register('/sw.js')
                          .then(function(registration) {
                            console.log('SW registered: ', registration);
                          })
                          .catch(function(registrationError) {
                            console.log('SW registration failed: ', registrationError);
                          });
                      }
                    } catch (e) {
                      console.warn('Service worker registration failed:', e);
                    }
                  });
                }
              })()
            `,
          }}
        />
      </body>
    </html>
  );
}