'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import PostModal from './PostModal'  // Import the working PostModal
import { 
  User, 
  Camera, 
  Edit3, 
  Save, 
  X, 
  Upload, 
  Loader2, 
  Check, 
  AlertCircle,
  Globe,
  MapPin,
  Calendar,
  Heart,
  Grid3X3,
  Settings,
  LogOut,
  MessageCircle
} from 'lucide-react'
import Image from 'next/image'

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
  joinedDaysAgo: number
}

// Enhanced Profile Component
export default function UserProfile({ userId, isOwnProfile = false }: {
  userId: string
  isOwnProfile?: boolean
}) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [activeStatsFilter, setActiveStatsFilter] = useState<'all' | 'created' | 'liked' | 'top' | 'timeline' | 'commented'>('all')
  const [selectedPost, setSelectedPost] = useState<any>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    bio: '',
    website: ''
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch profile data
  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError

      setProfile(profileData)
      setFormData({
        username: profileData.username || '',
        full_name: profileData.full_name || '',
        bio: profileData.bio || '',
        website: profileData.website || ''
      })

      // Fetch stats
      await fetchStats()
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  // Fetch user statistics
  const fetchStats = async () => {
    try {
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
      if (userPosts && userPosts.length > 0) {
        const postIds = userPosts.map(post => post.id)
        const { count } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .in('post_id', postIds)
        likesReceived = count || 0
      }

      // Get likes given by user
      const { count: likesGiven } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Calculate days since joining
      const { data: profileData } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', userId)
        .single()

      const joinedDaysAgo = profileData 
        ? Math.floor((new Date().getTime() - new Date(profileData.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0

      setStats({
        postsCount: postsCount || 0,
        likesReceived,
        likesGiven: likesGiven || 0,
        joinedDaysAgo
      })
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploadingAvatar(true)
      setError(null)

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file')
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image must be smaller than 5MB')
      }

      // Create unique filename (just the filename, no path)
      const fileExt = file.name.split('.').pop()?.toLowerCase()
      const fileName = `${userId}.${fileExt}`

      console.log('Uploading file:', fileName, 'Size:', file.size, 'Type:', file.type)

      // Upload to Supabase Storage (fileName only, no folder path)
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

      console.log('Upload successful:', uploadData)

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      console.log('Public URL:', urlData.publicUrl)

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', userId)

      if (updateError) {
        console.error('Profile update error:', updateError)
        throw updateError
      }

      // Refresh profile
      await fetchProfile()
    } catch (err: any) {
      console.error('Error uploading avatar:', err)
      setError(err.message || 'Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  // Save profile changes
  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      // Validate username uniqueness if changed
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
          website: formData.website || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      await fetchProfile()
      setEditing(false)
    } catch (err: any) {
      console.error('Error saving profile:', err)
      setError(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  // Handle post click
  const handlePostClick = (post: any) => {
    setSelectedPost(post)
  }

  // Handle modal close
  const handleModalClose = () => {
    setSelectedPost(null)
    // Refresh posts after modal closes (in case post was deleted)
    fetchProfile()
  }

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  useEffect(() => {
    fetchProfile()
  }, [userId])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="relative h-48 bg-gradient-to-r from-[#60A875] to-[#59B1E3] animate-pulse"></div>
          <div className="relative px-6 pb-6">
            <div className="flex items-end gap-6 -mt-16">
              <div className="w-32 h-32 bg-gray-200 rounded-full animate-pulse border-4 border-white"></div>
              <div className="flex-1 space-y-3 pb-4">
                <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Profile not found</h3>
          <p className="text-gray-600">This user profile doesn't exist or has been removed.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Cover Image */}
        <div className="relative h-48 bg-gradient-to-r from-[#60A875] to-[#59B1E3]">
          <div className="absolute inset-0 bg-black/10"></div>
          {isOwnProfile && (
            <button className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors">
              <Camera className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Profile Info */}
        <div className="relative px-6 pb-6">
          <div className="flex flex-col lg:flex-row lg:items-end gap-6 -mt-16">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-100 overflow-hidden">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.full_name || profile.username || 'User'}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#60A875] to-[#59B1E3] flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">
                      {(profile.full_name || profile.username || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>

              {isOwnProfile && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:scale-110 active:scale-95 hover:bg-gray-50 group"
                  disabled={uploadingAvatar}
                >
                  <Camera className="w-4 h-4 text-gray-600 group-hover:text-[#60A875] transition-colors duration-200" />
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

            {/* User Info */}
            <div className="flex-1 lg:pb-4">
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#60A875] focus:border-[#60A875]"
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
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#60A875] focus:border-[#60A875]"
                      placeholder="username"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {profile.full_name || profile.username || 'Anonymous User'}
                  </h1>
                  {profile.username && (
                    <p className="text-lg text-gray-600 mb-4">@{profile.username}</p>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 lg:pb-4">
              {isOwnProfile ? (
                editing ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-[#60A875] text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false)
                        setFormData({
                          username: profile.username || '',
                          full_name: profile.full_name || '',
                          bio: profile.bio || '',
                          website: profile.website || ''
                        })
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )
              ) : (
                <button className="flex items-center gap-2 px-4 py-2 bg-[#59B1E3] text-white rounded-lg hover:bg-blue-600 transition-colors">
                  <Heart className="w-4 h-4" />
                  Follow
                </button>
              )}
            </div>
          </div>

          {/* Bio and Links */}
          <div className="mt-6 space-y-4">
            {editing ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#60A875] focus:border-[#60A875]"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#60A875] focus:border-[#60A875]"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  {profile.bio && (
                    <div className="mb-4">
                      <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {profile.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-[#59B1E3] transition-colors"
                      >
                        <Globe className="w-4 h-4" />
                        Website
                      </a>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Joined {stats?.joinedDaysAgo === 0 ? 'today' : `${stats?.joinedDaysAgo} days ago`}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid with Click Actions */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <button
            onClick={() => {
              console.log('Clicked Posts Created')
              setActiveStatsFilter('created')
            }}
            className={`bg-white rounded-xl p-6 text-center shadow-sm border transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95 ${
              activeStatsFilter === 'created' ? 'border-[#60A875] ring-2 ring-[#60A875]/20' : 'border-gray-200 hover:border-[#60A875]'
            }`}
          >
            <div className="text-2xl font-bold text-[#60A875] mb-1">{stats.postsCount}</div>
            <div className="text-sm text-gray-600">Posts Created</div>
            {activeStatsFilter === 'created' && (
              <div className="text-xs text-[#60A875] mt-1 font-medium">● Active Filter</div>
            )}
          </button>
          
          <button
            onClick={() => {
              console.log('Clicked Posts with Likes - setting filter to TOP')
              setActiveStatsFilter('top')
            }}
            className={`bg-white rounded-xl p-6 text-center shadow-sm border transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95 ${
              activeStatsFilter === 'top' ? 'border-[#59B1E3] ring-2 ring-[#59B1E3]/20' : 'border-gray-200 hover:border-[#59B1E3]'
            }`}
          >
            <div className="text-2xl font-bold text-[#59B1E3] mb-1">{stats.likesReceived}</div>
            <div className="text-sm text-gray-600">Posts with Likes</div>
            {activeStatsFilter === 'top' && (
              <div className="text-xs text-[#59B1E3] mt-1 font-medium">● Active Filter</div>
            )}
          </button>
          
          <button
            onClick={() => {
              console.log('Clicked Likes Given')
              setActiveStatsFilter('liked')
            }}
            className={`bg-white rounded-xl p-6 text-center shadow-sm border transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95 ${
              activeStatsFilter === 'liked' ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-200 hover:border-orange-500'
            }`}
          >
            <div className="text-2xl font-bold text-orange-500 mb-1">{stats.likesGiven}</div>
            <div className="text-sm text-gray-600">Likes Given</div>
            {activeStatsFilter === 'liked' && (
              <div className="text-xs text-orange-500 mt-1 font-medium">● Active Filter</div>
            )}
          </button>

          <button
            onClick={() => {
              console.log('Clicked Posts Commented')
              setActiveStatsFilter('commented')
            }}
            className={`bg-white rounded-xl p-6 text-center shadow-sm border transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95 ${
              activeStatsFilter === 'commented' ? 'border-green-500 ring-2 ring-green-500/20' : 'border-gray-200 hover:border-green-500'
            }`}
          >
            <div className="text-2xl font-bold text-green-500 mb-1">
              <MessageCircle className="w-6 h-6 mx-auto" />
            </div>
            <div className="text-sm text-gray-600">Posts Commented</div>
            {activeStatsFilter === 'commented' && (
              <div className="text-xs text-green-500 mt-1 font-medium">● Active Filter</div>
            )}
          </button>
          
          <button
            onClick={() => {
              console.log('Clicked Days Active')
              setActiveStatsFilter('timeline')
            }}
            className={`bg-white rounded-xl p-6 text-center shadow-sm border transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95 ${
              activeStatsFilter === 'timeline' ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-gray-200 hover:border-purple-500'
            }`}
          >
            <div className="text-2xl font-bold text-purple-500 mb-1">{stats.joinedDaysAgo}</div>
            <div className="text-sm text-gray-600">Days Active</div>
            {activeStatsFilter === 'timeline' && (
              <div className="text-xs text-purple-500 mt-1 font-medium">● Timeline View</div>
            )}
          </button>
        </div>
      )}

      {/* User's Posts Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Grid3X3 className="w-6 h-6 text-[#60A875]" />
          <h2 className="text-xl font-bold text-gray-900">Recent Posts</h2>
        </div>
        
        <UserPostsGrid userId={userId} filter={activeStatsFilter} onPostClick={handlePostClick} />
      </div>

      {/* Post Modal */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={handleModalClose}
        />
      )}
    </div>
  )
}

// Component to display user's posts in a grid with filtering
function UserPostsGrid({ userId, filter = 'all', onPostClick }: { 
  userId: string
  filter?: 'all' | 'created' | 'liked' | 'top' | 'timeline' | 'commented'
  onPostClick?: (post: any) => void
}) {
  const [posts, setPosts] = useState<any[]>([])
  const [likedPosts, setLikedPosts] = useState<any[]>([])
  const [commentedPosts, setCommentedPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        setLoading(true)
        
        // Simple approach: get posts first, then get like counts separately
        const { data: createdPosts, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (postsError) throw postsError

        console.log('Fetched posts:', createdPosts?.length || 0)

        // Get like counts for each post
        const postsWithLikes = await Promise.all(
          (createdPosts || []).map(async (post) => {
            const { count, error: countError } = await supabase
              .from('likes')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id)

            if (countError) {
              console.error('Error counting likes for post', post.id, countError)
              return { ...post, likes_count: 0 }
            }

            return {
              ...post,
              likes_count: count || 0
            }
          })
        )

        // Get comment counts for each post
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

        // Only log summary, not individual posts
        const totalLikes = postsWithComments.reduce((sum, post) => sum + (post.likes_count || 0), 0)
        const totalComments = postsWithComments.reduce((sum, post) => sum + (post.comments_count || 0), 0)
        console.log(`✅ Loaded ${postsWithComments.length} posts with ${totalLikes} total likes and ${totalComments} total comments`)
        setPosts(postsWithComments)

        // Fetch posts the user has liked
        const { data: userLikes, error: likesError } = await supabase
          .from('likes')
          .select(`
            post_id,
            posts (*)
          `)
          .eq('user_id', userId)

        if (likesError) throw likesError

        const likedPostsData = userLikes?.map(like => like.posts).filter(Boolean) || []
        setLikedPosts(likedPostsData)

        // Fetch posts the user has commented on
        const { data: userComments, error: commentsError } = await supabase
          .from('comments')
          .select(`
            post_id,
            posts (*)
          `)
          .eq('user_id', userId)

        if (commentsError) throw commentsError

        const commentedPostsData = userComments?.map(comment => comment.posts).filter(Boolean) || []
        // Remove duplicates in case user commented multiple times on same post
        const uniqueCommentedPosts = commentedPostsData.filter((post: any, index: number, self: any[]) => 
          index === self.findIndex((p: any) => p.id === post.id)
        )
        setCommentedPosts(uniqueCommentedPosts)
      } catch (err) {
        console.error('Error fetching user posts:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserPosts()
  }, [userId])

  // Filter posts based on selected filter
  const getFilteredPosts = () => {
    switch (filter) {
      case 'created':
        return posts.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        
      case 'liked':
        return likedPosts
        
      case 'commented':
        return commentedPosts
        
      case 'top':
        // Show ONLY posts that have received likes (Option 1)
        const postsWithLikes = posts.filter(post => (post.likes_count || 0) > 0)
        const topResult = postsWithLikes.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
        
        // Clean logging - only log when filter is active
        console.log(`🎯 POSTS WITH LIKES FILTER: Showing ${topResult.length} posts with likes (filtered from ${posts.length} total)`)
        if (topResult.length > 0) {
          console.log('📊 TOP 5 POSTS BY LIKES:')
          topResult.slice(0, 5).forEach((post, index) => {
            console.log(`  ${index + 1}. ${post.likes_count || 0} likes`)
          })
        }
        
        return topResult
        
      case 'timeline':
        return posts.slice().sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        
      case 'all':
      default:
        return posts.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
  }

  const filteredPosts = getFilteredPosts()

  // Get filter title
  const getFilterTitle = () => {
    switch (filter) {
      case 'created':
        return 'Posts Created (Recent First)'
      case 'liked':
        return 'Posts You Liked'
      case 'commented':
        return 'Posts You Commented On'
      case 'top':
        return 'Posts with Likes (Most Liked First)'
      case 'timeline':
        return 'Timeline (Oldest First)'
      case 'all':
      default:
        return 'Recent Posts'
    }
  }

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Loading...</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        case 'created':
          return "No posts created yet."
        case 'liked':
          return "No liked posts yet."
        case 'commented':
          return "No commented posts yet."
        case 'top':
          return "No posts have received likes yet."
        default:
          return "No posts yet."
      }
    }

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">{getFilterTitle()}</h3>
          <span className="text-sm text-gray-500">{filteredPosts.length} posts</span>
        </div>
        <div className="text-center py-12">
          <Grid3X3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{getEmptyMessage()}</h3>
          <p className="text-gray-600">
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
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{getFilterTitle()}</h3>
        <span className="text-sm text-gray-500">{filteredPosts.length} posts</span>
      </div>
      
      {/* Show all posts for created filter, but limit others to 12 for performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(filter === 'created' ? filteredPosts : filteredPosts.slice(0, 12)).map((post) => (
          <div
            key={post.id}
            onClick={() => onPostClick?.(post)}
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
              <div className="w-full h-full bg-gradient-to-br from-[#60A875]/20 to-[#59B1E3]/20 flex items-center justify-center p-4">
                <p className="text-sm text-gray-700 line-clamp-4 text-center">
                  {post.content}
                </p>
              </div>
            )}
            
            {/* Hover overlay with better click indication */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
                    Day {post.tidbit}
                  </span>
                  <div className="flex items-center gap-2">
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
                {/* Click to view indicator */}
                <div className="text-center mt-2">
                  <span className="text-xs bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                    Click to view
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show "Show All" button for created filter if there are more than 12 posts */}
      {filter === 'created' && posts.length > 12 && filteredPosts.length <= 12 && (
        <div className="text-center mt-6">
          <button
            onClick={() => {
              // This would need to be implemented to show all posts
              console.log('Show all posts clicked')
            }}
            className="px-6 py-2 bg-[#60A875] text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Show All {posts.length} Posts
          </button>
        </div>
      )}
    </div>
  )
}