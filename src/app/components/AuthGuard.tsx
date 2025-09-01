// app/components/AuthGuard.tsx - Hydration-safe route protection
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import type { AuthState } from '../types'

interface AuthGuardProps {
  children: React.ReactNode
  requiredState?: AuthState | AuthState[]
  redirectTo?: string
  fallback?: React.ReactNode
  allowedRoles?: ('company_admin' | 'company_member')[]
}

export default function AuthGuard({
  children,
  requiredState = 'has-company-access',
  redirectTo,
  fallback,
  allowedRoles
}: AuthGuardProps) {
  const { authState, loading, user, isCompanyAdmin, mounted } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Wait for hydration and auth to complete
    if (!mounted || loading) return

    const requiredStates = Array.isArray(requiredState) ? requiredState : [requiredState]
    const hasRequiredState = requiredStates.includes(authState)

    // Check role permissions if specified
    const hasRequiredRole = !allowedRoles || allowedRoles.some(role => {
      if (role === 'company_admin') return isCompanyAdmin
      if (role === 'company_member') return !!user?.companyMembership
      return false
    })

    if (!hasRequiredState || !hasRequiredRole) {
      // Determine redirect based on auth state
      if (redirectTo) {
        router.push(redirectTo)
        return
      }

      // Smart redirects based on auth state
      switch (authState) {
        case 'logged-out':
          router.push('/auth')
          break
        case 'needs-password-setup':
          router.push('/partners/setup')
          break
        case 'no-company':
          router.push('/partners')
          break
        case 'loading':
          // Stay on current page while loading
          break
        default:
          router.push('/partners')
      }
    }
  }, [authState, loading, mounted, redirectTo, router, user, isCompanyAdmin, allowedRoles])

  // Show loading state during hydration or auth check
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-brand-green border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Check auth state requirements
  const requiredStates = Array.isArray(requiredState) ? requiredState : [requiredState]
  const hasRequiredState = requiredStates.includes(authState)

  // Check role requirements
  const hasRequiredRole = !allowedRoles || allowedRoles.some(role => {
    if (role === 'company_admin') return isCompanyAdmin
    if (role === 'company_member') return !!user?.companyMembership
    return false
  })

  if (!hasRequiredState || !hasRequiredRole) {
    // Show fallback component while redirecting
    if (fallback) {
      return <>{fallback}</>
    }

    // Default fallback
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-brand-green border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Convenience wrapper components
export function PartnerGuard({ children, ...props }: Omit<AuthGuardProps, 'requiredState'>) {
  return (
    <AuthGuard requiredState="has-company-access" {...props}>
      {children}
    </AuthGuard>
  )
}

export function AdminGuard({ children, ...props }: Omit<AuthGuardProps, 'requiredState' | 'allowedRoles'>) {
  return (
    <AuthGuard 
      requiredState="has-company-access" 
      allowedRoles={['company_admin']} 
      {...props}
    >
      {children}
    </AuthGuard>
  )
}