'use client'

import { useEffect, useState } from 'react'
import { useAuthForm } from '../hooks/useAuthForm'
import ProfileSetupWizard from '../components/ProfileSetupWizard'
import { supabase } from '../lib/supabaseClient'

export default function AuthFormPage() {
  const { mode, setMode, email, setEmail, password, setPassword, confirmPassword, setConfirmPassword, loading, message, error, handleEmailAuth, handleOAuth, handleReset } = useAuthForm()
  const [needsSetup, setNeedsSetup] = useState(false)
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user ?? null)
      if (user?.id) {
        const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
        setNeedsSetup(!data || !data.full_name)
      }
      setReady(true)
    }
    init()
  }, [])

  if (!ready) return null

  if (needsSetup && user) {
    return (
      <div className="mx-auto max-w-md p-6">
        <ProfileSetupWizard userId={user.id} onComplete={() => setNeedsSetup(false)} onDone={() => setNeedsSetup(false)} />
      </div>
    )
  }

  const isLogin = mode === 'login'
  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-center text-2xl font-semibold">{isLogin ? 'Sign In' : 'Create Account'}</h1>

      {error && <div className="mb-3 text-red-600">{error}</div>}
      {message && <div className="mb-3 text-green-700">{message}</div>}

      <form onSubmit={(e) => { e.preventDefault(); handleEmailAuth() }} className="space-y-3">
        <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border p-2" placeholder="Email" />
        <input type="password" required autoComplete={isLogin ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border p-2" placeholder="Password" />
        {!isLogin && (
          <input type="password" required autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-xl border p-2" placeholder="Confirm Password" />
        )}
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60">{isLogin ? 'Sign In' : 'Create Account'}</button>
        <button type="button" onClick={handleReset} className="w-full text-center text-sm text-gray-600 underline" disabled={loading || !email}>Forgot your password?</button>
      </form>

      <div className="my-4 flex items-center gap-2 text-xs text-gray-500"><div className="h-px flex-1 bg-gray-200" /> or <div className="h-px flex-1 bg-gray-200" /></div>

      <div className="grid gap-2">
        <button type="button" onClick={() => handleOAuth('google')} disabled={loading} className="w-full rounded-xl border bg-white px-4 py-2 disabled:opacity-60">Continue with Google</button>
        <button type="button" onClick={() => handleOAuth('apple')} disabled={loading} className="w-full rounded-xl border bg-white px-4 py-2 disabled:opacity-60">Continue with Apple</button>
      </div>

      <div className="mt-4 text-center text-sm">
        {isLogin ? (
          <button onClick={() => setMode('signup')} className="underline">Need an account? Sign up</button>
        ) : (
          <button onClick={() => setMode('login')} className="underline">Have an account? Sign in</button>
        )}
      </div>
    </div>
  )
}