// src/app/api/partners/moderation/page.tsx - Updated for hydration safety and cookie auth
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Building2, 
  Mail, 
  Globe, 
  RefreshCw,
  AlertCircle,
  Send,
  Eye
} from 'lucide-react'
import { SafeDate } from '../../lib/clientUtils' // ✅ FIXED: Import SafeDate

type PartnerRequest = {
  id: string
  email: string
  full_name: string
  company_name: string
  company_website: string
  tool_name: string
  tool_description: string
  role: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  reviewed_at?: string
  reviewer_notes?: string
}

type Company = {
  id: string
  name: string
  website?: string
  created_at: string
}

export default function PartnerModerationPage() {
  const [requests, setRequests] = useState<PartnerRequest[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [newCompanyName, setNewCompanyName] = useState('')
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [mounted, setMounted] = useState(false)

  const { user, loading: authLoading, authState } = useAuth()

  // Hydration safety
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !authLoading) {
      loadData()
    }
  }, [selectedTab, mounted, authLoading])

  const loadData = async () => {
    if (!mounted || authLoading || authState !== 'has-company-access') return

    try {
      setLoading(true)
      setError(null)

      // Load requests - now uses cookie-based auth automatically
      const requestsRes = await fetch(`/api/partners/request-access?status=${selectedTab}`)

      if (!requestsRes.ok) {
        throw new Error('Failed to load requests')
      }

      const requestsData = await requestsRes.json()
      setRequests(requestsData.requests || [])

      // Load companies for assignment
      if (selectedTab === 'pending') {
        const companiesRes = await fetch('/api/companies')

        if (companiesRes.ok) {
          const companiesData = await companiesRes.json()
          setCompanies(companiesData.companies || [])
        }
      }

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (request: PartnerRequest) => {
    if (!mounted || !selectedCompanyId && !newCompanyName) {
      alert('Please select an existing company or enter a new company name')
      return
    }

    try {
      setProcessing(request.id)
      setError(null)

      let companyId = selectedCompanyId

      // Create new company if needed
      if (newCompanyName && !selectedCompanyId) {
        const companyRes = await fetch('/api/companies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: newCompanyName,
            website: request.company_website
          })
        })

        if (!companyRes.ok) {
          throw new Error('Failed to create company')
        }

        const companyData = await companyRes.json()
        companyId = companyData.company.id
      }

      // Send invitation - now uses cookie-based auth
      const inviteRes = await fetch('/api/partners/send-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: request.email,
          companyId: companyId,
          role: 'company_admin',
          requestId: request.id
        })
      })

      if (!inviteRes.ok) {
        const errorData = await inviteRes.json()
        throw new Error(errorData.error || 'Failed to send invitation')
      }

      // Refresh data
      await loadData()
      
      // Reset form
      setSelectedCompanyId('')
      setNewCompanyName('')

    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (request: PartnerRequest, reason: string) => {
    if (!mounted) return

    try {
      setProcessing(request.id)
      setError(null)

      const res = await fetch('/api/partners/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requestId: request.id,
          reason
        })
      })

      if (!res.ok) {
        throw new Error('Failed to reject request')
      }

      await loadData()

    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(null)
    }
  }

  // Show loading during hydration
  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-brand-green border-t-transparent rounded-full"></div>
      </div>
    )
  }

  // Auth check after mounted
  if (authState !== 'has-company-access' || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Admin access is required to view this page.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-brand-green border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-semibold">Partner Request Moderation</h1>
          <p className="text-gray-600 mt-1">Review and manage partner access requests</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <span className="text-red-800">{error}</span>
            <button
              onClick={loadData}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          {(['pending', 'approved', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                selectedTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({requests.length})
            </button>
          ))}
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                {selectedTab === 'pending' ? <Clock className="h-12 w-12 mx-auto" /> :
                 selectedTab === 'approved' ? <CheckCircle className="h-12 w-12 mx-auto" /> :
                 <XCircle className="h-12 w-12 mx-auto" />}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {selectedTab} requests
              </h3>
              <p className="text-gray-600">
                {selectedTab === 'pending' && 'New partner requests will appear here for review.'}
                {selectedTab === 'approved' && 'Approved requests will be listed here.'}
                {selectedTab === 'rejected' && 'Rejected requests will be listed here.'}
              </p>
            </div>
          ) : (
            requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                companies={companies}
                processing={processing === request.id}
                selectedCompanyId={selectedCompanyId}
                setSelectedCompanyId={setSelectedCompanyId}
                newCompanyName={newCompanyName}
                setNewCompanyName={setNewCompanyName}
                onApprove={() => handleApprove(request)}
                onReject={(reason) => handleReject(request, reason)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function RequestCard({
  request,
  companies,
  processing,
  selectedCompanyId,
  setSelectedCompanyId,
  newCompanyName,
  setNewCompanyName,
  onApprove,
  onReject
}: {
  request: PartnerRequest
  companies: Company[]
  processing: boolean
  selectedCompanyId: string
  setSelectedCompanyId: (id: string) => void
  newCompanyName: string
  setNewCompanyName: (name: string) => void
  onApprove: () => void
  onReject: (reason: string) => void
}) {
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const handleRejectSubmit = () => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }
    onReject(rejectReason)
    setShowRejectForm(false)
    setRejectReason('')
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{request.full_name}</h3>
            <p className="text-sm text-gray-600">{request.email}</p>
          </div>
        </div>
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          request.status === 'approved' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {request.status === 'pending' && <Clock className="w-4 h-4" />}
          {request.status === 'approved' && <CheckCircle className="w-4 h-4" />}
          {request.status === 'rejected' && <XCircle className="w-4 h-4" />}
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Company Information
          </h4>
          <div className="space-y-2 text-sm">
            <div><strong>Name:</strong> {request.company_name}</div>
            {request.company_website && (
              <div className="flex items-center gap-1">
                <strong>Website:</strong>
                <a 
                  href={request.company_website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-brand-green hover:underline flex items-center gap-1"
                >
                  {request.company_website}
                  <Globe className="w-3 h-3" />
                </a>
              </div>
            )}
            <div><strong>Role:</strong> {request.role}</div>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-3">AI Tool</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Name:</strong> {request.tool_name}</div>
            <div><strong>Description:</strong></div>
            <div className="bg-gray-50 rounded-lg p-3 text-xs">
              {request.tool_description}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ FIXED: Use SafeDate components instead of toLocaleDateString/toLocaleTimeString */}
      <div className="text-xs text-gray-500 mb-4">
        Submitted: <SafeDate date={request.created_at} format="short" /> at <SafeDate date={request.created_at} format="time" />
      </div>

      {/* Actions for pending requests */}
      {request.status === 'pending' && (
        <div className="border-t pt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign to Company
            </label>
            <div className="grid md:grid-cols-2 gap-4">
              <select
                value={selectedCompanyId}
                onChange={(e) => {
                  setSelectedCompanyId(e.target.value)
                  if (e.target.value) setNewCompanyName('')
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                disabled={processing}
              >
                <option value="">Select existing company...</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Or create new company..."
                value={newCompanyName}
                onChange={(e) => {
                  setNewCompanyName(e.target.value)
                  if (e.target.value) setSelectedCompanyId('')
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                disabled={processing}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onApprove}
              disabled={processing || (!selectedCompanyId && !newCompanyName)}
              className="flex items-center gap-2 bg-brand-green text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-greenDark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending Invite...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Approve & Send Invite
                </>
              )}
            </button>

            {!showRejectForm ? (
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={processing}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            ) : (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  placeholder="Rejection reason..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  onClick={handleRejectSubmit}
                  className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    setShowRejectForm(false)
                    setRejectReason('')
                  }}
                  className="text-gray-600 px-3 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Show review info for processed requests */}
      {request.status !== 'pending' && request.reviewed_at && (
        <div className="border-t pt-4">
          {/* ✅ FIXED: Use SafeDate component instead of toLocaleDateString */}
          <div className="text-xs text-gray-500">
            {request.status === 'approved' ? 'Approved' : 'Rejected'}: <SafeDate date={request.reviewed_at} format="short" />
            {request.reviewer_notes && (
              <div className="mt-1 bg-gray-50 rounded p-2">
                <strong>Notes:</strong> {request.reviewer_notes}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}