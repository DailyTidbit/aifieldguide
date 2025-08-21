'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { 
  Eye, 
  MessageSquare, 
  Share, 
  CheckCircle, 
  Clock,
  Trophy,
  ChevronDown,
  ChevronUp,
  Calendar,
  Target,
  Sparkles,
  Filter,
  RotateCcw
} from 'lucide-react'

interface TidbitProgress {
  tidbit_number: number
  viewed_at: string | null
  tutor_used_at: string | null
  posted_at: string | null
  completed_steps: number
  tidbit_title?: string
  tidbit_created_at?: string
}

interface TidbitProgressTrackerProps {
  userId: string
  isOwnProfile: boolean
}

type FilterType = 'all' | 'completed' | 'in-progress' | 'not-started'

export default function TidbitProgressTracker({ userId, isOwnProfile }: TidbitProgressTrackerProps) {
  const [progress, setProgress] = useState<TidbitProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const [showDetails, setShowDetails] = useState(false)

  // Calculate stats
  const totalTidbits = progress.length
  const completedTidbits = progress.filter(p => p.completed_steps === 3).length
  const inProgressTidbits = progress.filter(p => p.completed_steps > 0 && p.completed_steps < 3).length
  const notStartedTidbits = progress.filter(p => p.completed_steps === 0).length
  const completionRate = totalTidbits > 0 ? Math.round((completedTidbits / totalTidbits) * 100) : 0

  // Filter progress
  const filteredProgress = progress.filter(p => {
    switch (filter) {
      case 'completed': return p.completed_steps === 3
      case 'in-progress': return p.completed_steps > 0 && p.completed_steps < 3
      case 'not-started': return p.completed_steps === 0
      default: return true
    }
  })

  useEffect(() => {
    fetchTidbitProgress()
  }, [userId])

  const fetchTidbitProgress = async () => {
    try {
      setLoading(true)

      // Get all published tidbits
      const { data: tidbits, error: tidbitsError } = await supabase
        .from('tidbits')
        .select('day_number, title, created_at')
        .eq('status', 'published')
        .order('day_number', { ascending: false })

      if (tidbitsError) throw tidbitsError

      // Get user's progress for all tidbits
      const tidbitNumbers = tidbits?.map(t => t.day_number) || []
      
      const { data: userProgress, error: progressError } = await supabase
        .from('user_tidbit_progress')
        .select('*')
        .eq('user_id', userId)
        .in('tidbit_number', tidbitNumbers)

      if (progressError) throw progressError

      // Combine tidbit info with progress
      const progressData: TidbitProgress[] = tidbits?.map(tidbit => {
        const userProg = userProgress?.find(up => up.tidbit_number === tidbit.day_number)
        
        let completedSteps = 0
        if (userProg?.viewed_at) completedSteps++
        if (userProg?.tutor_used_at) completedSteps++
        if (userProg?.posted_at) completedSteps++

        return {
          tidbit_number: tidbit.day_number,
          viewed_at: userProg?.viewed_at || null,
          tutor_used_at: userProg?.tutor_used_at || null,
          posted_at: userProg?.posted_at || null,
          completed_steps: completedSteps,
          tidbit_title: tidbit.title,
          tidbit_created_at: tidbit.created_at
        }
      }) || []

      setProgress(progressData)
    } catch (error) {
      console.error('Error fetching tidbit progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProgressIcon = (step: 'viewed' | 'tutor' | 'posted', progress: TidbitProgress) => {
    const completed = {
      viewed: !!progress.viewed_at,
      tutor: !!progress.tutor_used_at,
      posted: !!progress.posted_at
    }

    const iconClass = completed[step] 
      ? 'text-green-600 bg-green-100' 
      : 'text-gray-400 bg-gray-100'

    const IconComponent = {
      viewed: Eye,
      tutor: MessageSquare,
      posted: Share
    }[step]

    return (
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconClass} transition-colors`}>
        <IconComponent className="w-4 h-4" />
      </div>
    )
  }

  const getTidbitStatusColor = (completedSteps: number) => {
    if (completedSteps === 3) return 'text-green-600 bg-green-50 border-green-200'
    if (completedSteps > 0) return 'text-blue-600 bg-blue-50 border-blue-200'
    return 'text-gray-600 bg-gray-50 border-gray-200'
  }

  const getTidbitStatusText = (completedSteps: number) => {
    if (completedSteps === 3) return 'Completed'
    if (completedSteps > 0) return `${completedSteps}/3 steps`
    return 'Not started'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!isOwnProfile && completedTidbits === 0) {
    return null // Don't show tracker for other users with no progress
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header Summary */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#60A875] to-[#59B1E3] text-white">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900" style={{fontFamily: "'Playfair Display', serif"}}>
                Learning Progress
              </h3>
              <p className="text-gray-600 text-sm">
                {isOwnProfile ? 'Your tidbit completion journey' : `${completedTidbits} tidbits completed`}
              </p>
            </div>
          </div>
          
          {isOwnProfile && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">{completedTidbits}</div>
            <div className="text-sm text-green-700">Completed</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{inProgressTidbits}</div>
            <div className="text-sm text-blue-700">In Progress</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-600">{notStartedTidbits}</div>
            <div className="text-sm text-gray-700">Not Started</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">{completionRate}%</div>
            <div className="text-sm text-purple-700">Complete</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm text-gray-600">{completedTidbits}/{totalTidbits}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-[#60A875] to-[#59B1E3] h-3 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Detailed Progress (Expandable) */}
      {expanded && isOwnProfile && (
        <div className="p-6 space-y-6">
          {/* Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
            </div>
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'All', count: totalTidbits },
                { key: 'completed', label: 'Completed', count: completedTidbits },
                { key: 'in-progress', label: 'In Progress', count: inProgressTidbits },
                { key: 'not-started', label: 'Not Started', count: notStartedTidbits }
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as FilterType)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filter === key 
                      ? 'bg-[#60A875] text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
          </div>

          {/* Progress Legend */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Progress Steps</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Viewed</div>
                  <div className="text-xs text-gray-600">Read the tidbit</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-100 text-purple-600">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Tutor Used</div>
                  <div className="text-xs text-gray-600">Tried with AI</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100 text-green-600">
                  <Share className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Posted</div>
                  <div className="text-xs text-gray-600">Shared creation</div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredProgress.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No tidbits match this filter</p>
                <button
                  onClick={() => setFilter('all')}
                  className="text-[#60A875] hover:text-green-600 text-sm mt-2"
                >
                  Show all tidbits
                </button>
              </div>
            ) : (
              filteredProgress.map((item) => (
                <div 
                  key={item.tidbit_number}
                  className={`border rounded-lg p-4 transition-all hover:shadow-md ${getTidbitStatusColor(item.completed_steps)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-bold bg-[#59B1E3] text-white px-2 py-1 rounded-full">
                          Day {item.tidbit_number}
                        </span>
                        <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">
                          {item.tidbit_title || `Tidbit ${item.tidbit_number}`}
                        </h4>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {getProgressIcon('viewed', item)}
                        {getProgressIcon('tutor', item)}
                        {getProgressIcon('posted', item)}
                        
                        <span className="text-xs font-medium ml-2">
                          {getTidbitStatusText(item.completed_steps)}
                        </span>
                        
                        {item.completed_steps === 3 && (
                          <div className="flex items-center gap-1 text-green-600">
                            <Trophy className="w-4 h-4" />
                            <span className="text-xs font-bold">Complete!</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <a
                        href={`/day/${item.tidbit_number}`}
                        className="text-[#60A875] hover:text-green-600 text-sm font-medium"
                      >
                        {item.completed_steps === 0 ? 'Start' : 'Continue'}
                      </a>
                      {item.tidbit_created_at && (
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(item.tidbit_created_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}