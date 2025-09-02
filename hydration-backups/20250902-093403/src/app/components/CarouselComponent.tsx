'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function CarouselComponent() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)

  const dailyTidbits = [
    { id: 1, image: "https://cdn.dailytidbit.org/Day-1/Day-1.png", href: "/day/1" },
    { id: 2, image: "https://cdn.dailytidbit.org/Day-2/Day-2.png", href: "/day/2" },
    { id: 3, image: "https://cdn.dailytidbit.org/Day-3/Day-3.png", href: "/day/3" },
    { id: 4, image: "https://cdn.dailytidbit.org/Day-4/Day-4.png", href: "/day/4" },
    { id: 5, image: "https://cdn.dailytidbit.org/Day-5/Day-5.png", href: "/day/5" }
  ]

  // Hydration safety
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if mobile on mount and resize - only after mounted
  useEffect(() => {
    if (!mounted) return

    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [mounted])

  // Calculate slides - only after mounted
  const itemsPerSlide = mounted ? (isMobile ? 1 : 3) : 3 // Default to 3 for SSR
  const totalSlides = Math.ceil(dailyTidbits.length / itemsPerSlide)

  // Navigation functions
  const goToSlide = (slideIndex: number) => {
    if (!mounted) return

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

  // Show loading state during hydration
  if (!mounted) {
    return (
      <div className="relative w-full max-w-7xl mx-auto">
        <div className="overflow-hidden relative px-12">
          <div className="grid gap-6 grid-cols-3">
            {dailyTidbits.slice(0, 3).map((tidbit) => (
              <div key={tidbit.id} className="group">
                <div className="bg-white rounded-xl shadow-md">
                  <div className="bg-gray-200 rounded-t-xl overflow-hidden animate-pulse">
                    <div className="w-full h-48 bg-gray-200"></div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full max-w-7xl mx-auto">
      <div className="overflow-hidden relative px-12">
        <div
          ref={carouselRef}
          className="flex transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(-${currentSlide * 100}%)`,
          }}
        >
          {Array.from({ length: totalSlides }).map((_, slideIndex) => (
            <div
              key={slideIndex}
              className="w-full flex-shrink-0 pr-6"
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
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-800" style={{fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"}}>
                              Day {tidbit.id}
                            </h3>
                            <div className="w-8 h-8 bg-[brand-green] rounded-full flex items-center justify-center text-white text-sm font-medium group-hover:bg-brand-greenDark transition-colors duration-300">
                              ?
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

        <button
          onClick={prevSlide}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 ml-4 z-20 w-12 h-12 bg-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center text-gray-600 hover:text-[brand-green] transition-all duration-300 hover:scale-110 disabled:opacity-50"
          disabled={currentSlide === 0 && totalSlides <= 1}
        >
          <ChevronLeft size={24} />
        </button>
        
        <button
          onClick={nextSlide}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 mr-4 z-20 w-12 h-12 bg-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center text-gray-600 hover:text-[brand-green] transition-all duration-300 hover:scale-110 disabled:opacity-50"
          disabled={currentSlide === totalSlides - 1 && totalSlides <= 1}
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {totalSlides > 1 && (
        <div className="flex justify-center mt-8 gap-2">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-[brand-green] scale-110'
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
