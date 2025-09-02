// components/ValuePropCarousel.tsx - COMPLETE HYDRATION SAFETY FIX
'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Clock, BookOpen, Gift, Zap, Users, Heart } from 'lucide-react';

// Define a map for icons
const iconMap = {
  Clock: Clock,
  BookOpen: BookOpen,
  Gift: Gift,
  Zap: Zap,
  Users: Users,
  Heart: Heart,
} as const;

export interface ValuePropCardProps {
  title: string;
  description: string;
  icon: keyof typeof iconMap;
  accent?: 'green' | 'blue' | 'orange' | 'purple' | 'pink';
}

const ValuePropCard: React.FC<ValuePropCardProps> = ({ 
  title, 
  description, 
  icon, 
  accent = 'green' 
}) => {
  const IconComponent = iconMap[icon];
  
  // ? BRAND COLOR FIX: Use proper brand color classes
  const accentColors = {
    green: {
      gradient: 'from-brand-green to-green-400',
      text: 'text-brand-green',
      border: 'border-brand-green/20'
    },
    blue: {
      gradient: 'from-brand-blue to-blue-400',
      text: 'text-brand-blue',
      border: 'border-brand-blue/20'
    },
    orange: {
      gradient: 'from-orange-400 to-orange-500',
      text: 'text-orange-600',
      border: 'border-orange-400/20'
    },
    purple: {
      gradient: 'from-purple-400 to-purple-500',
      text: 'text-purple-600',
      border: 'border-purple-400/20'
    },
    pink: {
      gradient: 'from-pink-400 to-pink-500',
      text: 'text-pink-600',
      border: 'border-pink-400/20'
    }
  } as const;

  const colors = accentColors[accent];

  return (
    <div 
      className={`h-full w-full p-6 bg-white/90 backdrop-blur-sm rounded-2xl border-2 ${colors.border} shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center group hover:scale-[1.02]`}
      style={{ 
        minHeight: '280px',
        boxSizing: 'border-box'
      }}
    >
      <div className={`w-16 h-16 bg-gradient-to-br ${colors.gradient} rounded-full flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 flex-shrink-0`}>
        {IconComponent && <IconComponent className="w-8 h-8 text-white" />}
      </div>
      <h3 
        className={`text-xl font-bold ${colors.text} mb-3 leading-tight flex-shrink-0`} 
        style={{ fontFamily: "var(--font-playfair, 'Playfair Display'), serif" }}
      >
        {title}
      </h3>
      <p 
        className="text-base text-gray-700 leading-relaxed flex-grow" 
        style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk'), sans-serif" }}
      >
        {description}
      </p>
    </div>
  );
};

interface ValuePropCarouselProps {
  cards: ValuePropCardProps[];
  autoPlay?: boolean;
  autoPlayDelay?: number;
  className?: string;
}

const ValuePropCarousel: React.FC<ValuePropCarouselProps> = ({ 
  cards = [], 
  autoPlay = true, 
  autoPlayDelay = 4000,
  className = ""
}) => {
  // ? CRITICAL FIX: ALL hooks MUST be declared BEFORE any conditional returns
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(autoPlay);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const totalCards = cards.length;

  // ? HYDRATION SAFETY: Wait for mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const goToSlide = useCallback((index: number) => {
    if (!mounted || isTransitioning) return; // Guard against running during hydration

    setIsTransitioning(true);
    
    let newIndex = index;
    if (newIndex < 0) {
      newIndex = totalCards - 1;
    } else if (newIndex >= totalCards) {
      newIndex = 0;
    }
    
    setCurrentIndex(newIndex);
    
    // Reset transition flag after animation
    setTimeout(() => setIsTransitioning(false), 300);
  }, [totalCards, isTransitioning, mounted]);

  const nextSlide = useCallback(() => {
    if (!mounted) return; // Guard against running during hydration
    goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide, mounted]);

  const prevSlide = useCallback(() => {
    if (!mounted) return; // Guard against running during hydration
    goToSlide(currentIndex - 1);
  }, [currentIndex, goToSlide, mounted]);

  // ? HYDRATION SAFETY: Auto-play functionality only after mount
  useEffect(() => {
    if (!mounted) return;
    
    if (isAutoPlaying && totalCards > 1 && !isTransitioning) {
      const interval = setInterval(nextSlide, autoPlayDelay);
      return () => clearInterval(interval);
    }
  }, [mounted, isAutoPlaying, totalCards, nextSlide, autoPlayDelay, isTransitioning]);

  // Pause auto-play on hover
  const handleMouseEnter = useCallback(() => {
    if (!mounted) return; // Guard against running during hydration
    setIsAutoPlaying(false);
  }, [mounted]);

  const handleMouseLeave = useCallback(() => {
    if (!mounted) return; // Guard against running during hydration
    setIsAutoPlaying(autoPlay);
  }, [autoPlay, mounted]);

  // ? HYDRATION SAFETY: Keyboard navigation only after mount
  useEffect(() => {
    if (!mounted) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mounted, nextSlide, prevSlide]);

  // Touch handling - only after mount
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!mounted) return; // Guard against running during hydration
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, [mounted]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!mounted) return; // Guard against running during hydration
    setTouchEnd(e.targetTouches[0].clientX);
  }, [mounted]);

  const handleTouchEnd = useCallback(() => {
    if (!mounted || !touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  }, [touchStart, touchEnd, nextSlide, prevSlide, mounted]);

  // ? CRITICAL: Early returns AFTER all hooks are declared
  
  // Early return if no cards
  if (!cards || cards.length === 0) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <div className="p-6 text-center text-gray-500">
          No cards to display
        </div>
      </div>
    );
  }

  // ? HYDRATION SAFETY: Loading state during hydration
  if (!mounted) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
        <div style={{ paddingLeft: '60px', paddingRight: '60px' }}>
          <div className="animate-pulse">
            <div 
              className="h-full w-full p-6 bg-gray-200 rounded-2xl flex flex-col items-center"
              style={{ minHeight: '280px' }}
            >
              <div className="w-16 h-16 bg-gray-300 rounded-full mb-4"></div>
              <div className="h-6 bg-gray-300 rounded w-32 mb-3"></div>
              <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get current card
  const currentCard = cards[currentIndex];

  return (
    <div 
      className={`${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="region"
      aria-label="Value proposition carousel"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        maxWidth: '600px',
        margin: '0 auto',
        position: 'relative'
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 'auto',
          paddingLeft: '60px',
          paddingRight: '60px'
        }}
      >
        {/* Current card with fade transition */}
        <div
          key={currentIndex} // Force re-render for transition
          style={{
            opacity: isTransitioning ? 0.7 : 1,
            transform: isTransitioning ? 'scale(0.98)' : 'scale(1)',
            transition: 'all 300ms ease-out',
            width: '100%'
          }}
        >
          <ValuePropCard {...currentCard} />
        </div>

        {/* Navigation buttons - BRAND COLOR FIX */}
        {totalCards > 1 && (
          <>
            <button
              onClick={prevSlide}
              disabled={isTransitioning}
              style={{
                position: 'absolute',
                left: '0px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                background: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                cursor: isTransitioning ? 'wait' : 'pointer',
                transition: 'all 300ms ease',
                opacity: isTransitioning ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!isTransitioning) {
                  e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
              aria-label="Previous slide"
            >
              <ChevronLeft style={{ width: '20px', height: '20px', color: 'rgb(var(--brand-green))' }} />
            </button>
            
            <button
              onClick={nextSlide}
              disabled={isTransitioning}
              style={{
                position: 'absolute',
                right: '0px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                background: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                cursor: isTransitioning ? 'wait' : 'pointer',
                transition: 'all 300ms ease',
                opacity: isTransitioning ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!isTransitioning) {
                  e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
              aria-label="Next slide"
            >
              <ChevronRight style={{ width: '20px', height: '20px', color: 'rgb(var(--brand-green))' }} />
            </button>
          </>
        )}
      </div>

      {/* Pagination dots - BRAND COLOR FIX */}
      {totalCards > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '20px',
          gap: '8px',
          alignItems: 'center'
        }}>
          {cards.map((_, index) => (
            <button
              key={`dot-${index}`}
              onClick={() => goToSlide(index)}
              disabled={isTransitioning}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                border: 'none',
                background: index === currentIndex ? 'brand-green' : '#d1d5db', // Use brand green
                cursor: isTransitioning ? 'wait' : 'pointer',
                transition: 'all 300ms ease',
                transform: index === currentIndex ? 'scale(1.2)' : 'scale(1)',
                position: 'relative',
                overflow: 'hidden',
                opacity: isTransitioning ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (index !== currentIndex && !isTransitioning) {
                  e.currentTarget.style.background = '#9ca3af';
                }
              }}
              onMouseLeave={(e) => {
                if (index !== currentIndex) {
                  e.currentTarget.style.background = '#d1d5db';
                }
              }}
              aria-label={`Go to slide ${index + 1}`}
            >
              {/* Auto-play progress indicator */}
              {index === currentIndex && isAutoPlaying && !isTransitioning && (
                <div 
                  className="dailytidbit-progress-animation"
                  style={{
                    position: 'absolute',
                    inset: '0',
                    background: '#86efac',
                    borderRadius: '50%'
                  }}
                />
              )}
            </button>
          ))}
          
          {/* Auto-play toggle */}
          {autoPlay && (
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              style={{
                marginLeft: '12px',
                fontSize: '12px',
                color: '#6b7280',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'all 200ms ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#374151';
                e.currentTarget.style.background = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6b7280';
                e.currentTarget.style.background = 'transparent';
              }}
              aria-label={isAutoPlaying ? 'Pause auto-play' : 'Resume auto-play'}
              title={isAutoPlaying ? 'Pause auto-play' : 'Resume auto-play'}
            >
              {isAutoPlaying ? '??' : '??'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ValuePropCarousel;
