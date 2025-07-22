'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Calendar, Tag, Clock, Eye, Edit, BarChart3, X, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

// Enhanced Tidbit type matching your Supabase schema
interface Tidbit {
  id: number
  day_number: number
  title: string
  hero_heading: string
  walkthrough_intro: string
  what_is_ai: string
  what_you_need: string
  step_by_step: string
  try_it: string
  tutor_intro: string
  video_url: string | null
  image_url: string | null
  bitboard_url: string | null
  chatbot_embed: string | null
  status: 'published' | 'draft' | 'archived'
  tags: string[]
  difficulty_level: 1 | 2 | 3 | 4 | 5
  estimated_time: number
  seo_description: string | null
  extra: number | null
  created_at: string
  updated_at: string
}

// Mock data for demonstration
const mockTidbits: Tidbit[] = [
  {
    id: 1,
    day_number: 1,
    title: "Write Better Emails with AI",
    hero_heading: "✨ AI for Real People",
    walkthrough_intro: "Learn how to craft professional emails using ChatGPT and other AI tools.",
    what_is_ai: "AI can analyze your writing style and suggest improvements for clarity and tone.",
    what_you_need: "Access to ChatGPT, Gmail or any email client, 5 minutes of your time.",
    step_by_step: "Step 1: Open ChatGPT and describe your email goal. Step 2: Provide context about the recipient.",
    try_it: "Try writing an email to reschedule a meeting using AI assistance.",
    tutor_intro: "I'm here to help you practice email writing with AI!",
    video_url: null,
    image_url: null,
    bitboard_url: null,
    chatbot_embed: null,
    status: "published",
    tags: ["writing", "productivity", "beginner", "email", "communication"],
    difficulty_level: 1,
    estimated_time: 5,
    seo_description: "Learn how to write better emails with AI assistance in just 5 minutes.",
    extra: null,
    created_at: "2024-01-01",
    updated_at: "2024-01-15"
  },
  {
    id: 2,
    day_number: 2,
    title: "Generate Creative Ideas with AI",
    hero_heading: "Spark Your Creativity",
    walkthrough_intro: "Discover how to use AI for brainstorming and creative problem-solving.",
    what_is_ai: "AI excels at making unexpected connections and generating diverse ideas quickly.",
    what_you_need: "Any AI chat tool like ChatGPT, Claude, or Gemini.",
    step_by_step: "Step 1: Define your creative challenge clearly. Step 2: Ask AI for 10 diverse approaches.",
    try_it: "Generate 5 unique business ideas for a local coffee shop using AI brainstorming.",
    tutor_intro: "Ready to unlock your creative potential with AI assistance?",
    video_url: null,
    image_url: null,
    bitboard_url: null,
    chatbot_embed: null,
    status: "draft",
    tags: ["creative", "brainstorming", "business", "ideas"],
    difficulty_level: 2,
    estimated_time: 10,
    seo_description: "Unlock creative potential with AI brainstorming techniques and idea generation.",
    extra: null,
    created_at: "2024-01-02",
    updated_at: "2024-01-16"
  },
  {
    id: 3,
    day_number: 3,
    title: "Create Music with AI Tools",
    hero_heading: "Make Music Magic",
    walkthrough_intro: "Learn to compose original music using Suno AI and other music generation tools.",
    what_is_ai: "AI music tools can generate melodies, harmonies, and full compositions.",
    what_you_need: "Suno AI account, basic understanding of music genres, headphones for listening.",
    step_by_step: "Step 1: Sign up for Suno AI. Step 2: Write a detailed prompt describing your desired song.",
    try_it: "Create a 30-second jingle for a fictional product using descriptive prompts.",
    tutor_intro: "Let's explore the world of AI-generated music together!",
    video_url: null,
    image_url: null,
    bitboard_url: null,
    chatbot_embed: null,
    status: "published",
    tags: ["creative", "music", "advanced", "audio", "suno"],
    difficulty_level: 4,
    estimated_time: 15,
    seo_description: "Create original music using AI tools and techniques.",
    extra: null,
    created_at: "2024-01-03",
    updated_at: "2024-01-17"
  }
]

const loadTidbitsFromSupabase = async (): Promise<Tidbit[]> => {
  const { data, error } = await supabase
    .from('tidbits')
    .select('*')
    .order('day_number', { ascending: true })
  
  if (error) throw error
  return data || []
}

export default function TidbitSearch() {
  const [tidbits, setTidbits] = useState<Tidbit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Tidbit[]>([])
  const [filters, setFilters] = useState({
    status: 'all' as 'all' | 'published' | 'draft' | 'archived',
    difficulty: 'all' as 'all' | '1' | '2' | '3' | '4' | '5',
    tags: [] as string[],
    minTime: '',
    maxTime: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  // Load tidbits
  useEffect(() => {
    loadTidbits()
  }, [])

  const loadTidbits = async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await loadTidbitsFromSupabase()
      const processedData = data.map(tidbit => ({
        ...tidbit,
        tags: Array.isArray(tidbit.tags) ? tidbit.tags : [],
        seo_description: tidbit.seo_description || '',
        status: tidbit.status || 'draft',
        difficulty_level: tidbit.difficulty_level || 1,
        estimated_time: tidbit.estimated_time || 5
      }))

      setTidbits(processedData)
      setSearchResults(processedData)
    } catch (err) {
      console.error('Error loading tidbits:', err)
      setError('Failed to load tidbits. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Get all unique tags
  const allTags = Array.from(new Set(tidbits.flatMap(t => t.tags))).sort()

  // Search function
  const performSearch = (query: string, currentFilters = filters) => {
    if (!query.trim() && currentFilters.status === 'all' && currentFilters.difficulty === 'all' && 
        currentFilters.tags.length === 0 && !currentFilters.minTime && !currentFilters.maxTime) {
      setSearchResults(tidbits)
      return
    }

    const results = tidbits.filter(tidbit => {
      const searchFields = [
        tidbit.title,
        tidbit.hero_heading,
        tidbit.walkthrough_intro,
        tidbit.what_is_ai,
        tidbit.what_you_need,
        tidbit.step_by_step,
        tidbit.try_it,
        tidbit.seo_description || '',
        ...tidbit.tags
      ].join(' ').toLowerCase()

      const matchesQuery = !query.trim() || searchFields.includes(query.toLowerCase())
      const matchesStatus = currentFilters.status === 'all' || tidbit.status === currentFilters.status
      const matchesDifficulty = currentFilters.difficulty === 'all' || 
                               tidbit.difficulty_level.toString() === currentFilters.difficulty
      const matchesTags = currentFilters.tags.length === 0 || 
                         currentFilters.tags.some(tag => tidbit.tags.includes(tag))
      const matchesMinTime = !currentFilters.minTime || 
                            tidbit.estimated_time >= parseInt(currentFilters.minTime)
      const matchesMaxTime = !currentFilters.maxTime || 
                            tidbit.estimated_time <= parseInt(currentFilters.maxTime)

      return matchesQuery && matchesStatus && matchesDifficulty && matchesTags && 
             matchesMinTime && matchesMaxTime
    })

    setSearchResults(results)
  }

  // Handle search input
  useEffect(() => {
    performSearch(searchQuery, filters)
  }, [searchQuery, filters])

  // Update filters
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
  }

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag) 
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag]
    updateFilters({ tags: newTags })
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: 'all',
      difficulty: 'all',
      tags: [],
      minTime: '',
      maxTime: ''
    })
  }

  // Get difficulty color
  const getDifficultyColor = (level: number): string => {
    const colors: Record<number, string> = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-orange-100 text-orange-800',
      5: 'bg-red-100 text-red-800'
    }
    return colors[level] || colors[1]
  }

  // Get status color
  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || colors['draft']
  }

  // Highlight search terms
  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark> : 
        part
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{fontFamily: "'Playfair Display', serif"}}>
          Search Daily Tidbits
        </h1>
        <p className="text-gray-600" style={{fontFamily: "'Space Grotesk', sans-serif"}}>
          Find the perfect AI tip from your content library
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#60A875]"></div>
          <span className="ml-3 text-gray-600">Loading tidbits...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={loadTidbits}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Search Interface */}
      {!loading && !error && (
        <>
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tidbits by title, content, tags, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#60A875] focus:border-[#60A875] bg-white shadow-sm"
              />
            </div>
          </div>

          {/* Filter Toggle & Summary */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Advanced Filters
              {(filters.status !== 'all' || filters.difficulty !== 'all' || filters.tags.length > 0 || filters.minTime || filters.maxTime) && (
                <span className="bg-[#60A875] text-white text-xs px-2 py-1 rounded-full">
                  {[
                    filters.status !== 'all' ? 1 : 0,
                    filters.difficulty !== 'all' ? 1 : 0,
                    filters.tags.length,
                    filters.minTime ? 1 : 0,
                    filters.maxTime ? 1 : 0
                  ].reduce((a, b) => a + b, 0)}
                </span>
              )}
            </button>
            
            <div className="text-sm text-gray-600">
              {searchResults.length} of {tidbits.length} tidbits
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => updateFilters({ status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#60A875]"
                  >
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty</label>
                  <select
                    value={filters.difficulty}
                    onChange={(e) => updateFilters({ difficulty: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#60A875]"
                  >
                    <option value="all">All Levels</option>
                    <option value="1">Beginner (1)</option>
                    <option value="2">Easy (2)</option>
                    <option value="3">Medium (3)</option>
                    <option value="4">Hard (4)</option>
                    <option value="5">Advanced (5)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Time (minutes)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minTime}
                      onChange={(e) => updateFilters({ minTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#60A875]"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxTime}
                      onChange={(e) => updateFilters({ maxTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#60A875]"
                    />
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Tags Filter */}
              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                        filters.tags.includes(tag)
                          ? 'bg-[#60A875] text-white border-[#60A875]'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-[#60A875]'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Search Results */}
          <div className="space-y-4">
            {searchResults.map(tidbit => (
              <div key={tidbit.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-semibold text-[#60A875]">Day #{tidbit.day_number}</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tidbit.status)}`}>
                        {tidbit.status}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(tidbit.difficulty_level)}`}>
                        Level {tidbit.difficulty_level}
                      </span>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{tidbit.estimated_time}m</span>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {highlightText(tidbit.title, searchQuery)}
                    </h3>
                    
                    <p className="text-gray-600 mb-3">
                      {highlightText(tidbit.seo_description || '', searchQuery)}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {tidbit.tags.map(tag => (
                        <span key={tag} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          {highlightText(tag, searchQuery)}
                        </span>
                      ))}
                    </div>

                    <p className="text-sm text-gray-500">
                      Updated {new Date(tidbit.updated_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => window.open(`/day/${tidbit.day_number}`, '_blank')}
                      className="p-2 text-gray-400 hover:text-[#59B1E3] transition-colors"
                      title="View Tidbit"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-[#60A875] transition-colors"
                      title="Edit Tidbit"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <ArrowRight className="w-5 h-5 text-gray-300" />
                  </div>
                </div>

                {/* Content preview */}
                {searchQuery && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Content preview:</strong> {highlightText((tidbit.walkthrough_intro || '').slice(0, 200), searchQuery)}
                      {(tidbit.walkthrough_intro || '').length > 200 && '...'}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* Empty State */}
            {searchResults.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No tidbits found</h3>
                <p className="text-gray-600 mb-4">
                  {tidbits.length === 0 
                    ? "No tidbits in your database yet. Add some content to get started!"
                    : "Try adjusting your search terms or filters"
                  }
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    clearFilters()
                  }}
                  className="px-4 py-2 bg-[#60A875] text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  {tidbits.length === 0 ? 'Refresh' : 'Clear Search'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}