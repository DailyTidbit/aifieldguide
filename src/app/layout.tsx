import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Space_Grotesk } from "next/font/google";
import Navigation from './components/Navigation';
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
  keywords: ["AI", "artificial intelligence", "daily tips", "productivity", "creativity"],
  authors: [{ name: "Daily Tidbit" }],
  openGraph: {
    title: "Daily Tidbit - AI for Real People",
    description: "Learn how to use AI to make life easier, more creative, and more fun. One smart tip a day.",
    type: "website",
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${playfairDisplay.variable} ${spaceGrotesk.variable}`}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} ${spaceGrotesk.variable} antialiased min-h-screen bg-white font-space-grotesk`}
      >
        <Navigation />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}