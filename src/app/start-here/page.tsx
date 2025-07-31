'use client'

import { useState, useEffect } from 'react'
import ValuePropCarousel, { ValuePropCardProps } from '../components/ValuePropCarousel'
import AIExplanationCarousel from '../components/AIExplanationCarousel'
import CTASection from '../components/CTASection'
import CarouselComponent from '../components/CarouselComponent'

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
              </div>

              {/* Value Props Carousel */}
              <div className="animate-fade-in-up delay-500">
                <ValuePropCarousel 
                  cards={valuePropsCards}
                  autoPlay={true}
                  autoPlayDelay={4000}
                />
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
                    className="bg-[#59B1E3] text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-2xl hover:bg-blue-600 hover:scale-105 transition-all duration-300 flex items-center gap-3 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    <span className="body-bold text-lg relative z-10">What's AI?</span>
                    <span className="group-hover:translate-x-1 transition-transform duration-200 relative z-10">✨</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* UPDATED: What Can You Do With AI Section - White background with card shadows */}
      <section id="what-is-ai" className="bg-white px-6 md:px-12 py-20">
        <div className="max-w-6xl mx-auto">
          {/* IMPROVED: Header with more pop */}
          <div className="text-center mb-16">
            <h2 
              className="heading-section text-4xl md:text-5xl text-[#60A875] mb-6 leading-tight font-bold drop-shadow-sm"
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

          {/* Carousel Container with enhanced shadows */}
          <div className="px-4 drop-shadow-lg">
            <CarouselComponent />
          </div>

          {/* Bottom Caption */}
          <div className="text-center mt-12">
            <p 
              className="text-lg text-gray-600 italic"
              style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}
            >
              And don't worry 'bout a thing — every little tip's gonna be alright. 🎶
            </p>
          </div>
        </div>
      </section>

      {/* UPDATED: How It Works Section - Soft lavender to icy blue gradient */}
      <section id="how-it-works" className="bg-gradient-to-b from-[#F4F5FF] to-[#E6F6F9] px-6 md:px-12 py-20 relative overflow-hidden">
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-200/20 rounded-full blur-xl"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <h3 className="heading-section text-4xl md:text-5xl text-[#59B1E3] mb-6 text-center">
            ✨ How Does AI Actually Work?
          </h3>
          
          <p className="body-large text-xl text-gray-800 mb-16 text-center max-w-2xl mx-auto">AI has two simple parts working together behind the scenes:</p>

          {/* AI Explanation Carousel */}
          <AIExplanationCarousel />
        </div>
      </section>

      {/* UPDATED: How Daily Tidbit Works - White background with enhanced card shadows */}
      <section id="how-daily-tidbit-works" className="bg-white px-6 md:px-12 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h3 className="heading-section text-4xl md:text-5xl mb-4 text-center" style={{fontFamily: "var(--font-playfair, 'Playfair Display'), serif"}}>
              🍍 The <span style={{color: '#60A875'}}>D</span><span style={{color: '#59B1E3'}}>ai</span><span style={{color: '#60A875'}}>ly Tidbit</span> Formula
            </h3>
            <p className="text-xl text-gray-600 font-medium" style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}>
              Like a cheat code for real life — watch, try, repeat.
            </p>
          </div>
          
          {/* Interactive 3-Step Flow - Clean layout without connection lines */}
          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Step 1: Watch - Pastel Blue */}
            <div className="group relative z-10">
              <div className="bg-white p-8 rounded-3xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border border-[#C7E6F7] relative overflow-hidden">
                {/* Top accent */}
                <div className="absolute top-0 left-0 w-full h-2 bg-[#C7E6F7]"></div>
                
                {/* Step number */}
                <div className="w-12 h-12 bg-[#C7E6F7] text-[#59B1E3] rounded-full flex items-center justify-center font-bold text-lg mb-6 group-hover:scale-105 transition-transform duration-300">
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
              </div>
            </div>

            {/* Step 2: Try - Pastel Green */}
            <div className="group relative z-10">
              <div className="bg-white p-8 rounded-3xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border border-[#C6E8D3] relative overflow-hidden">
                {/* Top accent */}
                <div className="absolute top-0 left-0 w-full h-2 bg-[#C6E8D3]"></div>
                
                {/* Step number */}
                <div className="w-12 h-12 bg-[#C6E8D3] text-[#60A875] rounded-full flex items-center justify-center font-bold text-lg mb-6 group-hover:scale-105 transition-transform duration-300">
                  2
                </div>
                
                {/* Icon and title */}
                <div className="mb-6">
                  <div className="text-4xl mb-4">💡</div>
                  <h4 className="text-2xl font-bold text-[#60A875] mb-2" style={{fontFamily: "var(--font-playfair, 'Playfair Display'), serif"}}>
                    Try
                  </h4>
                  <p className="text-lg font-semibold text-gray-700 mb-4" style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}>
                    Use It Yourself
                  </p>
                </div>
                
                {/* Description */}
                <p className="text-gray-700 leading-relaxed" style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}>
                  Watch the walkthrough, then test the idea instantly using a real AI tool — right in your browser.
                </p>
              </div>
            </div>

            {/* Step 3: Share - Pastel Yellow/Gold */}
            <div className="group relative z-10">
              <div className="bg-white p-8 rounded-3xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border border-[#FDE5B6] relative overflow-hidden">
                {/* Top accent */}
                <div className="absolute top-0 left-0 w-full h-2 bg-[#FDE5B6]"></div>
                
                {/* Step number */}
                <div className="w-12 h-12 bg-[#FDE5B6] text-[#D97706] rounded-full flex items-center justify-center font-bold text-lg mb-6 group-hover:scale-105 transition-transform duration-300">
                  3
                </div>
                
                {/* Icon and title */}
                <div className="mb-6">
                  <div className="text-4xl mb-4">📢</div>
                  <h4 className="text-2xl font-bold text-[#D97706] mb-2" style={{fontFamily: "var(--font-playfair, 'Playfair Display'), serif"}}>
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
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Using shared CTA Component instead of inline version */}
      <CTASection />
    </main>
  );
}