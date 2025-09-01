// src/app/admin/preview-manager/page.tsx
// Admin interface for managing preview tokens - Hydration Safe
'use client'

import { useState, useEffect } from 'react'
import { 
  Building2, 
  Plus, 
  Copy, 
  ExternalLink, 
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Mail,
  Search,
  Calendar,
  Loader2
} from 'lucide-react'

interface PreviewToken {
  token: string
  previewUrl: string
  expires_at: string
  created_at: string
  used_at: string | null
  isExpired: boolean
  isUsed: boolean
}

interface Company {
  id: string
  name: string
  domain: string
  domains: string[]
}

export default function PreviewManagerPage() {
  // Hydration safety state
  const [mounted, setMounted] = useState(false)
  
  // Component state
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [tokens, setTokens] = useState<PreviewToken[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [expiresInHours, setExpiresInHours] = useState(72)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Hydration safety - mount guard
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      loadCompanies()
    }
  }, [mounted])

  useEffect(() => {
    if (mounted && selectedCompany) {
      loadTokens(selectedCompany.id)
    }
  }, [mounted, selectedCompany])

  const loadCompanies = async () => {
    try {
      // This would be a real API call to get companies
      // For now, using mock data
      const mockCompanies: Company[] = [
        { id: '1', name: 'Stripe', domain: 'stripe.com', domains: ['stripe.com'] },
        { id: '2', name: 'Microsoft', domain: 'microsoft.com', domains: ['microsoft.com'] },
        { id: '3', name: 'Anthropic', domain: 'anthropic.com', domains: ['anthropic.com'] }
      ]
      setCompanies(mockCompanies)
    } catch (error) {
      console.error('Error loading companies:', error)
    }
  }

  const loadTokens = async (companyId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/partners/preview/generate?companyId=${companyId}`)
      const data = await response.json()
      
      if (response.ok) {
        setTokens(data.tokens || [])
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to load tokens' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error loading tokens' })
    } finally {
      setLoading(false)
    }
  }

  const generateToken = async () => {
    if (!selectedCompany) return
    
    setGenerating(true)
    try {
      const response = await fetch('/api/partners/preview/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompany.id,
          expiresInHours
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: `Preview token generated for ${data.companyName}` })
        loadTokens(selectedCompany.id) // Refresh tokens
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to generate token' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error generating token' })
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    // Hydration-safe clipboard access
    if (!mounted || typeof window === 'undefined' || !navigator.clipboard) {
      setMessage({ type: 'error', text: 'Clipboard not available' })
      return
    }
    
    navigator.clipboard.writeText(text).then(() => {
      setMessage({ type: 'success', text: 'Copied to clipboard!' })
      setTimeout(() => setMessage(null), 2000)
    }).catch(() => {
      setMessage({ type: 'error', text: 'Failed to copy to clipboard' })
    })
  }

  const generateEmailTemplate = (company: Company, previewUrl: string) => {
    return `Subject: Check out your ${company.name} Daily Tidbit partner portal

Hi there!

I wanted to show you what your company's Daily Tidbit partner portal would look like. Click the link below to see your personalized dashboard with real data:

${previewUrl}

You'll be able to explore:
• Your company's analytics and performance metrics
• Tool listing management interface  
• Sponsorship opportunities ($1 intro rate!)
• Direct support and communication tools

This is a read-only preview - you can click around and see everything, but you'll need to sign up with your work email to make any changes.

The preview link expires in ${Math.round(expiresInHours/24)} day${expiresInHours > 24 ? 's' : ''}.

Let me know if you have any questions!

Best regards,
[Your name]
Daily Tidbit Team`
  }

  const openInNewTab = (url: string) => {
    // Hydration-safe window access
    if (!mounted || typeof window === 'undefined') return
    window.open(url, '_blank')
  }

  // Loading state for hydration
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="body-medium">Loading preview manager...</span>
        </div>
      </div>
    )
  }

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.domain.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h1 className="heading-section text-gray-900 mb-2">Preview Token Manager</h1>
          <p className="body-medium text-gray-600">Generate and manage preview links for company partner portals</p>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <span className="body-medium">{message.text}</span>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Company Selection */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="heading-subsection text-gray-900 mb-4">Select Company</h2>
            
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-brand-green transition-colors"
              />
            </div>

            {/* Company List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredCompanies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => setSelectedCompany(company)}
                  className={`w-full p-3 rounded-lg border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 ${
                    selectedCompany?.id === company.id
                      ? 'bg-brand-green/10 border-brand-green text-brand-green'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5" />
                    <div>
                      <div className="body-bold">{company.name}</div>
                      <div className="body-small text-gray-500">@{company.domain}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Token Generation */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="heading-subsection text-gray-900 mb-4">Generate Preview Token</h2>
            
            {selectedCompany ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <span className="body-bold text-blue-900">{selectedCompany.name}</span>
                  </div>
                  <div className="body-small text-blue-800">
                    Domain: {selectedCompany.domain}
                  </div>
                </div>

                <div>
                  <label className="block body-medium text-gray-700 mb-2">
                    Expires in (hours)
                  </label>
                  <select
                    value={expiresInHours}
                    onChange={(e) => setExpiresInHours(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-brand-green transition-colors"
                  >
                    <option value={24}>24 hours (1 day)</option>
                    <option value={48}>48 hours (2 days)</option>
                    <option value={72}>72 hours (3 days)</option>
                    <option value={168}>168 hours (1 week)</option>
                  </select>
                </div>

                <button
                  onClick={generateToken}
                  disabled={generating}
                  className="w-full bg-brand-green text-white py-3 px-4 rounded-lg body-bold hover:bg-brand-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Generate Preview Link
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="body-medium">Select a company to generate a preview token</p>
              </div>
            )}
          </div>

          {/* Existing Tokens */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="heading-subsection text-gray-900 mb-4">Existing Tokens</h2>
            
            {selectedCompany ? (
              loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-green mx-auto mb-2" />
                  <p className="body-small text-gray-500">Loading tokens...</p>
                </div>
              ) : tokens.length > 0 ? (
                <div className="space-y-3">
                  {tokens.map((token, index) => (
                    <div key={token.token} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {token.isExpired ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : token.isUsed ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className="body-small font-medium">
                            {token.isExpired ? 'Expired' : token.isUsed ? 'Used' : 'Active'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => copyToClipboard(token.previewUrl)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 rounded"
                            title="Copy URL"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => openInNewTab(token.previewUrl)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 rounded"
                            title="Open preview"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => copyToClipboard(generateEmailTemplate(selectedCompany, token.previewUrl))}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 rounded"
                            title="Copy email template"
                          >
                            <Mail className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="body-small text-gray-500 space-y-1">
                        <div>Created: {new Date(token.created_at).toLocaleDateString()}</div>
                        <div>Expires: {new Date(token.expires_at).toLocaleDateString()}</div>
                        {token.used_at && (
                          <div>Used: {new Date(token.used_at).toLocaleDateString()}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="body-small">No preview tokens found</p>
                </div>
              )
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="body-small">Select a company to view tokens</p>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="body-bold text-blue-900 mb-3">How to use preview tokens:</h3>
          <div className="space-y-2 body-small text-blue-800">
            <div className="flex items-start gap-2">
              <span className="font-medium">1.</span>
              <span>Select a company and generate a preview token</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">2.</span>
              <span>Copy the preview URL or email template</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">3.</span>
              <span>Send to the company contact - they can explore their portal without signing up</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">4.</span>
              <span>When they're ready, they'll see clear CTAs to sign up with their work email</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}