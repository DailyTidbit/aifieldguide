// src/lib/gtag.ts
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || ''

// Unified consent keys (180-day expiry)
export const CONSENT_KEYS = {
  CONSENT: 'dt_cookie_consent',
  TIMESTAMP: 'dt_cookie_consent_ts',
  EXPIRY_DAYS: 180
}

declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

const gtag = (...args: any[]) => {
  // Don't run if no tracking ID
  if (!GA_TRACKING_ID || typeof window === "undefined") return;
  
  // Initialize dataLayer if it doesn't exist
  if (!window.dataLayer) {
    window.dataLayer = [];
  }
  
  // If gtag function exists, use it. Otherwise push to dataLayer directly
  if (typeof window.gtag === 'function') {
    window.gtag(...args);
  } else {
    window.dataLayer.push(args);
  }
};

// Manual pageview tracking (no auto doubles)
export const pageview = (url: string) => {
  gtag("config", GA_TRACKING_ID, { page_path: url });
};

// Universal event logger
export const logEvent = (name: string, params: Record<string, any> = {}) => {
  gtag("event", name, params);
};

/* ---- Daily Tidbit Event Helpers ---- */
export const trackCTAClick = (label: string, location: string, target: string) =>
  logEvent("cta_click", { label, location, target });

export const trackSectionView = (section_name: string) =>
  logEvent("section_view", { section_name });

export const trackUserEngagement = (metric: "scroll_depth" | "time_on_page", value: number, extra: Record<string, any> = {}) =>
  logEvent(metric, { value, ...extra });

export const trackImageInteraction = (image_id: string, action: "click" | "hover", extra: Record<string, any> = {}) =>
  logEvent("image_interaction", { image_id, action, ...extra });

export const trackStepInteraction = (step: "watch" | "try" | "share", step_number: number, action: "click" | "view") =>
  logEvent("step_interaction", { step, step_number, action });

export const trackReadingBehavior = (type: "reader" | "skimmer" | "scanner", time_spent_s: number, scroll_depth_pct: number) =>
  logEvent("reading_behavior", { type, time_spent_s, scroll_depth_pct });

export const trackDeviceEngagement = (device_type: string, engagement_score: number, extra: Record<string, any> = {}) =>
  logEvent("device_engagement", { device_type, engagement_score, ...extra });

export const trackConversionFunnel = (stage: "interested" | "engaged", score: number, extra: Record<string, any> = {}) =>
  logEvent("funnel_progress", { stage, score, ...extra });

// Value prop and carousel tracking
export const trackValuePropInteraction = (
  cardTitle: string,
  interactionType: 'view' | 'click' | 'auto_advance',
  cardIndex: number
) => {
  logEvent('value_prop_interaction', {
    card_title: cardTitle,
    interaction_type: interactionType,
    card_index: cardIndex,
  })
}

export const trackCarouselInteraction = (
  carouselType: 'value_prop' | 'ai_explanation' | 'use_cases',
  action: 'next' | 'prev' | 'dot_click' | 'auto_advance',
  currentSlide: number
) => {
  logEvent('carousel_interaction', {
    carousel_type: carouselType,
    action,
    slide_index: currentSlide,
  })
}

// Utility functions
export const getDeviceType = () => {
  if (typeof window === "undefined") return "unknown";
  const w = window.innerWidth;
  if (w < 640) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
};

export const calculateEngagementScore = (time_ms: number, scroll_ratio: number, interactions: number) => {
  const t = Math.min(time_ms / 60000, 3); // cap at 3 minutes
  const s = Math.min(scroll_ratio, 1);
  const i = Math.min(interactions, 10) / 10;
  // weighted score 0–100
  return Math.round((t * 0.45 + s * 0.4 + i * 0.15) * 100);
};

// Consent management helpers
export const getStoredConsent = (): { consent: string | null; isExpired: boolean } => {
  if (typeof window === 'undefined') return { consent: null, isExpired: true };
  
  const consent = localStorage.getItem(CONSENT_KEYS.CONSENT);
  const timestamp = localStorage.getItem(CONSENT_KEYS.TIMESTAMP);
  
  if (!consent || !timestamp) {
    return { consent: null, isExpired: true };
  }
  
  const consentAge = Date.now() - parseInt(timestamp);
  const maxAge = CONSENT_KEYS.EXPIRY_DAYS * 24 * 60 * 60 * 1000; // 180 days in ms
  const isExpired = consentAge > maxAge;
  
  return { consent: isExpired ? null : consent, isExpired };
};

export const storeConsent = (accepted: boolean) => {
  if (typeof window === 'undefined') return;
  
  const consentValue = accepted ? 'accepted' : 'declined';
  localStorage.setItem(CONSENT_KEYS.CONSENT, consentValue);
  localStorage.setItem(CONSENT_KEYS.TIMESTAMP, Date.now().toString());
};