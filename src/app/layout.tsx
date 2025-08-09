import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Space_Grotesk } from "next/font/google";
import Navigation from './components/Navigation';
import CookieConsentManager from './components/CookieConsentManager';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
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
    "AI for beginners"
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
    title: "Daily Tidbit - AI for Real People",
    description: "Learn how to use AI to make life easier, more creative, and more fun. One smart tip a day.",
    type: "website",
    url: "https://dailytidbit.org",
    siteName: "Daily Tidbit",
    locale: "en_US",
    images: [
      {
        url: "https://cdn.dailytidbit.org/og-image.png", // You'll want to create this
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
    creator: "@dailytidbit", // Replace with your actual Twitter handle
    site: "@dailytidbit",
  },
  alternates: {
    canonical: "https://dailytidbit.org",
  },
  category: "Education",
  classification: "AI Education Platform",
  verification: {
    // Add these when you get them from Google Search Console, etc.
    // google: "your-google-verification-token",
    // yandex: "your-yandex-verification-token",
    // yahoo: "your-yahoo-verification-token",
    // other: {
    //   "facebook-domain-verification": "your-facebook-verification-token"
    // }
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
    // PWA manifest
    "msapplication-square70x70logo": "/icons/mstile-70x70.png",
    "msapplication-square150x150logo": "/icons/mstile-150x150.png",
    "msapplication-wide310x150logo": "/icons/mstile-310x150.png",
    "msapplication-square310x310logo": "/icons/mstile-310x310.png",
  },
  // Icons for favicons and PWA
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  // Manifest for PWA
  manifest: "/manifest.json",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${playfairDisplay.variable} ${spaceGrotesk.variable}`}>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.dailytidbit.org" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        
        {/* Viewport meta tag for responsive design */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        
        {/* Additional SEO meta tags */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="color-scheme" content="light" />
        
        {/* Structured data for organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Daily Tidbit",
              "url": "https://dailytidbit.org",
              "logo": "https://cdn.dailytidbit.org/logo.png",
              "description": "Learn how to use AI to make life easier, more creative, and more fun. One smart tip a day.",
              "foundingDate": "2024",
              "sameAs": [
                // Add your social media URLs here
                // "https://twitter.com/dailytidbit",
                // "https://linkedin.com/company/dailytidbit"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "availableLanguage": "English"
              }
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} ${spaceGrotesk.variable} antialiased min-h-screen bg-white font-space-grotesk`}
      >
        {/* Skip to main content for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                     bg-brand-green text-white px-4 py-2 rounded-md z-50
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Skip to main content
        </a>
        
        <Navigation />
        
        <main id="main-content" role="main">
          {children}
        </main>
        
        {/* Cookie Consent Manager - handles GA loading based on consent */}
        <CookieConsentManager />
        
        {/* Footer can go here if you have one */}
        {/* <Footer /> */}
        
        {/* Service Worker registration for PWA (if you want to add PWA features) */}
        {process.env.NODE_ENV === 'production' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js');
                  });
                }
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}