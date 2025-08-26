// src/app/types.ts - Final clean version
export type Post = {
  id: string
  created_at: string
  user_id: string
  type: string
  content: string
  before_text: string | null
  after_text: string | null
  media_url: string | null
  tidbit: number
  likes_count?: number
}

// Auth Types
export type AuthState = 
  | 'loading'                 // Checking session
  | 'logged-out'             // No session
  | 'needs-password-setup'   // Session exists, needs password
  | 'no-company'            // Authenticated, no company access
  | 'has-company-access'    // Full partner access

export interface User {
  id: string
  email?: string
  user_metadata?: {
    has_password?: boolean
    full_name?: string
    avatar_url?: string
    vendor_flow?: boolean
    [key: string]: any
  }
  created_at: string
  updated_at?: string
}

export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  website: string | null
  created_at: string | null
  updated_at: string | null
}

export interface Company {
  id: string
  name: string
  website: string | null
  domain: string | null
  domains: string[] | null
  status: 'unverified' | 'verified' | 'suspended'
  created_at: string | null
  updated_at: string | null
  created_by: string | null
  updated_by: string | null
}

export interface CompanyUser {
  user_id: string
  company_id: string
  role: string // Keep as string since your DB doesn't enforce specific values
  created_at: string | null
  updated_at: string | null
  invited_by: string | null
}

export interface CompanyMembership {
  company_id: string
  role: string
  created_at: string | null
  companies: Company
}

export interface AuthUser extends User {
  profile?: Profile
  companyMembership?: CompanyMembership
}

// Auth Hook Return Type
export interface UseAuthReturn {
  // State
  user: AuthUser | null
  loading: boolean
  authState: AuthState
  
  // Company Info
  company: Company | null
  isCompanyAdmin: boolean
  
  // Methods
  signIn: (email: string, password?: string) => Promise<void>
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<void>
  signInWithMagicLink: (email: string, options?: any) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  
  // Utility
  checkCompanyAccess: () => Promise<boolean>
  refreshAuthState: () => Promise<void>
}