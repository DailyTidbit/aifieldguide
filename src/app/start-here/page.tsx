// app/start-here/page.tsx
import type { Metadata } from 'next';
import StartHereClient from './StartHereClient';

// Optional: page-specific metadata
export const metadata: Metadata = {
  title: 'Start Here — AI for Real People | Daily Tidbit',
  description:
    'Kick off your shoes and explore AI the simple way. One smart, practical tidbit a day — with walkthroughs and real-world use cases.',
};

// Structured Data for SEO (rendered server-side)
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: 'Daily Tidbit - AI for Real People',
  description:
    'Learn how to use AI to make life easier, more creative, and more fun. One smart tip a day.',
  provider: { '@type': 'Organization', name: 'Daily Tidbit' },
  educationalLevel: 'Beginner',
  courseMode: 'online',
  teaches: [
    'Artificial Intelligence basics',
    'AI tools for productivity',
    'Creative AI applications',
    'Practical AI implementation',
  ],
  audience: { '@type': 'Audience', audienceType: 'General Public' },
};

export default function StartHerePage() {
  return (
    <main className="min-h-screen">
      {/* SEO Structured Data (server-rendered) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <StartHereClient />
    </main>
  );
}
