// src/app/components/PartnerProfileSetupWizard.tsx - Hydration Safe Version
'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  X,
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Building2, 
  User, 
  Bell,
  Upload,
  Loader2,
  Mail,
  Phone,
  Globe,
  Camera,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import Image from 'next/image'
import { getSupabaseBrowserClient } from '@/app/lib/supabaseClient'
import type { PartnerInfo, PartnerProfile } from '../types/partner'

interface PartnerProfileSetupWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  userId: string
  partnerInfo: PartnerInfo
  existingProfile?: PartnerProfile | null
}

const TIMEZONES = [
  'Pacific Time (PT)',
  'Mountain Time (MT)', 
  'Central Time (CT)',
  'Eastern Time (ET)',
  'UTC',
  'GMT',
  'CET (Central European Time)',
  'JST (Japan Standard Time)',
  'AEST (Australian Eastern Time)'
]

export default function PartnerProfileSetupWizard({ 
  isOpen, 
  onClose, 
  onComplete, 
  userId, 
  partnerInfo,
  existingProfile 
}: PartnerProfileSetupWizardProps) {
  const [mounted, setMounted] = useState(false)
  const [clientReady, setClientReady] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ? HYDRATION SAFE: Enhanced mounting and client checking
  useEffect(() => {
    setMounted(true)
    
    // Check if Supabase client is available
    const checkClient = () => {
      try {
        const client = getSupabaseBrowserClient()
        setClientReady(!!client)
      } catch (error) {
        console.warn('Supabase client not ready for partner wizard:', error)
        setClientReady(false)
      }
    }
    
    checkClient()
    
    // Recheck periodically in case client becomes available later
    const interval = setInterval(checkClient, 1000)
    
    return () => clearInterval(interval)
  }, [])

  // ? HYDRATION SAFE: Get Supabase client safely
  const getClient = () => {
    if (!mounted || !clientReady) {
      return null
    }
    
    try {
      return getSupabaseBrowserClient()
    } catch (error) {
      console.warn('Failed to get Supabase client for partner wizard:', error)
      return null
    }
  }

  // ? Check if operations are ready
  const isWizardReady = mounted && clientReady

  const totalSteps = isWizardReady && partnerInfo.role === 'company_admin' ? 4 : 3

  // Form data state - only initialize after mounted
  const [companyData, setCompanyData] = useState({
    logo_url: '',
    support_email: '',
    billing_email: '',
    marketing_email: ''
  })

  const [memberData, setMemberData] = useState({
    title: '',
    phone: '',
    timezone: '',
    billing_email: '',
    marketing_email: ''
  })

  const [notificationData, setNotificationData] = useState({
    notify_new_messages: true,
    notify_listing_changes: true
  })

  // Initialize form data after mounting and client ready
  useEffect(() => {
    if (isWizardReady && existingProfile) {
      setCompanyData({
        logo_url: existingProfile.company.logo_url || '',
        support_email: existingProfile.company.support_email || '',
        billing_email: existingProfile.company.billing_email || '',
        marketing_email: existingProfile.company.marketing_email || ''
      })

      setMemberData({
        title: existingProfile.member.title || '',
        phone: existingProfile.member.phone || '',
        timezone: existingProfile.member.timezone || '',
        billing_email: existingProfile.member.billing_email || '',
        marketing_email: existingProfile.member.marketing_email || ''
      })

      setNotificationData({
        notify_new_messages: existingProfile.member.notify_new_messages ?? true,
        notify_listing_changes: existingProfile.member.notify_listing_changes ?? true
      })
    }
  }, [isWizardReady, existingProfile])

  // ? HYDRATION SAFE: Handle logo upload with enhanced guards
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isWizardReady) {
      setError('System not ready. Please try again in a moment.')
      return
    }
    
    const supabase = getClient()
    if (!supabase) {
      setError('Upload service unavailable. Please try again.')
      return
    }
    
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploadingLogo(true)
      setError(null)

      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file')
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image must be smaller than 5MB')
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()?.toLowerCase()
      const fileName = `company-logos/${partnerInfo.companyId}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('company-assets')
        .getPublicUrl(fileName)

      setCompanyData(prev => ({ ...prev, logo_url: urlData.publicUrl }))
    } catch (err: any) {
      setError(err.message || 'Failed to upload logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  // ? HYDRATION SAFE: Save profile data with enhanced guards
  const handleComplete = async () => {
    if (!isWizardReady) {
      setError('System not ready. Please try again in a moment.')
      return
    }
    
    const supabase = getClient()
    if (!supabase) {
      setError('Save service unavailable. Please try again.')
      return
    }
    
    try {
      setLoading(true)
      setError(null)

      // Save company profile (if admin)
      if (partnerInfo.role === 'company_admin') {
        const { error: companyError } = await supabase
          .from('company_profiles')
          .upsert({
            company_id: partnerInfo.companyId,
            logo_url: companyData.logo_url || null,
            support_email: companyData.support_email || null,
            billing_email: companyData.billing_email || null,
            marketing_email: companyData.marketing_email || null,
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'company_id'
          })

        if (companyError) throw companyError
      }

      // Save member profile
      const { error: memberError } = await supabase
        .from('company_member_profiles')
        .upsert({
          user_id: userId,
          company_id: partnerInfo.companyId,
          title: memberData.title || null,
          phone: memberData.phone || null,
          timezone: memberData.timezone || null,
          billing_email: memberData.billing_email || null,
          marketing_email: memberData.marketing_email || null,
          notify_new_messages: notificationData.notify_new_messages,
          notify_listing_changes: notificationData.notify_listing_changes,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'user_id,company_id' 
        })

      if (memberError) throw memberError

      onComplete()
    } catch (err: any) {
      console.error('Error saving partner profile:', err)
      setError(err.message || 'Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleComplete()
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  // ? HYDRATION SAFE: Validation for each step
  const canProceed = () => {
    if (!isWizardReady) return false
    
    switch (currentStep) {
      case 1: // Company setup (admin only)
        if (partnerInfo.role !== 'company_admin') return true
        return companyData.support_email.trim().length > 0
      case 2: // Personal info
        return memberData.title.trim().length > 0
      case 3: // Notifications
        return true
      default:
        return true
    }
  }

  const getStepTitle = () => {
    if (!isWizardReady) return 'Setup'
    
    if (partnerInfo.role === 'company_admin') {
      switch (currentStep) {
        case 1: return 'Company Information'
        case 2: return 'Your Information'
        case 3: return 'Notifications'
        case 4: return 'Complete Setup'
        default: return 'Setup'
      }
    } else {
      switch (currentStep) {
        case 1: return 'Your Information'
        case 2: return 'Notifications'  
        case 3: return 'Complete Setup'
        default: return 'Setup'
      }
    }
  }

  // ? HYDRATION SAFE: Early return for SSR and client readiness
  if (!isOpen) return null
  
  if (!mounted || !clientReady) {
    return (
      <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full p-8">
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-gray-600">
              <Loader2 className="w-8 h-8 animate-spin text-[brand-blue]" />
              <span className="text-sm">
                {!mounted ? 'Loading...' : 'Connecting to services...'}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const adjustedStep = partnerInfo.role === 'company_admin' ? currentStep : currentStep + 1

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[brand-blue]/10 rounded-lg">
                <Building2 className="w-6 h-6 text-[brand-blue]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {existingProfile ? 'Update' : 'Set Up'} Partner Profile
                </h2>
                <p className="text-sm text-gray-600">{partnerInfo.companyName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index + 1 <= currentStep 
                    ? 'bg-[brand-blue] text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {index + 1 < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                {index < totalSteps - 1 && (
                  <div className={`w-12 h-1 mx-2 rounded ${
                    index + 1 < currentStep ? 'bg-[brand-blue]' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-2">
            <div className="text-sm text-gray-600">
              Step {currentStep} of {totalSteps}: {getStepTitle()}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step Content */}
        <div className="p-6">
          {/* Step 1: Company Setup (Admin Only) */}
          {partnerInfo.role === 'company_admin' && currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[brand-blue] to-[brand-green] rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Company Information</h3>
                <p className="text-gray-600">Set up your company's profile information</p>
              </div>

              {/* Company Logo */}
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-xl border-2 border-gray-200 shadow-sm bg-gray-100 overflow-hidden">
                    {companyData.logo_url ? (
                      <Image
                        src={companyData.logo_url}
                        alt="Company logo"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[brand-blue] to-[brand-green] flex items-center justify-center">
                        <Building2 className="w-12 h-12 text-white" />
                      </div>
                    )}
                    {uploadingLogo && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo || !isWizardReady}
                    className="absolute bottom-0 right-0 p-3 bg-[brand-blue] text-white rounded-full shadow-lg hover:bg-brand-blueDark transition-colors disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo || !isWizardReady}
                  className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-[brand-blue] hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {companyData.logo_url ? 'Change Logo' : 'Upload Company Logo'}
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>

              {/* Company Contact Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Support Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={companyData.support_email}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, support_email: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[brand-blue]/20 focus:border-[brand-blue] transition-colors"
                      placeholder="support@yourcompany.com"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Where users can get help with your tool</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Billing Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={companyData.billing_email}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, billing_email: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[brand-blue]/20 focus:border-[brand-blue] transition-colors"
                      placeholder="billing@yourcompany.com"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">For invoices and payment notifications</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marketing Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={companyData.marketing_email}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, marketing_email: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[brand-blue]/20 focus:border-[brand-blue] transition-colors"
                      placeholder="marketing@yourcompany.com"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">For partnership opportunities and updates</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2/1: Personal Information */}
          {((partnerInfo.role === 'company_admin' && currentStep === 2) || (partnerInfo.role !== 'company_admin' && currentStep === 1)) && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[brand-green] to-[brand-blue] rounded-full mx-auto mb-4 flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Information</h3>
                <p className="text-gray-600">Tell us about your role and contact preferences</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={memberData.title}
                      onChange={(e) => setMemberData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[brand-green]/20 focus:border-[brand-green] transition-colors"
                      placeholder="e.g. Marketing Manager, CEO, Developer"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Your role within the company</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={memberData.phone}
                      onChange={(e) => setMemberData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[brand-green]/20 focus:border-[brand-green] transition-colors"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">For urgent support matters (optional)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={memberData.timezone}
                      onChange={(e) => setMemberData(prev => ({ ...prev, timezone: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[brand-green]/20 focus:border-[brand-green] transition-colors"
                    >
                      <option value="">Select timezone</option>
                      {TIMEZONES.map(tz => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Helps us schedule calls and support</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Personal Billing Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={memberData.billing_email}
                        onChange={(e) => setMemberData(prev => ({ ...prev, billing_email: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[brand-green]/20 focus:border-[brand-green] transition-colors"
                        placeholder="your.email@company.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Personal Marketing Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={memberData.marketing_email}
                        onChange={(e) => setMemberData(prev => ({ ...prev, marketing_email: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[brand-green]/20 focus:border-[brand-green] transition-colors"
                        placeholder="your.email@company.com"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3/2: Notifications */}
          {((partnerInfo.role === 'company_admin' && currentStep === 3) || (partnerInfo.role !== 'company_admin' && currentStep === 2)) && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[brand-blue] to-[brand-green] rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Bell className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Notification Preferences</h3>
                <p className="text-gray-600">Choose what updates you'd like to receive</p>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Email Notifications</h4>
                  
                  <div className="space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={notificationData.notify_new_messages}
                        onChange={(e) => setNotificationData(prev => ({ 
                          ...prev, 
                          notify_new_messages: e.target.checked 
                        }))}
                        className="mt-1 w-4 h-4 text-[brand-blue] border-gray-300 rounded focus:ring-[brand-blue]/20 focus:ring-2"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 group-hover:text-[brand-blue] transition-colors">
                          New Messages & Support Updates
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Get notified when you receive new support messages or important announcements
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={notificationData.notify_listing_changes}
                        onChange={(e) => setNotificationData(prev => ({ 
                          ...prev, 
                          notify_listing_changes: e.target.checked 
                        }))}
                        className="mt-1 w-4 h-4 text-[brand-blue] border-gray-300 rounded focus:ring-[brand-blue]/20 focus:ring-2"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 group-hover:text-[brand-blue] transition-colors">
                          Tool Listing Updates
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Get notified about changes to your tool listings, reviews, and performance metrics
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Bell className="w-5 h-5 text-brand-blueDark flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium text-blue-900 mb-1">You can always change these later</div>
                      <div className="text-blue-700">
                        Update your notification preferences anytime in your partner settings.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Final Step: Complete Setup */}
          {currentStep === totalSteps && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[brand-green] to-[brand-blue] rounded-full mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">you&apos;re All Set!</h3>
                <p className="text-gray-600">Review your information and complete setup</p>
              </div>

              <div className="space-y-6">
                {/* Company Summary (Admin only) */}
                {partnerInfo.role === 'company_admin' && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-[brand-blue]" />
                      Company Information
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Support Email:</span>
                        <span className="font-medium">{companyData.support_email || 'Not set'}</span>
                      </div>
                      {companyData.billing_email && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Billing Email:</span>
                          <span className="font-medium">{companyData.billing_email}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Company Logo:</span>
                        <span className="font-medium">{companyData.logo_url ? 'Uploaded' : 'Default'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Personal Summary */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-[brand-green]" />
                    Your Information
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Job Title:</span>
                      <span className="font-medium">{memberData.title || 'Not set'}</span>
                    </div>
                    {memberData.phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{memberData.phone}</span>
                      </div>
                    )}
                    {memberData.timezone && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Timezone:</span>
                        <span className="font-medium">{memberData.timezone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notifications Summary */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[brand-blue]" />
                    Notifications
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      {notificationData.notify_new_messages ? (
                        <CheckCircle2 className="w-4 h-4 text-brand-greenDark" />
                      ) : (
                        <X className="w-4 h-4 text-gray-400" />
                      )}
                      <span>New messages & support updates</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {notificationData.notify_listing_changes ? (
                        <CheckCircle2 className="w-4 h-4 text-brand-greenDark" />
                      ) : (
                        <X className="w-4 h-4 text-gray-400" />
                      )}
                      <span>Tool listing updates</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={nextStep}
              disabled={!canProceed() || loading || !isWizardReady}
              className="flex items-center gap-2 px-6 py-3 bg-[brand-blue] text-white rounded-lg hover:bg-brand-blueDark disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : currentStep === totalSteps ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
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
