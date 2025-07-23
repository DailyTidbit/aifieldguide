'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Check, Clock, Star, MessageSquare, Eye, Target } from 'lucide-react'

interface TidbitProgress {
  tidbit_number: number
  viewed_at: string | null
  completed_at: string | null
  practiced_with_ai: boolean
  created_post: boolean
}

interface ProgressStats {
  totalTidbits: number
  viewedCount: number
  completedCount: number
  practicedCount: number
  sharedCount: number
  currentStreak: number
  longestStreak: number
  progressPercentage: number
}

// Hook to track and manage tidbit progress
export function useTidbitProgress() {
  const [progress, setProgress] = useState<TidbitProgress[]>([])
  const [stats, setStats] = useState<ProgressStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        await fetchProgress(user.id)
      } else {
        setLoading(false)
      }
    }
    getUser()
  }, [])

  const fetchProgress = async (userId: string) => {
    try {
      setLoading(true)
      
      const { data: progressData, error } = await supabase
        .from('user_tidbit_progress')
        .select('*')
        .eq('user_id', userId)
        .order('tidbit_number')

      if (error) throw error

      setProgress(progressData || [])
      calculateStats(progressData || [])
    } catch (error) {
      console.error('Error fetching progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (progressData: TidbitProgress[]) => {
    const totalTidbits = 365 // Total tidbits available
    const viewedCount = progressData.filter(p => p.viewed_at).length
    const completedCount = progressData.filter(p => p.completed_at).length
    const practicedCount = progressData.filter(p => p.practiced_with_ai).length
    const sharedCount = progressData.filter(p => p.created_post).length

    // Calculate streak
    const sortedProgress = progressData
      .filter(p => p.viewed_at)
      .sort((a, b) => new Date(b.viewed_at!).getTime() - new Date(a.viewed_at!).getTime())

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    // Simple streak calculation based on consecutive days
    for (let i = 0; i < sortedProgress.length; i++) {
      const current = new Date(sortedProgress[i].viewed_at!)
      const previous = i > 0 ? new Date(sortedProgress[i - 1].viewed_at!) : null

      if (!previous || Math.abs(current.getTime() - previous.getTime()) <= 86400000 * 2) { // Within 2 days
        tempStreak++
        if (i === 0) currentStreak = tempStreak
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
        if (i === 0) currentStreak = 1
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak)

    setStats({
      totalTidbits,
      viewedCount,
      completedCount,
      practicedCount,
      sharedCount,
      currentStreak,
      longestStreak,
      progressPercentage: Math.round((viewedCount / totalTidbits) * 100)
    })
  }

  // Track when user views a tidbit
  const markTidbitViewed = async (tidbitNumber: number) => {
    if (!user) return

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

      if (error) throw error

      // Refresh progress
      await fetchProgress(user.id)
    } catch (error) {
      console.error('Error marking tidbit viewed:', error)
    }
  }

  // Mark tidbit as completed (finished walkthrough)
  const markTidbitCompleted = async (tidbitNumber: number) => {
    if (!user) return

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

      if (error) throw error
      await fetchProgress(user.id)
    } catch (error) {
      console.error('Error marking tidbit completed:', error)
    }
  }

  // Mark AI practice used
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

      if (error) throw error
      await fetchProgress(user.id)
    } catch (error) {
      console.error('Error marking AI practiced:', error)
    }
  }

  // Mark post created
  const markPostCreated = async (tidbitNumber: number) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('user_tidbit_progress')
        .upsert({
          user_id: user.id,
          tidbit_number: tidbitNumber,
          created_post: true
        }, {
          onConflict: 'user_id,tidbit_number'
        })

      if (error) throw error
      await fetchProgress(user.id)
    } catch (error) {
      console.error('Error marking post created:', error)
    }
  }

  // Get next unviewed tidbit
  const getNextUnviewedTidbit = () => {
    if (!progress.length) return 1

    const viewedTidbits = new Set(progress.filter(p => p.viewed_at).map(p => p.tidbit_number))
    
    // Find first unviewed tidbit
    for (let i = 1; i <= 365; i++) {
      if (!viewedTidbits.has(i)) {
        return i
      }
    }
    
    return null // All viewed
  }

  // Get recommended tidbits (unviewed ones)
  const getRecommendedTidbits = (limit = 5) => {
    const viewedTidbits = new Set(progress.filter(p => p.viewed_at).map(p => p.tidbit_number))
    const unviewed = []
    
    for (let i = 1; i <= 365 && unviewed.length < limit; i++) {
      if (!viewedTidbits.has(i)) {
        unviewed.push(i)
      }
    }
    
    return unviewed
  }

  // Check if tidbit is viewed/completed
  const getTidbitStatus = (tidbitNumber: number) => {
    const tidbitProgress = progress.find(p => p.tidbit_number === tidbitNumber)
    return {
      viewed: !!tidbitProgress?.viewed_at,
      completed: !!tidbitProgress?.completed_at,
      practiced: !!tidbitProgress?.practiced_with_ai,
      shared: !!tidbitProgress?.created_post
    }
  }

  return {
    progress,
    stats,
    loading,
    user,
    markTidbitViewed,
    markTidbitCompleted,
    markAIPracticed,
    markPostCreated,
    getNextUnviewedTidbit,
    getRecommendedTidbits,
    getTidbitStatus,
    refreshProgress: () => user && fetchProgress(user.id)
  }
}

// Progress Dashboard Component
export default function TidbitProgressDashboard() {
  const { stats, loading, getRecommendedTidbits, getNextUnviewedTidbit } = useTidbitProgress()

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const nextTidbit = getNextUnviewedTidbit()
  const recommended = getRecommendedTidbits(3)

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-[#60A875]" />
          Your Progress
        </h2>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {stats.viewedCount} of {stats.totalTidbits} tidbits explored
            </span>
            <span className="text-sm font-bold text-[#60A875]">
              {stats.progressPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-[#60A875] to-[#59B1E3] h-3 rounded-full transition-all duration-500"
              style={{ width: `${stats.progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Eye className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{stats.viewedCount}</div>
            <div className="text-sm text-blue-700">Viewed</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Check className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{stats.completedCount}</div>
            <div className="text-sm text-green-700">Completed</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Star className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">{stats.practicedCount}</div>
            <div className="text-sm text-purple-700">Practiced</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <MessageSquare className="w-6 h-6 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-600">{stats.sharedCount}</div>
            <div className="text-sm text-orange-700">Shared</div>
          </div>
        </div>

        {/* Streak Info */}
        {stats.currentStreak > 0 && (
          <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <div>
                <div className="font-bold text-yellow-800">
                  {stats.currentStreak} day streak!
                </div>
                <div className="text-sm text-yellow-700">
                  Longest streak: {stats.longestStreak} days
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Next Steps */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Continue Learning</h3>
        
        {nextTidbit ? (
          <div className="space-y-3">
            <div className="p-4 bg-gradient-to-r from-[#60A875] to-[#59B1E3] rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold">Next Up: Day {nextTidbit}</div>
                  <div className="text-sm opacity-90">Continue your AI journey</div>
                </div>
                <a
                  href={`/day/${nextTidbit}`}
                  className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors font-medium"
                >
                  Start →
                </a>
              </div>
            </div>
            
            {recommended.length > 1 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Or try these:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {recommended.slice(1).map(tidbit => (
                    <a
                      key={tidbit}
                      href={`/day/${tidbit}`}
                      className="p-3 border border-gray-200 rounded-lg hover:border-[#60A875] transition-colors text-center"
                    >
                      <div className="font-medium text-gray-900">Day {tidbit}</div>
                      <div className="text-sm text-gray-600">Not started</div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <div className="text-xl font-bold text-gray-900 mb-2">
              Incredible! You've viewed all 365 tidbits!
            </div>
            <div className="text-gray-600">
              You're a true AI learning champion!
            </div>
          </div>
        )}
      </div>
    </div>
  )
}