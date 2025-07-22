'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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
    <div className="relative">
      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-6 z-10 w-12 h-12 bg-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center text-gray-600 hover:text-[#60A875] transition-all duration-300 hover:scale-110 disabled:opacity-50"
        disabled={currentSlide === 0 && totalSlides <= 1}
      >
        <ChevronLeft size={24} />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-6 z-10 w-12 h-12 bg-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center text-gray-600 hover:text-[#60A875] transition-all duration-300 hover:scale-110 disabled:opacity-50"
        disabled={currentSlide === totalSlides - 1 && totalSlides <= 1}
      >
        <ChevronRight size={24} />
      </button>

      {/* Carousel Container */}
      <div className="overflow-hidden">
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
              className="w-full flex-shrink-0"
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
                            <h3 className="text-lg font-semibold text-gray-800" style={{fontFamily: "'Space Grotesk', sans-serif"}}>
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

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section with Enhanced Layout - CLEANED UP */}
      <section className="bg-gradient-to-br from-green-50 to-green-100 px-6 md:px-12 py-20 relative overflow-hidden">
        {/* Subtle floating background elements */}
        <div className="absolute top-20 right-10 w-32 h-32 bg-green-200/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-orange-200/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        
        <div className={`max-w-7xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="relative flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            {/* Left side - Hero graphic (cleaned up) */}
            <div className="lg:w-1/2 flex justify-center lg:justify-start animate-fade-in-up delay-300">
              <div className="relative">
                {/* Curved background that bleeds */}
                <div className="absolute -inset-8 bg-gradient-to-br from-orange-200/40 to-green-200/40 rounded-[3rem] blur-2xl -z-10"></div>
                <div className="relative max-w-lg w-full lg:w-[500px]">
                  <img
                    src="https://cdn.dailytidbit.org/Hands-Uppp.png"
                    alt="Person celebrating AI success with arms wide open"
                    className="w-full h-auto object-contain hover:scale-105 transform transition-all duration-500 relative z-10"
                  />
                </div>
              </div>
            </div>

            {/* Right side - Text content */}
            <div className="lg:w-1/2 space-y-8 text-center lg:text-left">
              <h1 className="heading-hero text-5xl md:text-6xl lg:text-7xl leading-tight animate-fade-in-up" style={{fontFamily: "'Playfair Display', serif", fontWeight: 700}}>
                <span className="text-[#59B1E3]">✨ AI</span> <span className="text-[#60A875]">for Real People</span>
              </h1>
              
              <div className="space-y-6 body-large text-xl md:text-2xl text-gray-800 leading-relaxed animate-fade-in-up delay-300" style={{fontFamily: "'Space Grotesk', sans-serif"}}>
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

              {/* Personality-driven cards slider */}
              <div className="animate-fade-in-up delay-500">
                <div 
                  className="flex overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
                  style={{
                    scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  {/* Card 1 */}
                  <div className="flex-shrink-0 w-full snap-start relative pr-6">
                    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border-2 border-[#60A875]/20 shadow-md hover:shadow-lg transition-all duration-300 h-full">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3" style={{fontFamily: "'Space Grotesk', sans-serif"}}>
                        The Clean Confidence
                      </p>
                      <h3 className="text-xl font-bold text-[#60A875] mb-4" style={{fontFamily: "'Playfair Display', serif"}}>
                        Why You'll Love Daily Tidbit
                      </h3>
                      <div className="space-y-3">
                        <p className="text-base text-gray-700" style={{fontFamily: "'Space Grotesk', sans-serif"}}>
                          <strong>Quick.</strong> 60-second videos, no fluff.
                        </p>
                        <p className="text-base text-gray-700" style={{fontFamily: "'Space Grotesk', sans-serif"}}>
                          <strong>Clear.</strong> Easy walkthroughs for real results.
                        </p>
                        <p className="text-base text-gray-700" style={{fontFamily: "'Space Grotesk', sans-serif"}}>
                          <strong>Free.</strong> No catch, just good vibes.
                        </p>
                      </div>
                    </div>
                    {/* Scroll hint on first card */}
                    <div className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg opacity-70 pointer-events-none">
                      ⟶
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="flex-shrink-0 w-full snap-start relative pr-6">
                    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border-2 border-[#59B1E3]/20 shadow-md hover:shadow-lg transition-all duration-300 h-full">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3" style={{fontFamily: "'Space Grotesk', sans-serif"}}>
                        The Daily Habit Hook
                      </p>
                      <h3 className="text-xl font-bold text-[#59B1E3] mb-4" style={{fontFamily: "'Playfair Display', serif"}}>
                        Why People Keep Coming Back
                      </h3>
                      <div className="space-y-3">
                        <p className="text-base text-gray-700" style={{fontFamily: "'Space Grotesk', sans-serif"}}>
                          <strong>It's fast.</strong> One smart tidbit a day.
                        </p>
                        <p className="text-base text-gray-700" style={{fontFamily: "'Space Grotesk', sans-serif"}}>
                          <strong>It's real.</strong> Actual tools, real-life tasks.
                        </p>
                        <p className="text-base text-gray-700" style={{fontFamily: "'Space Grotesk', sans-serif"}}>
                          <strong>It's fun.</strong> Like a mini win, every time.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="flex-shrink-0 w-full snap-start relative pr-6">
                    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border-2 border-orange-400/20 shadow-md hover:shadow-lg transition-all duration-300 h-full">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3" style={{fontFamily: "'Space Grotesk', sans-serif"}}>
                        The You-Centric One
                      </p>
                      <h3 className="text-xl font-bold text-orange-600 mb-4" style={{fontFamily: "'Playfair Display', serif"}}>
                        Why You'll Actually Use This
                      </h3>
                      <div className="space-y-3">
                        <p className="text-base text-gray-700" style={{fontFamily: "'Space Grotesk', sans-serif"}}>
                          <strong>Short & sweet.</strong> Watch it, try it, done.
                        </p>
                        <p className="text-base text-gray-700" style={{fontFamily: "'Space Grotesk', sans-serif"}}>
                          <strong>Super useful.</strong> Stuff you'll *actually* use.
                        </p>
                        <p className="text-base text-gray-700" style={{fontFamily: "'Space Grotesk', sans-serif"}}>
                          <strong>No pressure.</strong> Just show up and learn.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card 4 */}
                  <div className="flex-shrink-0 w-full snap-start relative pr-6">
                    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border-2 border-purple-400/20 shadow-md hover:shadow-lg transition-all duration-300 h-full">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3" style={{fontFamily: "'Space Grotesk', sans-serif"}}>
                        The Gen Z Friend
                      </p>
                      <h3 className="text-xl font-bold text-purple-600 mb-4" style={{fontFamily: "'Playfair Display', serif"}}>
                        What Makes Daily Tidbit Kinda Addictive
                      </h3>
                      <div className="space-y-3">
                        <p className="text-base text-gray-700" style={{fontFamily: "'Space Grotesk', sans-serif"}}>
                          <strong>Fast AF.</strong> Most tips are under a minute.
                        </p>
                        <p className="text-base text-gray-700" style={{fontFamily: "'Space Grotesk', sans-serif"}}>
                          <strong>Real-world stuff.</strong> No theory dumps here.
                        </p>
                        <p className="text-base text-gray-700" style={{fontFamily: "'Space Grotesk', sans-serif"}}>
                          <strong>Free-free.</strong> No subscriptions, no strings.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card 5 */}
                  <div className="flex-shrink-0 w-full snap-start relative">
                    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border-2 border-[#60A875]/20 shadow-md hover:shadow-lg transition-all duration-300 h-full">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3" style={{fontFamily: "'Space Grotesk', sans-serif"}}>
                        The Brand Voice Banger
                      </p>
                      <h3 className="text-xl font-bold text-[#60A875] mb-4" style={{fontFamily: "'Playfair Display', serif"}}>
                        Daily Tidbit = Fast, Useful, Actually Fun
                      </h3>
                      <div className="space-y-3">
                        <p className="text-base text-gray-700" style={{fontFamily: "'Space Grotesk', sans-serif"}}>
                          <strong>60-second videos.</strong> With walkthroughs if you want 'em.
                        </p>
                        <p className="text-base text-gray-700" style={{fontFamily: "'Space Grotesk', sans-serif"}}>
                          <strong>From emails to ideas.</strong> Quick wins and big moves.
                        </p>
                        <p className="text-base text-gray-700" style={{fontFamily: "'Space Grotesk', sans-serif"}}>
                          <strong>And yeah — it's free.</strong> Because making life better *should* be fun.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hide scrollbar styles */}
              <style jsx>{`
                .scrollbar-hide {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                  display: none;
                }
              `}</style>

              {/* Moved Bob Marley line below the benefits box */}
              <div className="mt-6 text-center lg:text-left animate-fade-in-up delay-600">
                <p className="text-lg text-gray-700 italic leading-relaxed" style={{fontFamily: "'Space Grotesk', sans-serif"}}>
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
                    <span className="body-bold text-lg relative z-10">Get Started Today</span>
                    <span className="group-hover:translate-x-1 transition-transform duration-200 relative z-10">→</span>
                  </button>
                  
                  <button 
                    onClick={() => scrollToSection('how-it-works')}
                    className="border-2 border-[#60A875] text-[#60A875] px-8 py-4 rounded-xl hover:bg-[#60A875] hover:text-white transition-all duration-300 flex items-center gap-3 group"
                  >
                    <span className="body-bold text-lg">Learn How</span>
                    <span className="group-hover:translate-x-1 transition-transform duration-200">✨</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Can You Do With AI Section - True Carousel */}
      <section id="what-is-ai" className="bg-gradient-to-br from-orange-50/30 to-yellow-50/30 px-6 md:px-12 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 
              className="heading-section text-4xl md:text-5xl text-[#60A875] mb-6 leading-tight"
              style={{fontFamily: "'Playfair Display', serif"}}
            >
              This Is What You Can Do With AI
            </h2>
            
            <p 
              className="text-xl md:text-2xl text-gray-800 max-w-2xl mx-auto leading-relaxed"
              style={{fontFamily: "'Space Grotesk', sans-serif"}}
            >
              One smart, real-world idea a day. Quick, creative, and actually useful.
            </p>
          </div>

          {/* True Carousel Container */}
          <div className="px-4">
            <CarouselComponent />
          </div>

          {/* Bottom Caption */}
          <div className="text-center mt-12">
            <p 
              className="text-lg text-gray-600 italic"
              style={{fontFamily: "'Space Grotesk', sans-serif"}}
            >
              Real tips from real people doing <strong className="text-[#60A875]">real things</strong> with AI.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section - Gentler blue */}
      <section id="how-it-works" className="bg-gradient-to-br from-blue-50/70 to-slate-100/50 px-6 md:px-12 py-20 relative overflow-hidden">
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200/30 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-green-200/30 rounded-full blur-xl"></div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          <h3 className="heading-section text-4xl md:text-5xl text-[#59B1E3] mb-6 text-center">
            ✨ How Does AI Actually Work?
          </h3>
          
          <p className="body-large text-xl text-gray-800 mb-16 text-center max-w-2xl mx-auto">AI has two simple parts working together behind the scenes:</p>

          <div className="grid md:grid-cols-2 gap-10">
            <div className="bg-white p-10 rounded-3xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#60A875] to-green-400"></div>
              <div className="flex items-center gap-6 mb-8">
                <div className="w-16 h-16 bg-[#60A875] text-white rounded-full flex items-center justify-center body-bold text-xl group-hover:scale-110 transition-transform duration-300">1</div>
                <h4 className="heading-subsection text-2xl text-[#60A875]">The model is the brain</h4>
              </div>
              
              <div className="space-y-5 body-medium text-gray-700 text-lg">
                <p>
                  It's trained on massive datasets — reading patterns in language, images, sounds, and code —
                  so it can generate helpful results.
                </p>
                <p>
                  Some models write, some generate images, others make music, synthesize voices, 
                  or even help with code.
                </p>
                <p>You don't see the model — and you don't have to.</p>
                <p className="body-bold text-[#60A875]">
                  It all happens in the background, but that's where the magic lives.
                </p>
              </div>
            </div>

            <div className="bg-white p-10 rounded-3xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#59B1E3] to-blue-400"></div>
              <div className="flex items-center gap-6 mb-8">
                <div className="w-16 h-16 bg-[#59B1E3] text-white rounded-full flex items-center justify-center body-bold text-xl group-hover:scale-110 transition-transform duration-300">2</div>
                <h4 className="heading-subsection text-2xl text-[#59B1E3]">The tool is what you use</h4>
              </div>
              
              <div className="space-y-5 body-medium text-gray-700 text-lg">
                <p>Most people don't interact with the model directly.</p>
                <p>
                  Instead, they use websites or apps that make it easy.
                </p>
                <p>
                  These tools give you a simple interface — like a chat box, a design screen, or a form.
                </p>
                <p className="body-bold text-[#59B1E3]">
                  You just type what you want, and the tool talks to the model behind the scenes to make it happen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How Daily Tidbit Works - Sunny cream instead of mint */}
      <section id="how-daily-tidbit-works" className="bg-gradient-to-br from-orange-50/60 to-yellow-50/60 px-6 md:px-12 py-20">
        <div className="max-w-5xl mx-auto">
          <h3 className="heading-section text-4xl md:text-5xl text-[#60A875] mb-12 text-center">How Daily Tidbit Works</h3>
          
          {/* Day 1 preview - right after the heading */}
          <div className="mb-16 text-center">
            <img 
              src="https://cdn.dailytidbit.org/day-1.png" 
              alt="Daily Tidbit Day 1 preview" 
              className="mx-auto max-w-[360px] w-[90%] h-auto rounded-xl shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-300" 
            />
            <p className="text-sm text-gray-500 mt-4 font-medium">
              Real tips. Real tools. Real people learning AI — one step at a time.
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-10 rounded-3xl mb-16 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#60A875]/20 to-[#59B1E3]/20 rounded-full blur-xl"></div>
            <div className="relative z-10 text-center max-w-4xl mx-auto">
              <p className="body-large text-xl text-gray-800 mb-8">
                Every day, we give you one quick AI tip — something fun, useful, or creative you can try with free tools. 
                You'll get a <strong className="text-[#60A875]">step-by-step walkthrough</strong> that shows exactly how to use it — 
                no guesswork, no tech-speak.
              </p>
              <p className="body-medium text-lg text-gray-700 mb-6">No stress. No experience needed.</p>
              <p className="heading-subsection text-3xl text-[#60A875]">Just smart ideas, made easy.</p>
            </div>
          </div>

          {/* Three-step process */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-[#60A875] to-green-400 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">📺</span>
              </div>
              <h4 className="heading-subsection text-xl text-[#60A875] mb-4">Watch & Learn</h4>
              <p className="text-gray-700">Start with a 60-second video showing today's AI tip in action</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-[#59B1E3] to-blue-400 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🛠️</span>
              </div>
              <h4 className="heading-subsection text-xl text-[#59B1E3] mb-4">Try It Out</h4>
              <p className="text-gray-700">Use our Tidbit Tutor GPT to practice and test your understanding</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🎯</span>
              </div>
              <h4 className="heading-subsection text-xl text-orange-600 mb-4">Share & Connect</h4>
              <p className="text-gray-700">Post your creations on BitBoard and see what the community is making</p>
            </div>
          </div>

          {/* Community highlight */}
          <div className="bg-gradient-to-r from-[#60A875]/10 to-[#59B1E3]/10 p-8 rounded-2xl text-center">
            <h4 className="heading-subsection text-2xl text-gray-800 mb-4">Join the Tidbit Creators Community</h4>
            <p className="body-large text-lg text-gray-700 mb-6">
              Connect with curious, kind people learning AI together. Share your creations, 
              get inspired by others, and see how AI is making everyday life better for real people.
            </p>
            <div className="flex justify-center gap-4">
              <button className="bg-[#60A875] text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-colors duration-300">
                Explore BitBoard
              </button>
              <button className="border-2 border-[#59B1E3] text-[#59B1E3] px-6 py-3 rounded-xl hover:bg-[#59B1E3] hover:text-white transition-all duration-300">
                Try Tidbit Tutor
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Merged Mission + CTA Final Section - Softer blue with texture */}
      <section className="bg-gradient-to-br from-blue-500/90 to-blue-600/90 px-6 md:px-12 py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20"></div>
        <div className="absolute top-10 left-10 w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        
        <div className="max-w-4xl mx-auto text-center text-white relative z-10">
          <h4 className="heading-section text-4xl md:text-5xl mb-8 leading-tight">
            This Isn't Just About Tips — It's About What You'll Do With Them
          </h4>
          
          <div className="max-w-3xl mx-auto mb-16">
            <p className="text-xl md:text-2xl opacity-95 leading-relaxed">
              We believe AI should boost creativity, spark new ideas, and help real people do amazing things. 
              Whether you're writing, dreaming, planning, or just curious — <strong className="text-blue-100">you belong here.</strong>
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <button className="bg-white text-blue-600 px-12 py-5 rounded-2xl body-bold text-xl hover:bg-gray-50 hover:scale-105 transform transition-all duration-200 shadow-xl hover:shadow-2xl flex items-center gap-3 group">
              <span>Start Learning Today</span>
              <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
            </button>
            
            <button className="border-3 border-white text-white px-12 py-5 rounded-2xl body-bold text-xl hover:bg-white hover:text-blue-600 transition-all duration-200 flex items-center gap-3 group">
              <span>Explore the BitBoard</span>
              <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
            </button>
          </div>

          <p className="text-lg text-blue-100 italic">
            No pressure. Just play around and see what happens.
          </p>
        </div>
      </section>
    </main>
  );
}