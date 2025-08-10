// app/page.tsx (Server Component - NO 'use client')
import { Suspense } from 'react';
import { unstable_cache } from 'next/cache';
import type { Metadata } from 'next';
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
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('tidbits')
      .select(
        'day_number,title,walkthrough_intro,what_you_need,video_url,image_url,bitboard_url,tags,difficulty_level,estimated_time'
      )
      .order('day_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      throw new Error(error?.message || 'No current tidbit found');
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
  },
  ['current-tidbit'],
  { revalidate: 300 }
);

// Metadata uses the same cached fetch
export async function generateMetadata(): Promise<Metadata> {
  try {
    const t = await getCurrentTidbit();
    const desc = (t.walkthrough_intro || '').slice(0, 160);

    return {
      title: `Day ${t.day_number}: ${t.title} | Daily Tidbit`,
      description: desc,
      openGraph: {
        title: `Day ${t.day_number}: ${t.title}`,
        description: desc,
        images: t.image_url ? [{ url: t.image_url }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: `Day ${t.day_number}: ${t.title}`,
        description: desc,
        images: t.image_url ? [t.image_url] : undefined,
      },
    };
  } catch {
    return {
      title: 'Daily Tidbit - AI for Real People',
      description:
        'Learn how to use AI to make life easier, more creative, and more fun. One smart tidbit a day.',
    };
  }
}

// Loading skeleton (now announced to screen readers)
function TodaysTidbitSkeleton() {
  return (
    <div className="max-w-3xl mx-auto animate-pulse" role="status" aria-busy="true" aria-live="polite">
      <div className="flex justify-center mb-6 sm:mb-8">
        <div className="relative max-w-3xl w-full px-4">
          <div className="w-full max-w-md mx-auto h-64 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-gray-100 p-4 sm:p-6 rounded-xl h-32"></div>
        <div className="bg-gray-100 p-4 sm:p-6 rounded-xl h-32"></div>
      </div>

      <div className="bg-gray-200 rounded-xl h-64 mb-4 sm:mb-6"></div>
      <div className="bg-gray-100 rounded-xl h-16 mb-6 sm:mb-8"></div>
    </div>
  );
}

// Server Component that passes data to the client UI
async function TodaysTidbitServer() {
  try {
    const todaysTip = await getCurrentTidbit();
    return <TodaysTidbitClient todaysTip={todaysTip} />;
  } catch (error) {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <div
          className="rounded-2xl p-8 sm:p-12 text-center border shadow-lg"
          style={{ background: 'rgba(89,177,227,0.08)', borderColor: '#59B1E3' }}
          role="alert"
          aria-live="polite"
        >
          <div
            className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: '#59B1E3' }}
          >
            <span className="text-2xl text-white">⚠️</span>
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: '#59B1E3' }}>
            We couldn’t load today’s Tidbit
          </h3>
          <p className="text-sm sm:text-base mb-5" style={{ color: '#134E1E' }}>
            Please try refreshing. If this keeps happening, we’re likely updating the content.
          </p>
          <div className="inline-block">
            <RefreshButton />
          </div>
        </div>
      </div>
    );
  }
}

// Main homepage (Server Component)
export default async function HomePage() {
  return (
    <HomeClient>
      <div className="min-h-screen relative overflow-hidden">
        {/* Restore your original gradient */}
        <div className="fixed inset-0 bg-gradient-to-br from-green-200 via-green-100 to-blue-200"></div>

        <main className="relative z-10">
          {/* Screen-reader top-level heading */}
          <h1 className="sr-only">Daily Tidbit — Today’s Tidbit</h1>

          <section className="py-12 sm:py-20 text-center relative">
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
