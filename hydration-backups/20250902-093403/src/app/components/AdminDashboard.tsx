'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, Eye, Calendar, Tag, Clock, BarChart3, Filter } from 'lucide-react'
import { formatDateSafe } from '../lib/format'

// Define the Tidbit type
interface Tidbit {
  id: number
  day_number: number
  title: string
  hero_heading: string
  status: 'published' | 'draft' | 'archived'
  tags: string[]
  difficulty_level: 1 | 2 | 3 | 4 | 5
  estimated_time: number
  seo_description: string
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
    status: "published",
    tags: ["writing", "productivity", "beginner"],
    difficulty_level: 1,
    estimated_time: 5,
    seo_description: "Learn how to write better emails with AI assistance in just 5 minutes.",
    created_at: "2024-01-01",
    updated_at: "2024-01-15"
  },
  {
    id: 2,
    day_number: 2,
    title: "Generate Creative Ideas",
    hero_heading: "Spark Your Creativity",
    status: "draft",
    tags: ["creative", "brainstorming"],
    difficulty_level: 2,
    estimated_time: 10,
    seo_description: "Unlock creative potential with AI brainstorming techniques.",
    created_at: "2024-01-02",
    updated_at: "2024-01-16"
  },
  {
    id: 3,
    day_number: 3,
    title: "AI Music Creation",
    hero_heading: "Make Music Magic",
    status: "published",
    tags: ["creative", "music", "advanced"],
    difficulty_level: 4,
    estimated_time: 15,
    seo_description: "Create original music using AI tools and techniques.",
    created_at: "2024-01-03",
    updated_at: "2024-01-17"
  }
]

export default function AdminDashboard() {
  // ✅ HYDRATION SAFETY: Primary mounted state
  const [mounted, setMounted] = useState(false)
  const [tidbits, setTidbits] = useState<Tidbit[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all')
  const [selectedTidbit, setSelectedTidbit] = useState<Tidbit | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load data only after mounted
    setTidbits(mockTidbits)
  }, [])

  // ✅ HYDRATION SAFE: Filter tidbits only after mounted
  const filteredTidbits = mounted ? tidbits.filter(tidbit => {
    const matchesSearch = tidbit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tidbit.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || tidbit.status === statusFilter
    const matchesDifficulty = difficultyFilter === 'all' || tidbit.difficulty_level.toString() === difficultyFilter
    
    return matchesSearch && matchesStatus && matchesDifficulty
  }) : []

  // ✅ HYDRATION SAFE: Calculate stats only after mounted
  const stats = mounted ? {
    total: tidbits.length,
    published: tidbits.filter(t => t.status === 'published').length,
    drafts: tidbits.filter(t => t.status === 'draft').length,
    avgDifficulty: tidbits.length > 0 ? (tidbits.reduce((sum, t) => sum + t.difficulty_level, 0) / tidbits.length).toFixed(1) : '0'
  } : {
    total: 0,
    published: 0,
    drafts: 0,
    avgDifficulty: '0'
  }

  const getDifficultyColor = (level: number): string => {
    // ✅ BRAND COLORS FIXED - Keep status colors as semantic
    const colors: Record<number, string> = {
      1: 'bg-brand-green/10 text-brand-green',
      2: 'bg-brand-blue/10 text-brand-blue', 
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-orange-100 text-orange-800',
      5: 'bg-red-100 text-red-800'
    }
    return colors[level] || colors[1]
  }

  const getStatusColor = (status: string): string => {
    // Keep semantic status colors
    const colors: Record<string, string> = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || colors['draft']
  }

  const handleDelete = (tidbitId: number) => {
    if (!mounted) return // ✅ HYDRATION SAFETY: Guard callback
    
    if (typeof window !== 'undefined' && window.confirm('Are you sure you want to delete this tidbit?')) {
      setTidbits(tidbits.filter(t => t.id !== tidbitId))
    }
  }

  // ✅ HYDRATION SAFETY: Show loading skeleton during hydration
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-9 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="animate-pulse space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-8 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{fontFamily: "'Playfair Display', serif"}}>
            Daily Tidbit Admin
          </h1>
          <p className="text-gray-600" style={{fontFamily: "'Space Grotesk', sans-serif"}}>
            Manage your AI tips and walkthroughs
          </p>
        </div>

        {/* Stats Overview - BRAND COLORS FIXED */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-green rounded-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Tidbits</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-green rounded-lg">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold text-gray-900">{stats.published}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500 rounded-lg">
                <Edit className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Drafts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.drafts}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-blue rounded-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Difficulty</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgDifficulty}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls - BRAND COLORS FIXED */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tidbits or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-brand-green"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'draft' | 'archived')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-brand-green"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>

              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value as 'all' | '1' | '2' | '3' | '4' | '5')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-brand-green"
              >
                <option value="all">All Difficulty</option>
                <option value="1">Beginner (1)</option>
                <option value="2">Easy (2)</option>
                <option value="3">Medium (3)</option>
                <option value="4">Hard (4)</option>
                <option value="5">Advanced (5)</option>
              </select>

              <button
                onClick={() => setShowNewModal(true)}
                className="bg-brand-green text-white px-4 py-2 rounded-lg hover:bg-brand-greenDark transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Tidbit
              </button>
            </div>
          </div>
        </div>

        {/* Tidbits Table - BRAND COLORS FIXED */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Day</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Title</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Difficulty</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Time</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Tags</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Updated</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTidbits.map((tidbit) => (
                  <tr key={tidbit.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <span className="font-semibold text-brand-green">#{tidbit.day_number}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-gray-900">{tidbit.title}</p>
                        <p className="text-sm text-gray-500 truncate max-w-xs">{tidbit.seo_description}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tidbit.status)}`}>
                        {tidbit.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(tidbit.difficulty_level)}`}>
                        Level {tidbit.difficulty_level}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{tidbit.estimated_time}m</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1">
                        {tidbit.tags.slice(0, 2).map((tag, index) => (
                          <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            {tag}
                          </span>
                        ))}
                        {tidbit.tags.length > 2 && (
                          <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded">
                            +{tidbit.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500">
                      {/* ✅ HYDRATION SAFE: Use safe date formatting */}
                      {formatDateSafe(tidbit.updated_at)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (typeof window !== 'undefined') {
                              window.open(`/day/${tidbit.day_number}`, '_blank')
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-brand-blue transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTidbit(tidbit)
                            setShowEditModal(true)
                          }}
                          className="p-1 text-gray-400 hover:text-brand-green transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tidbit.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTidbits.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No tidbits found matching your criteria.</p>
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredTidbits.length} of {tidbits.length} tidbits
        </div>
      </div>

      {/* Modals - BRAND COLORS FIXED */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Edit Tidbit #{selectedTidbit?.day_number}</h3>
            <p className="text-gray-600 mb-4">Edit modal would go here with form fields for all the tidbit properties.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-brand-greenDark transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Create New Tidbit</h3>
            <p className="text-gray-600 mb-4">New tidbit form would go here with all the required fields.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-brand-greenDark transition-colors"
              >
                Create Tidbit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
