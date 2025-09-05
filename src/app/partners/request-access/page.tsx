// src/app/partners/request-access/page.tsx - FULLY HYDRATION SAFE & BRAND CONSISTENT
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Mail, Building2, User, Globe, Send, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

// Types
type FormData = {
  email: string
  fullName: string
  companyName: string
  companyWebsite: string
  toolName: string
  toolDescription: string
  role: string
}

// Loading skeleton
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-px bg-gray-300" />
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </header>
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8 space-y-4">
          <div className="h-8 w-32 bg-gray-200 rounded-full animate-pulse mx-auto" />
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mx-auto" />
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse mx-auto" />
        </div>
        <div className="space-y-6">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
            </div>
          ))}
          <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  </div>
)

// Form field component - memoized for performance
const FormField = ({ 
  label, 
  value, 
  onChange, 
  type = 'text', 
  placeholder, 
  helper, 
  required = false,
  disabled = false
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  helper?: string
  required?: boolean
  disabled?: boolean
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => !disabled && onChange(e.target.value)}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      placeholder={placeholder}
      required={required}
      disabled={disabled}
    />
    {helper && (
      <div className="text-xs text-gray-500 mt-1">{helper}</div>
    )}
  </div>
)

// Success display component
const SuccessDisplay = ({ formData, mounted }: { formData: FormData; mounted: boolean }) => {
  if (!mounted) return <LoadingSkeleton />

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-greenDark rounded-lg"></div>
            <span className="font-bold text-xl text-gray-900">Daily Tidbit Partners</span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-brand-greenDark" />
          </div>
          
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">
            Request Submitted Successfully!
          </h1>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            Thank you for your interest in becoming a Daily Tidbit partner. We've received your request 
            and will review it within 2-3 business days.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-blue-900 mb-3">What happens next?</h3>
            <div className="space-y-3 text-sm text-blue-800 text-left">
              {[
                "Our team reviews your AI tool and company information",
                "we'll send you a secure login link via email if approved",
                "you'll set up your password and access the partner dashboard",
                "Start managing your tool listings and tracking performance"
              ].map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-brand-blueDark flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <div>{step}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <h4 className="font-medium text-gray-900 mb-2">Your submission details:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div><strong>Email:</strong> {formData.email}</div>
                <div><strong>Company:</strong> {formData.companyName}</div>
                <div><strong>Tool:</strong> {formData.toolName}</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link 
                href="/partners"
                className="flex items-center justify-center gap-2 bg-brand-greenDark text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Partner Hub
              </Link>
              <Link 
                href="/"
                className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Visit Daily Tidbit
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Questions? Email us at{' '}
              <a href="mailto:partners@dailytidbit.org" className="text-brand-greenDark hover:underline">
                partners@dailytidbit.org
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RequestAccessPage() {
  // Hydration safety
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    email: '',
    fullName: '',
    companyName: '',
    companyWebsite: '',
    toolName: '',
    toolDescription: '',
    role: ''
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mount effect
  useEffect(() => {
    setMounted(true)
  }, [])

  // Form update handler
  const updateForm = useCallback((field: keyof FormData, value: string) => {
    if (!mounted) return
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }, [mounted])

  // Submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mounted) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/partners/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit request')
      }

      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Failed to submit request. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [mounted, formData])

  // Form validation
  const isFormValid = useMemo(() => {
    const requiredFields = ['email', 'fullName', 'companyName', 'companyWebsite', 'toolName', 'toolDescription', 'role']
    return requiredFields.every(field => formData[field as keyof FormData].trim() !== '')
  }, [formData])

  // Show loading during hydration
  if (!mounted) {
    return <LoadingSkeleton />
  }

  // Show success page if submitted
  if (submitted) {
    return <SuccessDisplay formData={formData} mounted={mounted} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/partners"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Partner Hub
            </Link>
            <div className="h-4 w-px bg-gray-300" />
            <h1 className="text-xl font-semibold">Request Partner Access</h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          {/* Header */}
          <div className="p-8 pb-0">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-brand-green/10 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Building2 className="h-4 w-4" />
                Partner Application
              </div>
              
              <h1 className="text-2xl font-semibold text-gray-900 mb-4">
                Join Daily Tidbit's Partner Program
              </h1>
              
              <p className="text-gray-600 leading-relaxed">
                Get your AI tool in front of 30,000+ learners through our beginner-friendly lessons. 
                Fill out the form below and we'll review your application within 2-3 business days.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
                {error}
              </div>
            )}

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5" />
                Your Information
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  label="Full Name"
                  value={formData.fullName}
                  onChange={(v) => updateForm('fullName', v)}
                  placeholder="Your full name"
                  required
                  disabled={!mounted || loading}
                />
                
                <FormField
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(v) => updateForm('email', v)}
                  placeholder="your@company.com"
                  helper="we'll send your login link to this email"
                  required
                  disabled={!mounted || loading}
                />
              </div>

              <FormField
                label="Your Role"
                value={formData.role}
                onChange={(v) => updateForm('role', v)}
                placeholder="e.g. Founder, Marketing Manager, Product Manager"
                helper="Your role at the company"
                required
                disabled={!mounted || loading}
              />
            </div>

            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  label="Company Name"
                  value={formData.companyName}
                  onChange={(v) => updateForm('companyName', v)}
                  placeholder="Your company name"
                  required
                  disabled={!mounted || loading}
                />
                
                <FormField
                  label="Company Website"
                  type="url"
                  value={formData.companyWebsite}
                  onChange={(v) => updateForm('companyWebsite', v)}
                  placeholder="https://yourcompany.com"
                  helper="Your main company website"
                  required
                  disabled={!mounted || loading}
                />
              </div>
            </div>

            {/* Tool Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Your AI Tool
              </h3>
              
              <FormField
                label="Tool Name"
                value={formData.toolName}
                onChange={(v) => updateForm('toolName', v)}
                placeholder="The name of your AI tool"
                required
                disabled={!mounted || loading}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tool Description *
                </label>
                <textarea
                  value={formData.toolDescription}
                  onChange={(e) => updateForm('toolDescription', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Briefly describe what your AI tool does and how it helps users (2-3 sentences)"
                  required
                  disabled={!mounted || loading}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Help us understand how your tool fits into our educational content
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">What we look for:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• AI tools that solve real problems for everyday users</li>
                <li>• Clear value proposition that beginners can understand</li>
                <li>• Active product development and user support</li>
                <li>• Willingness to collaborate on educational content</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading || !isFormValid || !mounted}
              className="w-full flex items-center justify-center gap-2 bg-brand-greenDark text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Application
                </>
              )}
            </button>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                By submitting this form, you agree to our{' '}
                <Link href="/terms" className="text-brand-greenDark hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-brand-greenDark hover:underline">Privacy Policy</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
