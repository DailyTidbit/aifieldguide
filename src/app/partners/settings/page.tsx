// src/app/partners/settings/page.tsx - FULLY HYDRATION SAFE WITH BRAND COLORS
'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { ArrowLeft, Save, AlertCircle, CheckCircle2, Mail, Bell, User, Building2, Globe, Loader2 } from 'lucide-react'
import Link from 'next/link'

type CompanyProfile = {
  support_email?: string | null
  billing_email?: string | null
  marketing_email?: string | null
  logo_url?: string | null
  socials?: Record<string, string> | null
}

type MemberProfile = {
  title?: string | null
  phone?: string | null
  timezone?: string | null
  notify_new_messages?: boolean
  notify_listing_changes?: boolean
  billing_email?: string | null
  marketing_email?: string | null
}

// Loading skeleton
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
    <header className="bg-white border-b">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-px bg-gray-300" />
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </header>
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-64 space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
          ))}
          <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse mt-8" />
        </div>
        <div className="flex-1">
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

// Form field component
const FormField = ({ 
  label, 
  icon: Icon, 
  value, 
  onChange, 
  type = 'text', 
  placeholder, 
  helper, 
  required = false,
  disabled = false
}: {
  label: string
  icon: any
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  helper?: string
  required?: boolean
  disabled?: boolean
}) => (
  <div>
    <label className="block">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
        <Icon className="h-4 w-4" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </div>
      <input
        type={type}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        value={value}
        onChange={(e) => !disabled && onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
      {helper && (
        <div className="text-xs text-gray-500 mt-1">{helper}</div>
      )}
    </label>
  </div>
)

// Notification toggle component
const NotificationToggle = ({ 
  label, 
  description, 
  checked, 
  onChange,
  disabled = false
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) => (
  <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
    <div className="flex-1">
      <div className="font-medium text-gray-900">{label}</div>
      <div className="text-sm text-gray-600 mt-1">{description}</div>
    </div>
    <label className="flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2 ${
        disabled 
          ? 'opacity-50 cursor-not-allowed'
          : checked ? 'bg-brand-greenDark' : 'bg-gray-200'
      }`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </div>
    </label>
  </div>
)

export default function VendorSettings() {
  // Hydration safety
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'company' | 'personal' | 'notifications'>('company')
  const [company, setCompany] = useState<CompanyProfile>({})
  const [member, setMember] = useState<MemberProfile>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [unsavedChanges, setUnsavedChanges] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      loadSettings()
    }
  }, [mounted])

  const loadSettings = useCallback(async () => {
    if (!mounted) return

    try {
      setLoading(true)
      setMessage(null)
      
      const res = await fetch('/api/partners/settings/profile', {
        method: 'GET',
        credentials: 'include'
      })
      
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/partners'
          return
        }
        const errorData = await res.json()
        throw new Error(errorData.error || `HTTP ${res.status}`)
      }
      
      const data = await res.json()
      setCompany(data.company || {})
      setMember(data.member || {})
    } catch (error: any) {
      console.error('Settings load error:', error)
      setMessage({ type: 'error', text: error.message || 'Unable to load settings' })
    } finally {
      setLoading(false)
    }
  }, [mounted])

  const save = useCallback(async () => {
    if (!mounted) return

    try {
      setSaving(true)
      setMessage(null)
      
      const res = await fetch('/api/partners/settings/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ company, member })
      })
      
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/partners'
          return
        }
        const errorData = await res.json()
        throw new Error(errorData.error || `HTTP ${res.status}`)
      }
      
      setMessage({ type: 'success', text: 'Settings saved successfully!' })
      setUnsavedChanges(false)
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      console.error('Settings save error:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }, [mounted, company, member])

  const updateCompany = useCallback((field: keyof CompanyProfile, value: string | null) => {
    if (!mounted) return
    setCompany(prev => ({ ...prev, [field]: value }))
    setUnsavedChanges(true)
  }, [mounted])

  const updateMember = useCallback((field: keyof MemberProfile, value: any) => {
    if (!mounted) return
    setMember(prev => ({ ...prev, [field]: value }))
    setUnsavedChanges(true)
  }, [mounted])

  const tabs = useMemo(() => [
    { id: 'company', label: 'Company Profile', icon: Building2 },
    { id: 'personal', label: 'Your Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ] as const, [])

  // Show loading during hydration
  if (!mounted || loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/partners/dashboard"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <div className="h-4 w-px bg-gray-300" />
            <h1 className="text-xl font-semibold">Company Settings</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Status Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
            {message.text}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Tab Navigation */}
          <div className="lg:w-64">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => mounted && setActiveTab(tab.id)}
                  disabled={!mounted}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors disabled:opacity-50 ${
                    activeTab === tab.id
                      ? 'bg-brand-greenDark text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Save Button */}
            <div className="mt-8">
              <button
                onClick={save}
                disabled={saving || !unsavedChanges || !mounted}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  saving || !unsavedChanges || !mounted
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-brand-greenDark text-white hover:bg-green-700 shadow-sm hover:shadow'
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {unsavedChanges ? 'Save Changes' : 'No Changes'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1">
            <div className="bg-white rounded-xl border border-gray-200">
              {/* Company Profile Tab */}
              {activeTab === 'company' && (
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-green/10 rounded-lg">
                      <Building2 className="h-6 w-6 text-brand-greenDark" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Company Profile</h2>
                      <p className="text-gray-600 text-sm">How your company appears across Daily Tidbit</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Logo Section */}
                    <div>
                      <FormField
                        label="Company Logo URL"
                        icon={Globe}
                        value={company.logo_url || ''}
                        onChange={(v) => updateCompany('logo_url', v)}
                        placeholder="https://your-company.com/logo.png"
                        helper="Recommended: 400x400px, PNG or SVG format"
                        disabled={!mounted}
                      />
                      {company.logo_url && (
                        <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-700 mb-2">Preview:</div>
                          <img 
                            src={company.logo_url} 
                            alt="Company logo" 
                            className="h-16 w-16 object-contain border rounded-lg bg-white"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Contact Emails */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        label="Support Email"
                        icon={Mail}
                        type="email"
                        value={company.support_email || ''}
                        onChange={(v) => updateCompany('support_email', v)}
                        placeholder="support@yourcompany.com"
                        helper="Where users can get help with your tool"
                        required
                        disabled={!mounted}
                      />
                      
                      <FormField
                        label="Billing Email"
                        icon={Mail}
                        type="email"
                        value={company.billing_email || ''}
                        onChange={(v) => updateCompany('billing_email', v)}
                        placeholder="billing@yourcompany.com"
                        helper="For invoices and payment-related emails"
                        disabled={!mounted}
                      />
                    </div>

                    <FormField
                      label="Marketing Email"
                      icon={Mail}
                      type="email"
                      value={company.marketing_email || ''}
                      onChange={(v) => updateCompany('marketing_email', v)}
                      placeholder="marketing@yourcompany.com"
                      helper="For partnership opportunities and marketing updates"
                      disabled={!mounted}
                    />
                  </div>
                </div>
              )}

              {/* Personal Profile Tab */}
              {activeTab === 'personal' && (
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-blue/10 rounded-lg">
                      <User className="h-6 w-6 text-brand-blueDark" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Your Profile</h2>
                      <p className="text-gray-600 text-sm">Your personal information and preferences</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        label="Job Title"
                        icon={User}
                        value={member.title || ''}
                        onChange={(v) => updateMember('title', v)}
                        placeholder="e.g. Marketing Manager, Founder, CTO"
                        helper="How you'd like to be addressed"
                        disabled={!mounted}
                      />
                      
                      <FormField
                        label="Phone Number"
                        icon={User}
                        type="tel"
                        value={member.phone || ''}
                        onChange={(v) => updateMember('phone', v)}
                        placeholder="+1 (555) 123-4567"
                        helper="For urgent account matters only"
                        disabled={!mounted}
                      />
                    </div>

                    <FormField
                      label="Timezone"
                      icon={Globe}
                      value={member.timezone || ''}
                      onChange={(v) => updateMember('timezone', v)}
                      placeholder="e.g. Pacific Time, UTC-8, America/Los_Angeles"
                      helper="Helps us schedule calls and send timely updates"
                      disabled={!mounted}
                    />

                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        label="Your Billing Email"
                        icon={Mail}
                        type="email"
                        value={member.billing_email || ''}
                        onChange={(v) => updateMember('billing_email', v)}
                        placeholder="your-email@company.com"
                        helper="Personal copy of billing notifications"
                        disabled={!mounted}
                      />
                      
                      <FormField
                        label="Your Marketing Email"
                        icon={Mail}
                        type="email"
                        value={member.marketing_email || ''}
                        onChange={(v) => updateMember('marketing_email', v)}
                        placeholder="your-email@company.com"
                        helper="Personal copy of partnership updates"
                        disabled={!mounted}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Bell className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Notification Preferences</h2>
                      <p className="text-gray-600 text-sm">Choose when and how you'd like to be contacted</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <NotificationToggle
                      label="New Messages"
                      description="Get notified when the Daily Tidbit team sends you a message"
                      checked={member.notify_new_messages || false}
                      onChange={(v) => updateMember('notify_new_messages', v)}
                      disabled={!mounted}
                    />
                    
                    <NotificationToggle
                      label="Listing Changes"
                      description="Get updates when your tool listing changes are approved or need revision"
                      checked={member.notify_listing_changes || false}
                      onChange={(v) => updateMember('notify_listing_changes', v)}
                      disabled={!mounted}
                    />

                    <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-brand-blueDark flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium text-blue-900">Important Account Updates</div>
                          <div className="text-sm text-blue-800 mt-1">
                            we'll always email you about billing issues, security alerts, and major changes to our partner program, regardless of these settings.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
