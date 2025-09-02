// src/lib/clientUtils.ts
// Consolidated hydration-safe utilities for consistent SSR/client behavior

import React, { useState, useEffect } from 'react';

// =============================================================================
// Core Environment Detection
// =============================================================================

export const isBrowser = typeof window !== 'undefined';
export const isClient = isBrowser; // Alias for consistency

// =============================================================================
// Core Hydration Safety Hook
// =============================================================================

export const useMounted = () => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  return mounted;
};

// Alias for consistency
export const useIsMounted = useMounted;

// =============================================================================
// Safe Browser APIs
// =============================================================================

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser) return null;
    try {
      return window.localStorage?.getItem(key) || null;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (!isBrowser) return;
    try {
      window.localStorage?.setItem(key, value);
    } catch {
      // Silent fail
    }
  },
  removeItem: (key: string): void => {
    if (!isBrowser) return;
    try {
      window.localStorage?.removeItem(key);
    } catch {
      // Silent fail
    }
  }
};

export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser) return null;
    try {
      return window.sessionStorage?.getItem(key) || null;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (!isBrowser) return;
    try {
      window.sessionStorage?.setItem(key, value);
    } catch {
      // Silent fail
    }
  },
  removeItem: (key: string): void => {
    if (!isBrowser) return;
    try {
      window.sessionStorage?.removeItem(key);
    } catch {
      // Silent fail
    }
  }
};

export const safeWindow = {
  gtag: (...args: any[]) => {
    if (isBrowser && typeof window.gtag === 'function') {
      window.gtag(...args);
    }
  },
  
  localStorage: safeLocalStorage,
  sessionStorage: safeSessionStorage,
  
  navigator: {
    userAgent: (): string => {
      return isBrowser ? (window.navigator?.userAgent || '') : '';
    },
    
    share: async (data: ShareData): Promise<void> => {
      if (isBrowser && window.navigator?.share) {
        try {
          await window.navigator.share(data);
        } catch {
          // Share failed or was cancelled
        }
      }
    }
  }
};

// =============================================================================
// Safe State Management
// =============================================================================

export const useClientState = <T>(initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(initialValue);
  const isMounted = useMounted();
  
  return isMounted ? [value, setValue] : [initialValue, () => {}];
};

// =============================================================================
// Safe Random Generation
// =============================================================================

export const safeRandom = {
  id: (prefix = 'id'): string => {
    if (!isBrowser) {
      return `${prefix}-ssr`;
    }
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },
  
  number: (min = 0, max = 1): number => {
    if (!isBrowser) {
      return min;
    }
    return Math.random() * (max - min) + min;
  }
};

// =============================================================================
// Media Queries
// =============================================================================

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);
  const isMounted = useMounted();
  
  useEffect(() => {
    if (!isBrowser) return;
    
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  
  return isMounted ? matches : false;
};

// =============================================================================
// Media Validation (from validateMedia.ts)
// =============================================================================

export function isValidMediaUrl(url: string): boolean {
  if (!url) return false;

  try {
    const parsedUrl = new URL(url);
    const lowerPath = parsedUrl.pathname.toLowerCase();

    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp4', '.webm', '.mp3'];
    const bannedHosts = ['www.midjourney.com', 'midjourney.com']; // block homepage links

    // Disallow banned hosts
    if (bannedHosts.includes(parsedUrl.hostname)) return false;

    // Only allow valid file extensions
    return validExtensions.some(ext => lowerPath.endsWith(ext));
  } catch (err) {
    return false;
  }
}

// =============================================================================
// Date Utilities (consolidated from format.ts)
// =============================================================================

export const SAFE_LOCALE = 'en-US';
export const SAFE_TIMEZONE = 'America/New_York'; // Using Eastern Time for consistency

// =============================================================================
// Core Date Validation
// =============================================================================

export const isValidDate = (d: string | number | Date): boolean => {
  try {
    const date = new Date(d);
    return date instanceof Date && !isNaN(date.getTime());
  } catch {
    return false;
  }
};

// =============================================================================
// Safe Date Formatters (with fallbacks)
// =============================================================================

export const formatDateSafe = (dateInput: string | number | Date, fallback: string = 'Invalid date'): string => {
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return fallback;
    
    return date.toLocaleDateString(SAFE_LOCALE, {
      timeZone: SAFE_TIMEZONE,
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.warn('Date formatting error:', error);
    return fallback;
  }
};

// =============================================================================
// Individual Date Formatters
// =============================================================================

export const formatDate = (d: string | number | Date): string => {
  return new Intl.DateTimeFormat(SAFE_LOCALE, {
    timeZone: SAFE_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(d));
};

export const formatDateLong = (d: string | number | Date): string => {
  return new Intl.DateTimeFormat(SAFE_LOCALE, {
    timeZone: SAFE_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(d));
};

export const formatTime = (d: string | number | Date): string => {
  return new Intl.DateTimeFormat(SAFE_LOCALE, {
    timeZone: SAFE_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(d));
};

export const formatDateTime = (d: string | number | Date): string => {
  return new Intl.DateTimeFormat(SAFE_LOCALE, {
    timeZone: SAFE_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(d));
};

export const formatRelativeTime = (d: string | number | Date): string => {
  const date = new Date(d);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return formatDate(d);
  }
};

// =============================================================================
// Date Object/Namespace for Backward Compatibility
// =============================================================================

export const formatDateUtils = {
  relative: formatRelativeTime,
  absolute: formatDateLong,
  short: formatDate,
  time: formatTime,
  datetime: formatDateTime,
  iso: (date: Date | string): string => {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    return targetDate.toISOString();
  }
};

export const getCurrentYear = (): number => {
  return new Date().getUTCFullYear();
};

// =============================================================================
// Date Hooks
// =============================================================================

export const useClientDate = (
  date: Date | string,
  formatter: (date: Date) => string,
  fallback: string
): string => {
  const isMounted = useMounted();
  const [formattedDate, setFormattedDate] = useState(fallback);
  
  useEffect(() => {
    if (isMounted) {
      const targetDate = typeof date === 'string' ? new Date(date) : date;
      setFormattedDate(formatter(targetDate));
    }
  }, [date, formatter, isMounted]);
  
  return formattedDate;
};

export const useRelativeTime = (date: Date | string): string => {
  const isMounted = useMounted();
  const [relativeTime, setRelativeTime] = useState('');
  
  useEffect(() => {
    if (!isMounted) return;
    
    const updateTime = () => {
      setRelativeTime(formatRelativeTime(date));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    
    return () => clearInterval(interval);
  }, [date, isMounted]);
  
  if (!isMounted) {
    return formatDate(date);
  }
  
  return relativeTime;
};

// =============================================================================
// Safe Date Component
// =============================================================================

interface SafeDateProps {
  date: Date | string;
  format?: 'relative' | 'absolute' | 'short' | 'time';
  className?: string;
  updateInterval?: number;
}

export const SafeDate: React.FC<SafeDateProps> = ({ 
  date, 
  format = 'relative', 
  className = '',
  updateInterval = 60000
}) => {
  const isMounted = useMounted();
  const [displayDate, setDisplayDate] = useState<string>(() => {
    switch (format) {
      case 'relative':
        return formatDate(date); // Fallback for SSR
      case 'absolute':
        return formatDateLong(date);
      case 'short':
        return formatDate(date);
      case 'time':
        return formatTime(date);
      default:
        return formatDate(date);
    }
  });
  
  useEffect(() => {
    if (!isMounted) return;
    
    const updateDate = () => {
      switch (format) {
        case 'relative':
          setDisplayDate(formatRelativeTime(date));
          break;
        case 'absolute':
          setDisplayDate(formatDateLong(date));
          break;
        case 'short':
          setDisplayDate(formatDate(date));
          break;
        case 'time':
          setDisplayDate(formatTime(date));
          break;
      }
    };
    
    updateDate();
    
    if (format === 'relative' && updateInterval > 0) {
      const interval = setInterval(updateDate, updateInterval);
      return () => clearInterval(interval);
    }
  }, [date, format, isMounted, updateInterval]);
  
  return React.createElement('time', {
    dateTime: new Date(date).toISOString(),
    className: className
  }, displayDate);
};