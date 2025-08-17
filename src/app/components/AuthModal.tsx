'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import ProfileSetupWizard from './ProfileSetupWizard'
import ModalAuthForm from './ModalAuthForm'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  title?: string
  subtitle?: string
}

export default function AuthModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  title = "Welcome to Daily Tidbit",
  subtitle = "Sign in to unlock all features"
}: AuthModalProps) {
  const [user, setUser] = useState<any>(null)
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false)

  console.log('AuthModal render - isOpen:', isOpen) // Debug log

  useEffect(() => {
    if (!isOpen) return

    console.log('AuthModal useEffect - modal is open') // Debug log

    // Check current auth state when modal opens
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await handleSignIn(user)
      }
    }

    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await handleSignIn(session.user)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setNeedsProfileSetup(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [isOpen])

  // Auto-close if user becomes authenticated and doesn't need setup
  useEffect(() => {
    if (user && !needsProfileSetup && isOpen) {
      // Small delay to show the success state
      const timer = setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [user, needsProfileSetup, isOpen, onSuccess, onClose])

  const handleSignIn = async (user: any) => {
    setUser(user)
    
    // Check if user has completed profile setup
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', user.id)
      .single()

    // If no full_name, they need to complete setup
    if (!profile?.full_name) {
      setNeedsProfileSetup(true)
    } else {
      // User is fully set up, close modal and trigger success
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1000)
    }
  }

  const handleProfileSetupComplete = () => {
    setNeedsProfileSetup(false)
    setTimeout(() => {
      onSuccess?.()
      onClose()
    }, 1000)
  }

  const handleSkipSetup = () => {
    setNeedsProfileSetup(false)
    setTimeout(() => {
      onSuccess?.()
      onClose()
    }, 500)
  }

  if (!isOpen) {
    console.log('AuthModal not rendering - isOpen is false')
    return null
  }

  console.log('AuthModal rendering modal content')

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="p-8">
            {user && needsProfileSetup ? (
              <ProfileSetupWizard
                userId={user.id}
                onComplete={handleProfileSetupComplete}
                onSkip={handleSkipSetup}
              />
            ) : user ? (
              // User is logged in and setup complete
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Welcome back!
                </h3>
                <p className="text-gray-600">
                  You're successfully signed in.
                </p>
              </div>
            ) : (
              // Show streamlined auth form
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#60A875] to-[#59B1E3] rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl">✨</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {title}
                  </h2>
                  <p className="text-gray-600">
                    {subtitle}
                  </p>
                </div>
                <ModalAuthForm onSuccess={onSuccess} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}