// src/app/components/TodaysTidbitClient.tsx - COMPLETE HYDRATION SAFE + BRAND COLOR FIX
'use client';

import { ArrowRight, Brain, Target } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

// ✅ HYDRATION SAFE: Lazy import analytics to avoid SSR issues
const loadAnalytics = () => import('../lib/gtag');

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

interface TodaysTidbitClientProps {
  todaysTip: TodaysTip | null;
}

// ✅ HYDRATION SAFE: Loading skeleton component
const TodaysTidbitSkeleton = () => (
  <div className="max-w-3xl mx-auto">
    <div className="animate-pulse space-y-6">
      <div className="flex justify-center mb-8">
        <div className="w-64 h-64 bg-gray-200 rounded-2xl"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-200 h-32 rounded-xl"></div>
        <div className="bg-gray-200 h-32 rounded-xl"></div>
      </div>
      <div className="bg-gray-200 h-64 rounded-xl aspect-video"></div>
      <div className="flex justify-center">
        <div className="bg-gray-200 h-16 w-80 rounded-full"></div>
      </div>
    </div>
  </div>
)

export default function TodaysTidbitClient({ todaysTip }: TodaysTidbitClientProps) {
  // ✅ HYDRATION SAFETY: Component-level mounted state
  const [mounted, setMounted] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageHoveredRef = useRef(false);
  const videoMilestonesRef = useRef(new Set(['25', '50', '75']));

  const [videoInteractions, setVideoInteractions] = useState(0);
  const [cardInteractions, setCardInteractions] = useState(0);

  // ✅ HYDRATION SAFETY: Wait for mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ HYDRATION SAFE: Video ID calculation only after mount
  const videoId = useMemo(
    () => {
      if (!mounted) return 'tidbit_day_unknown'
      return todaysTip ? `tidbit_day_${todaysTip.day_number}` : 'tidbit_day_unknown'
    },
    [todaysTip, mounted]
  );

  const bumpVideoInteraction = () => setVideoInteractions((prev) => prev + 1);
  const bumpCardInteraction = () => setCardInteractions((prev) => prev + 1);

  // ✅ HYDRATION SAFE: All analytics functions check mounted state
  const trackSectionView = async (section: string) => {
    if (!mounted) return;
    try {
      const { logEvent } = await loadAnalytics();
      logEvent('section_view', { section });
    } catch {
      // Analytics not critical
    }
  };

  const trackImageInteraction = async (videoId: string, action: string, params: Record<string, any>) => {
    if (!mounted) return;
    try {
      const { logEvent } = await loadAnalytics();
      logEvent('image_interaction', { video_id: videoId, action, ...params });
    } catch {
      // Analytics not critical
    }
  };

  const trackCTAClick = async (ctaName: string, section: string, url: string) => {
    if (!mounted) return;
    try {
      const { logEvent } = await loadAnalytics();
      logEvent('cta_click', { cta_name: ctaName, section, url });
    } catch {
      // Analytics not critical
    }
  };

  const trackConversionFunnel = async (stage: string, score: number, params: Record<string, any>) => {
    if (!mounted) return;
    try {
      const { logEvent } = await loadAnalytics();
      logEvent('conversion_funnel', { stage, engagement_score: score, ...params });
    } catch {
      // Analytics not critical
    }
  };

  const calculateEngagementScore = (timeSpent: number, scrollDepth: number, interactions: number) => {
    return Math.min(100, timeSpent * 0.001 + scrollDepth * 50 + interactions * 10);
  };

  const logEvent = async (eventName: string, params: Record<string, any>) => {
    if (!mounted) return;
    try {
      const { logEvent } = await loadAnalytics();
      logEvent(eventName, params);
    } catch {
      // Analytics not critical
    }
  };

  // ✅ HYDRATION SAFE: Track section view once on mount
  useEffect(() => {
    if (!mounted) return;
    trackSectionView('todays_tidbit');
  }, [mounted]);

  // ✅ HYDRATION SAFE: Reset video milestones when the tidbit changes
  useEffect(() => {
    if (!mounted) return;
    videoMilestonesRef.current = new Set(['25', '50', '75']);
  }, [mounted, todaysTip?.day_number]);

  // ✅ HYDRATION SAFE: Video engagement tracking (only if we have a video and are mounted)
  useEffect(() => {
    if (!mounted) return;
    
    const videoEl = videoRef.current;
    if (!videoEl || !todaysTip?.video_url) return;

    const handleVideoPlay = () => {
      bumpVideoInteraction();
      logEvent('video_interaction', {
        action: 'play',
        video_id: videoId,
        section_name: 'todays_tidbit',
      });
    };

    const handleVideoPause = () => {
      logEvent('video_interaction', {
        action: 'pause',
        video_id: videoId,
        current_time: Math.round(videoEl.currentTime),
      });
    };

    const handleVideoEnded = () => {
      bumpVideoInteraction();
      logEvent('video_interaction', {
        action: 'completed',
        video_id: videoId,
        engagement_score: 100,
      });
    };

    const handleVideoProgress = () => {
      if (!videoEl.duration || !isFinite(videoEl.duration)) return;
      const progress = (videoEl.currentTime / videoEl.duration) * 100;
      const milestones = videoMilestonesRef.current;

      if (progress >= 25 && milestones.has('25')) {
        milestones.delete('25');
        logEvent('video_progress', { milestone: '25_percent', video_id: videoId });
      }
      if (progress >= 50 && milestones.has('50')) {
        milestones.delete('50');
        logEvent('video_progress', { milestone: '50_percent', video_id: videoId });
      }
      if (progress >= 75 && milestones.has('75')) {
        milestones.delete('75');
        logEvent('video_progress', { milestone: '75_percent', video_id: videoId });
      }
    };

    videoEl.addEventListener('play', handleVideoPlay);
    videoEl.addEventListener('pause', handleVideoPause);
    videoEl.addEventListener('ended', handleVideoEnded);
    videoEl.addEventListener('timeupdate', handleVideoProgress);

    return () => {
      videoEl.removeEventListener('play', handleVideoPlay);
      videoEl.removeEventListener('pause', handleVideoPause);
      videoEl.removeEventListener('ended', handleVideoEnded);
      videoEl.removeEventListener('timeupdate', handleVideoProgress);
    };
  }, [mounted, todaysTip?.video_url, videoId]);

  const handleImageHover = () => {
    if (!mounted || imageHoveredRef.current || !todaysTip) return;
    imageHoveredRef.current = true;
    trackImageInteraction(videoId, 'hover', { section_name: 'todays_tidbit' });
  };

  const handleImageClick = () => {
    if (!mounted || !todaysTip) return;
    trackImageInteraction(videoId, 'click', {
      section_name: 'todays_tidbit',
      image_type: 'tidbit_illustration',
    });
  };

  const handleLearningCardClick = () => {
    if (!mounted) return;
    bumpCardInteraction();
    logEvent('card_interaction', {
      card_type: 'learning_preview',
      action: 'click',
      section_name: 'todays_tidbit',
    });
  };

  const handleNeedsCardClick = () => {
    if (!mounted) return;
    bumpCardInteraction();
    logEvent('card_interaction', {
      card_type: 'requirements_preview',
      action: 'click',
      section_name: 'todays_tidbit',
    });
  };

  const handleWalkthroughClick = () => {
    if (!mounted || !todaysTip) return;

    trackCTAClick(
      `walkthrough_${todaysTip.title.toLowerCase().replace(/\s+/g, '_')}`,
      'todays_tidbit',
      `/day/${todaysTip.day_number}`
    );

    const engagementScore = calculateEngagementScore(
      30000, // ~30s
      0.5, // mid-scroll
      videoInteractions + cardInteractions + 1
    );

    trackConversionFunnel('engaged', engagementScore, {
      interaction_type: 'walkthrough_click',
      day_number: todaysTip.day_number,
    });
  };

  // ✅ HYDRATION SAFETY: Show loading state until mounted
  if (!mounted) {
    return <TodaysTidbitSkeleton />;
  }

  // ✅ BRAND COLOR FIX: Branded empty/error state (rare given server logic)
  if (!todaysTip) {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <div
          className="rounded-2xl p-8 sm:p-12 text-center border shadow-lg bg-brand-blue/8 border-brand-blue"
          role="alert"
          aria-live="polite"
        >
          <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center bg-brand-blue">
            <span className="text-2xl text-white">⚠️</span>
          </div>
          <h3 className="text-xl font-bold mb-2 text-brand-blue">
            We couldn't load today's Tidbit
          </h3>
          <p className="text-sm sm:text-base text-gray-700">
            Please refresh and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {todaysTip.image_url && (
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="relative max-w-3xl w-full px-4">
            <Image
              src={todaysTip.image_url}
              alt={`Day ${todaysTip.day_number} illustration`}
              width={600}
              height={600}
              className="w-full max-w-md mx-auto h-auto aspect-square rounded-2xl shadow-xl object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
              priority
              placeholder="blur"
              blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
              onClick={handleImageClick}
              onMouseEnter={handleImageHover}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 text-left">
        <button
          type="button"
          onClick={handleLearningCardClick}
          className="bg-white/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl border-2 border-gray-300 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-left"
          aria-label="Open summary of what you will learn in this tidbit"
        >
          <h3 className="text-base sm:text-lg font-bold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
            <Brain className="w-4 sm:w-5 h-4 sm:h-5" />
            What You'll Learn
          </h3>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            {todaysTip.walkthrough_intro.length > 120
              ? `${todaysTip.walkthrough_intro.substring(0, 120)}...`
              : todaysTip.walkthrough_intro}
          </p>
        </button>

        {/* ✅ BRAND COLOR FIX: Use brand color classes in gradient */}
        <button
          type="button"
          onClick={handleNeedsCardClick}
          className="bg-gradient-to-br from-brand-green/10 to-brand-green/20 p-4 sm:p-6 rounded-xl border border-brand-green/20 shadow-lg backdrop-blur-sm hover:shadow-xl hover:scale-105 transition-all duration-300 text-left"
          aria-label="Open list of what you need to follow this tidbit"
        >
          <h3 className="text-base sm:text-lg font-bold text-brand-greenDark mb-2 sm:mb-3 flex items-center gap-2">
            <Target className="w-4 sm:w-5 h-4 sm:h-5" />
            What You Need
          </h3>
          <p className="text-sm sm:text-base text-brand-greenDark/80 leading-relaxed">
            {todaysTip.what_you_need.length > 120
              ? `${todaysTip.what_you_need.substring(0, 120)}...`
              : todaysTip.what_you_need}
          </p>
        </button>
      </div>

      {todaysTip.video_url && (
        <div className="relative bg-gray-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl aspect-video mb-4 sm:mb-6 w-full max-w-full">
          <video ref={videoRef} className="w-full h-full object-cover" controls preload="metadata">
            <source src={todaysTip.video_url} type="video/mp4" />
            {/* Optional captions file; add the .vtt when ready */}
            <track
              kind="captions"
              src={`/captions/day-${todaysTip.day_number}.vtt`}
              srcLang="en"
              label="English"
            />
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      <div className="flex justify-center px-4 sm:px-0">
        <Link
          href={`/day/${todaysTip.day_number}`}
          onClick={handleWalkthroughClick}
          className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-brand-green to-brand-blue text-white px-8 sm:px-12 py-4 sm:py-5 rounded-full hover:shadow-2xl transform hover:scale-110 transition-all duration-300 font-bold text-lg sm:text-xl w-full sm:w-auto shadow-lg dance-button hover:animate-pulse"
          aria-label={`Open walkthrough for Day ${todaysTip.day_number}: ${todaysTip.title}`}
        >
          <span>Walkthrough: {todaysTip.title}</span>
          <ArrowRight className="w-6 h-6 animate-pulse" />
        </Link>
      </div>
    </div>
  );
}