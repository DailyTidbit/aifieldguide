'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

const USE_CASES = [
  { emoji: '🏠', text: 'Figure out if your landlord is charging you fairly' },
  { emoji: '✈️', text: 'Plan a trip around your actual budget' },
  { emoji: '💊', text: "Research a health symptom before your doctor's appointment" },
  { emoji: '📝', text: 'Write a complaint letter that actually gets results' },
  { emoji: '💰', text: 'Make sense of a confusing financial document' },
  { emoji: '🍽️', text: "Plan a week of dinners from what's already in your fridge" },
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

export default function StartHerePageClient() {
  return (
    <div className="font-poppins bg-white">

      {/* Section 1 — Hero */}
      <section className="relative h-[75vh] min-h-[520px] overflow-hidden">
        <Image
          src="/images/hero.jpg"
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
        <div className="relative h-56 md:h-72 overflow-hidden mb-14 md:mb-20">
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

        <div className="px-6 md:px-12">
          <FadeIn>
            <p className="text-gray-500 text-lg text-center mb-10 max-w-2xl mx-auto leading-relaxed">
              Here&apos;s the thing — AI isn&apos;t just for tech people. It&apos;s genuinely useful for normal, everyday stuff.
            </p>
          </FadeIn>
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {USE_CASES.map((item, i) => (
              <FadeIn key={i} delay={i * 70}>
                <div
                  className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 h-full"
                  style={{ transition: 'box-shadow 0.25s ease, transform 0.25s ease' }}
                >
                  <div className="text-3xl mb-3" aria-hidden="true">{item.emoji}</div>
                  <p className="text-gray-700 text-sm leading-relaxed">{item.text}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
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
              href="/tools"
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

      {/* Section 8 — CTA */}
      <section className="relative h-[60vh] min-h-[420px] overflow-hidden">
        <Image
          src="/images/cta.jpg"
          alt="You're ready"
          fill
          className="object-cover object-center"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.65))' }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <FadeIn>
            <div className="text-center px-6">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                Alright. You&apos;re ready.
              </h2>
              <p className="text-white/80 text-base md:text-lg mb-10 max-w-md mx-auto leading-relaxed">
                You now know more about AI than most people. Time to actually use it.
              </p>
              <Link
                href="/day/1"
                className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-xl font-bold text-base shadow-xl hover:opacity-90 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
                style={{ transition: 'opacity 0.2s ease, transform 0.2s ease' }}
              >
                Let&apos;s go
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

    </div>
  )
}
