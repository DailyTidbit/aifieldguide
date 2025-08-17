'use client'

import { AlertCircle, Apple, Chrome, Loader2 } from 'lucide-react'
import { useAuthForm } from '../hooks/useAuthForm'

interface ModalAuthFormProps { redirectTo?: string | null }

export default function ModalAuthForm({ redirectTo }: ModalAuthFormProps) {
  const {
    mode, setMode,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    loading, message, error,
    handleEmailAuth, handleOAuth, handleReset,
  } = useAuthForm({ redirectTo })

  const isLogin = mode === 'login'

  return (
    <div className="w-full">
      <div className="mb-4">
        <div className="flex gap-2 text-sm">
          <button onClick={() => setMode('login')} className={`px-3 py-1 rounded-full ${isLogin ? 'bg-black text-white' : 'bg-gray-100'}`} aria-pressed={isLogin}>Sign In</button>
          <button onClick={() => setMode('signup')} className={`px-3 py-1 rounded-full ${!isLogin ? 'bg-black text-white' : 'bg-gray-100'}`} aria-pressed={!isLogin}>Create Account</button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-3 flex items-center gap-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      {message && <div role="status" className="mb-3 text-green-700">{message}</div>}

      <form onSubmit={(e) => { e.preventDefault(); handleEmailAuth() }} className="space-y-3">
        <label className="block text-sm font-medium">Email</label>
        <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border p-2" aria-invalid={Boolean(error)} />

        <label className="block text-sm font-medium">Password</label>
        <input type="password" required autoComplete={isLogin ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border p-2" />

        {!isLogin && (
          <div>
            <label className="block text-sm font-medium">Confirm Password</label>
            <input type="password" required autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-xl border p-2" />
          </div>
        )}

        <button type="submit" disabled={loading} className="mt-2 inline-flex w-full items-center justify-center rounded-xl border bg-black px-4 py-2 text-white disabled:opacity-60">
          {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isLogin ? 'Signing in…' : 'Creating account…'}</>) : (isLogin ? 'Sign In' : 'Create Account')}
        </button>

        <button type="button" onClick={handleReset} className="w-full text-center text-sm text-gray-600 underline" disabled={loading || !email}>Forgot your password?</button>
      </form>

      <div className="my-4 flex items-center gap-2 text-xs text-gray-500"><div className="h-px flex-1 bg-gray-200" /> or <div className="h-px flex-1 bg-gray-200" /></div>

      <div className="grid grid-cols-1 gap-2">
        <button type="button" onClick={() => handleOAuth('google')} disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2 disabled:opacity-60"><Chrome className="h-4 w-4" /> Continue with Google</button>
        <button type="button" onClick={() => handleOAuth('apple')} disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2 disabled:opacity-60"><Apple className="h-4 w-4" /> Continue with Apple</button>
      </div>
    </div>
  )
}
