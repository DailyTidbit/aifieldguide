'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { getSupabaseBrowserClient } from '@/app/lib/supabaseClient'
import { User, Camera, ArrowRight, ArrowLeft, Check, Sparkles, Globe, ChevronRight, Upload, Loader2, X } from 'lucide-react'

interface ProfileSetupProps {
  userId: string
  onComplete: () => void
  onSkip?: () => void
  onDone?: () => void // optional callback for parent close
}

export default function ProfileSetupWizard({ userId, onComplete, onSkip, onDone }: ProfileSetupProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false) // HYDRATION FIX

  const [formData, setFormData] = useState({ full_name: '', username: '', bio: '', website: '', avatar_url: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const totalSteps = 3

  // HYDRATION FIX: Set mounted state
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!mounted) return // HYDRATION FIX: Guard against running during hydration
    
    const file = event.target.files?.[0]
    if (!file) return
    
    try {
      setUploadingAvatar(true)
      setError(null)
      
      const supabase = getSupabaseBrowserClient()
      const fileExt = file.name.split('.').pop()
      const filePath = `avatars/${userId}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError
      
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setFormData((prev) => ({ ...prev, avatar_url: data.publicUrl }))
    } catch (err) {
      setError('Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleComplete = async () => {
    if (!mounted) return // HYDRATION FIX: Prevent action during hydration

    try {
      setLoading(true)
      setError(null)
      
      const supabase = getSupabaseBrowserClient()
      
      if (formData.username) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', formData.username)
          .neq('id', userId)
          .single()
        
        if (existingUser) throw new Error('Username already taken')
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name || null,
          username: formData.username || null,
          bio: formData.bio || null,
          website: formData.website || null,
          avatar_url: formData.avatar_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
      
      if (error) throw error
      
      try { 
        onComplete() 
      } finally { 
        onDone?.() 
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => { 
    if (!mounted) return // HYDRATION FIX
    if (currentStep < totalSteps) setCurrentStep((s) => s + 1)
    else handleComplete() 
  }

  const prevStep = () => { 
    if (!mounted) return // HYDRATION FIX
    if (currentStep > 1) setCurrentStep((s) => s - 1) 
  }

  const canProceed = () => {
    if (!mounted) return false // HYDRATION FIX
    return currentStep === 1 ? formData.full_name.trim().length > 0 : true
  }

  // HYDRATION FIX: Show loading during hydration
  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8">
          <Loader2 className="h-8 w-8 animate-spin text-[#60A875] mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Complete Your Profile</h2>
            {onSkip && (
              <button 
                onClick={onSkip} 
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Skip for now
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index + 1 <= currentStep 
                    ? 'bg-[#60A875] text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {index + 1 < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                {index < totalSteps - 1 && (
                  <div className={`w-12 h-1 mx-2 rounded ${
                    index + 1 < currentStep ? 'bg-[#60A875]' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3">
            <X className="w-5 h-5 text-red-600" />
            <span className="text-red-700 text-sm">{error}</span>
            <button 
              onClick={() => setError(null)} 
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="p-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[#60A875] to-[#59B1E3] rounded-full mx-auto mb-4 flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Let's get to know you!</h3>
                <p className="text-gray-600">Tell us your name and choose a username</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name *
                  </label>
                  <input 
                    type="text" 
                    value={formData.full_name} 
                    onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#60A875] focus:border-[#60A875] text-lg" 
                    placeholder="Your full name" 
                    autoFocus 
                  />
                  <p className="text-sm text-gray-500 mt-1">This is how your name will appear to others</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username (optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                    <input 
                      type="text" 
                      value={formData.username} 
                      onChange={(e) => setFormData((p) => ({ 
                        ...p, 
                        username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') 
                      }))} 
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#60A875] focus:border-[#60A875] text-lg" 
                      placeholder="username" 
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Your unique handle for Daily Tidbit</p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[#60A875] to-[#59B1E3] rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Add your photo</h3>
                <p className="text-gray-600">Help others recognize you on BitBoard</p>
              </div>
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-gray-200 shadow-lg bg-gray-100 overflow-hidden">
                    {formData.avatar_url ? (
                      <Image 
                        src={formData.avatar_url} 
                        alt="Avatar preview" 
                        width={128} 
                        height={128} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#60A875] to-[#59B1E3] flex items-center justify-center">
                        <span className="text-4xl font-bold text-white">
                          {formData.full_name.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="absolute bottom-0 right-0 p-3 bg-[#60A875] text-white rounded-full shadow-lg hover:bg-green-600 transition-colors" 
                    disabled={uploadingAvatar}
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="flex items-center gap-3 px-6 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#60A875] hover:bg-green-50 transition-colors" 
                  disabled={uploadingAvatar}
                >
                  <Upload className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700">
                    {formData.avatar_url ? 'Change photo' : 'Upload a photo'}
                  </span>
                </button>
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarUpload} 
                  className="hidden" 
                />
                <p className="text-sm text-gray-500 text-center">
                  Choose a clear photo of yourself. You can always change this later.
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[#60A875] to-[#59B1E3] rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Tell your story</h3>
                <p className="text-gray-600">Share what you're passionate about (optional)</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea 
                    value={formData.bio} 
                    onChange={(e) => setFormData((p) => ({ ...p, bio: e.target.value }))} 
                    rows={4} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#60A875] focus:border-[#60A875]" 
                    placeholder="Tell us about yourself, your interests in AI, or what you're working on..." 
                  />
                  <p className="text-sm text-gray-500 mt-1">{formData.bio.length}/160 characters</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website or Portfolio
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="url" 
                      value={formData.website} 
                      onChange={(e) => setFormData((p) => ({ ...p, website: e.target.value }))} 
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#60A875] focus:border-[#60A875]" 
                      placeholder="https://yourwebsite.com" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1 || !mounted}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>
          <div className="flex items-center gap-3">
            {onSkip && currentStep === totalSteps && (
              <button 
                onClick={onSkip} 
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Skip for now
              </button>
            )}
            <button
              onClick={nextStep}
              disabled={!canProceed() || loading || !mounted}
              className="flex items-center gap-2 px-6 py-2 bg-[#60A875] text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : currentStep === totalSteps ? (
                <>
                  <Check className="w-4 h-4" />
                  Complete Setup
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProfilePreview({ profile }: { profile: any }) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
        <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
        {profile.avatar_url ? (
          <Image 
            src={profile.avatar_url} 
            alt={profile.full_name || profile.username || 'User'} 
            width={48} 
            height={48} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#60A875] to-[#59B1E3] flex items-center justify-center">
            <span className="text-lg font-bold text-white">
              {(profile.full_name || profile.username || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate">
          {profile.full_name || profile.username || 'Anonymous User'}
        </h4>
        {profile.username && <p className="text-sm text-gray-500 truncate">@{profile.username}</p>}
        {profile.bio && <p className="text-xs text-gray-600 truncate mt-1">{profile.bio}</p>}
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </div>
  )
}