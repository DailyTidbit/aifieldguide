// src/app/components/PartnerProfileModal.tsx - Fixed Types
'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Building2, 
  User, 
  Crown, 
  Users, 
  Calendar, 
  Mail, 
  Phone, 
  Globe, 
  Edit3, 
  Loader2,
  AlertCircle,
  ArrowRight
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { supabaseClient } from '@/app/lib/supabaseClient'
import PartnerProfileSetupWizard from './PartnerProfileSetupWizard'
import type { PartnerInfo, PartnerProfile, CompanyProfile, MemberProfile, TeamMember } from './types/partner'

interface PartnerProfileModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  partnerInfo: PartnerInfo
}

export default function PartnerProfileModal({ isOpen, onClose, userId, partnerInfo }: PartnerProfileModalProps) {
  const [profile, setProfile] = useState<PartnerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [showSetupWizard, setShowSetupWizard] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchPartnerProfile()
    }
  }, [isOpen, partnerInfo.companyId, userId])

  const fetchPartnerProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch company profile
      const { data: companyProfile, error: companyError } = await supabaseClient
        .from('company_profiles')
        .select('*')
        .eq('company_id', partnerInfo.companyId)
        .maybeSingle()

      if (companyError && companyError.code !== 'PGRST116') {
        throw companyError
      }

      // Fetch member profile
      const { data: memberProfile, error: memberError } = await supabaseClient
        .from('company_member_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('company_id', partnerInfo.companyId)
        .maybeSingle()

      if (memberError && memberError.code !== 'PGRST116') {
        throw memberError
      }

      // Fetch team members (if admin)
      let teamMembers: TeamMember[] = []
      if (partnerInfo.role === 'company_admin') {
        const { data: teamData } = await supabaseClient
          .from('company_users')
          .select(`
            user_id,
            role,
            created_at,
            company_member_profiles(title),
            profiles!inner(full_name, id)
          `)
          .eq('company_id', partnerInfo.companyId)

        teamMembers = teamData?.map(member => ({
          id: member.user_id,
          name: (member as any).profiles?.full_name || 'Unknown',
          email: member.user_id, // We'd need to join auth.users for email
          role: member.role,
          joined: member.created_at
        })) || []
      }

      // Fetch stats
      const { count: listingCount } = await supabaseClient
        .from('tool_listings')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', partnerInfo.companyId)

      const profileData: PartnerProfile = {
        company: companyProfile || {},
        member: memberProfile || {},
        teamMembers,
        stats: {
          totalListings: listingCount || 0,
          monthlyViews: 2400, // Mock data - you'd calculate this
          clickThroughs: 156,
          sponsorships: 2
        }
      }

      setProfile(profileData)

      // Check if setup is needed
      const hasCompanyInfo = !!(companyProfile?.support_email && companyProfile?.logo_url)
      const hasMemberInfo = !!(memberProfile?.title)
      
      if (!hasCompanyInfo || !hasMemberInfo) {
        setNeedsSetup(true)
      }

    } catch (err) {
      console.error('Error fetching partner profile:', err)
      setError('Failed to load profile information')
    } finally {
      setLoading(false)
    }
  }

  const handleSetupComplete = () => {
    setShowSetupWizard(false)
    setNeedsSetup(false)
    fetchPartnerProfile() // Refresh data
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto relative">
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-gray-200 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#59B1E3]/10 rounded-lg">
              <Building2 className="w-6 h-6 text-[#59B1E3]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Partner Profile</h2>
              <p className="text-sm text-gray-600">{partnerInfo.companyName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#59B1E3]" />
              <span className="ml-3 text-gray-600">Loading profile...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Profile</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={fetchPartnerProfile}
                  className="px-4 py-2 bg-[#59B1E3] text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : needsSetup ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Complete Your Partner Profile</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Set up your partner profile to manage your company's presence on Daily Tidbit effectively.
              </p>
              <button
                onClick={() => setShowSetupWizard(true)}
                className="inline-flex items-center gap-2 bg-[#59B1E3] text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                <Building2 className="w-4 h-4" />
                Set Up Profile
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : profile ? (
            <PartnerProfileContent 
              profile={profile} 
              partnerInfo={partnerInfo}
              onEditClick={() => setShowSetupWizard(true)}
            />
          ) : null}
        </div>
      </div>

      {/* Setup Wizard */}
      {showSetupWizard && (
        <PartnerProfileSetupWizard
          isOpen={showSetupWizard}
          onClose={() => setShowSetupWizard(false)}
          onComplete={handleSetupComplete}
          userId={userId}
          partnerInfo={partnerInfo}
          existingProfile={profile}
        />
      )}
    </div>
  )
}

// Partner Profile Content Component
function PartnerProfileContent({ 
  profile, 
  partnerInfo, 
  onEditClick 
}: { 
  profile: PartnerProfile
  partnerInfo: PartnerInfo
  onEditClick: () => void
}) {
  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-[#59B1E3]/5 to-[#60A875]/5 rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Company Logo */}
            <div className="w-20 h-20 rounded-xl border-2 border-gray-200 bg-white overflow-hidden">
              {profile.company.logo_url ? (
                <Image
                  src={profile.company.logo_url}
                  alt={partnerInfo.companyName}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#59B1E3] to-[#60A875] flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
              )}
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900">{partnerInfo.companyName}</h3>
              <div className="flex items-center gap-2 mt-2">
                {partnerInfo.role === 'company_admin' ? (
                  <div className="flex items-center gap-1 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                    <Crown className="w-3 h-3" />
                    Company Admin
                  </div>
                ) : (
                  <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    <User className="w-3 h-3" />
                    Team Member
                  </div>
                )}
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  Member since {new Date(partnerInfo.memberSince).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onEditClick}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Edit Profile
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-[#59B1E3]">{profile.stats.totalListings}</div>
          <div className="text-sm text-gray-600">Tool Listings</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-[#60A875]">{profile.stats.monthlyViews.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Monthly Views</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{profile.stats.clickThroughs}</div>
          <div className="text-sm text-gray-600">Click-throughs</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{profile.stats.sponsorships}</div>
          <div className="text-sm text-gray-600">Sponsorships</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Company Information */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#59B1E3]" />
            Company Information
          </h4>
          
          <div className="space-y-4">
            {profile.company.support_email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Support Email</div>
                  <div className="text-sm text-gray-600">{profile.company.support_email}</div>
                </div>
              </div>
            )}
            
            {profile.company.billing_email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Billing Email</div>
                  <div className="text-sm text-gray-600">{profile.company.billing_email}</div>
                </div>
              </div>
            )}
            
            {profile.company.marketing_email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Marketing Email</div>
                  <div className="text-sm text-gray-600">{profile.company.marketing_email}</div>
                </div>
              </div>
            )}

            {(!profile.company.support_email && !profile.company.billing_email && !profile.company.marketing_email) && (
              <div className="text-center py-4 text-gray-500">
                <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm">No company information yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-[#60A875]" />
            Your Information
          </h4>
          
          <div className="space-y-4">
            {profile.member.title && (
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Job Title</div>
                  <div className="text-sm text-gray-600">{profile.member.title}</div>
                </div>
              </div>
            )}
            
            {profile.member.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Phone</div>
                  <div className="text-sm text-gray-600">{profile.member.phone}</div>
                </div>
              </div>
            )}
            
            {profile.member.timezone && (
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Timezone</div>
                  <div className="text-sm text-gray-600">{profile.member.timezone}</div>
                </div>
              </div>
            )}

            {(!profile.member.title && !profile.member.phone && !profile.member.timezone) && (
              <div className="text-center py-4 text-gray-500">
                <User className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm">No personal information yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Members (Admin only) */}
      {partnerInfo.role === 'company_admin' && profile.teamMembers.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#59B1E3]" />
            Team Members ({profile.teamMembers.length})
          </h4>
          
          <div className="space-y-3">
            {profile.teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{member.name}</div>
                    <div className="text-sm text-gray-600">
                      {member.role === 'company_admin' ? 'Company Admin' : 'Team Member'}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Joined {new Date(member.joined).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/partners/dashboard"
            className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all"
          >
            <Building2 className="w-4 h-4 text-[#59B1E3]" />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          
          <Link
            href="/partners/settings"
            className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all"
          >
            <Edit3 className="w-4 h-4 text-[#60A875]" />
            <span className="text-sm font-medium">Settings</span>
          </Link>
          
          <Link
            href="/partners/ads"
            className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all"
          >
            <Calendar className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium">Sponsor</span>
          </Link>
          
          <Link
            href="/partners/messages"
            className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all"
          >
            <Mail className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium">Support</span>
          </Link>
        </div>
      </div>
    </div>
  )
}