// src/app/components/UserProfile.tsx - COMPLETE HYDRATION SAFE + BRAND COLOR FIX
'use client'

import { useState, useEffect, useRef } from 'react'
import { getSupabaseBrowserClientSafe } from '../lib/supabaseClient'
import PostModal from './PostModal'
import TidbitProgressTracker from './TidbitProgressTracker'
import { 
  User, 
  Edit3, 
  Save, 
  X, 
  Loader2, 
  AlertCircle,
  Globe,
  Calendar,
  Heart,
  Grid3X3,
  LogOut,
  MessageCircle,
  Trophy,
  Lock,
  Pin
} from 'lucide-react'
import Image from 'next/image'

// ✅ HYDRATION SAFE: Loading skeleton component
const ProfileSkeleton = () => (
  <div className="max-w-4xl mx-auto p-4 sm:p-6">
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="relative h-32 sm:h-48 bg-gradient-to-r from-brand-green to-brand-blue animate-pulse"></div>
      <div className="relative px-4 sm:px-6 pb-6">
        <div className="flex items-end gap-4 sm:gap-6 -mt-12 sm:-mt-16">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-200 rounded-full animate-pulse border-4 border-white"></div>
          <div className="flex-1 space-y-3 pb-4">
            <div className="h-4 sm:h-6 bg-gray-200 rounded w-32 sm:w-48 animate-pulse"></div>
            <div className="h-3 sm:h-4 bg-gray-200 rounded w-24 sm:w-32 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  website: string | null
  created_at: string
  updated_at: string
}

interface ProfileStats {
  postsCount: number
  likesReceived: number
  likesGiven: number
  commentsGiven: number
  commentsReceived: number
  joinedDaysAgo: number
  completedTidbits: number
}

interface Badge {
  id: string
  name: string
  emoji: string
  tagline: string
  tier: 'starter' | 'arcade' | 'web' | 'hacker' | 'voyager' | 'neural' | 'quantum'
  threshold: number
  theme: string
  type: 'posts' | 'tidbits' | 'engagement'
}

// ✅ BRAND COLOR FIX: Updated badge themes to use brand colors
const RETRO_BADGES: Badge[] = [
  // Getting Started (1-10 tidbits completed)
  { id: 'first-bit', name: 'First Bit!', emoji: '🎉', tagline: 'Welcome to the Board', tier: 'starter', threshold: 1, theme: 'from-brand-green to-brand-greenDark', type: 'tidbits' },
  { id: 'bit-curious', name: 'Bit Curious', emoji: '👀', tagline: "You're exploring...", tier: 'starter', threshold: 3, theme: 'from-brand-blue to-brand-blueDark', type: 'tidbits' },
  { id: 'daily-dabbler', name: 'Daily Dabbler', emoji: '🧪', tagline: 'Starting to feel it?', tier: 'starter', threshold: 5, theme: 'from-brand-green to-brand-greenLight', type: 'tidbits' },
  { id: 'early-adapter', name: 'Early Adapter', emoji: '💾', tagline: "You're plugged in now", tier: 'starter', threshold: 10, theme: 'from-brand-blue to-brand-blueLight', type: 'tidbits' },
  
  // Arcade Era (11-50 tidbits)
  { id: 'bit-bouncer', name: 'Bit Bouncer', emoji: '🕹️', tagline: "You're bouncing back daily", tier: 'arcade', threshold: 15, theme: 'from-brand-green to-brand-blue', type: 'tidbits' },
  { id: 'pixel-pusher', name: 'Pixel Pusher', emoji: '🎮', tagline: 'That rhythm tho', tier: 'arcade', threshold: 20, theme: 'from-brand-blue to-brand-green', type: 'tidbits' },
  { id: 'console-committer', name: 'Console Committer', emoji: '💾', tagline: "That's a quarter milestone!", tier: 'arcade', threshold: 25, theme: 'from-brand-greenLight to-brand-greenDark', type: 'tidbits' },
  { id: 'coinop-regular', name: 'Coin-Op Regular', emoji: '🪙', tagline: "You've earned your high score", tier: 'arcade', threshold: 30, theme: 'from-brand-blueLight to-brand-blueDark', type: 'tidbits' },
  { id: 'level-grinder', name: 'Level Grinder', emoji: '🧠', tagline: 'This is more than a phase', tier: 'arcade', threshold: 40, theme: 'from-brand-green to-brand-greenDark', type: 'tidbits' },
  { id: 'game-saved', name: 'Game Saved', emoji: '💽', tagline: 'Press start to continue', tier: 'arcade', threshold: 50, theme: 'from-brand-blue to-brand-blueDark', type: 'tidbits' },
  
  // Engagement Badges (based on posts/interaction) - BRAND COLOR FIX
  { id: 'first-post', name: 'First Post', emoji: '📝', tagline: 'Welcome to sharing!', tier: 'starter', threshold: 1, theme: 'from-brand-green to-brand-blue', type: 'posts' },
  { id: 'prolific-poster', name: 'Prolific Poster', emoji: '📈', tagline: 'You love to share', tier: 'arcade', threshold: 10, theme: 'from-brand-blue to-brand-green', type: 'posts' },
  { id: 'community-builder', name: 'Community Builder', emoji: '🏗️', tagline: 'Building the ecosystem', tier: 'web', threshold: 50, theme: 'from-brand-greenDark to-brand-blueDark', type: 'posts' },
  { id: 'engagement-engine', name: 'Engagement Engine', emoji: '⚡', tagline: 'Always sparking discussion', tier: 'hacker', threshold: 25, theme: 'from-brand-blueLight to-brand-greenLight', type: 'engagement' }
]

export default function UserProfile({ userId, isOwnProfile = false }: {
  userId: string
  isOwnProfile?: boolean
}) {
  // ✅ HYDRATION SAFETY: Component-level mounted state
  const [mounted, setMounted] = useState(false)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [activeStatsFilter, setActiveStatsFilter] = useState<'all' | 'created' | 'liked' | 'top' | 'timeline' | 'commented' | 'received'>('all')
  const [selectedPost, setSelectedPost] = useState<any>(null)
  const [userBadges, setUserBadges] = useState<Badge[]>([])
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    bio: '',
    website: ''
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ✅ HYDRATION SAFETY: Wait for mount
  useEffect(() => {
    setMounted(true)
  }, [])

  const calculateEarnedBadges = (stats: ProfileStats) => {
    const earnedBadges: Badge[] = []
    
    const tidbitBadges = RETRO_BADGES.filter(badge => 
      badge.type === 'tidbits' && stats.completedTidbits >= badge.threshold
    )
    earnedBadges.push(...tidbitBadges)
    
    const postBadges = RETRO_BADGES.filter(badge => 
      badge.type === 'posts' && stats.postsCount >= badge.threshold
    )
    earnedBadges.push(...postBadges)
    
    const engagementScore = stats.commentsGiven + stats.likesGiven
    const engagementBadges = RETRO_BADGES.filter(badge => 
      badge.type === 'engagement' && engagementScore >= badge.threshold
    )
    earnedBadges.push(...engagementBadges)
    
    return earnedBadges.sort((a, b) => a.threshold - b.threshold)
  }

  const getCurrentTierBadge = (badges: Badge[]) => {
    const tidbitBadges = badges.filter(b => b.type === 'tidbits')
    return tidbitBadges.length > 0 ? tidbitBadges[tidbitBadges.length - 1] : null
  }

  const fetchProfile = async () => {
    if (!mounted) return
    
    try {
      setLoading(true)
      setError(null)

      const supabase = getSupabaseBrowserClientSafe()
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        throw profileError
      }

      setProfile(profileData)
      setFormData({
        username: profileData.username || '',
        full_name: profileData.full_name || '',
        bio: profileData.bio || '',
        website: profileData.website || ''
      })

      await fetchStats()
    } catch (err: any) {
      console.error('Error fetching profile:', err)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    if (!mounted) return
    
    try {
      const supabase = getSupabaseBrowserClientSafe()
      
      // Get posts count
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Get likes received (on user's posts)
      const { data: userPosts } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', userId)

      let likesReceived = 0
      let commentsReceived = 0
      if (userPosts && userPosts.length > 0) {
        const postIds = userPosts.map(post => post.id)
        
        // Likes received
        const { count: likesCount } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .in('post_id', postIds)
        likesReceived = likesCount || 0

        // Comments received
        const { count: commentsCount } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .in('post_id', postIds)
        commentsReceived = commentsCount || 0
      }

      // Get likes given by user
      const { count: likesGiven } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Get comments given by user
      const { count: commentsGiven } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Get completed tidbits count
      const { count: completedTidbits } = await supabase
        .from('user_tidbit_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('viewed_at', 'is', null)
        .not('tutor_used_at', 'is', null)
        .not('posted_at', 'is', null)

      // Calculate days since joining
      const { data: profileData } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', userId)
        .single()

      const joinedDaysAgo = profileData 
        ? Math.floor((new Date().getTime() - new Date(profileData.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0

      const newStats = {
        postsCount: postsCount || 0,
        likesReceived,
        likesGiven: likesGiven || 0,
        commentsGiven: commentsGiven || 0,
        commentsReceived,
        joinedDaysAgo,
        completedTidbits: completedTidbits || 0
      }

      setStats(newStats)
      const badges = calculateEarnedBadges(newStats)
      setUserBadges(badges)
    } catch (err: any) {
      console.error('Error fetching stats:', err)
    }
  }

  const handleWebsiteChange = (value: string) => {
    if (!mounted) return
    setFormData(prev => ({ ...prev, website: value }))
  }

  const formatWebsiteForSave = (website: string) => {
    if (!website.trim()) return ''
    if (website.startsWith('http://') || website.startsWith('https://')) {
      return website
    }
    return `https://${website}`
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!mounted) return
    
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploadingAvatar(true)
      setError(null)

      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file')
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image must be smaller than 5MB')
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase()
      const fileName = `${userId}.${fileExt}`

      const supabase = getSupabaseBrowserClientSafe()
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { 
          upsert: true,
          contentType: file.type 
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', userId)

      if (updateError) {
        console.error('Profile update error:', updateError)
        throw updateError
      }

      await fetchProfile()
    } catch (err: any) {
      console.error('Error uploading avatar:', err)
      setError(err.message || 'Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSave = async () => {
    if (!mounted) return
    
    try {
      setSaving(true)
      setError(null)

      const supabase = getSupabaseBrowserClientSafe()
      
      if (formData.username && formData.username !== profile?.username) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', formData.username)
          .neq('id', userId)
          .single()

        if (existingUser) {
          throw new Error('Username already taken')
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username || null,
          full_name: formData.full_name || null,
          bio: formData.bio || null,
          website: formatWebsiteForSave(formData.website),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        console.error('Save error:', error)
        throw error
      }

      await fetchProfile()
      setEditing(false)
    } catch (err: any) {
      console.error('Error saving profile:', err)
      setError(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePostClick = (post: any) => {
    if (!mounted) return
    setSelectedPost(post)
  }

  const handleModalClose = () => {
    if (!mounted) return
    setSelectedPost(null)
    fetchProfile()
  }

  const handleLogout = async () => {
    if (!mounted) return
    
    try {
      const supabase = getSupabaseBrowserClientSafe()
      await supabase.auth.signOut()
      
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  useEffect(() => {
    if (mounted) {
      fetchProfile()
    }
  }, [userId, mounted])

  // ✅ HYDRATION SAFETY: Show skeleton during SSR and loading states
  if (!mounted || loading) {
    return <ProfileSkeleton />
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Profile not found</h3>
          <p className="text-gray-600">This user profile doesn't exist or has been removed.</p>
        </div>
      </div>
    )
  }

  const currentBadge = getCurrentTierBadge(userBadges)

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
          <span className="text-red-700 text-sm sm:text-base">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* ✅ BRAND COLOR FIX: Use brand colors in gradient header */}
        <div className="relative h-32 sm:h-48 bg-gradient-to-r from-brand-green to-brand-blue">
          <div className="absolute inset-0 bg-black/10"></div>
        </div>

        <div className="relative px-4 sm:px-6 pb-6">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4 sm:gap-6 -mt-12 sm:-mt-16">
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-lg bg-gray-100 overflow-hidden">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.full_name || profile.username || 'User'}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brand-green to-brand-blue flex items-center justify-center">
                    <span className="text-2xl sm:text-4xl font-bold text-white">
                      {(profile.full_name || profile.username || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 sm:w-6 sm:h-6 text-white animate-spin" />
                  </div>
                )}
              </div>

              {isOwnProfile && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 p-1.5 sm:p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:scale-110 active:scale-95 hover:bg-gray-50 group"
                  disabled={uploadingAvatar}
                >
                  <Edit3 className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 group-hover:text-brand-green transition-colors duration-200" />
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            <div className="flex-1 lg:pb-4">
              {editing ? (
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => {
                        if (!mounted) return
                        setFormData(prev => ({ ...prev, full_name: e.target.value }))
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-brand-green text-sm sm:text-base"
                      placeholder="Your display name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => {
                        if (!mounted) return
                        setFormData(prev => ({ ...prev, username: e.target.value }))
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-brand-green text-sm sm:text-base"
                      placeholder="username"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    {profile.full_name || profile.username || 'Anonymous User'}
                  </h1>
                  {profile.username && (
                    <p className="text-base sm:text-lg text-gray-600 mb-2 sm:mb-4">@{profile.username}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 lg:pb-4">
              {isOwnProfile ? (
                editing ? (
                  <div className="flex items-center gap-2 w-full lg:w-auto">
                    <button
                      onClick={handleSave}
                      disabled={saving || !mounted}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-brand-greenDark transition-colors disabled:opacity-50 text-sm sm:text-base flex-1 lg:flex-initial justify-center"
                    >
                      {saving ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : <Save className="w-3 h-3 sm:w-4 sm:h-4" />}
                      Save
                    </button>
                    <button
                      onClick={() => {
                        if (!mounted) return
                        setEditing(false)
                        setFormData({
                          username: profile.username || '',
                          full_name: profile.full_name || '',
                          bio: profile.bio || '',
                          website: profile.website || ''
                        })
                      }}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base"
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Cancel</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 w-full lg:w-auto">
                    <button
                      onClick={() => {
                        if (!mounted) return
                        setEditing(true)
                      }}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base flex-1 lg:flex-initial justify-center"
                    >
                      <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Edit Profile</span>
                      <span className="sm:hidden">Edit</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm sm:text-base"
                    >
                      <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Logout</span>
                    </button>
                  </div>
                )
              ) : (
                <button className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blueDark transition-colors text-sm sm:text-base">
                  <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                  Follow
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 sm:mt-6 space-y-4">
            {editing ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => {
                      if (!mounted) return
                      setFormData(prev => ({ ...prev, bio: e.target.value }))
                    }}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-brand-green text-sm sm:text-base"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => handleWebsiteChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-brand-green text-sm sm:text-base"
                    placeholder="yourwebsite.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    We'll automatically add https:// if needed
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  {profile.bio && (
                    <div className="mb-4">
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{profile.bio}</p>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {profile.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-brand-blue transition-colors"
                      >
                        <Globe className="w-4 h-4" />
                        Website
                      </a>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Joined {stats?.joinedDaysAgo === 0 ? 'today' : `${stats?.joinedDaysAgo} days ago`}
                    </div>
                    {currentBadge && (
                      <div className="flex items-center gap-1 text-amber-600">
                        <span>{currentBadge.emoji}</span>
                        <span className="font-medium">{currentBadge.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <TidbitProgressTracker userId={userId} isOwnProfile={isOwnProfile} />

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
          <button
            onClick={() => {
              if (!mounted) return
              setActiveStatsFilter('created')
            }}
            className={`bg-white rounded-xl p-4 sm:p-6 text-center shadow-sm border transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95 ${
              activeStatsFilter === 'created' ? 'border-brand-green ring-2 ring-brand-green/20' : 'border-gray-200 hover:border-brand-green'
            }`}
          >
            <div className="text-xl sm:text-2xl font-bold text-brand-green mb-1">{stats.postsCount}</div>
            <div className="text-xs sm:text-sm text-gray-600">Posts Created</div>
            {activeStatsFilter === 'created' && (
              <div className="text-xs text-brand-green mt-1 font-medium">● Active</div>
            )}
          </button>
          
          <button
            onClick={() => {
              if (!mounted) return
              setActiveStatsFilter('top')
            }}
            className={`bg-white rounded-xl p-4 sm:p-6 text-center shadow-sm border transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95 ${
              activeStatsFilter === 'top' ? 'border-brand-blue ring-2 ring-brand-blue/20' : 'border-gray-200 hover:border-brand-blue'
            }`}
          >
            <div className="text-xl sm:text-2xl font-bold text-brand-blue mb-1">{stats.likesReceived}</div>
            <div className="text-xs sm:text-sm text-gray-600">Likes Received</div>
            {activeStatsFilter === 'top' && (
              <div className="text-xs text-brand-blue mt-1 font-medium">● Active</div>
            )}
          </button>
          
          <button
            onClick={() => {
              if (!mounted) return
              setActiveStatsFilter('liked')
            }}
            className={`bg-white rounded-xl p-4 sm:p-6 text-center shadow-sm border transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95 ${
              activeStatsFilter === 'liked' ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-200 hover:border-orange-500'
            }`}
          >
            <div className="text-xl sm:text-2xl font-bold text-orange-500 mb-1">{stats.likesGiven}</div>
            <div className="text-xs sm:text-sm text-gray-600">Likes Given</div>
            {activeStatsFilter === 'liked' && (
              <div className="text-xs text-orange-500 mt-1 font-medium">● Active</div>
            )}
          </button>

          <button
            onClick={() => {
              if (!mounted) return
              setActiveStatsFilter('received')
            }}
            className={`bg-white rounded-xl p-4 sm:p-6 text-center shadow-sm border transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95 ${
              activeStatsFilter === 'received' ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-gray-200 hover:border-purple-500'
            }`}
          >
            <div className="text-xl sm:text-2xl font-bold text-purple-500 mb-1">{stats.commentsReceived}</div>
            <div className="text-xs sm:text-sm text-gray-600">Comments Received</div>
            {activeStatsFilter === 'received' && (
              <div className="text-xs text-purple-500 mt-1 font-medium">● Active</div>
            )}
          </button>
          
          <button
            onClick={() => {
              if (!mounted) return
              setActiveStatsFilter('commented')
            }}
            className={`bg-white rounded-xl p-4 sm:p-6 text-center shadow-sm border transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95 ${
              activeStatsFilter === 'commented' ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-200 hover:border-indigo-500'
            }`}
          >
            <div className="text-xl sm:text-2xl font-bold text-indigo-500 mb-1">{stats.commentsGiven}</div>
            <div className="text-xs sm:text-sm text-gray-600">Comments Given</div>
            {activeStatsFilter === 'commented' && (
              <div className="text-xs text-indigo-500 mt-1 font-medium">● Active</div>
            )}
          </button>

          <div className="bg-white rounded-xl p-4 sm:p-6 text-center shadow-sm border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
            <div className="text-xl sm:text-2xl font-bold text-amber-600 mb-1">{stats.completedTidbits}</div>
            <div className="text-xs sm:text-sm text-amber-700">Tidbits Completed</div>
            <div className="flex items-center justify-center mt-1">
              <Trophy className="w-3 h-3 text-amber-500" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <Grid3X3 className="w-5 h-5 sm:w-6 sm:h-6 text-brand-green" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Recent Posts</h2>
        </div>
        
        <UserPostsGrid userId={userId} filter={activeStatsFilter} onPostClick={handlePostClick} />
      </div>

      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={handleModalClose}
        />
      )}
    </div>
  )
}

// ✅ HYDRATION SAFE: UserPostsGrid component with brand color fixes
function UserPostsGrid({ userId, filter = 'all', onPostClick }: { 
  userId: string
  filter?: 'all' | 'created' | 'liked' | 'top' | 'timeline' | 'commented' | 'received'
  onPostClick?: (post: any) => void
}) {
  const [mounted, setMounted] = useState(false)
  const [posts, setPosts] = useState<any[]>([])
  const [likedPosts, setLikedPosts] = useState<any[]>([])
  const [commentedPosts, setCommentedPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const getCurrentUser = async () => {
      if (!mounted) return
      
      try {
        const supabase = getSupabaseBrowserClientSafe()
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) {
          console.error('Auth error:', error)
          return
        }
        setCurrentUser(user)
      } catch (err) {
        console.error('Error getting current user:', err)
      }
    }
    getCurrentUser()
  }, [mounted])

  const isOwnProfile = currentUser?.id === userId

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!mounted) return
      
      try {
        setLoading(true)
        
        const supabase = getSupabaseBrowserClientSafe()
        
        const { data: createdPosts, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (postsError) {
          console.error('Posts error:', postsError)
          throw postsError
        }

        const postsWithLikes = await Promise.all(
          (createdPosts || []).map(async (post) => {
            const { count, error: countError } = await supabase
              .from('likes')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id)

            return {
              ...post,
              likes_count: countError ? 0 : (count || 0)
            }
          })
        )

        const postsWithComments = await Promise.all(
          postsWithLikes.map(async (post) => {
            const { count, error: countError } = await supabase
              .from('comments')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id)

            return {
              ...post,
              comments_count: countError ? 0 : (count || 0)
            }
          })
        )

        setPosts(postsWithComments)

        const { data: userLikes, error: likesError } = await supabase
          .from('likes')
          .select(`
            post_id,
            posts (*)
          `)
          .eq('user_id', userId)

        if (!likesError && userLikes) {
          const likedPostsData = userLikes.map(like => like.posts).filter(Boolean)
          setLikedPosts(likedPostsData)
        }

        const { data: userComments, error: commentsError } = await supabase
          .from('comments')
          .select(`
            post_id,
            posts!inner(*)
          `)
          .eq('user_id', userId)

        if (!commentsError && userComments) {
          const commentedPostsData = userComments.map(comment => comment.posts).filter(Boolean)
          const uniqueCommentedPosts = commentedPostsData.filter((post: any, index: number, self: any[]) => 
            index === self.findIndex((p: any) => p.id === post.id)
          )
          setCommentedPosts(uniqueCommentedPosts)
        }
      } catch (err) {
        console.error('Error fetching user posts:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserPosts()
  }, [userId, mounted])

  const getFilteredPosts = () => {
    switch (filter) {
      case 'created':
        return posts.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      case 'liked':
        return likedPosts
      case 'commented':
        return commentedPosts
      case 'received':
        const postsWithComments = posts.filter(post => (post.comments_count || 0) > 0)
        return postsWithComments.sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0))
      case 'top':
        const postsWithLikes = posts.filter(post => (post.likes_count || 0) > 0)
        return postsWithLikes.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
      case 'timeline':
        return posts.slice().sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      case 'all':
      default:
        return posts.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
  }

  const filteredPosts = getFilteredPosts()

  const getFilterTitle = () => {
    switch (filter) {
      case 'created': return 'Posts Created (Recent First)'
      case 'liked': return 'Posts You Liked'
      case 'commented': return 'Posts You Commented On'
      case 'received': return 'Posts with Comments Received'
      case 'top': return 'Posts with Likes (Most Liked First)'
      case 'timeline': return 'Timeline (Oldest First)'
      case 'all':
      default: return 'Recent Posts'
    }
  }

  if (!mounted || loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Loading...</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (filteredPosts.length === 0) {
    const getEmptyMessage = () => {
      switch (filter) {
        case 'created': return "No posts created yet."
        case 'liked': return "No liked posts yet."
        case 'commented': return "No commented posts yet."
        case 'received': return "No posts have received comments yet."
        case 'top': return "No posts have received likes yet."
        default: return "No posts yet."
      }
    }

    return (
      <div>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">{getFilterTitle()}</h3>
          <span className="text-sm text-gray-500">{filteredPosts.length} posts</span>
        </div>
        <div className="text-center py-8 sm:py-12">
          <Grid3X3 className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{getEmptyMessage()}</h3>
          <p className="text-gray-600 text-sm sm:text-base">
            {filter === 'liked' 
              ? "Start liking posts to see them here!"
              : filter === 'commented'
              ? "Start commenting on posts to see them here!"
              : filter === 'top'
              ? "Share amazing content to start receiving likes!"
              : "Share your AI creations to build your collection!"
            }
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">{getFilterTitle()}</h3>
        <span className="text-sm text-gray-500">{filteredPosts.length} posts</span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {(filter === 'created' ? filteredPosts : filteredPosts.slice(0, 12)).map((post) => (
          <div
            key={post.id}
            onClick={() => {
              if (!mounted) return
              onPostClick?.(post)
            }}
            className="aspect-square bg-gray-100 rounded-lg overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300 relative"
          >
            {post.media_url ? (
              <Image
                src={post.media_url}
                alt="User post"
                width={300}
                height={300}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-brand-green/20 to-brand-blue/20 flex items-center justify-center p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-700 line-clamp-4 text-center leading-relaxed">
                  {post.content}
                </p>
              </div>
            )}
            
            {post.is_private && isOwnProfile && (
              <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
                <Lock className="w-3 h-3" />
                Private
              </div>
            )}
            
            {post.is_pinned && (
              <div className="absolute top-2 right-2 bg-brand-blue text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
                <Pin className="w-3 h-3" />
                Pinned
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3 text-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
                    Day {post.tidbit}
                  </span>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
                      <Heart className="w-3 h-3" />
                      <span className="text-xs">{post.likes_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
                      <MessageCircle className="w-3 h-3" />
                      <span className="text-xs">{post.comments_count || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="text-center mt-1 sm:mt-2">
                  <span className="text-xs bg-white/20 px-2 sm:px-3 py-1 rounded-full backdrop-blur-sm">
                    Tap to view
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
