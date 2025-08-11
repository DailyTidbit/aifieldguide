// app/lib/analytics.ts - OPTIMIZED ANALYTICS HELPER
let cached: any = null

export async function logEvent(eventName: string, params: Record<string, any> = {}) {
  try {
    // ✅ Cache the import to avoid re-importing on every event
    if (!cached) {
      cached = await import('./gtag')
    }
    
    // Call the cached logEvent function
    cached.logEvent?.(eventName, params)
  } catch (error) {
    // Analytics not critical - fail silently
    console.warn('Analytics error:', error)
  }
}

// Specialized tracking functions for field guide
export async function trackSectionView(sectionName: string, slug: string, toolsCount: number) {
  return logEvent('field_guide_section_view', {
    section_name: sectionName,
    section_slug: slug,
    tools_count: toolsCount
  })
}

export async function trackSectionClick(sectionName: string, slug: string, toolCount: number) {
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
  return logEvent('field_guide_search', {
    search_term: searchTerm,
    results_count: resultsCount,
    search_context: context
  })
}

export async function trackPageView(pageTitle: string, pageLocation: string, additionalData?: Record<string, any>) {
  return logEvent('page_view', {
    page_title: pageTitle,
    page_location: pageLocation,
    ...additionalData
  })
}

export async function trackCTAClick(ctaType: string, location: string, additionalData?: Record<string, any>) {
  return logEvent('cta_click', {
    cta_type: ctaType,
    location,
    ...additionalData
  })
}

export async function trackNavigation(from: string, to: string, context?: string) {
  return logEvent('navigation', {
    from_section: from,
    to_section: to,
    context
  })
}