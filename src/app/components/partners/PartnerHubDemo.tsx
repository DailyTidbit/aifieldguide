// src/app/components/partners/PartnerHubDemo.tsx - FULLY HYDRATION SAFE VERSION
'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Library,
  Layout,
  MessageSquare,
  Sparkles,
  PlayCircle,
  Pencil,
  Save,
  Send,
  NotebookPen,
  MonitorSmartphone,
  BadgeCheck,
  Calendar,
  CircleDot,
} from 'lucide-react'

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</section>
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border bg-white/70 backdrop-blur shadow-sm ${className}`}>{children}</div>
}

export default function PartnerHubDemo({
  userName,
  companyName,
  toolName,
  companyId, // kept for future use; not required by the submit API
}: { userName: string; companyName: string; toolName: string; companyId: string }) {
  // Hydration safety
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [showFGModal, setShowFGModal] = useState(false)
  const [listing, setListing] = useState({
    display_name: toolName,
    website_url: 'https://example.com',
    logo_url: '',
    summary: 'Write, analyze, and reason with a helpful AI assistant.',
    use_cases: 'Email polish, brainstorming, research assistance, coding help',
    pricing: 'Free tier + Pro $20/mo',
    login_requirements: 'Email or Google login',
    model_name: toolName,
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleSubmit() {
    if (!mounted) return

    try {
      setSubmitting(true)
      const res = await fetch('/api/listing-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important for cookie-based auth
        // API derives company_id from the logged-in user; no need to send companyId
        body: JSON.stringify({ proposed: listing }),
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData?.error || `HTTP ${res.status}`)
      }
      
      const data = await res.json()
      if (!data?.ok) {
        throw new Error(data?.error || 'Failed to submit changes')
      }
      
      setSubmitted(true)
    } catch (e: any) {
      console.error('Listing submission error:', e)
      alert(e.message || 'Unable to submit changes')
    } finally {
      setSubmitting(false)
    }
  }

  const variants = {
    enter: { opacity: 0, y: 12 },
    center: { opacity: 1, y: 0, transition: { duration: 0.35 } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.25 } },
  }

  const ValueProp = ({ icon: Icon, title, text }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.35 }}
    >
      <Card className="p-6 hover:shadow-md transition">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-xl border bg-white">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-neutral-900">{title}</h4>
            <p className="text-sm text-neutral-600 mt-1">{text}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  )

  const valueProps = [
    { icon: Layout, title: 'Professional presence', text: 'Consistent branding and accurate info across Daily Tidbit.' },
    { icon: Library, title: 'AI Field Guide inclusion', text: 'Beginner-friendly catalog where people discover tools by task.' },
    { icon: MessageSquare, title: 'Direct line to the team', text: 'Message us and keep your profile fresh with moderated updates.' },
    { icon: MonitorSmartphone, title: 'Real usage pathways', text: 'Tidbit page badge, Tidbit Tutor (if LLM), and walkthroughs.' },
    { icon: ShieldCheck, title: 'Lightweight analytics', text: 'Impressions and clicks on listings and placements.' },
    { icon: BadgeCheck, title: 'Trust & clarity', text: 'Plain-English presentation that helps users actually try your tool.' },
  ]

  const StepNav = () => (
    <div className="flex items-center justify-center gap-3 mb-6">
      {[1, 2, 3].map((i) => (
        <button
          key={i}
          onClick={() => mounted && setStep(i as 1 | 2 | 3)}
          disabled={!mounted}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm border transition disabled:opacity-50 ${
            step === i ? 'border-neutral-900 text-neutral-900' : 'border-neutral-300 text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <CircleDot className={`h-4 w-4 ${step === i ? '' : 'opacity-60'}`} />
          {i === 1 && 'Welcome'} {i === 2 && 'Placements'} {i === 3 && 'Update center'}
        </button>
      ))}
    </div>
  )

  // Show loading during hydration
  if (!mounted) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-neutral-50 via-white to-neutral-100 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-brand-green border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-neutral-50 via-white to-neutral-100 text-neutral-900">
      <Section className="pt-10 pb-8">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Daily Tidbit • Partner Hub</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold">Welcome, {userName}!</h1>
          <p className="text-neutral-600 max-w-2xl">
            Explore how {companyName} shows up across Daily Tidbit, preview exactly what users see, and keep your details fresh.
          </p>
          <StepNav />
        </div>
      </Section>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" variants={variants} initial="enter" animate="center" exit="exit">
            <Section className="pb-8">
              <Card className="p-6 md:p-10 border-neutral-200">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <div className="aspect-video rounded-2xl border bg-neutral-100 overflow-hidden flex items-center justify-center">
                      <div className="text-sm text-neutral-500 p-6 text-center">
                        <PlayCircle className="inline h-5 w-5 mr-1" /> Promo video placeholder
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div
                          key={i}
                          className="aspect-[4/3] rounded-xl border bg-white/60 flex items-center justify-center text-xs text-neutral-500"
                        >
                          Screenshot {i + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-semibold">Welcome to Daily Tidbit!</h3>
                    <p className="text-neutral-600 mt-2">
                      We reach everyday people learning AI — students, creators, small businesses, and curious first-timers.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4 mt-6">
                      {valueProps.map((vp, idx) => (
                        <ValueProp key={idx} {...vp} />
                      ))}
                    </div>
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Moderated updates
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
                        <NotebookPen className="h-3.5 w-3.5" /> Clear tooling profiles
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
                        <MessageSquare className="h-3.5 w-3.5" /> Direct messaging
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Section>
            <Section className="pb-16">
              <div className="mx-auto max-w-3xl text-center">
                <button
                  onClick={() => setStep(2)}
                  disabled={!mounted}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-3 border text-sm hover:shadow disabled:opacity-50"
                >
                  See everywhere your info appears <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </Section>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" variants={variants} initial="enter" animate="center" exit="exit">
            <Section className="pb-8">
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-5">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Layout className="h-4 w-4" /> Tidbit page badge
                  </h4>
                  <p className="text-sm text-neutral-600 mt-1">Your brand appears alongside daily walkthroughs.</p>
                  <div className="mt-3 aspect-[5/3] rounded-xl border bg-white/60 flex items-center justify-center text-xs text-neutral-500">
                    Preview
                  </div>
                </Card>
                <Card className="p-5">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Library className="h-4 w-4" /> Field Guide card
                  </h4>
                  <p className="text-sm text-neutral-600 mt-1">Discoverable by task, category, and tags.</p>
                  <div className="mt-3 aspect-[5/3] rounded-xl border bg-white/60 flex items-center justify-center text-xs text-neutral-500">
                    Preview
                  </div>
                </Card>
                <Card className="p-5">
                  <h4 className="font-semibold flex items-center gap-2">
                    <MonitorSmartphone className="h-4 w-4" /> Tidbit Tutor (if LLM)
                  </h4>
                  <p className="text-sm text-neutral-600 mt-1">Try your tool on-site.</p>
                  <div className="mt-3 aspect-[5/3] rounded-xl border bg-white/60 flex items-center justify-center text-xs text-neutral-500">
                    Preview
                  </div>
                </Card>
              </div>
            </Section>

            <Section className="pb-10">
              <Card className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <div className="w-full md:w-1/2">
                    <h3 className="text-lg font-semibold mb-2">Field Guide — Tool selector</h3>
                    <div className="rounded-xl border p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <input 
                          className="w-full rounded-lg border px-3 py-2" 
                          placeholder="Search tools" 
                          defaultValue={toolName}
                          disabled={!mounted}
                        />
                        <button 
                          className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50" 
                          onClick={() => mounted && setShowFGModal(true)}
                          disabled={!mounted}
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:w-1/2">
                    <h3 className="text-lg font-semibold mb-2">Modal preview</h3>
                    <div className="rounded-xl border p-4 bg-white">
                      <p className="text-sm text-neutral-600">Click "Open" to see the modal we use on the site.</p>
                      <div className="mt-3 aspect-video rounded-lg border bg-neutral-50 flex items-center justify-center text-xs text-neutral-500">
                        Modal area
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Section>

            <AnimatePresence>
              {showFGModal && (
                <motion.div 
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    initial={{ scale: 0.97, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.97, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-[min(92vw,900px)] rounded-2xl bg-white shadow-2xl border overflow-hidden"
                  >
                    <div className="p-5 border-b flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-neutral-200" />
                        <div>
                          <div className="font-semibold">{listing.display_name}</div>
                          <div className="text-xs text-neutral-600">{listing.summary}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowFGModal(false)} 
                        className="text-sm underline underline-offset-4"
                      >
                        Close
                      </button>
                    </div>
                    <div className="p-5 grid md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 space-y-3">
                        <div className="rounded-xl border p-4">
                          <div className="text-sm font-semibold">Use cases</div>
                          <div className="text-sm text-neutral-700 mt-1">{listing.use_cases}</div>
                        </div>
                        <div className="rounded-xl border p-4">
                          <div className="text-sm font-semibold">Pricing</div>
                          <div className="text-sm text-neutral-700 mt-1">{listing.pricing}</div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <a href={listing.website_url} target="_blank" className="block rounded-xl border p-4 hover:shadow" rel="noreferrer">
                          <div className="text-sm font-semibold">Visit website</div>
                          <div className="text-xs text-neutral-600 mt-1">{listing.website_url}</div>
                        </a>
                        <div className="rounded-xl border p-4">
                          <div className="text-sm font-semibold">Login requirements</div>
                          <div className="text-xs text-neutral-700 mt-1">{listing.login_requirements}</div>
                        </div>
                        <div className="rounded-xl border p-4">
                          <div className="text-sm font-semibold">Model name</div>
                          <div className="text-xs text-neutral-700 mt-1">{listing.model_name}</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <Section className="pb-16">
              <div className="mx-auto max-w-3xl text-center">
                <button 
                  onClick={() => setStep(3)} 
                  disabled={!mounted}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-3 border text-sm hover:shadow disabled:opacity-50"
                >
                  Update your info <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </Section>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" variants={variants} initial="enter" animate="center" exit="exit">
            <Section className="pb-8">
              <div className="grid lg:grid-cols-3 gap-6">
                <Card className="p-6 lg:col-span-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Pencil className="h-5 w-5" /> Suggest updates
                  </h3>
                  <p className="text-sm text-neutral-600 mt-1">Edit any field and submit for moderation.</p>

                  <div className="mt-6 grid sm:grid-cols-2 gap-4">
                    <Field 
                      label="Display name" 
                      value={listing.display_name} 
                      onChange={(v) => mounted && setListing((s) => ({ ...s, display_name: v }))}
                      disabled={!mounted}
                    />
                    <Field 
                      label="Website URL" 
                      value={listing.website_url} 
                      onChange={(v) => mounted && setListing((s) => ({ ...s, website_url: v }))}
                      disabled={!mounted}
                    />
                    <Field 
                      label="Logo URL" 
                      value={listing.logo_url} 
                      onChange={(v) => mounted && setListing((s) => ({ ...s, logo_url: v }))}
                      disabled={!mounted}
                    />
                    <Field 
                      label="Model name" 
                      value={listing.model_name} 
                      onChange={(v) => mounted && setListing((s) => ({ ...s, model_name: v }))}
                      disabled={!mounted}
                    />
                    <Field 
                      label="Pricing" 
                      value={listing.pricing as any} 
                      onChange={(v) => mounted && setListing((s) => ({ ...s, pricing: v }))}
                      disabled={!mounted}
                    />
                    <Field 
                      label="Login requirements" 
                      value={listing.login_requirements} 
                      onChange={(v) => mounted && setListing((s) => ({ ...s, login_requirements: v }))}
                      disabled={!mounted}
                    />
                    <TextArea 
                      label="Summary" 
                      value={listing.summary} 
                      onChange={(v) => mounted && setListing((s) => ({ ...s, summary: v }))}
                      disabled={!mounted}
                    />
                    <TextArea 
                      label="Use cases" 
                      value={listing.use_cases} 
                      onChange={(v) => mounted && setListing((s) => ({ ...s, use_cases: v }))}
                      disabled={!mounted}
                    />
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || submitted || !mounted}
                      className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm hover:shadow disabled:opacity-60"
                    >
                      {submitted ? <BadgeCheck className="h-4 w-4" /> : submitting ? <Save className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
                      {submitted ? 'Submitted' : submitting ? 'Submitting…' : 'Submit for approval'}
                    </button>
                    <div className="text-xs text-neutral-500">you'll see status in Messages; we'll email you on publish.</div>
                  </div>
                </Card>

                <Card className="p-6 space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5" /> Optional: Sponsor a Day
                  </h3>
                  <p className="text-sm text-neutral-600">
                    Intro month special — <span className="font-medium">$1</span>. One day per company.
                  </p>
                  <a href="/partners/ads" className="inline-flex items-center text-sm underline underline-offset-4">
                    See available dates →
                  </a>
                </Card>
              </div>
            </Section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Field({ 
  label, 
  value, 
  onChange, 
  disabled = false 
}: { 
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-neutral-700 mb-1">{label}</div>
      <input 
        className="w-full rounded-lg border px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed" 
        value={value} 
        onChange={(e) => !disabled && onChange(e.target.value)}
        disabled={disabled}
      />
    </label>
  )
}

function TextArea({ 
  label, 
  value, 
  onChange, 
  disabled = false 
}: { 
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  return (
    <label className="block sm:col-span-2">
      <div className="text-xs font-medium text-neutral-700 mb-1">{label}</div>
      <textarea 
        className="w-full rounded-lg border px-3 py-2 text-sm min-h-[100px] disabled:opacity-50 disabled:cursor-not-allowed" 
        value={value} 
        onChange={(e) => !disabled && onChange(e.target.value)}
        disabled={disabled}
      />
    </label>
  )
}