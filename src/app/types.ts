// src/app/types.ts - Complete type definitions with username support

// =============================================================================
// Core Profile Types
// =============================================================================

export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  website: string | null
  created_at: string
  updated_at: string
  username_changed: boolean
  username_changed_at: string | null
}

// =============================================================================
// Username Management Types
// =============================================================================

export interface UsernamePool {
  id: number
  username: string
  batch_number: number
  assigned_to: string | null
  assigned_at: string | null
  created_at: string
}

export interface ReservedUsername {
  username: string
  created_at: string
}

export interface UsernameValidationResult {
  isValid: boolean
  error?: string
  suggestions?: string[]
}

// =============================================================================
// Auth & User Types
// =============================================================================

export type AuthState = 'loading' | 'logged-out' | 'no-company' | 'has-company-access' | 'needs-password-setup'

export interface AuthUser {
  id: string
  email: string | undefined
  created_at: string | undefined
  updated_at: string | undefined
  user_metadata: any
  profile?: {
    id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
    bio: string | null
    website: string | null
    created_at: string | null
    updated_at: string | null
    username_changed?: boolean
    username_changed_at?: string | null
  }
  company?: Company
  role?: string
  companyMembership?: CompanyMembership
}

export interface CompanyMembership {
  company_id: string
  role: 'company_admin' | 'company_editor' | 'company_member'
  created_at: string
}

export interface Company {
  id: string
  name: string
  website?: string | null
  domain?: string | null
  status: 'active' | 'inactive'
  domains?: string[] | null
}

export interface UseAuthReturn {
  user: AuthUser | null
  loading: boolean
  authState: AuthState
  mounted: boolean
  company: Company | null
  isCompanyAdmin: boolean
  isPartner: boolean
  signIn: (email: string, password?: string) => Promise<void>
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<void>
  signInWithMagicLink: (email: string, options?: any) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  refreshAuth: () => Promise<void>
  checkCompanyAccess: () => Promise<boolean>
}

// =============================================================================
// Partner System Types
// =============================================================================

export interface PartnerInfo {
  companyId: string
  companyName: string
  role: 'company_admin' | 'company_editor'
  memberSince: string
}

export interface PartnerProfile {
  company: CompanyProfile
  member: MemberProfile
  teamMembers: TeamMember[]
  stats: PartnerStats
}

export interface CompanyProfile {
  logo_url?: string
  support_email?: string
  billing_email?: string
  marketing_email?: string
  [key: string]: any
}

export interface MemberProfile {
  title?: string
  phone?: string
  timezone?: string
  billing_email?: string
  marketing_email?: string
  notify_new_messages?: boolean
  notify_listing_changes?: boolean
  [key: string]: any
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  joined: string
}

export interface PartnerStats {
  totalListings: number
  monthlyViews: number
  clickThroughs: number
  sponsorships: number
}

// =============================================================================
// Social Platform Types (BitBoard)
// =============================================================================

export interface Post {
  id: string
  user_id: string
  content: string
  media_url?: string | null
  tidbit?: number | null
  is_private: boolean
  is_pinned: boolean
  created_at: string
  updated_at: string
  likes_count?: number
  comments_count?: number
  user_profile?: {
    username: string | null
    full_name: string | null
    avatar_url: string | null
  }
}

export interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  user_profile?: {
    username: string | null
    full_name: string | null
    avatar_url: string | null
  }
}

export interface Like {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

// =============================================================================
// Tidbit & Progress Types
// =============================================================================

export interface Tidbit {
  id: number
  title: string
  description: string
  content: string
  video_url?: string | null
  created_at: string
  updated_at: string
  published: boolean
  featured_tool?: string | null
  category?: string | null
}

export interface TidbitProgress {
  id: string
  user_id: string
  tidbit_id: number
  viewed_at?: string | null
  tutor_used_at?: string | null
  posted_at?: string | null
  created_at: string
  updated_at: string
}

export interface UserStats {
  postsCount: number
  likesReceived: number
  likesGiven: number
  commentsGiven: number
  commentsReceived: number
  joinedDaysAgo: number
  completedTidbits: number
}

// =============================================================================
// Badge System Types
// =============================================================================

export interface Badge {
  id: string
  name: string
  emoji: string
  tagline: string
  tier: 'starter' | 'arcade' | 'web' | 'hacker' | 'voyager' | 'neural' | 'quantum'
  threshold: number
  theme: string
  type: 'posts' | 'tidbits' | 'engagement'
}

// =============================================================================
// Field Guide Types
// =============================================================================

export interface FieldGuideSection {
  id: string
  name: string
  description: string
  slug: string
  icon?: string | null
  color?: string | null
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface FieldGuideTool {
  id: string
  name: string
  description: string
  website: string
  logo_url?: string | null
  section_id: string
  pricing_model?: 'free' | 'freemium' | 'paid' | 'subscription' | null
  is_featured: boolean
  order_index: number
  created_at: string
  updated_at: string
  section?: FieldGuideSection
}

// =============================================================================
// API Response Types
// =============================================================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  count: number
  page: number
  limit: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

// =============================================================================
// Form & Validation Types
// =============================================================================

export interface AuthFormData {
  email: string
  password: string
  confirmPassword?: string
  fullName?: string
}

export interface ProfileFormData {
  username?: string
  full_name: string
  bio: string
  website: string
}

export interface ValidationError {
  field: string
  message: string
}

// =============================================================================
// Search & Filter Types
// =============================================================================

export interface SearchFilters {
  query?: string
  category?: string
  section?: string
  featured?: boolean
  pricing?: 'free' | 'freemium' | 'paid' | 'subscription'
  page?: number
  limit?: number
}

export interface SearchResult<T = any> {
  items: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}

// =============================================================================
// UI State Types
// =============================================================================

export interface LoadingState {
  isLoading: boolean
  message?: string
}

export interface ErrorState {
  hasError: boolean
  message?: string
  code?: string
}

export interface ModalState {
  isOpen: boolean
  type?: string
  data?: any
}

// =============================================================================
// Utility Types
// =============================================================================

export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// =============================================================================
// Component Prop Types
// =============================================================================

export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface UserProfileProps {
  userId: string
  isOwnProfile?: boolean
}

export interface PostCardProps {
  post: Post
  onLike?: (postId: string) => void
  onComment?: (postId: string) => void
  onDelete?: (postId: string) => void
  showActions?: boolean
}

export interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  redirectTo?: string | null
  title?: string
  subtitle?: string
}

export interface ProfileSetupWizardProps {
  userId: string
  onComplete: () => void
  onDone: () => void
}

// =============================================================================
// Environment & Config Types
// =============================================================================

export interface AppConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  siteUrl: string
  environment: 'development' | 'staging' | 'production'
  features: {
    analytics: boolean
    bitboard: boolean
    partners: boolean
    fieldGuide: boolean
  }
}

// =============================================================================
// Database Table Types (for direct queries)
// =============================================================================

export interface ProfilesTable {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  website: string | null
  created_at: string
  updated_at: string
  username_changed: boolean
  username_changed_at: string | null
}

export interface PostsTable {
  id: string
  user_id: string
  content: string
  media_url: string | null
  tidbit: number | null
  is_private: boolean
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export interface CommentsTable {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
}

export interface LikesTable {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export interface CompanyUsersTable {
  user_id: string
  company_id: string
  role: 'company_admin' | 'company_editor' | 'company_member'
  created_at: string
  updated_at: string
  invited_by: string | null
}

export interface UsernamePoolTable {
  id: number
  username: string
  batch_number: number
  assigned_to: string | null
  assigned_at: string | null
  created_at: string
}

export interface ReservedUsernamesTable {
  username: string
  created_at: string
}