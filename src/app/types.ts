// app/types.ts - Hydration-safe type definitions
export interface Post {
  id: string;
  created_at: string;
  user_id: string;
  type: string;
  content: string;
  before_text: string | null;
  after_text: string | null;
  media_url: string | null;
  tidbit: number;
  likes_count?: number;
}

// Auth state management - deterministic states only
export type AuthState = 
  | 'loading'                 // Checking session
  | 'logged-out'             // No session
  | 'needs-password-setup'   // Session exists, needs password
  | 'no-company'            // Authenticated, no company access
  | 'has-company-access';   // Full partner access

export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    has_password?: boolean;
    full_name?: string;
    avatar_url?: string;
    vendor_flow?: boolean;
    [key: string]: any;
  };
  created_at: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Company interface matching database schema exactly
export interface Company {
  id: string;
  name: string | null;
  website: string | null;
  domain: string | null;
  domains: string | null; // JSON array as string from database
  status: string | null; // Flexible to handle all possible statuses
  created_at?: string | null;
  updated_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface CompanyUser {
  user_id: string;
  company_id: string;
  role: string;
  created_at: string | null;
  updated_at: string | null;
  invited_by: string | null;
}

export interface CompanyMembership {
  company_id: string;
  role: string;
  created_at: string | null;
  companies?: Company;
}

// Consolidated AuthUser interface
export interface AuthUser extends User {
  profile?: Profile;
  companyMembership?: CompanyMembership;
  company?: Company;
  role?: string;
}

// Auth Hook Return Type - all methods must be stable across renders
export interface UseAuthReturn {
  // State
  user: AuthUser | null;
  loading: boolean;
  authState: AuthState;
  mounted: boolean; // Hydration safety
  
  // Company Info
  company: Company | null;
  isCompanyAdmin: boolean;
  isPartner: boolean; // Compatibility with existing code
  
  // Methods (these will be memoized in the hook implementation)
  signIn: (email: string, password?: string) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<void>;
  signInWithMagicLink: (email: string, options?: { redirectTo?: string }) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  
  // Utility methods
  checkCompanyAccess: () => Promise<boolean>;
  refreshAuth: () => Promise<void>;
}

// Additional commonly used types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Form state types for consistent form handling
export interface FormState<T = any> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Export utility type helpers
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;