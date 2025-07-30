'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ValuePropCarousel, { ValuePropCardProps } from '../components/ValuePropCarousel'
import AIExplanationCarousel from '../components/AIExplanationCarousel'

// Value Props Cards Data
const valuePropsCards: ValuePropCardProps[] = [
  {
    title: "Why You'll Love Daily Tidbit",
    description: "Quick. 60-second videos, no fluff. Clear. Easy walkthroughs for real results. Free. No catch, just good vibes.",
    icon: "Heart",
    accent: "green"
  },
  {
    title: "Why People Keep Coming Back", 
    description: "It's fast. One smart tidbit a day. It's real. Actual tools, real-life tasks. It's fun. Like a mini win, every time.",
    icon: "Zap",
    accent: "blue"
  },
  {
    title: "Why You'll Actually Use This",
    description: "Short & sweet. Watch it, try it, done. Super useful. Stuff you'll *actually* use. No pressure. Just show up and learn.",
    icon: "BookOpen",
    accent: "orange"
  },
  {
    title: "What Makes Daily Tidbit Kinda Addictive",
    description: "Fast AF. Most tips are under a minute. Real-world stuff. No theory dumps here. Free-free. No subscriptions, no strings.",
    icon: "Clock",
    accent: "purple"
  },
  {
    title: "Daily Tidbit = Fast, Useful, Actually Fun",
    description: "60-second videos. With walkthroughs if you want 'em. From emails to ideas. Quick wins and big moves. And yeah — it's free.",
    icon: "Gift",
    accent: "pink"
  }
];

// Carousel Component
function CarouselComponent() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)

  const dailyTidbits = [
    { id: 1, image: "https://cdn.dailytidbit.org/Day-1/Day-1.png", href: "/day/1" },
    { id: 2, image: "https://cdn.dailytidbit.org/Day-2/Day-2.png", href: "/day/2" },
    { id: 3, image: "https://cdn.dailytidbit.org/Day-3/Day-3.png", href: "/day/3" },
    { id: 4, image: "https://cdn.dailytidbit.org/Day-4/Day-4.png", href: "/day/4" },
    { id: 5, image: "https://cdn.dailytidbit.org/Day-5/Day-5.png", href: "/day/5" }
  ]

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Calculate slides
  const itemsPerSlide = isMobile ? 1 : 3
  const totalSlides = Math.ceil(dailyTidbits.length / itemsPerSlide)

  // Navigation functions
  const goToSlide = (slideIndex: number) => {
    if (slideIndex < 0) slideIndex = totalSlides - 1
    if (slideIndex >= totalSlides) slideIndex = 0
    
    setCurrentSlide(slideIndex)
    
    // Scroll to position
    if (carouselRef.current) {
      // Each "slide" is a full width block containing 1 or 3 cards.
      // We scroll by the width of this block.
      const slideWidth = carouselRef.current.offsetWidth
      carouselRef.current.scrollTo({
        left: slideIndex * slideWidth,
        behavior: 'smooth'
      })
    }
  }

  const nextSlide = () => goToSlide(currentSlide + 1)
  const prevSlide = () => goToSlide(currentSlide - 1)

  return (
    <div className="relative w-full max-w-7xl mx-auto"> {/* Added max-w-7xl and mx-auto for better centering and width control */}
      {/* Carousel Container - now relative for arrows */}
      <div className="overflow-hidden relative px-12"> {/* Added px-12 for arrow space */}
        <div
          ref={carouselRef}
          className="flex transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(-${currentSlide * 100}%)`,
          }}
        >
          {/* Generate slides */}
          {Array.from({ length: totalSlides }).map((_, slideIndex) => (
            <div
              key={slideIndex}
              className="w-full flex-shrink-0" // Each slide takes full width of the visible container
            >
              <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
                {dailyTidbits
                  .slice(slideIndex * itemsPerSlide, (slideIndex + 1) * itemsPerSlide)
                  .map((tidbit) => (
                    <div
                      key={tidbit.id}
                      className="group cursor-pointer"
                      onClick={() => window.location.href = tidbit.href}
                    >
                      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.005]">
                        {/* Image Container */}
                        <div className="bg-gray-50 rounded-t-xl overflow-hidden">
                          <img
                            src={tidbit.image}
                            alt={`Daily Tidbit Day ${tidbit.id} - AI tip cover`}
                            className="w-full h-auto block transition-transform duration-500"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='240' viewBox='0 0 320 240'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='24' fill='%2360A875' text-anchor='middle' dy='.3em'%3EDay ${tidbit.id}%3C/text%3E%3C/svg%3E`;
                            }}
                          />
                        </div>
                        
                        {/* Card Footer */}
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-800" style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}>
                              Day {tidbit.id}
                            </h3>
                            <div className="w-8 h-8 bg-[#60A875] rounded-full flex items-center justify-center text-white text-sm font-medium group-hover:bg-green-600 transition-colors duration-300">
                              →
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows - moved inside the overflow-hidden div and adjusted positioning */}
        <button
          onClick={prevSlide}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 ml-4 z-20 w-12 h-12 bg-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center text-gray-600 hover:text-[#60A875] transition-all duration-300 hover:scale-110 disabled:opacity-50"
          disabled={currentSlide === 0 && totalSlides <= 1}
        >
          <ChevronLeft size={24} />
        </button>
        
        <button
          onClick={nextSlide}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 mr-4 z-20 w-12 h-12 bg-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center text-gray-600 hover:text-[#60A875] transition-all duration-300 hover:scale-110 disabled:opacity-50"
          disabled={currentSlide === totalSlides - 1 && totalSlides <= 1}
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Pagination Dots */}
      {totalSlides > 1 && (
        <div className="flex justify-center mt-8 gap-2">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-[#60A875] scale-110'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function StartHerePage() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section with Enhanced Layout */}
      <section className="bg-gradient-to-br from-green-50 to-green-100 px-6 md:px-12 py-20 relative overflow-hidden">
        {/* Subtle floating background elements */}
        <div className="absolute top-20 right-10 w-32 h-32 bg-green-200/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-orange-200/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        
        <div className={`max-w-7xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="relative flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            {/* Left side - Hero graphic with hover tooltip */}
            <div className="lg:w-1/2 flex justify-center lg:justify-start animate-fade-in-up delay-300">
              <div className="relative group">
                {/* Curved background that bleeds */}
                <div className="absolute -inset-8 bg-gradient-to-br from-orange-200/40 to-green-200/40 rounded-[3rem] blur-2xl -z-10 group-hover:from-orange-200/60 group-hover:to-green-200/60 transition-all duration-500"></div>
                <div className="relative max-w-lg w-full lg:w-[500px]">
                  <img
                    src="https://cdn.dailytidbit.org/Hands-Uppp.png"
                    alt="Person celebrating AI success with arms wide open"
                    className="w-full h-auto object-contain hover:scale-105 transform transition-all duration-500 relative z-10 cursor-pointer"
                    onMouseMove={(e) => {
                      const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                      if (tooltip) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        tooltip.style.left = `${x}px`;
                        tooltip.style.top = `${y - 20}px`; // Offset slightly above cursor
                      }
                    }}
                  />
                  
                  {/* Mouse-following tooltip - "You Belong Here" */}
                  <div className="absolute opacity-0 group-hover:opacity-100 
                                  scale-95 group-hover:scale-100
                                  transition-all duration-300 ease-out
                                  bg-white/95 backdrop-blur-sm p-4 rounded-xl border-2 border-green-200/80 shadow-xl
                                  max-w-xs z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full">
                    <div className="text-center">
                      <h4 className="text-sm font-bold text-[#60A875] mb-2 flex items-center justify-center gap-1" 
                          style={{fontFamily: "var(--font-playfair, 'Playfair Display'), serif"}}>
                        <span>✨</span> You Belong Here
                      </h4>
                      <p className="text-xs text-gray-700 leading-relaxed" 
                         style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}>
                        Whether you're writing, dreaming, planning — or just curious — you're in the right place to learn AI that helps.
                      </p>
                    </div>
                    
                    {/* Little arrow pointing down */}
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white/95 border-r-2 border-b-2 border-green-200/80 rotate-45"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Text content */}
            <div className="lg:w-1/2 space-y-8 text-center lg:text-left">
              <h1 className="heading-hero text-5xl md:text-6xl lg:text-7xl leading-tight animate-fade-in-up" style={{fontFamily: "var(--font-playfair, 'Playfair Display'), serif", fontWeight: 700}}>
                <span className="text-[#59B1E3]">✨ AI</span> <span className="text-[#60A875]">for Real People</span>
              </h1>
              
              <div className="space-y-6 body-large text-xl md:text-2xl text-gray-800 leading-relaxed animate-fade-in-up delay-300" style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}>
                <p>
                  <strong>Kick off your shoes, put your feet up — you're in the right place.</strong>
                </p>
                <p>
                  Daily Tidbit is where real people learn how to use artificial intelligence to make life easier, more creative, and honestly? A lot more fun.
                </p>
                <p>
                  From writing better emails to making music, planning dinner to chasing big ideas — it's all easier than you think.
                </p>
                <p>
                  We'll show you how, one smart tip a day. Simple. Fast. Useful.
                </p>
                <p>
                  <strong>Real tools. Real results.</strong> <strong className="text-[#59B1E3]">Real people.</strong>
                </p>
              </div>

              {/* Value Props Carousel */}
              <div className="animate-fade-in-up delay-500">
                <ValuePropCarousel 
                  cards={valuePropsCards}
                  autoPlay={true}
                  autoPlayDelay={4000}
                />
              </div>

              {/* Moved Bob Marley line below the benefits box */}
              <div className="mt-6 text-center lg:text-left animate-fade-in-up delay-600">
                <p className="text-lg text-gray-700 italic leading-relaxed" style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}>
                  <strong>No tech talk. No pressure.</strong> And don't worry 'bout a thing — every little tip's gonna be alright. 🎶
                </p>
              </div>

              {/* Action buttons */}
              <div className="space-y-6 animate-fade-in-up delay-1000">
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <button 
                    onClick={() => scrollToSection('how-daily-tidbit-works')}
                    className="bg-[#60A875] text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-2xl hover:bg-green-600 hover:scale-105 transition-all duration-300 flex items-center gap-3 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    <span className="body-bold text-lg relative z-10">Daily Tidbit?!</span>
                    <span className="group-hover:translate-x-1 transition-transform duration-200 relative z-10">→</span>
                  </button>
                  
                  <button 
                    onClick={() => scrollToSection('how-it-works')}
                    className="border-2 border-[#60A875] text-[#60A875] px-8 py-4 rounded-xl hover:bg-[#60A875] hover:text-white transition-all duration-300 flex items-center gap-3 group"
                  >
                    <span className="body-bold text-lg">What's AI?</span>
                    <span className="group-hover:translate-x-1 transition-transform duration-200">✨</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IMPROVED: What Can You Do With AI Section - Lighter background with gradient */}
      <section id="what-is-ai" className="bg-gradient-to-br from-green-50/50 via-orange-50/30 to-yellow-50/40 px-6 md:px-12 py-20">
        <div className="max-w-6xl mx-auto">
          {/* IMPROVED: Header with more pop */}
          <div className="text-center mb-16">
            <h2 
              className="heading-section text-4xl md:text-5xl text-[#60A875] mb-6 leading-tight font-bold"
              style={{fontFamily: "var(--font-playfair, 'Playfair Display'), serif"}}
            >
              💡 Real Tools. Real Use Cases.
            </h2>
            
            <p 
              className="text-xl md:text-2xl text-gray-800 max-w-3xl mx-auto leading-relaxed font-medium"
              style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}
            >
              One smart AI idea a day — creative, practical, and actually fun.
            </p>
          </div>

          {/* Carousel Container */}
          <div className="px-4">
            <CarouselComponent />
          </div>

          {/* Bottom Caption */}
          <div className="text-center mt-12">
            <p 
              className="text-lg text-gray-600 italic"
              style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}
            >
              Real tips from real people doing <strong className="text-[#60A875]">real things</strong> with AI.
            </p>
          </div>
        </div>
      </section>

      {/* IMPROVED: How It Works Section - Now a Carousel */}
      <section id="how-it-works" className="bg-gradient-to-br from-blue-50/70 to-slate-100/50 px-6 md:px-12 py-20 relative overflow-hidden">
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200/30 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-green-200/30 rounded-full blur-xl"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <h3 className="heading-section text-4xl md:text-5xl text-[#59B1E3] mb-6 text-center">
            ✨ How Does AI Actually Work?
          </h3>
          
          <p className="body-large text-xl text-gray-800 mb-16 text-center max-w-2xl mx-auto">AI has two simple parts working together behind the scenes:</p>

          {/* AI Explanation Carousel */}
          <AIExplanationCarousel />
        </div>
      </section>

      {/* REDESIGNED: How Daily Tidbit Works - Interactive Steps */}
      <section id="how-daily-tidbit-works" className="bg-gradient-to-br from-orange-50/60 to-yellow-50/60 px-6 md:px-12 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h3 className="heading-section text-4xl md:text-5xl text-[#60A875] mb-4 text-center">How Daily Tidbit Works</h3>
            <p className="text-xl text-gray-600 font-medium" style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}>
              One tip. Three simple steps. Try it today.
            </p>
          </div>
          
          {/* Interactive 3-Step Flow */}
          <div className="grid md:grid-cols-3 gap-8 mb-16 relative">
            {/* Connection lines for desktop */}
            <div className="hidden md:block absolute top-1/2 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-[#59B1E3] via-purple-400 to-orange-400 -translate-y-1/2 z-0"></div>
            
            {/* Step 1: Watch */}
            <div className="group relative z-10">
              <div className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 border-2 border-[#59B1E3]/20 hover:border-[#59B1E3]/40 relative overflow-hidden">
                {/* Top accent */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#59B1E3] to-blue-400"></div>
                
                {/* Step number */}
                <div className="w-12 h-12 bg-[#59B1E3] text-white rounded-full flex items-center justify-center font-bold text-lg mb-6 group-hover:scale-110 transition-transform duration-300">
                  1
                </div>
                
                {/* Icon and title */}
                <div className="mb-6">
                  <div className="text-4xl mb-4">🎬</div>
                  <h4 className="text-2xl font-bold text-[#59B1E3] mb-2" style={{fontFamily: "var(--font-playfair, 'Playfair Display'), serif"}}>
                    Watch
                  </h4>
                  <p className="text-lg font-semibold text-gray-700 mb-4" style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}>
                    See It in Action
                  </p>
                </div>
                
                {/* Description */}
                <p className="text-gray-700 leading-relaxed" style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}>
                  Start with a quick 60-second video that shows the AI tip in the real world — no jargon, just results.
                </p>
                
                {/* Hover effect background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#59B1E3]/5 to-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
              </div>
            </div>

            {/* Step 2: Try */}
            <div className="group relative z-10">
              <div className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 border-2 border-purple-400/20 hover:border-purple-400/40 relative overflow-hidden">
                {/* Top accent */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-400 to-purple-500"></div>
                
                {/* Step number */}
                <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-6 group-hover:scale-110 transition-transform duration-300">
                  2
                </div>
                
                {/* Icon and title */}
                <div className="mb-6">
                  <div className="text-4xl mb-4">💡</div>
                  <h4 className="text-2xl font-bold text-purple-600 mb-2" style={{fontFamily: "var(--font-playfair, 'Playfair Display'), serif"}}>
                    Try
                  </h4>
                  <p className="text-lg font-semibold text-gray-700 mb-4" style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}>
                    Use It Yourself
                  </p>
                </div>
                
                {/* Description */}
                <p className="text-gray-700 leading-relaxed" style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}>
                  Test the idea instantly using Tidbit Tutor — a hands-on practice space powered by GPT, right in your browser.
                </p>
                
                {/* Hover effect background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
              </div>
            </div>

            {/* Step 3: Share */}
            <div className="group relative z-10">
              <div className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 border-2 border-orange-400/20 hover:border-orange-400/40 relative overflow-hidden">
                {/* Top accent */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-orange-500"></div>
                
                {/* Step number */}
                <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-6 group-hover:scale-110 transition-transform duration-300">
                  3
                </div>
                
                {/* Icon and title */}
                <div className="mb-6">
                  <div className="text-4xl mb-4">📢</div>
                  <h4 className="text-2xl font-bold text-orange-600 mb-2" style={{fontFamily: "var(--font-playfair, 'Playfair Display'), serif"}}>
                    Share
                  </h4>
                  <p className="text-lg font-semibold text-gray-700 mb-4" style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}>
                    Post What You Made
                  </p>
                </div>
                
                {/* Description */}
                <p className="text-gray-700 leading-relaxed" style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}>
                  Join the community on BitBoard. Show off your creation, get inspired, and see what others are doing too.
                </p>
                
                {/* Hover effect background */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
              </div>
            </div>
          </div>

          {/* REDESIGNED: Clean Impact Section - Replacing Day 1 card and blue text */}
          <div className="text-center mb-16">
            {/* Optional subheading */}
            <h4 className="text-lg font-semibold text-gray-600 mb-8 uppercase tracking-wider" style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}>
              What You'll Actually Get
            </h4>
            
            {/* Main callout box */}
            <div className="bg-gradient-to-br from-green-50/80 to-blue-50/80 p-10 lg:p-12 rounded-3xl shadow-lg border border-green-200/30 max-w-4xl mx-auto relative overflow-hidden">
              {/* Subtle background accent */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#60A875]/10 to-[#59B1E3]/10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-br from-[#59B1E3]/10 to-purple-400/10 rounded-full blur-xl"></div>
              
              <div className="relative z-10">
                <p className="text-xl md:text-2xl text-gray-800 mb-6 leading-relaxed" style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}>
                  <strong>Every day, we give you one quick AI idea</strong> — something useful, fun, or creative you can try instantly with free tools.
                </p>
                
                <p className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed" style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}>
                  No fluff. No pressure. Just clear, step-by-step guidance that works.
                </p>
                
                {/* Impact line - larger and bold */}
                <p className="text-2xl md:text-3xl font-bold text-[#60A875] leading-tight" style={{fontFamily: "var(--font-playfair, 'Playfair Display'), serif"}}>
                  Simple ideas. Real results. For real people.
                </p>
              </div>
            </div>
          </div>

          {/* New 3-Button CTA Layout */}
          <div className="text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {/* Today's Tidbit Button */}
              <button 
                onClick={() => window.location.href = '/day/today'}
                className="bg-[#60A875] text-white px-6 py-5 rounded-xl hover:bg-green-600 hover:scale-105 hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center gap-2 font-semibold shadow-lg group min-h-[120px]"
              >
                <div className="text-2xl mb-1">🟩</div>
                <div className="text-lg font-bold">Today's Tidbit</div>
                <div className="text-sm opacity-90 flex items-center gap-2">
                  Jump into today's AI tip
                  <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                </div>
              </button>
              
              {/* Tidbit Library Button */}
              <button 
                onClick={() => window.location.href = '/TidbitLibrary'}
                className="bg-[#59B1E3] text-white px-6 py-5 rounded-xl hover:bg-blue-600 hover:scale-105 hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center gap-2 font-semibold shadow-lg group min-h-[120px]"
              >
                <div className="text-2xl mb-1">🟦</div>
                <div className="text-lg font-bold">Tidbit Library</div>
                <div className="text-sm opacity-90 flex items-center gap-2">
                  Explore all past tips
                  <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                </div>
              </button>
              
              {/* BitBoard Button */}
              <button 
                onClick={() => window.location.href = '/bitboard'}
                className="bg-[#F5C26B] text-gray-800 px-6 py-5 rounded-xl hover:bg-yellow-500 hover:scale-105 hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center gap-2 font-semibold shadow-lg group min-h-[120px]"
              >
                <div className="text-2xl mb-1">🟨</div>
                <div className="text-lg font-bold">BitBoard</div>
                <div className="text-sm opacity-80 flex items-center gap-2">
                  See what people are making
                  <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}