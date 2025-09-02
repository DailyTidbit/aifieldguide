// src/lib/clientUtils.ts
// Hydration-safe client utilities for Daily Tidbit

export const isClient = (): boolean => typeof window !== 'undefined';

/**
 * Safe window utilities that prevent hydration mismatches
 */
export const safeWindow = {
  gtag: (...args: any[]) => {
    if (isClient() && typeof window.gtag === 'function') {
      window.gtag(...args);
    }
  },
  
  localStorage: {
    getItem: (key: string): string | null => {
      if (!isClient()) return null;
      try {
        return window.localStorage?.getItem(key) || null;
      } catch {
        return null;
      }
    },
    
    setItem: (key: string, value: string): void => {
      if (!isClient()) return;
      try {
        window.localStorage?.setItem(key, value);
      } catch {
        // Fail silently
      }
    },
    
    removeItem: (key: string): void => {
      if (!isClient()) return;
      try {
        window.localStorage?.removeItem(key);
      } catch {
        // Fail silently
      }
    }
  },
  
  sessionStorage: {
    getItem: (key: string): string | null => {
      if (!isClient()) return null;
      try {
        return window.sessionStorage?.getItem(key) || null;
      } catch {
        return null;
      }
    },
    
    setItem: (key: string, value: string): void => {
      if (!isClient()) return;
      try {
        window.sessionStorage?.setItem(key, value);
      } catch {
        // Fail silently
      }
    }
  },
  
  navigator: {
    userAgent: (): string => {
      return isClient() ? (window.navigator?.userAgent || '') : '';
    },
    
    share: async (data: ShareData): Promise<void> => {
      if (isClient() && window.navigator?.share) {
        try {
          await window.navigator.share(data);
        } catch {
          // Share failed or was cancelled
        }
      }
    }
  }
};

/**
 * Hook for safe client-side effects
 */
import { useEffect, useState } from 'react';

export const useIsMounted = (): boolean => {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  return isMounted;
};

/**
 * Hook for safe client-side state
 */
export const useClientState = <T>(initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(initialValue);
  const isMounted = useIsMounted();
  
  return isMounted ? [value, setValue] : [initialValue, () => {}];
};

/**
 * Safe random number generation
 */
export const safeRandom = {
  id: (prefix = 'id'): string => {
    if (!isClient()) {
      // Return a predictable ID for SSR
      return `${prefix}-ssr`;
    }
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },
  
  number: (min = 0, max = 1): number => {
    if (!isClient()) {
      // Return predictable value for SSR
      return min;
    }
    return Math.random() * (max - min) + min;
  }
};

/**
 * Safe media query matching
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);
  const isMounted = useIsMounted();
  
  useEffect(() => {
    if (!isClient()) return;
    
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