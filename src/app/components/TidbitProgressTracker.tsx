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
  RotateCcw,
  PlayCircle,
  Circle
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
  const [showLegend, setShowLegend] = useState(false) // NEW: State for collapsible legend

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

  // Handle clicking anywhere in the Learning Progress area to expand
  const handleSectionClick = () => {
    if (!expanded) {
      setExpanded(true)
    }
  }

  // Handle stat box clicks 
  const handleStatClick = (filterType: FilterType) => {
    if (!expanded) {
      // If collapsed, expand and set filter
      setExpanded(true)
      setFilter(filterType)
    } else {
      // If expanded, set the filter (or clear to 'all' if same filter clicked)
      if (filter === filterType) {
        setFilter('all')
      } else {
        setFilter(filterType)
      }
    }
  }

  // Handle manual collapse via chevron button
  const handleToggleCollapse = () => {
    setExpanded(!expanded)
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
      {/* Header Summary - Clickable to expand */}
      <div 
        className={`p-6 border-b border-gray-200 transition-all duration-200 ${
          !expanded ? 'cursor-pointer hover:bg-gray-50' : ''
        }`}
        onClick={!expanded ? handleSectionClick : undefined}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#60A875] to-[#59B1E3] text-white">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900" style={{fontFamily: "'Playfair Display', serif"}}>
                Tidbit Tracker
              </h3>
              <p className="text-gray-600 text-sm">
                {isOwnProfile ? 'Your tidbit completion journey' : `${completedTidbits} tidbits completed`}
              </p>
            </div>
          </div>
          
          {/* Toggle expand button - only works to collapse when expanded */}
          <button
            onClick={(e) => {
              e.stopPropagation() // Prevent section click when clicking chevron
              handleToggleCollapse()
            }}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {/* Enhanced Quick Stats - Always clickable */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Completed Stats Box */}
          <button
            onClick={(e) => {
              e.stopPropagation() // Prevent section click when clicking button
              handleStatClick('completed')
            }}
            className={`group relative text-center p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 ${
              expanded && filter === 'completed'
                ? 'bg-green-50 border-green-300 shadow-lg ring-2 ring-green-200'
                : 'bg-green-50 border-green-200 hover:border-green-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-green-500 text-white group-hover:scale-110 transition-transform duration-200">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-green-600">{completedTidbits}</div>
            <div className="text-sm text-green-700 font-medium">Completed</div>
            {expanded && filter === 'completed' && (
              <div className="absolute top-2 right-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </button>

          {/* In Progress Stats Box */}
          <button
            onClick={(e) => {
              e.stopPropagation() // Prevent section click when clicking button
              handleStatClick('in-progress')
            }}
            className={`group relative text-center p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 ${
              expanded && filter === 'in-progress'
                ? 'bg-blue-50 border-blue-300 shadow-lg ring-2 ring-blue-200'
                : 'bg-blue-50 border-blue-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-blue-500 text-white group-hover:scale-110 transition-transform duration-200">
                <PlayCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-600">{inProgressTidbits}</div>
            <div className="text-sm text-blue-700 font-medium">In Progress</div>
            {expanded && filter === 'in-progress' && (
              <div className="absolute top-2 right-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </button>

          {/* Not Started Stats Box */}
          <button
            onClick={(e) => {
              e.stopPropagation() // Prevent section click when clicking button
              handleStatClick('not-started')
            }}
            className={`group relative text-center p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 ${
              expanded && filter === 'not-started'
                ? 'bg-gray-50 border-gray-300 shadow-lg ring-2 ring-gray-200'
                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-gray-500 text-white group-hover:scale-110 transition-transform duration-200">
                <Circle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-600">{notStartedTidbits}</div>
            <div className="text-sm text-gray-700 font-medium">Not Started</div>
            {expanded && filter === 'not-started' && (
              <div className="absolute top-2 right-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </button>

          {/* Percentage Complete Stats Box */}
          <button
            onClick={(e) => {
              e.stopPropagation() // Prevent section click when clicking button
              handleStatClick('all')
            }}
            className={`group relative text-center p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 ${
              expanded && filter === 'all'
                ? 'bg-purple-50 border-purple-300 shadow-lg ring-2 ring-purple-200'
                : 'bg-purple-50 border-purple-200 hover:border-purple-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-purple-500 text-white group-hover:scale-110 transition-transform duration-200">
                <Trophy className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-purple-600">{completionRate}%</div>
            <div className="text-sm text-purple-700 font-medium">Complete</div>
            {expanded && filter === 'all' && (
              <div className="absolute top-2 right-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Tidbits Completed</span>
            <span className="text-sm text-gray-600">{completedTidbits}/{totalTidbits}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-[#60A875] to-[#59B1E3] h-3 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>

        {/* Instruction text when not expanded */}
        {!expanded && isOwnProfile && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
              <ChevronDown className="w-4 h-4 animate-bounce" />
              Click anywhere here to expand your Tidbit Tracker
              <ChevronDown className="w-4 h-4 animate-bounce" />
            </p>
          </div>
        )}
      </div>

      {/* Detailed Progress (Expandable with smooth animation) */}
      <div 
        className={`transition-all duration-500 ease-in-out ${
          expanded 
            ? 'max-h-[800px] opacity-100' 
            : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="p-6 space-y-6 bg-gray-50">
          {/* Collapsible Progress Legend */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setShowLegend(!showLegend)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Eye className="w-3 h-3" />
                </div>
                <h4 className="text-sm font-semibold text-gray-700">Progress Steps</h4>
                <span className="text-xs text-gray-500">What do the icons mean?</span>
              </div>
              {showLegend ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            
            {/* Collapsible Content */}
            <div 
              className={`transition-all duration-300 ease-in-out ${
                showLegend 
                  ? 'max-h-40 opacity-100' 
                  : 'max-h-0 opacity-0 overflow-hidden'
              }`}
            >
              <div className="px-4 pb-4 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
                      <Eye className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Viewed Tidbit</div>
                      <div className="text-xs text-gray-600">Read the walkthrough</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-100 text-purple-600">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Used Tidbit Tutor</div>
                      <div className="text-xs text-gray-600">Tried with AI</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100 text-green-600">
                      <Share className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Posted to BitBoard</div>
                      <div className="text-xs text-gray-600">Shared creation</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filtered Results Count */}
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900">
              {filter === 'all' ? 'All Tidbits' : 
               filter === 'completed' ? 'Completed Tidbits' :
               filter === 'in-progress' ? 'In Progress Tidbits' : 'Not Started Tidbits'}
            </h4>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {filteredProgress.length} results
            </span>
          </div>

          {/* Progress List - Mobile Optimized */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredProgress.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No tidbits match this filter</p>
                <button
                  onClick={() => setFilter('all')}
                  className="text-[#60A875] hover:text-green-600 text-sm mt-2 flex items-center gap-1 mx-auto"
                >
                  <RotateCcw className="w-4 h-4" />
                  Show all tidbits
                </button>
              </div>
            ) : (
              filteredProgress.map((item) => (
                <div 
                  key={item.tidbit_number}
                  className={`border rounded-xl transition-all duration-200 hover:shadow-md ${getTidbitStatusColor(item.completed_steps)}`}
                >
                  {/* Mobile-First Layout */}
                  <div className="p-4">
                    {/* Header Row - Day Badge + Title */}
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-sm font-bold bg-[#59B1E3] text-white px-3 py-1 rounded-full whitespace-nowrap">
                        Day {item.tidbit_number}
                      </span>
                      <h4 className="font-semibold text-gray-900 text-sm leading-tight flex-1 min-w-0">
                        {item.tidbit_title || `Tidbit ${item.tidbit_number}`}
                      </h4>
                    </div>
                    
                    {/* Progress + Action Row */}
                    <div className="flex items-center justify-between gap-4">
                      {/* Progress Icons - Compact on Mobile */}
                      <div className="flex items-center gap-2 flex-1">
                        {getProgressIcon('viewed', item)}
                        {getProgressIcon('tutor', item)}
                        {getProgressIcon('posted', item)}
                        
                        {/* Status Text - Hidden on Small Mobile */}
                        <span className="text-xs font-medium ml-2 px-2 py-1 bg-white/50 rounded-full hidden sm:inline">
                          {getTidbitStatusText(item.completed_steps)}
                        </span>
                        
                        {/* Completion Badge - Mobile Friendly */}
                        {item.completed_steps === 3 && (
                          <div className="flex items-center gap-1 text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            <Trophy className="w-3 h-3" />
                            <span className="text-xs font-bold hidden sm:inline">Complete!</span>
                            <span className="text-xs font-bold sm:hidden">✓</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Action Button - Compact on Mobile */}
                      <div className="flex flex-col items-end gap-1">
                        <a
                          href={`/day/${item.tidbit_number}`}
                          className="inline-flex items-center gap-1 bg-[#60A875] hover:bg-green-600 text-white text-xs sm:text-sm font-medium px-3 py-2 rounded-lg transition-colors duration-200 whitespace-nowrap"
                        >
                          {item.completed_steps === 0 ? 'Start' : 'Continue'}
                        </a>
                        {/* Date - Smaller on Mobile */}
                        {item.tidbit_created_at && (
                          <div className="text-xs text-gray-500">
                            {new Date(item.tidbit_created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Mobile Status Row - Only show on smaller screens */}
                    <div className="mt-3 sm:hidden">
                      <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                        {getTidbitStatusText(item.completed_steps)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}