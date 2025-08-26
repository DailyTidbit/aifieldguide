// src/app/components/AuthModal.tsx - Refactored to use useAuth hook
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
  const { user, authState, loading } = useAuth()
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const dialogRef = useRef<HTMLDivElement | null>(null)

  // Focus trap + ESC + body scroll lock
  useEffect(() => {
    if (!isOpen) return
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
    document.body.classList.add('overflow-hidden')
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.classList.remove('overflow-hidden')
    }
  }, [isOpen, onClose])

  // Handle auth state changes
  useEffect(() => {
    if (!isOpen || loading) return

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
  }, [authState, user, loading, isOpen, onClose, onSuccess])

  const handleProfileSetupComplete = () => {
    setShowProfileSetup(false)
    onSuccess?.()
    onClose()
  }

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

        {showProfileSetup && user ? (
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
          className="absolute right-3 top-3 rounded-full p-2 text-gray-500 hover:bg-gray-100" 
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  )
}