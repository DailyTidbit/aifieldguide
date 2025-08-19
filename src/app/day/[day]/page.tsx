'use client'

import React, { useState, useEffect, useMemo, Suspense } from 'react'
import { Clock, Star, Tag, Play, Users, ArrowRight, CheckCircle, Lightbulb, Target, Camera, Share2, Trophy } from 'lucide-react'
import { Metadata } from 'next'
import TidbitTutor from '../../components/TidbitTutor'
import RotatingWord from '../../components/RotatingWord'
import TryOtherAITools from '../../components/TryOtherAITools'
import { supabase } from '../../lib/supabaseClient'
import { enhancedAnalytics } from '../../lib/enhancedAnalytics'

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
    // Track error with enhanced analytics
    enhancedAnalytics.trackError('react_error_boundary', error.message, {
      stack: error.stack,
      componentStack: errorInfo.componentStack
    })
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
      <h3 className="text-xl font-bold">Steps temporarily unavailable</h3>
      <p className="text-sm mt-2">We're working on loading the walkthrough steps.</p>
      <button 
        onClick={() => window.location.reload()} 
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
)

const VideoErrorFallback = ({ error }: { error?: Error }) => (
  <div className="bg-gray-100 rounded-2xl p-8 text-center">
    <Play className="w-16 h-16 mx-auto mb-4 text-gray-400" />
    <p className="text-gray-600">Video temporarily unavailable</p>
  </div>
)

const TutorErrorFallback = ({ error }: { error?: Error }) => (
  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center">
    <div className="text-blue-600 mb-4">
      <Lightbulb className="w-12 h-12 mx-auto mb-4" />
      <h3 className="text-xl font-bold">AI Tutor temporarily unavailable</h3>
      <p className="text-sm mt-2">You can still complete the walkthrough above!</p>
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

// Social Sharing Component
const SocialShare = ({ tidbit }: { tidbit: any }) => {
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareText = `Check out Day ${tidbit.day_number}: ${tidbit.title} on Daily Tidbit!`

  const shareOptions = [
    {
      name: 'Instagram',
      url: `https://www.instagram.com/`, // Instagram doesn't have direct URL sharing, opens Instagram
      color: 'bg-[#C13584] hover:bg-[#A02B6B] border border-[#C13584]/20',
      logo: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      )
    },
    {
      name: 'TikTok',
      url: `https://www.tiktok.com/`, // TikTok doesn't have direct URL sharing, opens TikTok
      color: 'bg-black hover:bg-gray-900 border border-pink-400',
      textColor: '!text-white hover:!text-white',
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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      // Track sharing action
      enhancedAnalytics.trackUserEngagement('click', 'copy_link_button')
      alert('Link copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleSocialShare = (platform: string, url: string) => {
    // Track social sharing
    enhancedAnalytics.trackUserEngagement('click', `share_${platform.toLowerCase()}_button`)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 border border-emerald-200/50 shadow-lg">
      {/* Header Section */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#60A875] to-[#59B1E3] text-white shadow-lg">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900" style={{fontFamily: "'Playfair Display', serif"}}>
              Send to a Friend!
            </h3>
          </div>
        </div>
        <p className="text-lg text-gray-700 font-medium">
          Let's grow this community! 🌱
        </p>
        <p className="text-gray-600 mt-2">
          Share this AI tip and help others learn something new today
        </p>
      </div>
      
      {/* Social Buttons */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {shareOptions.map(option => (
          <button
            key={option.name}
            onClick={() => handleSocialShare(option.name, option.url)}
            className={`flex items-center gap-2 px-4 py-3 ${option.color} text-white rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg font-medium shadow-md border border-white/20`}
            title={`Share on ${option.name}`}
          >
            {option.logo}
            <span className="hidden sm:inline">{option.name}</span>
          </button>
        ))}
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#60A875] to-[#59B1E3] hover:from-[#60A875]/90 hover:to-[#59B1E3]/90 text-white rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg font-medium shadow-md border border-white/20"
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

// Enhanced Video Component
const EnhancedVideo = ({ tidbit }: { tidbit: any }) => {
  const [videoError, setVideoError] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const handleVideoLoad = () => {
    setVideoLoaded(true)
  }

  const handleVideoError = () => {
    setVideoError(true)
    enhancedAnalytics.trackError('video_load_error', `Failed to load video for tidbit ${tidbit.day_number}`)
  }

  const handlePlay = () => {
    setIsPlaying(true)
    // Analytics tracking using enhanced system
    enhancedAnalytics.trackVideoInteraction({
      video_id: `tidbit_${tidbit.day_number}_video`,
      action: 'play',
      timestamp: Date.now(),
      duration: 0 // Could be tracked from video element
    })
  }

  const handlePause = () => {
    setIsPlaying(false)
    enhancedAnalytics.trackVideoInteraction({
      video_id: `tidbit_${tidbit.day_number}_video`,
      action: 'pause',
      timestamp: Date.now()
    })
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
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading video...</p>
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

// Progress Analytics Component (Simplified)
const ProgressAnalytics = ({ progress }: { progress: UserProgress }) => {
  const hasViewed = !!progress.viewedAt
  const hasCompleted = !!progress.completedAt
  const hasPracticedAI = !!progress.practicedWithAI
  
  return (
    <div className="bg-gradient-to-r from-[#60A875]/10 to-[#59B1E3]/10 rounded-xl p-6 border border-[#60A875]/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-[#60A875]" />
          <h4 className="text-lg font-bold text-gray-900">Your Progress</h4>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-center text-sm">
        <div>
          <div className="font-bold text-[#60A875]">{hasViewed ? '✅' : '⏳'}</div>
          <div className="text-gray-600">Viewed</div>
        </div>
        <div>
          <div className="font-bold text-[#59B1E3]">{hasCompleted ? '✅' : '⏳'}</div>
          <div className="text-gray-600">Completed</div>
        </div>
        <div>
          <div className="font-bold text-purple-600">{hasPracticedAI ? '✅' : '⏳'}</div>
          <div className="text-gray-600">AI Practice</div>
        </div>
      </div>
    </div>
  )
}

export default function DayPage({ params }: DayPageProps) {
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

  // Memoized processed steps (no completion tracking needed)
  const processedSteps = useMemo(() => 
    tidbitSteps.map(step => ({
      ...step,
      processedContent: step.content
    })), [tidbitSteps]
  )

  // Simplified progress tracking - only track tidbit views
  const markTidbitViewed = async (tidbitNumber: number) => {
    if (!user) return

    setProgressLoading(true)
    try {
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
        // Analytics tracking using your existing system + enhanced tracking
        enhancedAnalytics.trackTidbitViewed(tidbitNumber)
      }
    } catch (error) {
      console.error('Error updating progress:', error)
    } finally {
      setProgressLoading(false)
    }
  }

  const markTidbitCompleted = async (tidbitNumber: number) => {
    if (!user) return

    setProgressLoading(true)
    try {
      const { error } = await supabase
        .from('user_tidbit_progress')
        .upsert({
          user_id: user.id,
          tidbit_number: tidbitNumber,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,tidbit_number'
        })

      if (error) {
        console.error('Error marking tidbit completed:', error)
      } else {
        setUserProgress(prev => ({ ...prev, completedAt: new Date().toISOString() }))
        
        // Analytics tracking using enhanced system
        enhancedAnalytics.trackTidbitCompleted(
          tidbitNumber, 
          0, // time spent - could be calculated if needed
          0  // no step completion tracking
        )
      }
    } catch (error) {
      console.error('Error updating progress:', error)
    } finally {
      setProgressLoading(false)
    }
  }

  const markAIPracticed = async (tidbitNumber: number) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('user_tidbit_progress')
        .upsert({
          user_id: user.id,
          tidbit_number: tidbitNumber,
          practiced_with_ai: true
        }, {
          onConflict: 'user_id,tidbit_number'
        })

      if (error) {
        console.error('Error marking AI practiced:', error)
      } else {
        setUserProgress(prev => ({ ...prev, practicedWithAI: true }))
        
        // Analytics tracking using enhanced system
        enhancedAnalytics.trackAIPracticed(tidbitNumber, {
          conversation_id: `conv_${Date.now()}`,
          message_count: 1, // Could be tracked more precisely
          session_duration: 0, // Could be calculated
          topics_discussed: [tidbit?.title || 'AI Practice']
        })
      }
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  // Load user progress (simplified - only tidbit level)
  const loadUserProgress = async (userId: string, tidbitNumber: number) => {
    try {
      // Load tidbit progress only
      const { data: tidbitProgress } = await supabase
        .from('user_tidbit_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('tidbit_number', tidbitNumber)
        .single()

      setUserProgress({
        viewedAt: tidbitProgress?.viewed_at,
        completedAt: tidbitProgress?.completed_at,
        practicedWithAI: tidbitProgress?.practiced_with_ai || false
      })
    } catch (error) {
      console.error('Error loading user progress:', error)
    }
  }

  // Resolve params and fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        const resolvedParams = await params
        setResolvedParams(resolvedParams)
        
        const { day } = resolvedParams
        console.log('Day param:', day)

        // Fetch main tidbit data
        const { data, error } = await supabase
          .from('tidbits')
          .select('*')
          .eq('day_number', Number(day))
          .single()

        if (error || !data) {
          setError(error?.message || 'Tidbit not found')
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
        enhancedAnalytics.trackError('tidbit_fetch_error', String(err))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params])

  // Check for user auth and load progress
  useEffect(() => {
    const initializeUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // Load user progress and mark tidbit as viewed
      if (user && tidbit) {
        await loadUserProgress(user.id, tidbit.day_number)
        await markTidbitViewed(tidbit.day_number)
      }
    }
    
    initializeUser()
  }, [tidbit])

  // Handle conversation updates from TidbitTutor
  const handleConversationUpdate = async (userInput: string, aiOutput: string) => {
    setLatestConversation({
      userInput,
      aiOutput,
      timestamp: new Date()
    })

    // Mark AI as practiced when user has a conversation
    if (user && tidbit) {
      await markAIPracticed(tidbit.day_number)
    }
  }

  // Enhanced completion handler
  const handleWalkthroughComplete = async () => {
    if (user && tidbit) {
      await markTidbitCompleted(tidbit.day_number)
      
      // Celebrate completion
      if (typeof window !== 'undefined') {
        console.log('🎉 Tidbit completed!')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50/30 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#60A875] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tidbit...</p>
        </div>
      </div>
    )
  }

  if (error || !tidbit) {
    return (
      <div className="p-8 text-red-600 text-center">
        <h1 className="text-2xl font-bold">Day {resolvedParams?.day} not found</h1>
        <p>{error}</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="mt-4 px-6 py-2 bg-[#60A875] text-white rounded-lg hover:bg-[#60A875]/90 transition-colors"
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
            <h1 className="text-3xl font-bold text-gray-900 max-w-2xl mx-auto leading-tight mb-6" style={{fontFamily: "'Playfair Display', serif"}}>
              {tidbit.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-12">
          
          {/* Progress Analytics (for logged-in users) */}
          {user && (
            <ProgressAnalytics progress={userProgress} />
          )}

          {/* What You'll Learn & What You Need - Combined White Box */}
          <section className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 border border-emerald-200/50 shadow-lg">
            <div className="space-y-8">
              {/* What You'll Learn */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-[#59B1E3] text-white">
                    <Lightbulb className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900" style={{fontFamily: "'Playfair Display', serif"}}>
                    What You'll Learn
                  </h3>
                </div>
                <RichContent>{tidbit.walkthrough_intro}</RichContent>
              </div>

              {/* What You Need */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-[#60A875] text-white">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900" style={{fontFamily: "'Playfair Display', serif"}}>
                    What You Need
                  </h3>
                </div>
                <RichContent>{tidbit.what_you_need}</RichContent>
              </div>
            </div>
          </section>

          {/* Timeline Walkthrough Steps - FIXED VERSION */}
          <section className="sm:bg-white/95 sm:backdrop-blur-sm sm:rounded-2xl sm:p-6 lg:p-8 sm:border sm:border-emerald-200/50 sm:shadow-lg overflow-hidden relative">
            <ErrorBoundary fallback={StepsErrorFallback}>
              <Suspense fallback={<StepsLoadingSkeleton />}>
                {/* Decorative Background Elements - Hidden on mobile */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl hidden sm:block"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 rounded-full blur-xl hidden sm:block"></div>
                
                <div className="relative z-10">
                  {/* Header - Different styling for mobile */}
                  <div className="flex items-center gap-3 mb-8 sm:mb-10 px-4 sm:px-0">
                    <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#60A875] to-[#59B1E3] text-white shadow-lg">
                      <Target className="w-5 h-5 sm:w-7 sm:h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent" style={{fontFamily: "'Playfair Display', serif"}}>
                        Day {tidbit.day_number}'s Walkthrough Steps
                      </h3>
                    </div>
                  </div>

                  {stepsLoading ? (
                    <StepsLoadingSkeleton />
                  ) : (
                    <>
                      {/* Timeline Steps - FIXED: Mobile-First Responsive Design */}
                      <div className="relative space-y-4 sm:space-y-8 mb-12">
                        {/* Animated Timeline Line - Hidden on mobile, repositioned for desktop */}
                        <div className="absolute left-12 top-12 bottom-12 w-1 bg-gradient-to-b from-purple-400 via-pink-400 to-indigo-400 hidden sm:block rounded-full shadow-sm">
                          <div className="absolute inset-0 bg-gradient-to-b from-purple-300 via-pink-300 to-indigo-300 rounded-full animate-pulse opacity-60"></div>
                        </div>
                        
                        {processedSteps.map((step, index) => (
                          <div key={step.id} className="relative group">
                            {/* Step Number Badge - FIXED: Positioned for mobile top-left, desktop on timeline */}
                            <div className={`
                              absolute top-2 left-2 sm:-left-12 sm:top-1/2 sm:-translate-y-1/2 flex items-center justify-center 
                              w-10 h-10 sm:w-16 sm:h-16 
                              ${index % 2 === 0 
                                ? 'bg-[#60A875]' 
                                : 'bg-[#59B1E3]'
                              }
                              text-white rounded-lg sm:rounded-xl lg:rounded-2xl font-bold text-base sm:text-xl shadow-lg sm:shadow-2xl border-2 sm:border-4 border-white
                              transform transition-transform duration-300 group-hover:scale-105 group-hover:rotate-1
                              z-20
                            `}>
                              {step.step_number}
                            </div>

                            {/* Step Card - FIXED: Removed scaling hover effect to prevent number cutoff */}
                            <div className={`
                              ${index % 2 === 0 
                                ? 'bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 sm:border-purple-200/50' 
                                : 'bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/30 sm:border-blue-200/50'
                              } 
                              rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 
                              border-0 sm:border-2 shadow-sm sm:shadow-lg hover:shadow-xl sm:hover:shadow-2xl 
                              transition-all duration-300
                              mx-0 sm:ml-24 transform
                              ${index % 2 === 0 ? 'sm:hover:border-purple-300' : 'sm:hover:border-blue-300'}
                              hover:bg-opacity-90
                            `}>
                              {/* Step Content - Title aligned, content flows under */}
                              <div className="pl-2 sm:pl-0">
                                {/* Title Section with Background Icon Only */}
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
                                  
                                  {/* Title aligned with step number */}
                                  <div className="relative z-10">
                                    <h4 className={`
                                      text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold leading-tight mb-4 sm:mb-3
                                      pl-10 sm:pl-0 mt-1 sm:mt-0
                                      ${index % 2 === 0 
                                        ? 'bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent' 
                                        : 'bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent'
                                      }
                                    `} style={{fontFamily: "'Playfair Display', serif"}}>
                                      {step.title}
                                    </h4>
                                    
                                    {/* Content can flow under the step number */}
                                    <div className="text-gray-700 leading-relaxed text-sm sm:text-base lg:text-lg mt-2 sm:mt-0">
                                      <RichContent>{step.content}</RichContent>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                    </>
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

          {/* Social Sharing Section - Moved to Bottom */}
          <SocialShare tidbit={tidbit} />

        </div>
      </div>
    </main>
  )
}

function Section({ 
  title, 
  children, 
  icon, 
  gradient, 
  highlight = false 
}: { 
  title: string
  children: string
  icon: React.ReactElement
  gradient: string
  highlight?: boolean
}) {
  return (
    <section className={`${highlight ? 'bg-white/95 backdrop-blur-sm rounded-2xl p-8 border border-emerald-200/50 shadow-lg' : ''}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg bg-gradient-to-r ${gradient} text-white`}>
          {icon}
        </div>
        <h3 className="text-2xl font-bold text-gray-900" style={{fontFamily: "'Playfair Display', serif"}}>
          {title}
        </h3>
      </div>
      <RichContent>{children}</RichContent>
    </section>
  )
}

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
              <CheckCircle className="w-5 h-5 text-[#60A875] flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 leading-relaxed text-lg">{parseInlineFormatting(item)}</span>
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
                       className="text-[#59B1E3] hover:text-blue-700 underline underline-offset-2">
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

  // Detect numbered circle steps (①②③④⑤⑥⑦⑧⑨⑩)
  const isNumberedStep = (line: string): boolean => {
    return /^[①②③④⑤⑥⑦⑧⑨⑩]/.test(line.trim())
  }

  // Extract step number from circle
  const getStepNumber = (line: string): string => {
    const circles = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩']
    const match = line.trim().match(/^[①②③④⑤⑥⑦⑧⑨⑩]/)
    if (match) {
      const index = circles.indexOf(match[0])
      return (index + 1).toString()
    }
    return '1'
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

    // Handle images
    if (trimmed.startsWith('<img')) {
      const altMatch = trimmed.match(/alt="([^"]*)"/)
      const altText = altMatch ? altMatch[1] : 'Tidbit image'
      
      elements.push(
        <div key={`img-${i}`} className="my-8">
          <div 
            className="rounded-xl overflow-hidden shadow-lg border border-gray-200"
            dangerouslySetInnerHTML={{ __html: trimmed }}
          />
          <p className="text-sm text-gray-500 text-center mt-3 italic">{altText}</p>
        </div>
      )
      return
    }

    // Handle callout boxes
    if (trimmed.startsWith('✅')) {
      elements.push(
        <div key={`callout-${i}`} className="bg-green-50 border border-green-200 rounded-lg p-4 my-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 font-medium leading-relaxed">{parseInlineFormatting(trimmed.slice(2).trim())}</p>
          </div>
        </div>
      )
      return
    }

    if (trimmed.startsWith('🧠 ')) {
      elements.push(
        <div key={`callout-${i}`} className="bg-purple-50 border border-purple-200 rounded-lg p-4 my-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <p className="text-purple-800 font-medium leading-relaxed">{parseInlineFormatting(trimmed.slice(2).trim())}</p>
          </div>
        </div>
      )
      return
    }

    if (trimmed.startsWith('📸')) {
      elements.push(
        <div key={`callout-${i}`} className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-6">
          <div className="flex items-start gap-3">
            <Camera className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-blue-800 font-medium leading-relaxed">{parseInlineFormatting(trimmed.slice(2).trim())}</p>
          </div>
        </div>
      )
      return
    }

    // Handle numbered circle steps (①②③④⑤)
    if (isNumberedStep(trimmed)) {
      const stepNum = getStepNumber(trimmed)
      const stepText = trimmed.replace(/^[①②③④⑤⑥⑦⑧⑨⑩]\s*/, '')
      
      elements.push(
        <div key={`step-${i}`} className="bg-gradient-to-r from-[#60A875]/10 to-[#59B1E3]/10 rounded-xl p-6 border border-[#60A875]/20 my-6">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-8 h-8 bg-[#60A875] text-white rounded-full font-bold text-sm flex-shrink-0">
              {stepNum}
            </div>
            <div className="flex-1">
              <p className="text-gray-900 font-semibold text-lg leading-relaxed">{parseInlineFormatting(stepText)}</p>
            </div>
          </div>
        </div>
      )
      return
    }

    // Handle "Step" prefixed lines (fallback)
    if (trimmed.toLowerCase().startsWith('step ')) {
      elements.push(
        <div key={`step-${i}`} className="bg-gradient-to-r from-[#60A875]/10 to-[#59B1E3]/10 rounded-lg p-4 border border-[#60A875]/20 my-6">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-[#60A875] flex-shrink-0 mt-0.5" />
            <p className="font-semibold text-[#60A875] text-lg leading-relaxed">{parseInlineFormatting(line)}</p>
          </div>
        </div>
      )
      return
    }

    // Handle example callouts
    if (trimmed.toLowerCase().startsWith('example:')) {
      const exampleText = trimmed.slice(8).trim()
      elements.push(
        <div key={`example-${i}`} className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-6">
          <div className="flex items-start gap-3">
            <div className="text-xl">💡</div>
            <div>
              <p className="font-semibold text-amber-800 mb-2">Example:</p>
              {exampleText && (
                <p className="text-amber-700 leading-relaxed">{parseInlineFormatting(exampleText)}</p>
              )}
            </div>
          </div>
        </div>
      )
      return
    }

    // Handle subject lines and structured content
    if (trimmed.toLowerCase().startsWith('subject:')) {
      elements.push(
        <div key={`subject-${i}`} className="bg-gray-50 border border-gray-200 rounded-lg p-4 my-4">
          <p className="font-mono text-sm text-gray-700">{parseInlineFormatting(trimmed)}</p>
        </div>
      )
      return
    }

    // Handle website URLs
    if (trimmed.match(/^www\./)) {
      elements.push(
        <div key={`url-${i}`} className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center my-6">
          <p className="font-mono text-blue-700 font-semibold text-lg">{trimmed}</p>
          <p className="text-sm text-blue-600 mt-1">↗ Open this in your browser</p>
        </div>
      )
      return
    }

    // Regular paragraphs
    elements.push(
      <p key={`p-${i}`} 
         className="text-gray-700 leading-relaxed text-lg my-4" 
         style={{fontFamily: "'Space Grotesk', sans-serif"}}>
        {parseInlineFormatting(line)}
      </p>
    )
  })

  // Flush any remaining list items
  flushList('final')

  return <div className="space-y-2">{elements}</div>
}