// src/app/components/types/partner.ts - Partner Profile Types for Components
export interface PartnerInfo {
  companyId: string
  companyName: string
  role: string  // Change from 'company_admin' | 'company_editor' to string
  memberSince: string
}

export interface CompanyProfile {
  logo_url?: string | null
  support_email?: string | null
  billing_email?: string | null
  marketing_email?: string | null
  socials?: Record<string, string> | null
}

export interface MemberProfile {
  title?: string | null
  phone?: string | null
  timezone?: string | null
  notify_new_messages?: boolean
  notify_listing_changes?: boolean
  billing_email?: string | null
  marketing_email?: string | null
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  joined: string
}

export interface PartnerProfile {
  company: CompanyProfile
  member: MemberProfile
  teamMembers: TeamMember[]
  stats: {
    totalListings: number
    monthlyViews: number
    clickThroughs: number
    sponsorships: number
  }
}