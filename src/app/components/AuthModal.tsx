// src/app/components/AuthModal.tsx - COMPLETE HYDRATION FIX
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

  // CRITICAL: Component must be mounted before any DOM operations
  useEffect(() => {
    setClientMounted(true)
  }, [])

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

  // HYDRATION SAFE: Handle auth state changes - Wait for all mounted states
  useEffect(() => {
    if (!clientMounted || !mounted || !isOpen || loading) return

    if (authState === 'has-company-access') {
      // User is fully authenticated and has company access
      onSuccess?.()
      onClose()
    } else if (authState === 'needs-password-setup') {
      // User needs to complete password setup
      onSuccess?.()
      onClose()
    } else if (user && !user.profile?.full_name) {
      // User is authenticated but needs profile setup
      setShowProfileSetup(true)
    } else if (user && user.profile?.full_name) {
      // User is authenticated and has profile
      onSuccess?.()
      onClose()
    }
  }, [authState, user, loading, isOpen, onClose, onSuccess, clientMounted, mounted])

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