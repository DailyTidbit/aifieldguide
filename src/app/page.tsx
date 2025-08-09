'use client'

import { Play, ArrowRight, Users, BookOpen, Brain, Target, Clock, Tag, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from './lib/supabaseClient'
import { Suspense, useEffect, useRef, useState } from 'react'
import CTASection from './components/CTASection'
import { 
  pageview,
  trackSectionView, 
  trackUserEngagement, 
  trackImageInteraction,
  trackCTAClick,
  trackDeviceEngagement,
  trackConversionFunnel,
  getDeviceType,
  calculateEngagementScore,
  logEvent
} from './lib/gtag'

interface TodaysTip {
  day_number: number
  title: string
  walkthrough_intro: string
  what_you_need: string
  video_url: string
  image_url: string
  bitboard_url: string
  tags: string[]
  difficulty_level: number
  estimated_time: number
}

// Loading component for today's tidbit section
function TodaysTidbitSkeleton() {
  return (
    <div className="max-w-3xl mx-auto animate-pulse">
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
  )
}

// Analytics-enabled TodaysTidbit component
function TodaysTidbitWithAnalytics({ todaysTip }: { todaysTip: TodaysTip | null }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const imageHoveredRef = useRef(false)
  const videoMilestonesRef = useRef(new Set(['25', '50', '75']))
  
  const [videoInteractions, setVideoInteractions] = useState(0)
  const [cardInteractions, setCardInteractions] = useState(0)

  const bumpVideoInteraction = () => setVideoInteractions(prev => prev + 1)
  const bumpCardInteraction = () => setCardInteractions(prev => prev + 1)

  useEffect(() => {
    // Track today's tidbit section view
    trackSectionView('todays_tidbit')
  }, [])

  // Video engagement tracking
  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl || !todaysTip) return

    const handleVideoPlay = () => {
      bumpVideoInteraction()
      logEvent('video_interaction', {
        action: 'play',
        video_id: `tidbit_day_${todaysTip.day_number}`,
        section_name: 'todays_tidbit'
      })
    }

    const handleVideoPause = () => {
      logEvent('video_interaction', {
        action: 'pause',
        video_id: `tidbit_day_${todaysTip.day_number}`,
        current_time: Math.round(videoEl.currentTime)
      })
    }

    const handleVideoEnded = () => {
      bumpVideoInteraction()
      logEvent('video_interaction', {
        action: 'completed',
        video_id: `tidbit_day_${todaysTip.day_number}`,
        engagement_score: 100
      })
    }

    // Fixed: Guard video milestones with Set to fire only once
    const handleVideoProgress = () => {
      const progress = (videoEl.currentTime / videoEl.duration) * 100
      const milestones = videoMilestonesRef.current
      
      if (progress >= 25 && milestones.has('25')) {
        milestones.delete('25')
        logEvent('video_progress', { milestone: '25_percent', video_id: `tidbit_day_${todaysTip.day_number}` })
      }
      if (progress >= 50 && milestones.has('50')) {
        milestones.delete('50')
        logEvent('video_progress', { milestone: '50_percent', video_id: `tidbit_day_${todaysTip.day_number}` })
      }
      if (progress >= 75 && milestones.has('75')) {
        milestones.delete('75')
        logEvent('video_progress', { milestone: '75_percent', video_id: `tidbit_day_${todaysTip.day_number}` })
      }
    }

    videoEl.addEventListener('play', handleVideoPlay)
    videoEl.addEventListener('pause', handleVideoPause)
    videoEl.addEventListener('ended', handleVideoEnded)
    videoEl.addEventListener('timeupdate', handleVideoProgress)

    return () => {
      videoEl.removeEventListener('play', handleVideoPlay)
      videoEl.removeEventListener('pause', handleVideoPause)
      videoEl.removeEventListener('ended', handleVideoEnded)
      videoEl.removeEventListener('timeupdate', handleVideoProgress)
    }
  }, [todaysTip])

  // Fixed: Throttled image hover - once per session
  const handleImageHover = () => {
    if (imageHoveredRef.current || !todaysTip) return
    imageHoveredRef.current = true
    trackImageInteraction(`tidbit_day_${todaysTip.day_number}`, 'hover', {
      section_name: 'todays_tidbit'
    })
  }

  const handleImageClick = () => {
    if (!todaysTip) return
    trackImageInteraction(`tidbit_day_${todaysTip.day_number}`, 'click', {
      section_name: 'todays_tidbit',
      image_type: 'tidbit_illustration'
    })
  }

  // Fixed: Use React onClick handlers instead of addEventListener
  const handleLearningCardClick = () => {
    bumpCardInteraction()
    logEvent('card_interaction', {
      card_type: 'learning_preview',
      action: 'click',
      section_name: 'todays_tidbit'
    })
  }

  const handleNeedsCardClick = () => {
    bumpCardInteraction()
    logEvent('card_interaction', {
      card_type: 'requirements_preview',
      action: 'click',
      section_name: 'todays_tidbit'
    })
  }

  const handleWalkthroughClick = () => {
    if (!todaysTip) return
    
    trackCTAClick(
      `walkthrough_${todaysTip.title.toLowerCase().replace(/\s+/g, '_')}`,
      'todays_tidbit',
      `/day/${todaysTip.day_number}`
    )
    
    // Track conversion funnel progress
    const engagementScore = calculateEngagementScore(
      30000, // Assume 30 seconds if they clicked walkthrough
      0.5, // Assume mid-scroll
      videoInteractions + cardInteractions + 1
    )
    
    trackConversionFunnel('engaged', engagementScore, {
      interaction_type: 'walkthrough_click',
      day_number: todaysTip.day_number
    })
  }

  if (!todaysTip) {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center shadow-lg">
          <Brain className="w-12 sm:w-16 h-12 sm:h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-bold text-gray-600 mb-2">No Tidbit Available</h3>
          <p className="text-sm sm:text-base text-gray-500">Check back soon for new content!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {todaysTip?.image_url && (
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
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+Wj2nkdkryehqpz5Nqj9EB+dGbdQe/ukcUtGZ3uGo6NNWQcf5cQz9GWrUy5J3b7V9v9F8sQJbcRi/XPxY5+Ks7g3p18BZKOvnKdqvdm6LtRiclNEH//9k="
              onClick={handleImageClick}
              onMouseEnter={handleImageHover}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 text-left">
        <div 
          onClick={handleLearningCardClick}
          className="bg-white/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl border-2 border-gray-300 shadow-lg cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300"
        >
          <h3 className="text-base sm:text-lg font-bold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
            <Brain className="w-4 sm:w-5 h-4 sm:h-5" />
            What You'll Learn
          </h3>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            {todaysTip.walkthrough_intro.length > 120 
              ? `${todaysTip.walkthrough_intro.substring(0, 120)}...`
              : todaysTip.walkthrough_intro
            }
          </p>
        </div>

        <div 
          onClick={handleNeedsCardClick}
          className="bg-gradient-to-br from-green-50 to-green-100 p-4 sm:p-6 rounded-xl border border-green-200 shadow-lg backdrop-blur-sm cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300"
        >
          <h3 className="text-base sm:text-lg font-bold text-green-900 mb-2 sm:mb-3 flex items-center gap-2">
            <Target className="w-4 sm:w-5 h-4 sm:h-5" />
            What You Need
          </h3>
          <p className="text-sm sm:text-base text-green-800 leading-relaxed">
            {todaysTip.what_you_need.length > 120 
              ? `${todaysTip.what_you_need.substring(0, 120)}...`
              : todaysTip.what_you_need
            }
          </p>
        </div>
      </div>

      <div className="relative bg-gray-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl aspect-video mb-4 sm:mb-6 w-full max-w-full">
        <video 
          ref={videoRef}
          className="w-full h-full object-cover"
          controls
          preload="metadata"
        >
          <source src={todaysTip.video_url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="flex justify-center px-4 sm:px-0">
        <Link
          href={`/day/${todaysTip.day_number}`}
          onClick={handleWalkthroughClick}
          className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#60A875] to-[#59B1E3] text-white px-8 sm:px-12 py-4 sm:py-5 rounded-full hover:shadow-2xl transform hover:scale-110 transition-all duration-300 font-bold text-lg sm:text-xl w-full sm:w-auto shadow-lg dance-button hover:animate-pulse"
        >
          <span>Walkthrough: {todaysTip.title}</span>
          <ArrowRight className="w-6 h-6 animate-pulse" />
        </Link>
      </div>
    </div>
  )
}

// Async component for fetching today's tidbit
async function TodaysTidbit() {
  try {
    // Add timeout and error handling to the query
    const { data: tidbitData, error: tidbitError } = await Promise.race([
      supabase
        .from('tidbits')
        .select('*')
        .order('day_number', { ascending: false })
        .limit(1)
        .single(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 8000)
      )
    ]) as any

    if (tidbitError) {
      throw tidbitError
    }

    const todaysTip: TodaysTip | null = tidbitData ? {
      day_number: tidbitData.day_number,
      title: tidbitData.title,
      walkthrough_intro: tidbitData.walkthrough_intro,
      what_you_need: tidbitData.what_you_need,
      video_url: tidbitData.video_url,
      image_url: tidbitData.image_url,
      bitboard_url: tidbitData.bitboard_url,
      tags: tidbitData.tags || [],
      difficulty_level: tidbitData.difficulty_level || 1,
      estimated_time: tidbitData.estimated_time || 5
    } : null

    return <TodaysTidbitWithAnalytics todaysTip={todaysTip} />
  } catch (error) {
    console.error('Error fetching today\'s tidbit:', error)
    
    return (
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-red-50/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center border border-red-200 shadow-lg">
          <div className="w-12 sm:w-16 h-12 sm:h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-red-700 mb-2">Unable to Load Today's Tidbit</h3>
          <p className="text-sm sm:text-base text-red-600 mb-4">
            We're having trouble loading the latest content. Please try refreshing the page.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }
}

// Main homepage component with full analytics
export default function HomePage() {
  const pageStartTime = useRef<number>(Date.now())
  const scrollDepthTracked = useRef<Set<number>>(new Set())
  const [interactions, setInteractions] = useState(0)

  const bumpInteraction = () => setInteractions(prev => prev + 1)

  // Fixed: Use pageview() instead of logEvent('page_view')
  useEffect(() => {
    // Track proper pageview
    pageview('/')
    trackSectionView('homepage_hero')
  }, [])

  // Fixed: Proper scroll depth tracking with ticking pattern
  useEffect(() => {
    const milestones = [25, 50, 75, 90]
    const fired = scrollDepthTracked.current
    let ticking = false

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const top = window.pageYOffset
        const doc = document.documentElement.scrollHeight - window.innerHeight
        if (doc <= 0) { 
          ticking = false
          return
        }
        const pct = Math.round((top / doc) * 100)
        
        for (const m of milestones) {
          if (pct >= m && !fired.has(m)) {
            fired.add(m)
            trackUserEngagement('scroll_depth', m, {
              section_name: 'homepage',
              device_type: getDeviceType(),
            })
          }
        }
        ticking = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Time on page tracking - only log if >= 1 minute
  useEffect(() => {
    const trackTimeOnPage = () => {
      const timeOnPage = Date.now() - pageStartTime.current
      const minutes = Math.floor(timeOnPage / 60000)
      
      if (minutes >= 1) {
        trackUserEngagement('time_on_page', minutes, {
          total_time_ms: timeOnPage,
          section_name: 'homepage',
          device_type: getDeviceType()
        })
      }
    }

    const interval = setInterval(trackTimeOnPage, 60000) // Every minute
    return () => clearInterval(interval)
  }, [])

  // Page engagement score tracking on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const timeOnPage = Date.now() - pageStartTime.current
        const maxScrollDepth = Math.max(...Array.from(scrollDepthTracked.current), 0)
        const engagementScore = calculateEngagementScore(timeOnPage, maxScrollDepth / 100, interactions)
        
        trackDeviceEngagement(getDeviceType(), engagementScore, {
          time_on_page_ms: timeOnPage,
          max_scroll_depth: maxScrollDepth,
          total_interactions: interactions,
          page: 'homepage'
        })

        // Track funnel progress based on engagement
        if (engagementScore >= 30) {
          trackConversionFunnel('interested', engagementScore, {
            page: 'homepage',
            engagement_type: 'high_engagement'
          })
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [interactions])

  // Fixed: Use inline onClick for footer links instead of querySelector
  const handleSocialClick = (platform: string, url: string) => {
    trackCTAClick(`social_${platform}`, 'footer', url)
    bumpInteraction()
  }

  const handleFooterLinkClick = (label: string, url: string) => {
    trackCTAClick(label, 'footer', url)
    bumpInteraction()
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Field Guide Inspired Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-green-200 via-green-100 to-blue-200"></div>

      <main className="relative z-10">
        <section className="py-12 sm:py-20 text-center relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Today's Tidbit with Suspense for better loading */}
            <Suspense fallback={<TodaysTidbitSkeleton />}>
              <TodaysTidbit />
            </Suspense>
          </div>
        </section>

        {/* Updated Quick Links Section - Now using Client Component */}
        <CTASection />

        {/* Footer - Updated with inline onClick handlers */}
        <footer className="relative z-10 bg-gradient-to-br from-gray-200 via-gray-100 to-blue-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
              {/* Left Side - Tagline, Copyright, Email */}
              <div className="space-y-4">
                <p className="text-lg sm:text-xl font-medium text-gray-800">
                  Come for the tips. Stay for the community. ✨
                </p>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h5 className="text-sm font-bold text-gray-800">Get In Touch</h5>
                    <a 
                      href="mailto:mike@dailytidbit.org" 
                      className="text-sm sm:text-base transition-colors duration-200 hover:underline footer-link"
                      onClick={() => handleFooterLinkClick('email_contact', 'mailto:mike@dailytidbit.org')}
                    >
                      mike@dailytidbit.org
                    </a>
                  </div>
                  <p className="text-sm sm:text-base text-gray-700">
                    © {new Date().getFullYear()} Daily Tidbit. All rights reserved.
                  </p>
                </div>
              </div>
              
              {/* Right Side - Legal Links */}
              <div className="text-left md:text-right">
                <div className="space-y-3">
                  <div>
                    <Link 
                      href="/privacy" 
                      className="text-sm sm:text-base transition-colors duration-200 hover:underline footer-link"
                      onClick={() => handleFooterLinkClick('privacy_policy', '/privacy')}
                    >
                      Privacy Policy
                    </Link>
                  </div>
                  <div>
                    <Link 
                      href="/accessibility" 
                      className="text-sm sm:text-base transition-colors duration-200 hover:underline footer-link"
                      onClick={() => handleFooterLinkClick('accessibility_statement', '/accessibility')}
                    >
                      Accessibility Statement
                    </Link>
                  </div>
                  <div>
                    <Link 
                      href="/terms" 
                      className="text-sm sm:text-base transition-colors duration-200 hover:underline footer-link"
                      onClick={() => handleFooterLinkClick('terms_conditions', '/terms')}
                    >
                      Terms & Conditions
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Social Icons - Fixed with inline onClick handlers */}
            <div className="border-t border-gray-300 mt-8 sm:mt-12 pt-6 sm:pt-8">
              <div className="flex justify-center">
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
                  {/* Facebook */}
                  <a 
                    href="https://www.facebook.com/dailytidbit.org" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 social-icon"
                    aria-label="Facebook Community"
                    onClick={() => handleSocialClick('facebook', 'https://www.facebook.com/dailytidbit.org')}
                  >
                    <svg className="w-5 h-5" fill="#374151" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  
                  {/* Instagram */}
                  <a 
                    href="https://www.instagram.com/dailytidbitorg/" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 social-icon"
                    aria-label="Instagram"
                    onClick={() => handleSocialClick('instagram', 'https://www.instagram.com/dailytidbitorg/')}
                  >
                    <svg className="w-5 h-5" fill="#374151" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  
                  {/* YouTube */}
                  <a 
                    href="https://www.youtube.com/@DailyTidbitOrg" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 social-icon"
                    aria-label="YouTube"
                    onClick={() => handleSocialClick('youtube', 'https://www.youtube.com/@DailyTidbitOrg')}
                  >
                    <svg className="w-5 h-5" fill="#374151" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                  
                  {/* TikTok */}
                  <a 
                    href="https://www.tiktok.com/@dailytidbit.org" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 social-icon"
                    aria-label="TikTok"
                    onClick={() => handleSocialClick('tiktok', 'https://www.tiktok.com/@dailytidbit.org')}
                  >
                    <svg className="w-5 h-5" fill="#374151" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                    </svg>
                  </a>
                  
                  {/* Pinterest */}
                  <a 
                    href="https://www.pinterest.com/dailytidbitorg" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 social-icon"
                    aria-label="Pinterest"
                    onClick={() => handleSocialClick('pinterest', 'https://www.pinterest.com/dailytidbitorg')}
                  >
                    <svg className="w-5 h-5" fill="#374151" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.083.402-.09.402-.294 1.116-.334 1.272-.051.201-.402.244-.402.244-.402-.06-2.477-1.647-2.477-3.956 0-4.915 3.568-9.425 10.294-9.425 5.401 0 9.6 3.848 9.6 8.987 0 5.36-3.38 9.674-8.069 9.674-1.574 0-3.056-.818-3.56-1.797l-.969 3.691c-.351 1.35-1.302 3.04-1.939 4.078C8.69 23.81 10.316 24.029 12.017 24.029c6.624 0 11.99-5.367 11.90-11.987C24.007 5.367 18.641.001 12.017.001z"/>
                    </svg>
                  </a>
                  
                  {/* Twitter */}
                  <a 
                    href="https://x.com/dailytidbitorg" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 social-icon"
                    aria-label="Twitter"
                    onClick={() => handleSocialClick('twitter', 'https://x.com/dailytidbitorg')}
                  >
                    <svg className="w-5 h-5" fill="#374151" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}