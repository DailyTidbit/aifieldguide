'use client'

import { useState, useEffect, useRef } from 'react'

type State = 'idle' | 'loading' | 'success' | 'error'

export default function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Refs avoid SSR/hydration entirely — never rendered into JSX
  const honeypotRef = useRef<HTMLInputElement>(null)
  const formLoadedAt = useRef(0)

  useEffect(() => {
    formLoadedAt.current = Date.now()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          website: honeypotRef.current?.value ?? '',
          form_loaded_at: formLoadedAt.current,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.')
        setState('error')
      } else {
        setState('success')
      }
    } catch {
      setErrorMsg('Unable to send message. Check your connection and try again.')
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#60A875' }}>
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold font-serif text-gray-900 mb-3">Message sent!</h2>
        <p className="text-gray-600 leading-relaxed">
          Thanks for reaching out. I'll get back to you at <strong>{email}</strong> as soon as I can.
        </p>
      </div>
    )
  }

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 font-sans text-base'

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/*
        Honeypot — uncontrolled input positioned off-screen.
        Real users never see or tab to it; bots filling all fields will populate it.
        suppressHydrationWarning prevents the server/client style serialization mismatch.
      */}
      <div
        aria-hidden="true"
        suppressHydrationWarning
        style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflowX: 'hidden', overflowY: 'hidden' }}
      >
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          ref={honeypotRef}
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="space-y-5">
        <div>
          <label htmlFor="contact-name" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Name
          </label>
          <input
            id="contact-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            required
            maxLength={100}
            autoComplete="name"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="contact-email" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            maxLength={200}
            autoComplete="email"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="contact-message" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Message
          </label>
          <textarea
            id="contact-message"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="What's on your mind?"
            required
            maxLength={2000}
            rows={6}
            className={`${inputClass} resize-none`}
          />
          <p className="text-xs text-gray-400 mt-1 text-right">
            {message.length} / 2000
          </p>
        </div>

        {state === 'error' && (
          <div role="alert" className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={state === 'loading'}
          className="w-full py-3.5 px-6 rounded-xl font-bold text-white text-base transition-[opacity,transform] duration-200 hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
          style={{ backgroundColor: '#60A875' }}
        >
          {state === 'loading' ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Sending…
            </>
          ) : (
            'Send Message'
          )}
        </button>
      </div>
    </form>
  )
}
