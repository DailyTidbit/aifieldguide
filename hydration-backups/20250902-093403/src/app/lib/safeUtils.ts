import { useState, useEffect } from 'react';

export const isBrowser = typeof window !== 'undefined';

// Hydration-safe date formatting with consistent timezone
export const formatDateSafe = (dateInput: string | Date, fallback: string = 'Invalid date'): string => {
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return fallback;
    
    // Use UTC to prevent hydration mismatches between server/client timezones
    return date.toLocaleDateString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return fallback;
  }
};

// Safe localStorage wrapper - FIXED to use its own methods consistently
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

// Core mounted hook for hydration safety
export const useMounted = () => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  return mounted;
};