'use client'

import React, { useState, useEffect, useMemo, Suspense } from 'react'
import { Clock, Star, Tag, Play, Users, ArrowRight, CheckCircle, Lightbulb, Target, Camera, Share2, Trophy, Loader2 } from 'lucide-react'
import TidbitTutor from '../../components/TidbitTutor'
import RotatingWord from '../../components/RotatingWord'
import TryOtherAITools from '../../components/TryOtherAITools'
import { getSupabaseBrowserClient } from '../../lib/supabaseClient'
import { analytics, useAnalytics, logEvent } from '../../lib/analytics'

interface TidbitStep {
  id: string
  tidbit_day: number
  step_number: number
  icon?: string
  title: string
  content: string
  created_at: string
}

interface DayPageProps {
  params: Promise<{ day: string }>
}

interface TutorConversation {
  userInput: string
  aiOutput: string
  timestamp: Date
}

interface UserProgress {
  viewedAt?: string
  completedAt?: string
  practicedWithAI?: boolean
}

// Error Boundary Components
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ComponentType<{ error?: Error }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (typeof window !== 'undefined' && analytics) {
      analytics.trackEvent({
        event_type: 'react_error_boundary',
        event_data: {
          error_message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack
        }
      })
    }
  }

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback
      return <Fallback error={this.state.error} />
    }

    return this.props.children
  }
}

const StepsErrorFallback = ({ error }: { error?: Error }) => (
  <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
    <div className="text-red-600 mb-4">
      <Target className="w-12 h-12 mx-auto mb-4" />
      <h3 className="heading-subsection">Steps temporarily unavailable</h3>
      <p className="body-small mt-2">We're working on loading the walkthrough steps.</p>
      <button 
        onClick={() => typeof window !== 'undefined' && window.location.reload()} 
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
      >
        Try Again
      </button>
    </div>
  </div>
)

const VideoErrorFallback = ({ error }: { error?: Error }) => (
  <div className="bg-gray-100 rounded-2xl p-8 text-center">
    <Play className="w-16 h-16 mx-auto mb-4 text-gray-400" />
    <p className="body-medium text-gray-600">Video temporarily unavailable</p>
  </div>
)

const TutorErrorFallback = ({ error }: { error?: Error }) => (
  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center">
    <div className="text-blue-600 mb-4">
      <Lightbulb className="w-12 h-12 mx-auto mb-4" />
      <h3 className="heading-subsection">AI Tutor temporarily unavailable</h3>
      <p className="body-small mt-2">You can still complete the walkthrough above!</p>
    </div>
  </div>
)

// Loading Skeletons
const StepsLoadingSkeleton = () => (
  <div className="space-y-8">
    {[1, 2, 3].map(i => (
      <div key={i} className="bg-white/50 rounded-2xl p-8 animate-pulse">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gray-200 rounded-2xl"></div>
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
)

// Social Sharing Component - HYDRATION SAFE + BRAND COLORS
const SocialShare = ({ tidbit }: { tidbit: any }) => {
  const [mounted, setMounted] = useState(false)
  const { analytics: analyticsInstance } = useAnalytics()
  
  useEffect(() => {
    setMounted(true)
  }, [])

  // HYDRATION SAFE: Only available after mounting
  const shareUrl = mounted && typeof window !== 'undefined' ? window.location.href : ''
  const shareText = `Check out Day ${tidbit.day_number}: ${tidbit.title} on Daily Tidbit!`

  const shareOptions = [
    {
      name: 'Instagram',
      url: `https://www.instagram.com/`,
      color: 'bg-[#C13584] hover:bg-[#A02B6B] border border-[#C13584]/20',
      logo: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      )
    },
    {
      name: 'TikTok',
      url: `https://www.tiktok.com/`,
      color: 'bg-black hover:bg-gray-900 border border-pink-400 text-white',
      logo: (
        <svg className="w-4 h-4" fill="white" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-.88-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.04-.1z"/>
        </svg>
      )
    },
    {
      name: 'Facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      color: 'bg-[#1877F2] hover:bg-[#166FE5] border border-[#1877F2]/20',
      logo: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    }
  ]

  // HYDRATION SAFE: Fixed clipboard access pattern
  const copyToClipboard = async () => {
    if (!mounted || typeof window === 'undefined' || !window.navigator?.clipboard) {
      alert('Clipboard not available')
      return
    }

    try {
      await window.navigator.clipboard.writeText(shareUrl)
      if (analyticsInstance) {
        await analyticsInstance.trackEvent({
          event_type: 'user_engagement',
          event_data: {
            engagement_type: 'click',
            target: 'copy_link_button',
            tidbit_number: tidbit.day_number
          }
        })
      }
      alert('Link copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
      alert('Failed to copy link')
    }
  }

  const handleSocialShare = async (platform: string, url: string) => {
    // HYDRATION SAFE: Window access
    if (!mounted || typeof window === 'undefined') return
    
    if (analyticsInstance) {
      await analyticsInstance.trackEvent({
        event_type: 'user_engagement',
        event_data: {
          engagement_type: 'click',
          target: `share_${platform.toLowerCase()}_button`,
          tidbit_number: tidbit.day_number,
          platform: platform.toLowerCase()
        }
      })
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Show loading state until mounted
  if (!mounted) {
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 border border-emerald-200/50 shadow-lg">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-brand-green" />
          <p className="body-medium text-gray-600 mt-4">Loading sharing options...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 border border-emerald-200/50 shadow-lg">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-brand-green to-brand-blue text-white shadow-lg">
            <Share2 className="w-6 h-6" />
          </div>
        </div>
        
        <h3 className="heading-subsection text-gray-900 mb-2">
          Send this <RotatingWord /> to a friend!
        </h3>
        
        <p className="body-large text-gray-700">
          Let's grow this community! 🌱
        </p>
        <p className="body-medium text-gray-600 mt-2">
          Share this AI tip and help others learn something new today
        </p>
      </div>
      
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {shareOptions.map(option => (
          <button
            key={option.name}
            onClick={() => handleSocialShare(option.name, option.url)}
            className={`flex items-center gap-2 px-4 py-3 ${option.color} rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg body-bold shadow-md border border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2`}
            title={`Share on ${option.name}`}
          >
            {option.logo}
            <span className="hidden sm:inline">
              {option.name}
            </span>
          </button>
        ))}
        
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 px-4 py-3 bg-brand-green hover:bg-brand-greenDark text-white rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg body-bold shadow-md border border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2"
          title="Copy link"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span className="hidden sm:inline">Copy Link</span>
        </button>
      </div>
    </div>
  )
}

// Enhanced Video Component - HYDRATION SAFE + BRAND COLORS
const EnhancedVideo = ({ tidbit }: { tidbit: any }) => {
  const [mounted, setMounted] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const { analytics: analyticsInstance } = useAnalytics()
  
  // ✅ HYDRATION SAFE: Timestamp generation only after mount
  const [analyticsTimestamp, setAnalyticsTimestamp] = useState<number>(0)

  useEffect(() => {
    setMounted(true)
    // ✅ HYDRATION SAFE: Generate timestamp after mount for analytics
    setAnalyticsTimestamp(Date.now())
  }, [])

  const handleVideoLoad = () => {
    setVideoLoaded(true)
  }

  const handleVideoError = () => {
    setVideoError(true)
    if (mounted && analyticsInstance) {
      analyticsInstance.trackEvent({
        event_type: 'video_error',
        event_data: {
          error_type: 'video_load_error',
          video_id: `tidbit_${tidbit.day_number}_video`,
          tidbit_number: tidbit.day_number
        }
      })
    }
  }

  const handlePlay = async () => {
    setIsPlaying(true)
    // ✅ HYDRATION SAFE: Only use timestamp after it's been set
    if (mounted && analyticsInstance && analyticsTimestamp > 0) {
      await analyticsInstance.trackVideoInteraction({
        video_id: `tidbit_${tidbit.day_number}_video`,
        action: 'play',
        timestamp: analyticsTimestamp, // Use pre-generated timestamp
        duration: 0
      })
    }
  }

  const handlePause = async () => {
    setIsPlaying(false)
    // ✅ HYDRATION SAFE: Only use timestamp after it's been set
    if (mounted && analyticsInstance && analyticsTimestamp > 0) {
      await analyticsInstance.trackVideoInteraction({
        video_id: `tidbit_${tidbit.day_number}_video`,
        action: 'pause',
        timestamp: Date.now() // This is fine as it's in a user interaction handler
      })
    }
  }

  if (!mounted) {
    return (
      <div className="max-w-3xl mx-auto mb-8">
        <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
          <div className="aspect-video flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        </div>
      </div>
    )
  }

  if (videoError) {
    return <VideoErrorFallback />
  }

  return (
    <div className="max-w-3xl mx-auto mb-8">
      <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
        {!videoLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <Loader2 className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="body-medium">Loading video...</p>
            </div>
          </div>
        )}
        <video 
          controls 
          className="w-full"
          poster={tidbit.image_url}
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
          onPlay={handlePlay}
          onPause={handlePause}
          preload="metadata"
          style={{ display: videoLoaded ? 'block' : 'none' }}
        >
          <source src={tidbit.video_url} type="video/mp4" />
          <track kind="captions" src={`${tidbit.video_url}.vtt`} srcLang="en" label="English" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  )
}

// Progress Analytics Component - HYDRATION SAFE + BRAND COLORS
const ProgressAnalytics = ({ progress }: { progress: UserProgress }) => {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="bg-gradient-to-r from-brand-green/10 to-brand-blue/10 rounded-xl p-6 border border-brand-green/20 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const hasViewed = !!progress.viewedAt
  const hasCompleted = !!progress.completedAt
  const hasPracticedAI = !!progress.practicedWithAI
  
  return (
    <div className="bg-gradient-to-r from-brand-green/10 to-brand-blue/10 rounded-xl p-6 border border-brand-green/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-brand-green" />
          <h4 className="heading-subsection text-gray-900">Your Progress</h4>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-center body-small">
        <div>
          <div className="body-bold text-brand-green">{hasViewed ? '✅' : '⏳'}</div>
          <div className="text-gray-600">Viewed</div>
        </div>
        <div>
          <div className="body-bold text-brand-blue">{hasPracticedAI ? '✅' : '⏳'}</div>
          <div className="text-gray-600">AI Practice</div>
        </div>
        <div>
          <div className="body-bold text-purple-600">{hasCompleted ? '✅' : '⏳'}</div>
          <div className="text-gray-600">Posted</div>
        </div>
      </div>
    </div>
  )
}

export default function DayPage({ params }: DayPageProps) {
  // CRITICAL: Mount guard for hydration safety
  const [mounted, setMounted] = useState(false)
  const { analytics: analyticsInstance } = useAnalytics()
  
  // Component state
  const [resolvedParams, setResolvedParams] = useState<{ day: string } | null>(null)
  const [tidbit, setTidbit] = useState<any>(null)
  const [tidbitSteps, setTidbitSteps] = useState<TidbitStep[]>([])
  const [loading, setLoading] = useState(true)
  const [stepsLoading, setStepsLoading] = useState(false)
  const [progressLoading, setProgressLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [latestConversation, setLatestConversation] = useState<TutorConversation | null>(null)
  const [user, setUser] = useState<any>(null)
  const [userProgress, setUserProgress] = useState<UserProgress>({})
  
  // ✅ HYDRATION SAFE: Analytics timestamp generated only after mount
  const [conversationIdTimestamp, setConversationIdTimestamp] = useState<number>(0)

  // Initialize mounted state
  useEffect(() => {
    setMounted(true)
    // ✅ HYDRATION SAFE: Generate timestamp for conversation IDs after mount
    setConversationIdTimestamp(Date.now())
  }, [])

  // Memoized processed steps
  const processedSteps = useMemo(() => 
    tidbitSteps.map(step => ({
      ...step,
      processedContent: step.content
    })), [tidbitSteps]
  )

  // Enhanced progress tracking - HYDRATION SAFE: Fixed Supabase null handling
  const markTidbitViewed = async (tidbitNumber: number) => {
    if (!mounted || !user) return

    setProgressLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      
      // CRITICAL FIX: Handle null supabase client
      if (!supabase) {
        console.warn('Supabase client not available')
        return
      }
      
      const { error } = await supabase
        .from('user_tidbit_progress')
        .upsert({
          user_id: user.id,
          tidbit_number: tidbitNumber,
          viewed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,tidbit_number'
        })

      if (error) {
        console.error('Error marking tidbit viewed:', error)
      } else {
        setUserProgress(prev => ({ ...prev, viewedAt: new Date().toISOString() }))
        if (mounted && analyticsInstance) {
          await analyticsInstance.trackTidbitViewed(tidbitNumber)
        }
      }
    } catch (error) {
      console.error('Error updating progress:', error)
    } finally {
      setProgressLoading(false)
    }
  }

  const markTutorUsed = async (tidbitNumber: number) => {
    if (!mounted || !user) return

    try {
      const supabase = getSupabaseBrowserClient()
      
      // CRITICAL FIX: Handle null supabase client
      if (!supabase) {
        console.warn('Supabase client not available')
        return
      }
      
      const { error } = await supabase
        .from('user_tidbit_progress')
        .upsert({
          user_id: user.id,
          tidbit_number: tidbitNumber,
          tutor_used_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,tidbit_number'
        })

      if (error) {
        console.error('Error marking tutor used:', error)
      } else {
        setUserProgress(prev => ({ ...prev, practicedWithAI: true }))
        // ✅ HYDRATION SAFE: Only use timestamp after it's been set
        if (mounted && analyticsInstance && conversationIdTimestamp > 0) {
          await analyticsInstance.trackAIPracticed(tidbitNumber, {
            conversation_id: `conv_${conversationIdTimestamp}`, // Use pre-generated timestamp
            message_count: 1,
            session_duration: 0,
            topics_discussed: [tidbit?.title || 'AI Practice']
          })
        }
      }
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  // Load user progress - HYDRATION SAFE: Fixed Supabase null handling
  const loadUserProgress = async (userId: string, tidbitNumber: number) => {
    if (!mounted) return
    
    try {
      const supabase = getSupabaseBrowserClient()
      
      // CRITICAL FIX: Handle null supabase client
      if (!supabase) {
        console.warn('Supabase client not available')
        return
      }
      
      const { data: tidbitProgress } = await supabase
        .from('user_tidbit_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('tidbit_number', tidbitNumber)
        .single()

      setUserProgress({
        viewedAt: tidbitProgress?.viewed_at,
        completedAt: tidbitProgress?.posted_at,
        practicedWithAI: !!tidbitProgress?.tutor_used_at
      })
    } catch (error) {
      console.error('Error loading user progress:', error)
    }
  }

  // Simple progress refresh function
  const refreshUserProgress = async () => {
    if (mounted && user && tidbit) {
      await loadUserProgress(user.id, tidbit.day_number)
    }
  }

  // Enhanced conversation handler
  const handleConversationUpdate = async (userInput: string, aiOutput: string) => {
    if (!mounted) return
    
    setLatestConversation({
      userInput,
      aiOutput,
      timestamp: new Date()
    })
    
    // Track tutor usage (second step)
    if (user && tidbit) {
      await markTutorUsed(tidbit.day_number)
    }
    
    // If this is a progress update, refresh the progress
    if (userInput === 'PROGRESS_UPDATE') {
      await refreshUserProgress()
    }
  }

  // Resolve params and fetch data - HYDRATION SAFE: Only after mounting
  useEffect(() => {
    if (!mounted) return

    async function fetchData() {
      try {
        const resolvedParams = await params
        setResolvedParams(resolvedParams)
        
        const { day } = resolvedParams
        console.log('Day param:', day)

        // CRITICAL FIX: Handle null supabase client
        const supabase = getSupabaseBrowserClient()
        if (!supabase) {
          setError('Database connection unavailable')
          setLoading(false)
          return
        }
        
        // Fetch main tidbit data
        const { data, error } = await supabase
          .from('tidbits')
          .select('*')
          .eq('day_number', Number(day))
          .single()

        if (error || !data) {
          setError(error?.message || 'Tidbit not found')
          setLoading(false)
          return
        }

        // Fetch tidbit steps
        setStepsLoading(true)
        const { data: stepsData, error: stepsError } = await supabase
          .from('tidbit_steps')
          .select('*')
          .eq('tidbit_day', Number(day))
          .order('step_number', { ascending: true })

        if (stepsError) {
          console.error('Error fetching steps:', stepsError)
        } else {
          setTidbitSteps(stepsData || [])
        }
        setStepsLoading(false)

        const processedTidbit = {
          ...data,
          day_number: Number(day),
          tags: data.tags || [],
          difficulty_level: data.difficulty_level || 1,
          estimated_time: data.estimated_time || 5,
          seo_description: data.seo_description || data.title
        }

        setTidbit(processedTidbit)
      } catch (err) {
        setError('Failed to load tidbit')
        console.error(err)
        if (mounted && analyticsInstance) {
          await analyticsInstance.trackEvent({
            event_type: 'tidbit_fetch_error',
            event_data: {
              error_message: String(err),
              attempted_day: resolvedParams?.day
            }
          })
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [mounted, params, analyticsInstance])

  // Check for user auth and load progress - HYDRATION SAFE: Only after mounting and tidbit loaded
  useEffect(() => {
    if (!mounted || !tidbit) return
    
    const initializeUser = async () => {
      const supabase = getSupabaseBrowserClient()
      
      // CRITICAL FIX: Handle null supabase client
      if (!supabase) {
        console.warn('Supabase client not available for user initialization')
        return
      }
      
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        await loadUserProgress(user.id, tidbit.day_number)
        await markTidbitViewed(tidbit.day_number)
      }
    }
    
    initializeUser()
  }, [mounted, tidbit])

  // HYDRATION SAFETY: Show loading until mounted AND data loaded
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50/30 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 w-8 text-brand-green animate-spin mx-auto mb-4" />
          <p className="body-medium text-gray-600">Loading tidbit...</p>
        </div>
      </div>
    )
  }

  if (error || !tidbit) {
    return (
      <div className="p-8 text-red-600 text-center">
        <h1 className="heading-section">Day {resolvedParams?.day} not found</h1>
        <p className="body-medium">{error}</p>
        <button 
          onClick={() => {
            if (mounted && typeof window !== 'undefined') {
              window.location.href = '/'
            }
          }}
          className="mt-4 px-6 py-2 bg-brand-green text-white rounded-lg hover:bg-brand-greenDark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2"
        >
          Back to Home
        </button>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-200 via-emerald-100 to-cyan-200">
      {/* Hero Section */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-emerald-100">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Video as Hero */}
          {tidbit.video_url && (
            <ErrorBoundary fallback={VideoErrorFallback}>
              <EnhancedVideo tidbit={tidbit} />
            </ErrorBoundary>
          )}

          {/* Title */}
          <div className="text-center">
            <h1 className="heading-hero text-gray-900 max-w-2xl mx-auto mb-6">
              {tidbit.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-12">
          
          {/* Progress Analytics (for logged-in users only) */}
          {mounted && user && (
            <ProgressAnalytics progress={userProgress} />
          )}

          {/* What You'll Learn & What You Need - Combined White Box with BRAND COLORS */}
          <section className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 border border-emerald-200/50 shadow-lg">
            <div className="space-y-8">
              {/* What You'll Learn */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-brand-blue text-white">
                    <Lightbulb className="w-6 h-6" />
                  </div>
                  <h3 className="heading-subsection text-gray-900">
                    What You'll Learn
                  </h3>
                </div>
                <RichContent>{tidbit.walkthrough_intro}</RichContent>
              </div>

              {/* What You Need */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-brand-green text-white">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h3 className="heading-subsection text-gray-900">
                    What You Need
                  </h3>
                </div>
                <RichContent>{tidbit.what_you_need}</RichContent>
              </div>
            </div>
          </section>

          {/* Timeline Walkthrough Steps with BRAND COLORS */}
          <section className="sm:bg-white/95 sm:backdrop-blur-sm sm:rounded-2xl sm:p-6 lg:p-8 sm:border sm:border-emerald-200/50 sm:shadow-lg overflow-hidden relative">
            <ErrorBoundary fallback={StepsErrorFallback}>
              <Suspense fallback={<StepsLoadingSkeleton />}>
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-8 sm:mb-10 px-4 sm:px-0">
                    <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-brand-green to-brand-blue text-white shadow-lg">
                      <Target className="w-5 h-5 sm:w-7 sm:h-7" />
                    </div>
                    <div>
                      <h3 className="heading-section bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        Day {tidbit.day_number}'s Walkthrough Steps
                      </h3>
                    </div>
                  </div>

                  {stepsLoading ? (
                    <StepsLoadingSkeleton />
                  ) : (
                    <div className="relative space-y-4 sm:space-y-8 mb-12">
                      {processedSteps.map((step, index) => (
                        <div key={step.id} className="relative group">
                          {/* Step Number Badge with BRAND COLORS */}
                          <div className={`
                            absolute top-2 left-2 sm:-left-6 sm:top-1/2 sm:-translate-y-1/2 flex items-center justify-center 
                            w-10 h-10 sm:w-20 sm:h-20 
                            ${index % 2 === 0 
                              ? 'bg-brand-green' 
                              : 'bg-brand-blue'
                            }
                            text-white rounded-lg sm:rounded-xl lg:rounded-2xl font-bold text-base sm:text-2xl 
                            shadow-lg sm:shadow-2xl border-2 sm:border-4 border-white
                            transform transition-transform duration-300 group-hover:scale-105 group-hover:rotate-1
                            z-20
                          `}>
                            {step.step_number}
                          </div>

                          {/* Step Card */}
                          <div className={`
                            ${index % 2 === 0 
                              ? 'bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 sm:border-purple-200/50' 
                              : 'bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/30 sm:border-blue-200/50'
                            } 
                            rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 
                            border-0 sm:border-2 shadow-sm sm:shadow-lg hover:shadow-xl sm:hover:shadow-2xl 
                            transition-all duration-300
                            mx-0 sm:ml-16 transform
                            ${index % 2 === 0 ? 'sm:hover:border-purple-300' : 'sm:hover:border-blue-300'}
                            hover:bg-opacity-90
                          `}>
                            {/* Step Content */}
                            <div className="pl-12 sm:pl-0">
                              <div className="relative mb-4 sm:mb-6">
                                {/* Large Background Icon */}
                                {step.icon && (
                                  <div className={`
                                    absolute -top-2 -right-2 sm:-top-4 sm:-right-4 text-6xl sm:text-8xl lg:text-9xl opacity-10
                                    ${index % 2 === 0 ? 'text-purple-400' : 'text-blue-400'}
                                    pointer-events-none select-none
                                  `}>
                                    {step.icon}
                                  </div>
                                )}
                                
                                {/* Title and Content */}
                                <div className="relative z-10">
                                  <h4 className={`
                                    heading-subsection leading-tight mb-4 sm:mb-3
                                    ${index % 2 === 0 
                                      ? 'bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent' 
                                      : 'bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent'
                                    }
                                  `}>
                                    {step.title}
                                  </h4>
                                  
                                  <div className="body-medium text-gray-700">
                                    <RichContent>{step.content}</RichContent>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Suspense>
            </ErrorBoundary>
          </section>

          {/* Tidbit Tutor Section */}
          <section className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 border border-emerald-200/50 shadow-lg">
            <ErrorBoundary fallback={TutorErrorFallback}>
              <TidbitTutor 
                tidbitNumber={tidbit.day_number}
                tidbitTitle={tidbit.title}
                onConversationUpdate={handleConversationUpdate}
                embedded={true}
              />
            </ErrorBoundary>
          </section>

          {/* Try Other AI Tools Component */}
          <TryOtherAITools />

          {/* Social Sharing Section */}
          <SocialShare tidbit={tidbit} />

        </div>
      </div>
    </main>
  )
}

// Rich Content Component - keeping original functionality with BRAND COLORS
function RichContent({ children }: { children: string }) {
  // Clean up content - handle \r\n, multiple spaces, etc.
  const cleanContent = children
    .replace(/\\r\\n/g, '\n') // Convert escaped \r\n to actual newlines
    .replace(/\r\n/g, '\n')   // Convert actual \r\n to \n
    .replace(/\r/g, '\n')     // Convert lone \r to \n
    .trim()

  const lines = cleanContent.split('\n')
  const elements: React.ReactElement[] = []
  let listBuffer: string[] = []

  const flushList = (keyPrefix: string) => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`ul-${keyPrefix}`} className="list-none space-y-3 ml-0 my-6">
          {listBuffer.map((item, i) => (
            <li key={`li-${keyPrefix}-${i}`} className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-brand-green flex-shrink-0 mt-0.5" />
              <span className="body-large text-gray-700">{parseInlineFormatting(item)}</span>
            </li>
          ))}
        </ul>
      )
      listBuffer = []
    }
  }

  // Parse inline formatting like **bold**, *italic*, <br> tags, and links
  const parseInlineFormatting = (text: string): React.ReactElement => {
    // First, split by <br> tags to handle line breaks
    const brParts = text.split('<br>')
    
    return (
      <>
        {brParts.map((brPart, brIndex) => (
          <React.Fragment key={brIndex}>
            {brIndex > 0 && <br />}
            {(() => {
              // Now handle other formatting within each part
              const parts = brPart.split(/(\*\*.*?\*\*|\*.*?\*|https?:\/\/[^\s]+)/g)
              
              return parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
                } else if (part.startsWith('*') && part.endsWith('*')) {
                  return <em key={i} className="italic">{part.slice(1, -1)}</em>
                } else if (part.startsWith('http')) {
                  return (
                    <a key={i} href={part} target="_blank" rel="noopener noreferrer" 
                       className="text-brand-blue hover:text-brand-blueDark underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2">
                      {part}
                    </a>
                  )
                }
                return <span key={i}>{part}</span>
              })
            })()}
          </React.Fragment>
        ))}
      </>
    )
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim()

    // Handle list items
    if (trimmed.startsWith('- ')) {
      listBuffer.push(trimmed.slice(2))
      return
    }

    // Flush any pending list before processing other content
    flushList(`line-${i}`)

    // Empty lines create spacing
    if (trimmed === '') {
      elements.push(<div key={`space-${i}`} className="h-4" />)
      return
    }

    // Regular paragraphs
    elements.push(
      <p key={`p-${i}`} className="body-large text-gray-700 my-4">
        {parseInlineFormatting(line)}
      </p>
    )
  })

  // Flush any remaining list items
  flushList('final')

  return <div className="space-y-2">{elements}</div>
}