// components/AIExplanationCarousel.tsx
'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface AISlideProps {
  title: string;
  content: React.ReactNode;
  accent: 'green' | 'blue' | 'purple';
  hasButton?: boolean;
  buttonText?: string;
  buttonAction?: () => void;
  stepNumber: number;
}

const AISlide: React.FC<AISlideProps> = ({ 
  title, 
  content, 
  accent,
  hasButton = false,
  buttonText,
  buttonAction,
  stepNumber
}) => {
  const accentColors = {
    green: {
      gradient: 'from-[#60A875] to-green-400',
      text: 'text-[#60A875]',
      border: 'border-[#60A875]/20',
      bgAccent: 'bg-[#60A875]',
      bgLight: 'bg-green-50'
    },
    blue: {
      gradient: 'from-[#59B1E3] to-blue-400',
      text: 'text-[#59B1E3]',
      border: 'border-[#59B1E3]/20',
      bgAccent: 'bg-[#59B1E3]',
      bgLight: 'bg-blue-50'
    },
    purple: {
      gradient: 'from-purple-400 to-purple-500',
      text: 'text-purple-600',
      border: 'border-purple-400/20',
      bgAccent: 'bg-purple-500',
      bgLight: 'bg-purple-50'
    }
  } as const;

  const colors = accentColors[accent];

  return (
    <div 
      className={`w-full h-full flex flex-col justify-center items-center p-4 sm:p-6 md:p-8 ${colors.bgLight} relative overflow-hidden`}
      style={{ 
        minHeight: '400px', // Reduced from 500px for mobile 
        boxSizing: 'border-box'
      }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className={`w-full h-full bg-gradient-to-br ${colors.gradient}`}></div>
      </div>
      
      {/* Step indicator - Responsive positioning */}
      <div className="absolute top-3 left-3 sm:top-6 sm:left-6 flex items-center gap-2 sm:gap-3">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 ${colors.bgAccent} text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-lg`}>
          {stepNumber}
        </div>
        <div className="text-xs sm:text-sm text-gray-500 font-medium">
          Step {stepNumber} of 3
        </div>
      </div>
      
      {/* Main content card - Better mobile spacing */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 lg:p-12 max-w-2xl w-full mx-auto relative z-10 border border-white/50 overflow-hidden">
        {/* AI Host background image for all slides - Mobile optimized */}
        <>
          {/* Host image background - Better mobile positioning */}
          <div 
            className="absolute bottom-0 right-0 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-96 lg:h-96 opacity-30 sm:opacity-40 pointer-events-none"
            style={{
              backgroundImage: 'url(https://cdn.dailytidbit.org/Host/hosttransparent.png)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'bottom center',
              filter: 'blur(0.2px)',
              transform: 'translateX(10%) translateY(10%) scale(0.8)', // Better mobile scaling
              transformOrigin: 'bottom right'
            }}
          />
          {/* Lighter overlay for text readability - More opaque on mobile */}
          <div className="absolute inset-0 bg-white/65 sm:bg-white/55 pointer-events-none rounded-2xl sm:rounded-3xl"></div>
        </>
        
        {/* Content with higher z-index - Mobile optimized spacing */}
        <div className="relative z-20">
          {/* Title - Responsive text sizing */}
          <h4 
            className={`text-xl sm:text-2xl md:text-3xl font-bold ${colors.text} mb-4 sm:mb-6 text-center leading-tight`}
            style={{ fontFamily: "var(--font-playfair, 'Playfair Display'), serif" }}
          >
            {title}
          </h4>
          
          {/* Content - Responsive text sizing and spacing */}
          <div 
            className="text-base sm:text-lg text-gray-700 leading-relaxed space-y-3 sm:space-y-4 text-center"
            style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif" }}
          >
            {content}
          </div>
          
          {/* Button if present - Mobile optimized */}
          {hasButton && buttonText && (
            <div className="mt-6 sm:mt-8 text-center">
              <button 
                onClick={buttonAction}
                className={`${colors.bgAccent} text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:opacity-90 hover:scale-105 transition-all duration-300 inline-flex items-center gap-2 sm:gap-3 font-semibold text-base sm:text-lg shadow-lg`}
              >
                {buttonText}
                <span className="text-lg sm:text-xl">→</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Floating elements for visual interest - Mobile hidden to reduce clutter */}
      <div className={`hidden sm:block absolute top-20 right-12 w-16 h-16 ${colors.bgAccent}/10 rounded-full blur-xl animate-pulse`}></div>
      <div className={`hidden sm:block absolute bottom-20 left-12 w-12 h-12 ${colors.bgAccent}/15 rounded-full blur-lg animate-pulse delay-1000`}></div>
    </div>
  );
};

const AIExplanationCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const slides: AISlideProps[] = [
    {
      stepNumber: 1,
      title: "The Model = The Brain",
      content: (
        <>
          <p className="text-lg sm:text-xl mb-3 sm:mb-4">
            It's trained on massive datasets — reading patterns in language, images, sounds, and code — so it can generate helpful results.
          </p>
          <p className="mb-3 sm:mb-4">
            Some models write, some generate images, others make music, synthesize voices, or even help with code.
          </p>
          <p className="mb-3 sm:mb-4">
            You don't see the model — and you don't have to.
          </p>
          <p className="font-bold text-[#60A875] text-base sm:text-lg">
            It all happens in the background, but that's where the magic lives.
          </p>
        </>
      ),
      accent: 'green'
    },
    {
      stepNumber: 2,
      title: "The Tool = What You See",
      content: (
        <>
          <p className="text-lg sm:text-xl mb-3 sm:mb-4">
            Most people don't interact with the model directly. Instead, they use websites or apps that make it easy.
          </p>
          <p className="mb-3 sm:mb-4">
            These tools give you a simple interface — like a chat box, design screen, or form.
          </p>
          <p className="font-bold text-[#59B1E3] text-base sm:text-lg">
            You just type what you want, and the tool talks to the model behind the scenes to make it happen.
          </p>
        </>
      ),
      accent: 'blue'
    },
    {
      stepNumber: 3,
      title: "Where Daily Tidbit Fits In",
      content: (
        <>
          <p className="text-lg sm:text-xl mb-3 sm:mb-4">
            We make AI feel easy — and honestly? Fun.
          </p>
          <p className="mb-3 sm:mb-4">
            One smart tip a day to help you write better, create faster, and save time with free tools anyone can use.
          </p>
          <p className="mb-4 sm:mb-6">
            You don't need to be technical. <span className="font-bold text-purple-600">You just need to show up.</span>
          </p>
        </>
      ),
      accent: 'purple',
      hasButton: true,
      buttonText: "Browse the Tidbit Library",
      buttonAction: () => window.location.href = '/TidbitLibrary'
    }
  ];

  const totalSlides = slides.length;

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    
    let newIndex = index;
    if (newIndex < 0) {
      newIndex = totalSlides - 1;
    } else if (newIndex >= totalSlides) {
      newIndex = 0;
    }
    
    setCurrentIndex(newIndex);
    
    setTimeout(() => setIsTransitioning(false), 500);
  }, [totalSlides, isTransitioning]);

  const nextSlide = useCallback(() => {
    goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentIndex - 1);
  }, [currentIndex, goToSlide]);

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying && totalSlides > 1 && !isTransitioning) {
      const interval = setInterval(nextSlide, 6000); // 6 seconds for reading
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying, totalSlides, nextSlide, isTransitioning]);

  // Pause auto-play on hover
  const handleMouseEnter = useCallback(() => {
    setIsAutoPlaying(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsAutoPlaying(true);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        nextSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Touch handling for vertical swipes
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY); // Changed to clientY for vertical
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY); // Changed to clientY for vertical
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > 50;   // Swipe up = next slide
    const isDownSwipe = distance < -50; // Swipe down = previous slide

    if (isUpSwipe) {
      nextSlide();
    } else if (isDownSwipe) {
      prevSlide();
    }
  }, [touchStart, touchEnd, nextSlide, prevSlide]);

  return (
    <div 
      className="ai-explanation-carousel"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="region"
      aria-label="AI explanation carousel"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        position: 'relative',
        height: '550px', // Increased height to accommodate content
        overflow: 'hidden',
        borderRadius: '16px', // Smaller radius on mobile
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}
    >
      {/* Responsive height via CSS media queries */}
      <style jsx>{`
        @media (max-width: 640px) {
          .ai-explanation-carousel {
            height: 500px !important;
            border-radius: 16px !important;
          }
        }
        @media (max-width: 480px) {
          .ai-explanation-carousel {
            height: 480px !important;
          }
        }
      `}</style>

      {/* Vertical sliding container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: `${totalSlides * 100}%`,
          transform: `translateY(-${currentIndex * (100 / totalSlides)}%)`,
          transition: isTransitioning ? 'transform 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
          willChange: 'transform'
        }}
      >
        {slides.map((slide, index) => (
          <div
            key={`ai-slide-${index}`}
            style={{
              height: `${100 / totalSlides}%`,
              flexShrink: 0
            }}
          >
            <AISlide {...slide} />
          </div>
        ))}
      </div>

      {/* Vertical navigation buttons - Mobile optimized */}
      {totalSlides > 1 && (
        <>
          <button
            onClick={prevSlide}
            disabled={isTransitioning || currentIndex === 0}
            style={{
              position: 'absolute',
              top: '15px', // Closer to edge on mobile
              right: '15px',
              zIndex: 20,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              borderRadius: '50%',
              width: '40px', // Smaller on mobile
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              cursor: isTransitioning ? 'wait' : 'pointer',
              transition: 'all 300ms ease',
              opacity: (isTransitioning || currentIndex === 0) ? 0.3 : 1
            }}
            onMouseEnter={(e) => {
              if (!isTransitioning && currentIndex > 0) {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
            }}
            aria-label="Previous slide (swipe down)"
          >
            <ChevronUp style={{ width: '20px', height: '20px', color: '#60A875' }} />
          </button>
          
          <button
            onClick={nextSlide}
            disabled={isTransitioning || currentIndex === totalSlides - 1}
            style={{
              position: 'absolute',
              bottom: '15px', // Closer to edge on mobile
              right: '15px',
              zIndex: 20,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              borderRadius: '50%',
              width: '40px', // Smaller on mobile
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              cursor: isTransitioning ? 'wait' : 'pointer',
              transition: 'all 300ms ease',
              opacity: (isTransitioning || currentIndex === totalSlides - 1) ? 0.3 : 1
            }}
            onMouseEnter={(e) => {
              if (!isTransitioning && currentIndex < totalSlides - 1) {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
            }}
            aria-label="Next slide (swipe up)"
          >
            <ChevronDown style={{ width: '20px', height: '20px', color: '#60A875' }} />
          </button>
        </>
      )}

      {/* Vertical progress indicator - Mobile optimized */}
      <div style={{
        position: 'absolute',
        top: '15px', // Closer to edge on mobile
        left: '15px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px', // Smaller gap on mobile
        zIndex: 20
      }}>
        {slides.map((_, index) => (
          <div
            key={`progress-${index}`}
            style={{
              width: '3px', // Thinner on mobile
              height: '50px', // Shorter on mobile
              borderRadius: '2px',
              background: 'rgba(255, 255, 255, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Progress fill */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: index < currentIndex ? '100%' : index === currentIndex ? '100%' : '0%',
                background: index < currentIndex ? 'rgba(255, 255, 255, 0.9)' : 'rgba(96, 168, 117, 0.9)',
                transition: 'height 300ms ease',
                borderRadius: '2px'
              }}
            >
              {/* Auto-play animation */}
              {index === currentIndex && isAutoPlaying && !isTransitioning && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(96, 168, 117, 1)',
                    transformOrigin: 'top',
                    animation: 'story-progress 6000ms linear infinite'
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Story-like instruction hint - Mobile optimized */}
      <div style={{
        position: 'absolute',
        bottom: '15px',
        left: '15px',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '11px', // Smaller on mobile
        fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif"
      }}>
        Swipe up ↑ or use arrows
      </div>

      {/* Keyframe animation for story progress */}
      <style jsx>{`
        @keyframes story-progress {
          from { 
            transform: scaleY(0);
          }
          to { 
            transform: scaleY(1);
          }
        }
      `}</style>
    </div>
  );
};

export default AIExplanationCarousel;