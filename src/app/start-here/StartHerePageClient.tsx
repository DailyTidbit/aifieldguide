'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

const CAROUSEL_ITEMS = [
  // Home & Family
  { emoji: '🍽️', text: "Plan a week of dinners from what's in your fridge" },
  { emoji: '🛒', text: 'Write a grocery list organized by store aisle' },
  { emoji: '🔨', text: "Figure out if a contractor's quote is fair" },
  { emoji: '🔧', text: 'Troubleshoot why your appliance stopped working' },
  { emoji: '🏠', text: "Find out if your landlord can legally do that thing they're doing" },
  { emoji: '✉️', text: 'Write a firm but polite letter to your HOA' },
  { emoji: '📋', text: 'Help you understand your lease before you sign it' },
  { emoji: '🛠️', text: 'Suggest home repairs you can actually do yourself' },
  { emoji: '📅', text: 'Create a chore schedule for your whole family' },
  { emoji: '👶', text: "Help you childproof your home based on your kid's age" },
  // Money & Finance
  { emoji: '💸', text: 'Explain what your pay stub deductions actually mean' },
  { emoji: '🏥', text: 'Make sense of a confusing medical bill' },
  { emoji: '💌', text: 'Help you write a debt negotiation letter' },
  { emoji: '⚡', text: "Figure out if you're being overcharged on your utility bill" },
  { emoji: '📄', text: 'Explain what a financial document is asking you to sign' },
  { emoji: '💰', text: 'Build a simple monthly budget from your expenses' },
  { emoji: '📊', text: 'Help you understand your credit report' },
  { emoji: '🏷️', text: 'Find out if a deal or sale is actually a good deal' },
  { emoji: '🏦', text: 'Explain the difference between financial products (Roth vs Traditional IRA etc.)' },
  { emoji: '💳', text: 'Help you write a letter disputing a charge on your credit card' },
  // Health
  { emoji: '🩺', text: "Research a symptom before your doctor's appointment" },
  { emoji: '📋', text: 'Explain what a diagnosis actually means in plain English' },
  { emoji: '🗒️', text: 'Help you prepare questions to ask your doctor' },
  { emoji: '📖', text: 'Summarize a long medical study so you can actually read it' },
  { emoji: '🔬', text: 'Suggest questions to ask before agreeing to a procedure' },
  { emoji: '📄', text: 'Help you understand your insurance explanation of benefits' },
  { emoji: '💊', text: "Create a medication schedule so you don't miss doses" },
  { emoji: '🌿', text: 'Research whether a supplement actually works' },
  { emoji: '🔍', text: 'Help you find a specialist for a specific condition' },
  { emoji: '💊', text: 'Explain what a prescription drug does and its side effects' },
  // Work & Career
  { emoji: '📝', text: 'Write or rewrite your resume' },
  { emoji: '🎤', text: 'Help you prepare for a job interview' },
  { emoji: '✉️', text: "Write a cover letter that doesn't sound like everyone else's" },
  { emoji: '💼', text: 'Help you negotiate a salary offer' },
  { emoji: '📧', text: "Draft a professional email you've been putting off" },
  { emoji: '⚡', text: 'Summarize a long work document in 30 seconds' },
  { emoji: '📊', text: 'Help you write a performance self-review' },
  { emoji: '💬', text: 'Prepare you for a difficult conversation with your boss' },
  { emoji: '🔗', text: 'Help you write a LinkedIn profile that actually sounds like you' },
  { emoji: '🧭', text: 'Figure out what career you might be good at based on your skills' },
  // Travel
  { emoji: '✈️', text: 'Plan a trip around your actual budget' },
  { emoji: '🎟️', text: 'Find the cheapest time to fly somewhere' },
  { emoji: '🗺️', text: 'Build a day by day itinerary for any city' },
  { emoji: '🌿', text: 'Suggest off-the-beaten-path things to do at your destination' },
  { emoji: '🧳', text: 'Help you pack the right things for any climate' },
  { emoji: '🌐', text: 'Translate a menu or sign in another language' },
  { emoji: '🤝', text: 'Help you understand local customs before you go' },
  { emoji: '🐾', text: 'Find pet-friendly hotels or rentals' },
  { emoji: '✉️', text: 'Help you write a complaint to an airline or hotel' },
  { emoji: '🚗', text: 'Suggest road trip stops between two cities' },
  // Kids & Parenting
  { emoji: '💬', text: 'Explain a tough topic to your kid in age-appropriate language' },
  { emoji: '✏️', text: "Help you write a note to your child's teacher" },
  { emoji: '🎨', text: 'Suggest activities for a rainy day by age group' },
  { emoji: '📋', text: "Help you understand your child's IEP or school plan" },
  { emoji: '🌙', text: 'Create a bedtime routine that actually works' },
  { emoji: '🏫', text: 'Help you research the best school in your area' },
  { emoji: '🎂', text: 'Write a birthday party invitation' },
  { emoji: '📚', text: "Suggest books for your kid based on their reading level" },
  { emoji: '💬', text: 'Help you talk to your teenager about something hard' },
  { emoji: '🏕️', text: 'Research summer camps or after school programs' },
  // Legal & Admin
  { emoji: '⚖️', text: 'Explain what a contract clause actually means' },
  { emoji: '✉️', text: 'Help you write a demand letter to a business' },
  { emoji: '🏛️', text: 'Figure out if you have a case worth pursuing in small claims court' },
  { emoji: '🔑', text: 'Help you understand your rights as a tenant' },
  { emoji: '⚖️', text: 'Explain what happens during a specific legal process' },
  { emoji: '📋', text: 'Help you fill out a government form correctly' },
  { emoji: '👷', text: 'Research your rights as an employee' },
  { emoji: '📝', text: 'Help you write a formal complaint to a company' },
  { emoji: '🛡️', text: 'Explain what an insurance policy actually covers' },
  { emoji: '📜', text: 'Help you understand a will or estate document' },
  // Shopping & Consumer
  { emoji: '🔍', text: 'Compare two products and tell you which is actually better' },
  { emoji: '⭐', text: 'Find out if a review is fake or trustworthy' },
  { emoji: '🌱', text: 'Research whether a brand is ethical or sustainable' },
  { emoji: '📦', text: 'Help you write a return or refund request that works' },
  { emoji: '🏷️', text: 'Find the best time of year to buy something' },
  { emoji: '📊', text: 'Summarize hundreds of reviews into what people actually say' },
  { emoji: '💰', text: 'Help you find a dupe for an expensive product' },
  { emoji: '🛡️', text: 'Research whether a warranty is worth buying' },
  { emoji: '🤔', text: 'Help you decide between two big purchases' },
  { emoji: '⚠️', text: 'Find recalls or safety issues with a product you own' },
  // Food & Cooking
  { emoji: '🍳', text: 'Create a recipe from whatever ingredients you have' },
  { emoji: '🥗', text: 'Adjust a recipe for dietary restrictions' },
  { emoji: '📏', text: 'Scale a recipe up or down for your group size' },
  { emoji: '🍷', text: 'Suggest wine or drink pairings for a meal' },
  { emoji: '🥡', text: 'Help you meal prep for the whole week in one session' },
  { emoji: '👨‍🍳', text: "Explain a cooking technique you've never tried" },
  { emoji: '🛒', text: 'Give you a shopping list for a specific cuisine' },
  { emoji: '🍽️', text: 'Help you recreate a restaurant dish at home' },
  { emoji: '🥦', text: 'Suggest what to cook based on your calorie goals' },
  { emoji: '🌿', text: 'Find recipes that use up food before it goes bad' },
  // Personal & Lifestyle
  { emoji: '🥂', text: 'Help you write a heartfelt speech or toast' },
  { emoji: '🎁', text: 'Suggest a thoughtful gift for anyone in your life' },
  { emoji: '💬', text: 'Help you write a difficult text or email to a friend or family member' },
  { emoji: '💪', text: 'Create a workout plan based on your goals and equipment' },
  { emoji: '📓', text: 'Help you start journaling with prompts tailored to you' },
  { emoji: '🔍', text: 'Research whether a service or subscription is worth it' },
  { emoji: '🗂️', text: 'Help you declutter by deciding what to keep or donate' },
  { emoji: '💝', text: 'Write your dating profile in your actual voice' },
  { emoji: '🎉', text: 'Help you plan a meaningful anniversary or birthday' },
  { emoji: '📚', text: "Summarize a book so you can decide if it's worth reading" },
]

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.08 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

function Expander({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-5">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-green hover:text-brand-green-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green rounded"
        style={{ transition: 'color 0.2s ease' }}
      >
        <span>{open ? 'Show less' : 'Tell me more'}</span>
        <svg
          className="w-4 h-4"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        style={{
          display: 'grid',
          gridTemplateRows: open ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.45s ease',
        }}
        aria-hidden={!open}
      >
        <div style={{ overflow: 'hidden' }}>
          <p className="pt-4 text-gray-500 leading-relaxed text-base">
            {children}
          </p>
        </div>
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-brand-green mb-3">
      {children}
    </p>
  )
}

const SPEED = 0.45 // px per frame — slow, readable drift

function InfiniteCarousel({ items }: { items: { emoji: string; text: string }[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const posRef = useRef(0)
  const singleWidthRef = useRef(0)
  const isPausedRef = useRef(false)
  const isDraggingRef = useRef(false)
  const dragStartXRef = useRef(0)
  const dragStartPosRef = useRef(0)
  const capturedPointerRef = useRef<number | null>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const tick = () => {
      // Measure once the DOM is ready
      if (singleWidthRef.current === 0 && trackRef.current) {
        singleWidthRef.current = trackRef.current.offsetWidth / 2
      }

      if (!isDraggingRef.current && !isPausedRef.current) {
        const single = singleWidthRef.current
        if (single > 0) {
          posRef.current += SPEED
          if (posRef.current >= single) posRef.current -= single
          if (trackRef.current) {
            trackRef.current.style.transform = `translateX(-${posRef.current}px)`
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const handleMouseEnter = () => { isPausedRef.current = true }
  const handleMouseLeave = () => { isPausedRef.current = false }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true
    dragStartXRef.current = e.clientX
    dragStartPosRef.current = posRef.current
    capturedPointerRef.current = e.pointerId
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || e.pointerId !== capturedPointerRef.current) return
    const single = singleWidthRef.current
    if (single === 0) return
    const delta = dragStartXRef.current - e.clientX
    // Modulo wrap so looping stays seamless during drag
    posRef.current = ((dragStartPosRef.current + delta) % single + single) % single
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${posRef.current}px)`
    }
  }

  const stopDrag = () => {
    isDraggingRef.current = false
    capturedPointerRef.current = null
  }

  // Duplicate for seamless loop. Cards use mr-3 (not gap) so offsetWidth / 2 = exact single-set width.
  const doubled = [...items, ...items]

  return (
    <div
      className="overflow-hidden cursor-grab active:cursor-grabbing select-none"
      style={{ touchAction: 'pan-y' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
    >
      <div
        ref={trackRef}
        className="flex will-change-transform py-3"
        style={{ width: 'max-content' }}
        aria-hidden="true"
      >
        {doubled.map((item, i) => (
          <div
            key={i}
            className="w-52 flex-shrink-0 mr-3 bg-white border border-gray-100 rounded-2xl px-4 py-4 shadow-sm"
          >
            <div className="text-xl mb-2" aria-hidden="true">{item.emoji}</div>
            <p className="text-gray-700 text-sm leading-snug">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function StartHerePageClient() {
  return (
    <div className="font-poppins bg-white">

      {/* Section 1 — Hero */}
      <section className="relative h-[75vh] min-h-[520px] overflow-hidden">
        <Image
          src="/images/hero2.png"
          alt="AI is having a moment"
          fill
          className="object-cover object-center"
          priority
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%)' }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 flex items-end">
          <div className="px-6 md:px-16 pb-14 md:pb-20 max-w-4xl">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
              AI is having a moment.<br />Come see what all the fuss is about.
            </h1>
            <p className="text-white/80 text-base md:text-xl leading-relaxed max-w-xl">
              No jargon. No hype. Just a plain-english guide to the most interesting thing happening right now.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2 — What is AI? */}
      <section className="py-20 md:py-28 px-6 md:px-12">
        <FadeIn>
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-sm">
              <Image
                src="/images/explanation.jpg"
                alt="What is AI?"
                fill
                className="object-cover object-top"
              />
            </div>
            <div>
              <SectionLabel>What is AI?</SectionLabel>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug">
                AI is software that learned how to think by studying an almost incomprehensible amount of human knowledge.
              </h2>
              <Expander>
                The long answer starts with something called a neural network — a system loosely inspired by how the human
                brain works. Instead of being programmed with rules, AI is trained on patterns. It reads billions of
                sentences, images, and data points and learns to recognize relationships between them. When you ask it a
                question, it isn&apos;t &ldquo;thinking&rdquo; the way you are — it&apos;s predicting what a good
                response looks like based on everything it absorbed during training. It doesn&apos;t understand the way
                humans do, but it&apos;s extraordinarily good at pattern recognition at a scale no human could match.
              </Expander>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Section 3 — What are Models? */}
      <section className="py-20 md:py-28 px-6 md:px-12 bg-stone-50">
        <FadeIn>
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div className="order-2 md:order-1">
              <SectionLabel>What are models?</SectionLabel>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug">
                A model is the actual AI brain. GPT, Claude, and Gemini are all different models — each trained differently, with different strengths.
              </h2>
              <Expander>
                Think of models like different people who went to different schools and read different books. GPT-4 is
                made by OpenAI. Claude is made by Anthropic. Gemini is made by Google. They all do similar things but
                have different personalities, strengths, and blind spots. One might be better at creative writing,
                another at analysis, another at following complex instructions. Models are also measured by parameters
                — essentially the number of connections in their neural network. More parameters generally means more
                capable, but also more expensive to run. And newer isn&apos;t always better — a smaller, newer model
                trained on better data can outperform a larger older one. The field moves fast.
              </Expander>
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-sm order-1 md:order-2">
              <Image
                src="/images/explanation.jpg"
                alt="What are AI models?"
                fill
                className="object-cover object-bottom"
              />
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Section 4 — How are they trained? */}
      <section className="py-20 md:py-28 px-6 md:px-12">
        <FadeIn>
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-sm">
              <Image
                src="/images/explanation.jpg"
                alt="How is AI trained?"
                fill
                className="object-cover object-left"
              />
            </div>
            <div>
              <SectionLabel>How are they trained?</SectionLabel>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug">
                The short version: it read a huge chunk of the internet, plus books, code, scientific papers, and more — then got refined by human feedback.
              </h2>
              <Expander>
                Training happens in stages. First, the model is exposed to enormous amounts of text and learns to
                predict what comes next — word by word, billions of times over. This alone produces something
                surprisingly capable. Then comes the refinement. A technique called RLHF — Reinforcement Learning
                from Human Feedback — has humans rate the model&apos;s responses, and the model learns to produce
                answers people prefer. After that, fine-tuning shapes it for specific tasks or personalities. The
                catch: the model is only as good as what it was trained on. If the training data has biases, gaps,
                or errors, the model inherits them. This is why AI can sometimes be confidently wrong — it learned
                from imperfect humans.
              </Expander>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Section 5 — What are AI Tools? */}
      <section className="py-20 md:py-28 px-6 md:px-12 bg-stone-50">
        <FadeIn>
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-sm">
              <Image
                src="/images/tools.jpg"
                alt="What are AI tools?"
                fill
                className="object-cover object-center"
              />
            </div>
            <div>
              <SectionLabel>What are AI tools?</SectionLabel>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug">
                A model is the engine. A tool is the car. ChatGPT is a tool built on top of GPT-4. Claude.ai is a tool built on top of Claude.
              </h2>
              <Expander>
                Most people never interact with a raw model — they use a product built on top of one. When you open
                ChatGPT, you&apos;re using OpenAI&apos;s product that wraps their GPT model in a friendly interface.
                The same model might power dozens of different tools — a customer service chatbot, a coding assistant,
                a writing app — all with different personalities and limitations set by whoever built the tool.
                That&apos;s why two products using the same underlying model can feel completely different. At
                aifieldguide, we show you specific tools built for specific everyday tasks — so you&apos;re not just
                staring at a blank chat box wondering what to do with it.
              </Expander>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Section 6 — What can it do for you? */}
      <section className="py-20 md:py-28">
        <div className="relative h-56 md:h-auto md:aspect-[3/1] overflow-hidden mb-14 md:mb-20">
          <Image
            src="/images/whatcando.jpg"
            alt="What can AI do for you?"
            fill
            className="object-cover object-center"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 70%)' }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 flex items-center px-6 md:px-16">
            <FadeIn>
              <h2 className="text-2xl md:text-4xl font-bold text-white max-w-xl leading-snug">
                What can it actually do for you?
              </h2>
            </FadeIn>
          </div>
        </div>

        <FadeIn>
          <p className="text-gray-500 text-lg text-center mb-10 max-w-2xl mx-auto px-6 leading-relaxed">
            Here&apos;s the thing — AI isn&apos;t just for tech people. It&apos;s genuinely useful for normal, everyday stuff.
          </p>
        </FadeIn>

        <InfiniteCarousel items={CAROUSEL_ITEMS} />
      </section>

      {/* Section 7 — How aifieldguide works */}
      <section className="py-20 md:py-28 px-6 md:px-12 bg-stone-50">
        <FadeIn>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-5 leading-snug">
              Ready to see it in action?
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
              We&apos;ve put together a library of practical AI tools for real everyday problems. No fluff, no filler — just things that actually work.
            </p>
            <Link
              href="/field-guide"
              className="inline-flex items-center gap-2 bg-brand-green text-white px-8 py-4 rounded-xl font-semibold text-base shadow-lg hover:opacity-90 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2"
              style={{ transition: 'opacity 0.2s ease, transform 0.2s ease' }}
            >
              Explore the tools
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </FadeIn>
      </section>

    </div>
  )
}
