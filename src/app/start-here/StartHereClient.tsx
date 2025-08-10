// app/start-here/StartHereClient.tsx
'use client';

import {
  useState,
  useEffect,
  useRef,
  Suspense,
  lazy,
  Component,
  ReactNode,
} from 'react';
import Image from 'next/image';
import ValuePropCarousel, {
  ValuePropCardProps,
} from '../components/ValuePropCarousel';
import AIExplanationCarousel from '../components/AIExplanationCarousel';
import CTASection from '../components/CTASection';
import {
  trackCTAClick,
  trackSectionView,
  trackUserEngagement,
  trackImageInteraction,
  trackStepInteraction,
  trackReadingBehavior,
  trackDeviceEngagement,
  trackConversionFunnel,
  getDeviceType,
  calculateEngagementScore,
} from '../lib/gtag';

// Lazy load the heavy carousel component
const CarouselComponent = lazy(() => import('../components/CarouselComponent'));

// Error Boundary Class Component
class ErrorBoundary extends Component<
  {
    children: ReactNode;
    fallback: React.ComponentType<{
      error: Error;
      resetErrorBoundary: () => void;
    }>;
  },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: {
    children: ReactNode;
    fallback: React.ComponentType<{
      error: Error;
      resetErrorBoundary: () => void;
    }>;
  }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback;
      return (
        <FallbackComponent
          error={this.state.error}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      );
    }
    return this.props.children;
  }
}

// Error Fallback Component
function CarouselErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div
      className="bg-white p-8 rounded-xl border border-gray-200 text-center"
      role="alert"
    >
      <div className="text-4xl mb-4">🔧</div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        Something went wrong
      </h3>
      <p className="text-gray-600 mb-4">
        We're having trouble loading this section.
      </p>
      <button
        onClick={resetErrorBoundary}
        className="bg-brand-green text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
        aria-label="Try loading the carousel again"
      >
        Try Again
      </button>
    </div>
  );
}

// Loading Skeleton for Carousel
function CarouselSkeleton() {
  return (
    <div className="animate-pulse" role="status" aria-live="polite" aria-busy="true">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-200 h-64 rounded-xl"></div>
        ))}
      </div>
    </div>
  );
}

// Value Props Cards Data
const valuePropsCards: ValuePropCardProps[] = [
  {
    title: "Why You'll Love Daily Tidbit",
    description:
      'Quick. 60-second videos, no fluff. Clear. Easy walkthroughs for real results. Free. No catch, just good vibes.',
    icon: 'Heart',
    accent: 'green',
  },
  {
    title: 'Why People Keep Coming Back',
    description:
      "It's fast. One smart tidbit a day. It's real. Actual tools, real-life tasks. It's fun. Like a mini win, every time.",
    icon: 'Zap',
    accent: 'blue',
  },
  {
    title: "Why You'll Actually Use This",
    description:
      "Short & sweet. Watch it, try it, done. Super useful. Stuff you'll *actually* use. No pressure. Just show up and learn.",
    icon: 'BookOpen',
    accent: 'orange',
  },
  {
    title: 'What Makes Daily Tidbit Kinda Addictive',
    description:
      "Fast AF. Most tips are under a minute. Real-world stuff. No theory dumps here. Free-free. No subscriptions, no strings.",
    icon: 'Clock',
    accent: 'purple',
  },
  {
    title: 'Daily Tidbit = Fast, Useful, Actually Fun',
    description:
      "60-second videos. With walkthroughs if you want 'em. From emails to ideas. Quick wins and big moves. And yeah — it's free.",
    icon: 'Gift',
    accent: 'pink',
  },
];

export default function StartHereClient() {
  const [carouselInView, setCarouselInView] = useState(false);
  const [interactions, setInteractions] = useState(0);

  // Refs for engagement tracking
  const interactionsRef = useRef(0);
  const maxScrollRef = useRef(0);
  const firedThresholdsRef = useRef<Set<number>>(new Set());
  const startTimeRef = useRef(Date.now());

  // Tooltip ref for Next/Image wrapper
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const bumpInteraction = () => {
    interactionsRef.current += 1;
    setInteractions((v) => v + 1);
  };

  useEffect(() => {

    // Intersection Observer for lazy loading carousel
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setCarouselInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const carouselSection = document.getElementById('what-is-ai');
    if (carouselSection) observer.observe(carouselSection);

    // Section view tracking
    const sections = [
      { id: 'what-is-ai', name: 'What AI Can Do' },
      { id: 'how-it-works', name: 'How AI Works' },
      { id: 'how-daily-tidbit-works', name: 'How Daily Tidbit Works' },
    ];

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionName = sections.find((s) => s.id === entry.target.id)
              ?.name;
            if (sectionName) trackSectionView(sectionName);
          }
        });
      },
      { threshold: 0.5 }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) sectionObserver.observe(el);
    });

    return () => {
      observer.disconnect();
      sectionObserver.disconnect();
    };
  }, []);

  // Scroll tracking (throttled via rAF)
  useEffect(() => {
    const handleScroll = () => {
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const scrollPct = Math.round((window.pageYOffset / docHeight) * 100);
      if (scrollPct > maxScrollRef.current) {
        maxScrollRef.current = scrollPct;
      }

      const thresholds = [25, 50, 75, 100];
      for (const threshold of thresholds) {
        if (
          scrollPct >= threshold &&
          !firedThresholdsRef.current.has(threshold)
        ) {
          firedThresholdsRef.current.add(threshold);
          trackUserEngagement('scroll_depth', threshold, { page: 'start-here' });
        }
      }
    };

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Engagement timer
  useEffect(() => {
    const timer = setTimeout(() => {
      const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
      const deviceType = getDeviceType();
      const engagementScore = calculateEngagementScore(
        timeSpent * 1000,
        maxScrollRef.current / 100,
        interactionsRef.current
      );

      if (timeSpent > 60 && maxScrollRef.current > 75) {
        trackReadingBehavior('reader', timeSpent, maxScrollRef.current);
      } else if (timeSpent < 30 && maxScrollRef.current > 80) {
        trackReadingBehavior('skimmer', timeSpent, maxScrollRef.current);
      } else if (timeSpent > 30 && maxScrollRef.current < 50) {
        trackReadingBehavior('scanner', timeSpent, maxScrollRef.current);
      }

      trackDeviceEngagement(deviceType, engagementScore, {
        time_spent: timeSpent,
        scroll_depth: maxScrollRef.current,
        interactions: interactionsRef.current,
      });

      if (engagementScore > 70) {
        trackConversionFunnel('interested', engagementScore, {
          high_engagement: true,
          device_type: deviceType,
        });
      } else if (engagementScore > 40) {
        trackConversionFunnel('engaged', engagementScore, {
          medium_engagement: true,
          device_type: deviceType,
        });
      }

      trackUserEngagement('time_on_page', timeSpent, {
        page: 'start-here',
        engaged_time: timeSpent,
        engagement_score: engagementScore,
        device_type: deviceType,
      });
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    element.scrollIntoView({ behavior: 'smooth' });

    const sectionNames: Record<string, string> = {
      'how-daily-tidbit-works': 'Daily Tidbit Process',
      'how-it-works': 'AI Explanation',
    };

    const buttonText =
      id === 'how-daily-tidbit-works' ? 'Daily Tidbit?!' : "What's AI?";

    trackCTAClick(buttonText, 'Hero Section', sectionNames[id] || id);

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Navigated to ${
      element.querySelector('h2, h3')?.textContent || 'section'
    }`;
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  };

  return (
    <>
      {/* Hero Section */}
      <section
        className="bg-gradient-to-br from-green-50 to-green-100 px-6 md:px-12 py-20 relative overflow-hidden"
        aria-labelledby="hero-heading"
      >
        {/* Decorative background elements */}
        <div
          className="absolute top-20 right-10 w-32 h-32 bg-green-200/20 rounded-full blur-xl animate-pulse"
          aria-hidden="true"
        ></div>
        <div
          className="absolute bottom-20 left-10 w-24 h-24 bg-orange-200/20 rounded-full blur-xl animate-pulse delay-1000"
          aria-hidden="true"
        ></div>

        <div className="max-w-7xl mx-auto motion-safe:animate-fade-in-up">
          <div className="relative flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            {/* Left: Hero graphic + tooltip */}
            <div className="lg:w-1/2 flex justify-center lg:justify-start animate-fade-in-up delay-300">
              <div className="relative group">
                <div
                  className="absolute -inset-8 bg-gradient-to-br from-orange-200/40 to-green-200/40 rounded-[3rem] blur-2xl -z-10 group-hover:from-orange-200/60 group-hover:to-green-200/60 transition-all duration-500"
                  aria-hidden="true"
                ></div>
                <div className="relative max-w-lg w-full lg:w-[500px]">
                  <Image
                    src="https://cdn.dailytidbit.org/Hands-Uppp.png"
                    alt="Person celebrating AI success with arms wide open, representing the joy of learning AI"
                    width={500}
                    height={500}
                    priority
                    sizes="(min-width: 1024px) 500px, 100vw"
                    className="w-full h-auto object-contain hover:scale-105 transform transition-all duration-500 relative z-10 cursor-pointer"
                    onMouseMove={(e) => {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      const tooltip = tooltipRef.current;
                      if (tooltip) {
                        tooltip.style.left = `${x}px`;
                        tooltip.style.top = `${y - 20}px`;
                      }
                    }}
                    onClick={() => {
                      bumpInteraction();
                      trackImageInteraction('hero-celebration', 'click', {
                        location: 'hero_section',
                      });
                    }}
                  />

                  {/* Accessible tooltip */}
                  <div
                    ref={tooltipRef}
                    className="absolute opacity-0 group-hover:opacity-100 
                                    scale-95 group-hover:scale-100
                                    transition-all duration-300 ease-out
                                    bg-white/95 backdrop-blur-sm p-4 rounded-xl border-2 border-green-200/80 shadow-xl
                                    max-w-xs z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full"
                    role="tooltip"
                    aria-label="Welcome message for new users"
                  >
                    <div className="text-center">
                      <h4
                        className="text-sm font-bold text-[#60A875] mb-2 flex items-center justify-center gap-1"
                        style={{
                          fontFamily:
                            "var(--font-playfair, 'Playfair Display'), serif",
                        }}
                      >
                        <span aria-hidden="true">✨</span> You Belong Here
                      </h4>
                      <p
                        className="text-xs text-gray-700 leading-relaxed"
                        style={{
                          fontFamily:
                            "var(--font-space-grotesk, 'Space Grotesk'), sans-serif",
                        }}
                      >
                        Whether you're writing, dreaming, planning — or just
                        curious — you're in the right place to learn AI that
                        helps.
                      </p>
                    </div>

                    {/* Tooltip arrow */}
                    <div
                      className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white/95 border-r-2 border-b-2 border-green-200/80 rotate-45"
                      aria-hidden="true"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Text + carousel + buttons */}
            <div className="lg:w-1/2 space-y-8 text-center lg:text-left">
              <h1
                id="hero-heading"
                className="heading-hero text-5xl md:text-6xl lg:text-7xl leading-tight animate-fade-in-up"
                style={{
                  fontFamily:
                    "var(--font-playfair, 'Playfair Display'), serif",
                  fontWeight: 700,
                }}
              >
                <span className="text-[#59B1E3]" aria-label="AI with sparkle emoji">
                  ✨ AI
                </span>{' '}
                <span className="text-[#60A875]">for Real People</span>
              </h1>

              <div
                className="space-y-6 body-large text-xl md:text-2xl text-gray-800 leading-relaxed animate-fade-in-up delay-300"
                style={{
                  fontFamily:
                    "var(--font-space-grotesk, 'Space Grotesk'), sans-serif",
                }}
              >
                <p>
                  <strong>
                    Kick off your shoes, put your feet up — you're in the right
                    place.
                  </strong>
                </p>
                <p>
                  Daily Tidbit is where real people learn how to use artificial
                  intelligence to make life easier, more creative, and honestly?
                  A lot more fun.
                </p>
                <p>
                  From writing better emails to making music, planning dinner to
                  chasing big ideas — it's all easier than you think.
                </p>
                <p>We'll show you how, one smart tip a day. Simple. Fast. Useful.</p>
              </div>

              {/* Value Props Carousel */}
              <div className="animate-fade-in-up delay-500">
                <ErrorBoundary fallback={CarouselErrorFallback}>
                  <ValuePropCarousel
                    cards={valuePropsCards}
                    autoPlay={true}
                    autoPlayDelay={4000}
                  />
                </ErrorBoundary>
              </div>

              {/* CTA buttons */}
              <div className="space-y-6 animate-fade-in-up delay-1000">
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <button
                    onClick={() => scrollToSection('how-daily-tidbit-works')}
                    className="bg-[#60A875] text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-2xl hover:bg-green-600 hover:scale-105 transition-all duration-300 flex items-center gap-3 group relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                    aria-label="Learn about Daily Tidbit - scroll to how it works section"
                    onMouseEnter={() => bumpInteraction()}
                  >
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                      aria-hidden="true"
                    ></div>
                    <span className="body-bold text-lg relative z-10">
                      Daily Tidbit?!
                    </span>
                    <span
                      className="group-hover:translate-x-1 transition-transform duration-200 relative z-10"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </button>

                  <button
                    onClick={() => scrollToSection('how-it-works')}
                    className="bg-[#59B1E3] text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-2xl hover:bg-blue-600 hover:scale-105 transition-all duration-300 flex items-center gap-3 group relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    aria-label="Learn about AI basics - scroll to explanation section"
                    onMouseEnter={() => bumpInteraction()}
                  >
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                      aria-hidden="true"
                    ></div>
                    <span className="body-bold text-lg relative z-10">
                      What's AI?
                    </span>
                    <span
                      className="group-hover:translate-x-1 transition-transform duration-200 relative z-10"
                      aria-hidden="true"
                    >
                      ✨
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Can You Do With AI */}
      <section
        id="what-is-ai"
        className="bg-white px-6 md:px-12 py-20"
        aria-labelledby="what-ai-heading"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2
              id="what-ai-heading"
              className="heading-section text-4xl md:text-5xl text-[#60A875] mb-6 leading-tight font-bold drop-shadow-sm"
              style={{ fontFamily: "var(--font-playfair, 'Playfair Display'), serif" }}
            >
              <span aria-hidden="true">💡</span> Real Tools. Real Use Cases.
            </h2>

            <p
              className="text-xl md:text-2xl text-gray-800 max-w-3xl mx-auto leading-relaxed font-medium"
              style={{
                fontFamily:
                  "var(--font-space-grotesk, 'Space Grotesk'), sans-serif",
              }}
            >
              One smart AI idea a day — creative, practical, and actually fun.
            </p>
          </div>

          <div className="px-4 drop-shadow-lg">
            <ErrorBoundary fallback={CarouselErrorFallback}>
              <Suspense fallback={<CarouselSkeleton />}>
                {carouselInView && <CarouselComponent />}
              </Suspense>
            </ErrorBoundary>
          </div>

          <div className="text-center mt-12">
            <p
              className="text-lg text-gray-600 italic"
              style={{
                fontFamily:
                  "var(--font-space-grotesk, 'Space Grotesk'), sans-serif",
              }}
            >
              And don't worry 'bout a thing — every little tip's gonna be
              alright. <span aria-hidden="true">🎶</span>
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="bg-gradient-to-b from-[#F4F5FF] to-[#E6F6F9] px-6 md:px-12 py-20 relative overflow-hidden"
        aria-labelledby="how-ai-works-heading"
      >
        {/* Decorative elements */}
        <div
          className="absolute top-10 left-10 w-20 h-20 bg-blue-200/20 rounded-full blur-xl"
          aria-hidden="true"
        ></div>
        <div
          className="absolute bottom-10 right-10 w-32 h-32 bg-purple-200/20 rounded-full blur-xl"
          aria-hidden="true"
        ></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <h3
            id="how-ai-works-heading"
            className="heading-section text-4xl md:text-5xl text-[#59B1E3] mb-6 text-center"
          >
            <span aria-hidden="true">✨</span> How Does AI Actually Work?
          </h3>

          <p className="body-large text-xl text-gray-800 mb-16 text-center max-w-2xl mx-auto">
            AI has two simple parts working together behind the scenes:
          </p>

          <ErrorBoundary fallback={CarouselErrorFallback}>
            <AIExplanationCarousel />
          </ErrorBoundary>
        </div>
      </section>

      {/* How Daily Tidbit Works */}
      <section
        id="how-daily-tidbit-works"
        className="bg-white px-6 md:px-12 py-20"
        aria-labelledby="daily-tidbit-process-heading"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3
              id="daily-tidbit-process-heading"
              className="heading-section text-4xl md:text-5xl mb-4 text-center"
              style={{ fontFamily: "var(--font-playfair, 'Playfair Display'), serif" }}
            >
              <span aria-hidden="true">🍍</span> The{' '}
              <span style={{ color: '#60A875' }}>D</span>
              <span style={{ color: '#59B1E3' }}>ai</span>
              <span style={{ color: '#60A875' }}>ly Tidbit</span> Formula
            </h3>
            <p
              className="text-xl text-gray-600 font-medium"
              style={{
                fontFamily:
                  "var(--font-space-grotesk, 'Space Grotesk'), sans-serif",
              }}
            >
              Like a cheat code for real life — watch, try, repeat.
            </p>
          </div>

          {/* 3-Step Process */}
          <div
            className="grid md:grid-cols-3 gap-8"
            role="list"
            aria-label="Daily Tidbit learning process"
          >
            {/* Step 1: Watch */}
            <button
              type="button"
              className="group relative z-10 text-left"
              role="listitem"
              onClick={() => {
                bumpInteraction();
                trackStepInteraction('watch', 1, 'click');
              }}
              aria-label="Step 1: Watch - See it in action"
            >
              <div className="bg-white p-8 rounded-3xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border border-[#C7E6F7] relative overflow-hidden cursor-pointer">
                <div
                  className="absolute top-0 left-0 w-full h-2 bg-[#C7E6F7]"
                  aria-hidden="true"
                ></div>

                <div
                  className="w-12 h-12 bg-[#C7E6F7] text-[#59B1E3] rounded-full flex items-center justify-center font-bold text-lg mb-6 group-hover:scale-105 transition-transform duration-300"
                  aria-label="Step 1"
                >
                  1
                </div>

                <div className="mb-6">
                  <div className="text-4xl mb-4" aria-hidden="true">
                    🎬
                  </div>
                  <h4
                    className="text-2xl font-bold text-[#59B1E3] mb-2"
                    style={{
                      fontFamily:
                        "var(--font-playfair, 'Playfair Display'), serif",
                    }}
                  >
                    Watch
                  </h4>
                  <p
                    className="text-lg font-semibold text-gray-700 mb-4"
                    style={{
                      fontFamily:
                        "var(--font-space-grotesk, 'Space Grotesk'), sans-serif",
                    }}
                  >
                    See It in Action
                  </p>
                </div>

                <p
                  className="text-gray-700 leading-relaxed"
                  style={{
                    fontFamily:
                      "var(--font-space-grotesk, 'Space Grotesk'), sans-serif",
                  }}
                >
                  Start with a quick 60-second video that shows the AI tip in
                  the real world — no jargon, just results.
                </p>
              </div>
            </button>

            {/* Step 2: Try */}
            <button
              type="button"
              className="group relative z-10 text-left"
              role="listitem"
              onClick={() => {
                bumpInteraction();
                trackStepInteraction('try', 2, 'click');
              }}
              aria-label="Step 2: Try - Use it yourself"
            >
              <div className="bg-white p-8 rounded-3xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border border-[#C6E8D3] relative overflow-hidden cursor-pointer">
                <div
                  className="absolute top-0 left-0 w-full h-2 bg-[#C6E8D3]"
                  aria-hidden="true"
                ></div>

                <div
                  className="w-12 h-12 bg-[#C6E8D3] text-[#60A875] rounded-full flex items-center justify-center font-bold text-lg mb-6 group-hover:scale-105 transition-transform duration-300"
                  aria-label="Step 2"
                >
                  2
                </div>

                <div className="mb-6">
                  <div className="text-4xl mb-4" aria-hidden="true">
                    💡
                  </div>
                  <h4
                    className="text-2xl font-bold text-[#60A875] mb-2"
                    style={{
                      fontFamily:
                        "var(--font-playfair, 'Playfair Display'), serif",
                    }}
                  >
                    Try
                  </h4>
                  <p
                    className="text-lg font-semibold text-gray-700 mb-4"
                    style={{
                      fontFamily:
                        "var(--font-space-grotesk, 'Space Grotesk'), sans-serif",
                    }}
                  >
                    Use It Yourself
                  </p>
                </div>

                <p
                  className="text-gray-700 leading-relaxed"
                  style={{
                    fontFamily:
                      "var(--font-space-grotesk, 'Space Grotesk'), sans-serif",
                  }}
                >
                  Watch the walkthrough, then test the idea instantly using a
                  real AI tool — right in your browser.
                </p>
              </div>
            </button>

            {/* Step 3: Share */}
            <button
              type="button"
              className="group relative z-10 text-left"
              role="listitem"
              onClick={() => {
                bumpInteraction();
                trackStepInteraction('share', 3, 'click');
              }}
              aria-label="Step 3: Share - Post what you made"
            >
              <div className="bg-white p-8 rounded-3xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border border-[#FDE5B6] relative overflow-hidden cursor-pointer">
                <div
                  className="absolute top-0 left-0 w-full h-2 bg-[#FDE5B6]"
                  aria-hidden="true"
                ></div>

                <div
                  className="w-12 h-12 bg-[#FDE5B6] text-[#D97706] rounded-full flex items-center justify-center font-bold text-lg mb-6 group-hover:scale-105 transition-transform duration-300"
                  aria-label="Step 3"
                >
                  3
                </div>

                <div className="mb-6">
                  <div className="text-4xl mb-4" aria-hidden="true">
                    📢
                  </div>
                  <h4
                    className="text-2xl font-bold text-[#D97706] mb-2"
                    style={{
                      fontFamily:
                        "var(--font-playfair, 'Playfair Display'), serif",
                    }}
                  >
                    Share
                  </h4>
                  <p
                    className="text-lg font-semibold text-gray-700 mb-4"
                    style={{
                      fontFamily:
                        "var(--font-space-grotesk, 'Space Grotesk'), sans-serif",
                    }}
                  >
                    Post What You Made
                  </p>
                </div>

                <p
                  className="text-gray-700 leading-relaxed"
                  style={{
                    fontFamily:
                      "var(--font-space-grotesk, 'Space Grotesk'), sans-serif",
                  }}
                >
                  Join the community on BitBoard. Show off your creation, get
                  inspired, and see what others are doing too.
                </p>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection />
    </>
  );
}
