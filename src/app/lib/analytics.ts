// app/lib/analytics.ts - HYDRATION SAFE VERSION with improved initialization
let cached: any = null
let isReady = false
let isInitializing = false

// ✅ Initialize only in browser after hydration with proper timing
const initializeAnalytics = async () => {
  if (typeof window === 'undefined' || isReady || isInitializing) return
  
  isInitializing = true
  
  try {
    // Wait for DOM to be fully ready
    if (document.readyState !== 'complete') {
      await new Promise(resolve => {
        if (document.readyState === 'complete') {
          resolve(void 0)
        } else {
          const handleLoad = () => {
            window.removeEventListener('load', handleLoad)
            resolve(void 0)
          }
          window.addEventListener('load', handleLoad)
        }
      })
    }

    // ✅ Cache the import to avoid re-importing on every event
    if (!cached) {
      cached = await import('./gtag')
    }
    
    // Small delay to ensure gtag is fully loaded
    await new Promise(resolve => setTimeout(resolve, 100))
    
    isReady = true
  } catch (error) {
    console.warn('Analytics initialization error:', error)
  } finally {
    isInitializing = false
  }
}

// ✅ Improved initialization strategy
if (typeof window !== 'undefined') {
  // Use requestIdleCallback if available, otherwise setTimeout
  const scheduleInit = (callback: () => void) => {
    if ('requestIdleCallback' in window) {
      ;(window as any).requestIdleCallback(callback, { timeout: 1000 })
    } else {
      setTimeout(callback, 100)
    }
  }

  // Schedule initialization after current execution stack
  scheduleInit(() => {
    initializeAnalytics()
  })

  // Also ensure initialization on window load as fallback
  window.addEventListener('load', () => {
    scheduleInit(() => {
      if (!isReady && !isInitializing) {
        initializeAnalytics()
      }
    })
  })
}

export async function logEvent(eventName: string, params: Record<string, any> = {}) {
  // ✅ Guard against server-side execution and uninitialized state
  if (typeof window === 'undefined') {
    return
  }

  try {
    // Ensure analytics is initialized
    if (!isReady && !isInitializing) {
      await initializeAnalytics()
    }
    
    // Wait for initialization to complete if currently initializing
    if (isInitializing) {
      let attempts = 0
      while (isInitializing && attempts < 50) { // Max 5 seconds
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }
    }
    
    // Call the cached logEvent function if available
    if (isReady && cached?.logEvent) {
      cached.logEvent(eventName, params)
    }
  } catch (error) {
    // Analytics not critical - fail silently
    console.warn('Analytics error:', error)
  }
}

// All specialized tracking functions now have improved hydration safety
export async function trackSectionView(sectionName: string, slug: string, toolsCount: number) {
  if (typeof window === 'undefined') return
  
  return logEvent('field_guide_section_view', {
    section_name: sectionName,
    section_slug: slug,
    tools_count: toolsCount
  })
}

export async function trackSectionClick(sectionName: string, slug: string, toolCount: number) {
  if (typeof window === 'undefined') return
  
  return logEvent('field_guide_section_click', {
    section_name: sectionName,
    section_slug: slug,
    tool_count: toolCount
  })
}

export async function trackToolInteraction(
  tool: { id: string; name: string; free_tier: boolean; login_required: boolean },
  action: 'modal' | 'website',
  sectionName: string
) {
  if (typeof window === 'undefined') return
  
  return logEvent('tool_interaction', {
    tool_name: tool.name,
    tool_id: tool.id,
    action,
    section_name: sectionName,
    has_free_tier: tool.free_tier,
    requires_login: tool.login_required
  })
}

export async function trackSearch(searchTerm: string, resultsCount: number, context: 'sections' | 'tools') {
  if (typeof window === 'undefined') return
  
  return logEvent('field_guide_search', {
    search_term: searchTerm,
    results_count: resultsCount,
    search_context: context
  })
}

export async function trackPageView(pageTitle: string, pageLocation: string, additionalData?: Record<string, any>) {
  if (typeof window === 'undefined') return
  
  return logEvent('page_view', {
    page_title: pageTitle,
    page_location: pageLocation,
    ...additionalData
  })
}

export async function trackCTAClick(ctaType: string, location: string, additionalData?: Record<string, any>) {
  if (typeof window === 'undefined') return
  
  return logEvent('cta_click', {
    cta_type: ctaType,
    location,
    ...additionalData
  })
}

export async function trackNavigation(from: string, to: string, context?: string) {
  if (typeof window === 'undefined') return
  
  return logEvent('navigation', {
    from_section: from,
    to_section: to,
    context
  })
}

// ✅ Enhanced utility functions
export function isAnalyticsReady(): boolean {
  return typeof window !== 'undefined' && isReady && !isInitializing
}

export function isAnalyticsInitializing(): boolean {
  return typeof window !== 'undefined' && isInitializing
}

// ✅ Force initialization function for critical events
export async function ensureAnalyticsReady(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  
  if (!isReady && !isInitializing) {
    await initializeAnalytics()
  }
  
  return isReady
}

// ✅ Cleanup function for page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    // Give any pending events a chance to send
    if (isReady && cached?.cleanup && typeof cached.cleanup === 'function') {
      cached.cleanup()
    }
  })
}