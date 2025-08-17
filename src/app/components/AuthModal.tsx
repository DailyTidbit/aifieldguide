'use client'

import { useEffect, useRef, useState } from 'react'
import ModalAuthForm from './ModalAuthForm'
import ProfileSetupWizard from './ProfileSetupWizard'
import { supabase } from '../lib/supabaseClient'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  redirectTo?: string | null
  title?: string
  subtitle?: string
}

export default function AuthModal({ isOpen, onClose, onSuccess, redirectTo, title = 'Sign in', subtitle }: AuthModalProps) {
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [setupUserId, setSetupUserId] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)

  // Focus trap + ESC + body scroll lock
  useEffect(() => {
    if (!isOpen) return
    const dialog = dialogRef.current
    if (!dialog) return

    const focusable = dialog.querySelectorAll<HTMLElement>('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])')
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key !== 'Tab') return
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); (last as HTMLElement)?.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); (first as HTMLElement)?.focus() }
    }

    first?.focus()
    document.addEventListener('keydown', handleKeyDown)
    document.body.classList.add('overflow-hidden')
    return () => { document.removeEventListener('keydown', handleKeyDown); document.body.classList.remove('overflow-hidden') }
  }, [isOpen, onClose])

  // Listen for auth changes; decide whether to show wizard
  useEffect(() => {
    if (!isOpen) return
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setSetupUserId(session.user.id)
        const { data } = await supabase.from('profiles').select('full_name').eq('id', session.user.id).maybeSingle()
        const needsSetup = !data || !data.full_name
        if (needsSetup) setShowProfileSetup(true)
        else { onSuccess?.(); onClose() }
      }
    })
    return () => subscription.unsubscribe()
  }, [isOpen, onClose, onSuccess])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="auth-modal-title" className="relative z-[71] w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="auth-modal-title" className="mb-1 text-center text-xl font-semibold">{title}</h2>
        {subtitle && (<p className="mb-3 text-center text-sm text-gray-600">{subtitle}</p>)}

        {showProfileSetup ? (
          setupUserId && (
            <ProfileSetupWizard
              userId={setupUserId}
              onComplete={() => { /* optional internal state */ }}
              onDone={() => { onSuccess?.(); onClose() }}
            />
          )
        ) : (
          <ModalAuthForm redirectTo={redirectTo} />
        )}

        <button type="button" onClick={onClose} className="absolute right-3 top-3 rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Close">✕</button>
      </div>
    </div>
  )
}