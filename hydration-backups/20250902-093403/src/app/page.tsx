// app/page.tsx (Server Component - NO 'use client')
import { Suspense } from 'react';
import { unstable_cache } from 'next/cache';
import type { Metadata } from 'next';
import { AlertCircle } from 'lucide-react';
import { createServerClient } from './lib/supabaseServer';
import HomeClient from './components/HomeClient';
import TodaysTidbitClient from './components/TodaysTidbitClient';
import RefreshButton from './components/RefreshButton';

export const revalidate = 300; // 5 minutes

interface TodaysTip {
  day_number: number;
  title: string;
  walkthrough_intro: string;
  what_you_need: string;
  video_url: string | null;
  image_url: string | null;
  bitboard_url: string | null;
  tags: string[];
  difficulty_level: number | null;
  estimated_time: number | null;
}

// Single cached fetch used by both metadata and page
const getCurrentTidbit = unstable_cache(
  async (): Promise<TodaysTip> => {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from('tidbits')
        .select(
          'day_number,title,walkthrough_intro,what_you_need,video_url,image_url,bitboard_url,tags,difficulty_level,estimated_time'
        )
        .order('day_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Supabase error fetching current tidbit:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      if (!data) {
        console.warn('No current tidbit found in database');
        throw new Error('No current tidbit available');
      }

      return {
        day_number: data.day_number,
        title: data.title,
        walkthrough_intro: data.walkthrough_intro ?? '',
        what_you_need: data.what_you_need ?? '',
        video_url: data.video_url ?? null,
        image_url: data.image_url ?? null,
        bitboard_url: data.bitboard_url ?? null,
        tags: Array.isArray(data.tags) ? data.tags : [],
        difficulty_level: data.difficulty_level ?? null,
        estimated_time: data.estimated_time ?? null,
      };
    } catch (error) {
      console.error('Error in getCurrentTidbit:', error);
      throw error;
    }
  },
  ['current-tidbit'],
  { revalidate: 300 }
);

// Metadata uses the same cached fetch
export async function generateMetadata(): Promise<Metadata> {
  try {
    const t = await getCurrentTidbit();
    const desc = (t.walkthrough_intro || '').slice(0, 160);
    const siteName = 'Daily Tidbit';
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dailytidbit.org';

    return {
      title: `Day ${t.day_number}: ${t.title} | ${siteName}`,
      description: desc || `Learn AI with Day ${t.day_number}: ${t.title}. Practical AI tips for real people.`,
      keywords: [
        'AI tutorial',
        'artificial intelligence',
        'daily tips',
        'technology education',
        ...(t.tags || [])
      ],
      authors: [{ name: 'Daily Tidbit' }],
      creator: 'Daily Tidbit',
      publisher: 'Daily Tidbit LLC',
      openGraph: {
        type: 'website',
        url: baseUrl,
        siteName,
        title: `Day ${t.day_number}: ${t.title}`,
        description: desc || `Learn AI with Day ${t.day_number}: ${t.title}`,
        images: t.image_url ? [{
          url: t.image_url,
          width: 1200,
          height: 630,
          alt: `Day ${t.day_number}: ${t.title} - Daily Tidbit`,
        }] : [{
          url: `${baseUrl}/og-default.jpg`,
          width: 1200,
          height: 630,
          alt: 'Daily Tidbit - AI for Real People',
        }],
      },
      twitter: {
        card: 'summary_large_image',
        site: '@dailytidbit',
        creator: '@dailytidbit',
        title: `Day ${t.day_number}: ${t.title}`,
        description: desc || `Learn AI with Day ${t.day_number}: ${t.title}`,
        images: t.image_url ? [t.image_url] : [`${baseUrl}/og-default.jpg`],
      },
      alternates: {
        canonical: baseUrl,
      },
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
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    const siteName = 'Daily Tidbit';
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dailytidbit.org';
    
    return {
      title: `${siteName} - AI for Real People`,
      description: 'Learn how to use AI to make life easier, more creative, and more fun. One smart tidbit a day.',
      keywords: [
        'AI tutorial',
        'artificial intelligence',
        'daily tips',
        'technology education',
        'AI for beginners'
      ],
      authors: [{ name: 'Daily Tidbit' }],
      creator: 'Daily Tidbit',
      publisher: 'Daily Tidbit LLC',
      openGraph: {
        type: 'website',
        url: baseUrl,
        siteName,
        title: `${siteName} - AI for Real People`,
        description: 'Learn how to use AI to make life easier, more creative, and more fun.',
        images: [{
          url: `${baseUrl}/og-default.jpg`,
          width: 1200,
          height: 630,
          alt: 'Daily Tidbit - AI for Real People',
        }],
      },
      twitter: {
        card: 'summary_large_image',
        site: '@dailytidbit',
        creator: '@dailytidbit',
        title: `${siteName} - AI for Real People`,
        description: 'Learn how to use AI to make life easier, more creative, and more fun.',
        images: [`${baseUrl}/og-default.jpg`],
      },
      alternates: {
        canonical: baseUrl,
      },
    };
  }
}

// Enhanced loading skeleton with better accessibility
function TodaysTidbitSkeleton() {
  return (
    <div 
      className="max-w-3xl mx-auto animate-pulse" 
      role="status" 
      aria-busy="true" 
      aria-live="polite"
      aria-label="Loading today's tidbit"
    >
      {/* Video/Image Skeleton */}
      <div className="flex justify-center mb-6 sm:mb-8">
        <div className="relative max-w-3xl w-full px-4">
          <div className="w-full max-w-md mx-auto h-64 bg-gray-200 rounded-2xl shadow-lg"></div>
        </div>
      </div>

      {/* Info Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 px-4">
        <div className="bg-gray-100 p-4 sm:p-6 rounded-xl h-32 shadow-sm"></div>
        <div className="bg-gray-100 p-4 sm:p-6 rounded-xl h-32 shadow-sm"></div>
      </div>

      {/* Main Content Skeleton */}
      <div className="px-4">
        <div className="bg-gray-200 rounded-xl h-64 mb-4 sm:mb-6 shadow-sm"></div>
        <div className="bg-gray-100 rounded-xl h-16 mb-6 sm:mb-8 shadow-sm"></div>
      </div>
      
      {/* Screen reader text */}
      <span className="sr-only">Loading today's AI tidbit content...</span>
    </div>
  );
}

// Enhanced error component with better design system integration
function TodaysTidbitError({ error }: { error?: string }) {
  return (
    <div className="max-w-2xl mx-auto px-4">
      <div
        className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-2xl p-8 sm:p-12 text-center shadow-lg"
        role="alert"
        aria-live="assertive"
      >
        <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-6 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <h3 className="heading-subsection text-red-700 mb-4">
          We couldn't load today's Tidbit
        </h3>
        
        <p className="body-large text-red-600 mb-6 max-w-lg mx-auto">
          Please try refreshing the page. If this keeps happening, we might be updating our content or experiencing technical difficulties.
        </p>
        
        {error && process.env.NODE_ENV === 'development' && (
          <details className="mb-6 text-left">
            <summary className="body-small text-red-500 cursor-pointer hover:text-red-700">
              Technical Details (Development)
            </summary>
            <pre className="body-small text-red-500 mt-2 p-3 bg-red-50 rounded-lg overflow-auto">
              {error}
            </pre>
          </details>
        )}
        
        <div className="inline-block">
          <RefreshButton />
        </div>
      </div>
    </div>
  );
}

// Server Component that passes data to the client UI
async function TodaysTidbitServer() {
  try {
    const todaysTip = await getCurrentTidbit();
    return <TodaysTidbitClient todaysTip={todaysTip} />;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('TodaysTidbitServer error:', error);
    
    return <TodaysTidbitError error={errorMessage} />;
  }
}

// Main homepage (Server Component)
export default async function HomePage() {
  return (
    <HomeClient>
      <div className="min-h-screen relative overflow-hidden">
        {/* Brand-consistent gradient background */}
        <div className="fixed inset-0 bg-gradient-to-br from-green-200 via-green-100 to-blue-200"></div>

        <main className="relative z-10">
          {/* Accessible heading structure */}
          <h1 className="sr-only">Daily Tidbit - Today's AI Tidbit</h1>

          <section 
            className="py-12 sm:py-20 text-center relative"
            aria-labelledby="todays-tidbit-heading"
          >
            <h2 id="todays-tidbit-heading" className="sr-only">
              Today's Featured Tidbit
            </h2>
            
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <Suspense fallback={<TodaysTidbitSkeleton />}>
                <TodaysTidbitServer />
              </Suspense>
            </div>
          </section>
        </main>
      </div>
    </HomeClient>
  );
}