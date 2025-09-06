// src/app/components/AuthModal.tsx - FIXED: Better auth state handling
'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import ModalAuthForm from './ModalAuthForm'
import ProfileSetupWizard from './ProfileSetupWizard'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  redirectTo?: string | null
  title?: string
  subtitle?: string
}

export default function AuthModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  redirectTo, 
  title = 'Sign in', 
  subtitle 
}: AuthModalProps) {
  const { user, authState, loading, mounted } = useAuth()
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [clientMounted, setClientMounted] = useState(false)
  const dialogRef = useRef<HTMLDivElement | null>(null)

  // Track initial auth state to detect changes
  const [initialAuthState, setInitialAuthState] = useState<string | null>(null)

  // CRITICAL: Component must be mounted before any DOM operations
  useEffect(() => {
    setClientMounted(true)
  }, [])

  // Set initial auth state when modal opens
  useEffect(() => {
    if (isOpen && mounted && !loading) {
      setInitialAuthState(authState)
    }
  }, [isOpen, mounted, loading, authState])

  // HYDRATION SAFE: Focus trap + ESC + body scroll lock - Only after both mounted states
  useEffect(() => {
    if (!clientMounted || !mounted || !isOpen) return
    
    const dialog = dialogRef.current
    if (!dialog) return

    const focusable = dialog.querySelectorAll<HTMLElement>(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      
      if (e.key !== 'Tab') return
      
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        ;(last as HTMLElement)?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        ;(first as HTMLElement)?.focus()
      }
    }

    first?.focus()
    document.addEventListener('keydown', handleKeyDown)
    
    // Body scroll lock - guard against SSR
    if (typeof document !== 'undefined') {
      document.body.classList.add('overflow-hidden')
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (typeof document !== 'undefined') {
        document.body.classList.remove('overflow-hidden')
      }
    }
  }, [isOpen, onClose, clientMounted, mounted])

  // FIXED: Handle auth state changes - Close modal on successful auth
  useEffect(() => {
    if (!clientMounted || !mounted || !isOpen || loading) return
    if (!initialAuthState) return // Wait for initial state to be set

    // Check if auth state improved from the initial state
    const authImproved = (
      (initialAuthState === 'logged-out' && authState !== 'logged-out') ||
      (initialAuthState === 'loading' && authState !== 'loading' && authState !== 'logged-out')
    )

    if (authImproved) {
      if (authState === 'has-company-access') {
        // User is fully authenticated and has company access
        console.log('Auth success: has-company-access')
        onSuccess?.()
        onClose()
      } else if (authState === 'needs-password-setup') {
        // User needs to complete password setup
        console.log('Auth success: needs-password-setup')
        onSuccess?.()
        onClose()
      } else if (user && !user.profile?.full_name) {
        // User is authenticated but needs profile setup
        console.log('Auth success: needs profile setup')
        setShowProfileSetup(true)
      } else if (user && user.profile?.full_name) {
        // User is authenticated and has profile
        console.log('Auth success: complete profile')
        onSuccess?.()
        onClose()
      } else if (authState === 'no-company') {
        // User is authenticated but needs company access
        console.log('Auth success: no company access')
        onSuccess?.()
        onClose()
      }
    }
  }, [authState, user, loading, isOpen, onClose, onSuccess, clientMounted, mounted, initialAuthState])

  const handleProfileSetupComplete = () => {
    setShowProfileSetup(false)
    onSuccess?.()
    onClose()
  }

  // CRITICAL: Don't render anything until both client and auth are mounted
  if (!clientMounted || !mounted) {
    // Return null during hydration to prevent mismatch
    return null
  }

  // Don't render modal until it's supposed to be open
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50" 
        aria-hidden="true"
        onClick={onClose}
      />

      <div 
        ref={dialogRef} 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="auth-modal-title" 
        className="relative z-[71] w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id="auth-modal-title" className="mb-1 text-center text-xl font-semibold">
          {title}
        </h2>
        {subtitle && (
          <p className="mb-3 text-center text-sm text-gray-600">{subtitle}</p>
        )}

        {/* All auth-dependent rendering gated by mounted states */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-brand-green border-t-transparent rounded-full"></div>
          </div>
        ) : showProfileSetup && user ? (
          <ProfileSetupWizard
            userId={user.id}
            onComplete={handleProfileSetupComplete}
            onDone={handleProfileSetupComplete}
          />
        ) : (
          <ModalAuthForm redirectTo={redirectTo} />
        )}

        <button 
          type="button" 
          onClick={onClose} 
          className="absolute right-3 top-3 rounded-full p-2 text-gray-500 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green" 
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  )
}