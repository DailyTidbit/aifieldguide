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
      if (!supabase) {
        throw new Error('Database connection unavailable');
      }

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

      // Enhanced data validation and transformation
      return {
        day_number: data.day_number,
        title: data.title || 'Untitled Tidbit',
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
  { 
    revalidate: 300,
    tags: ['tidbits', 'homepage'] 
  }
);

// Enhanced metadata generation with better error handling
export async function generateMetadata(): Promise<Metadata> {
  const siteName = 'Daily Tidbit';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dailytidbit.org';
  
  // Fallback metadata
  const fallbackMetadata: Metadata = {
    title: `${siteName} - AI for Real People`,
    description: 'Learn how to use AI to make life easier, more creative, and more fun. One smart tidbit a day.',
    keywords: [
      'AI tutorial',
      'artificial intelligence',
      'daily tips',
      'technology education',
      'AI for beginners',
      'practical AI',
      'AI tools'
    ],
    authors: [{ name: 'Daily Tidbit', url: baseUrl }],
    creator: 'Daily Tidbit',
    publisher: 'Daily Tidbit',
    category: 'Education',
    classification: 'AI Education Platform',
    openGraph: {
      type: 'website',
      url: baseUrl,
      siteName,
      title: `${siteName} - AI for Real People`,
      description: 'Learn how to use AI to make life easier, more creative, and more fun. One smart tidbit a day.',
      images: [{
        url: `${baseUrl}/og-default.jpg`,
        width: 1200,
        height: 630,
        alt: 'Daily Tidbit - AI for Real People',
        type: 'image/jpeg',
      }],
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@dailytidbit',
      creator: '@dailytidbit',
      title: `${siteName} - AI for Real People`,
      description: 'Learn how to use AI to make life easier, more creative, and more fun. One smart tidbit a day.',
      images: [`${baseUrl}/og-default.jpg`],
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

  try {
    const tidbit = await getCurrentTidbit();
    const description = (tidbit.walkthrough_intro || '').slice(0, 157) + '...';
    const title = `Day ${tidbit.day_number}: ${tidbit.title}`;
    
    return {
      ...fallbackMetadata,
      title: `${title} | ${siteName}`,
      description: description || `Learn AI with Day ${tidbit.day_number}: ${tidbit.title}. Practical AI tips for real people.`,
      keywords: [
        'AI tutorial',
        'artificial intelligence',
        'daily tips',
        'technology education',
        `day ${tidbit.day_number}`,
        ...(tidbit.tags || [])
      ],
      openGraph: {
        ...fallbackMetadata.openGraph,
        title,
        description: description || `Learn AI with Day ${tidbit.day_number}: ${tidbit.title}`,
        images: tidbit.image_url ? [{
          url: tidbit.image_url,
          width: 1200,
          height: 630,
          alt: `Day ${tidbit.day_number}: ${tidbit.title} - Daily Tidbit`,
          type: 'image/jpeg',
        }] : fallbackMetadata.openGraph?.images || [],
      },
      twitter: {
        ...fallbackMetadata.twitter,
        title,
        description: description || `Learn AI with Day ${tidbit.day_number}: ${tidbit.title}`,
        images: tidbit.image_url ? [tidbit.image_url] : [`${baseUrl}/og-default.jpg`],
      },
    };
  } catch (error) {
    console.error('Error generating metadata, using fallback:', error);
    return fallbackMetadata;
  }
}

// Enhanced loading skeleton following design system
function TodaysTidbitSkeleton() {
  return (
    <div 
      className="max-w-3xl mx-auto animate-pulse" 
      role="status" 
      aria-busy="true" 
      aria-live="polite"
      aria-label="Loading today's AI tidbit"
    >
      {/* Day number indicator skeleton */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="h-6 bg-gray-200 rounded-lg w-24 mx-auto mb-4"></div>
        <div className="h-10 bg-gray-200 rounded-lg w-3/4 mx-auto mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
      </div>

      {/* Video/Image placeholder with proper aspect ratio */}
      <div className="flex justify-center mb-6 sm:mb-8">
        <div className="relative max-w-3xl w-full px-4">
          <div className="w-full max-w-md mx-auto aspect-video bg-gray-200 rounded-2xl shadow-brand"></div>
        </div>
      </div>

      {/* Info cards with brand styling */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 px-4">
        <div className="bg-gray-100 p-4 sm:p-6 rounded-xl h-32 shadow-sm">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
        <div className="bg-gray-100 p-4 sm:p-6 rounded-xl h-32 shadow-sm">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="px-4">
        <div className="bg-gray-100 rounded-xl p-6 mb-4 sm:mb-6 shadow-sm">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
        
        {/* CTA button skeleton */}
        <div className="text-center">
          <div className="h-12 bg-gray-200 rounded-lg w-48 mx-auto shadow-sm"></div>
        </div>
      </div>
      
      {/* Accessible loading text */}
      <span className="sr-only">Loading today's AI tidbit content...</span>
    </div>
  );
}

// Enhanced error component with design system integration
function TodaysTidbitError({ error }: { error?: string }) {
  return (
    <div className="max-w-2xl mx-auto px-4">
      <div
        className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-2xl p-8 sm:p-12 text-center shadow-brand-lg"
        role="alert"
        aria-live="assertive"
      >
        <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-6 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <h3 className="heading-subsection text-red-700 mb-4">
          Unable to Load Today's Tidbit
        </h3>
        
        <p className="body-large text-red-600 mb-6 max-w-lg mx-auto leading-relaxed">
          We're having trouble loading today's content. This might be due to a temporary issue or we could be updating our systems.
        </p>
        
        <div className="space-y-4">
          <div className="inline-block">
            <RefreshButton />
          </div>
          
          <p className="body-small text-red-500">
            If this problem persists, please try again in a few minutes.
          </p>
        </div>
        
        {/* Development error details */}
        {error && process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="body-small text-red-500 cursor-pointer hover:text-red-700 transition-colors">
              Technical Details (Development Only)
            </summary>
            <pre className="body-small text-red-500 mt-2 p-3 bg-red-50 rounded-lg overflow-auto whitespace-pre-wrap">
              {error}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

// Server Component that fetches and passes data to client
async function TodaysTidbitServer() {
  try {
    const todaysTip = await getCurrentTidbit();
    return <TodaysTidbitClient todaysTip={todaysTip} />;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('TodaysTidbitServer error:', errorMessage, error);
    
    return <TodaysTidbitError error={errorMessage} />;
  }
}

// Main homepage server component
export default async function HomePage() {
  return (
    <HomeClient>
      <div className="min-h-screen relative overflow-hidden">
        {/* Brand-consistent gradient background */}
        <div className="fixed inset-0 bg-gradient-to-br from-green-200 via-green-100 to-blue-200"></div>

        <main className="relative z-10">
          {/* Semantic heading structure for accessibility */}
          <h1 className="sr-only">Daily Tidbit - Learn AI One Tip at a Time</h1>

          <section 
            className="py-12 sm:py-20 text-center relative"
            aria-labelledby="todays-tidbit-heading"
          >
            {/* Hidden heading for screen readers */}
            <h2 id="todays-tidbit-heading" className="sr-only">
              Today's Featured AI Learning Tidbit
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