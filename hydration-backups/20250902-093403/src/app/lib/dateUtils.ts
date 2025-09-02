// src/lib/dateUtils.ts
// Hydration-safe date formatting for Daily Tidbit

import React, { useState, useEffect } from 'react';

/**
 * Simple client check function (inline to avoid circular imports)
 */
const isClient = (): boolean => typeof window !== 'undefined';

/**
 * Simple mounted hook (inline to avoid circular imports)  
 */
const useIsMounted = (): boolean => {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  return isMounted;
};

/**
 * Fixed timezone and locale to prevent hydration mismatches
 */
export const SAFE_LOCALE = 'en-US';
export const SAFE_TIMEZONE = 'UTC';

/**
 * Server-safe date formatting that prevents hydration mismatches
 */
export const formatDate = {
  /**
   * Safe relative time formatting
   */
  relative: (date: Date | string): string => {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    // Fall back to absolute date for older content
    return targetDate.toLocaleDateString(SAFE_LOCALE, {
      timeZone: SAFE_TIMEZONE,
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },
  
  /**
   * Safe absolute date formatting
   */
  absolute: (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      timeZone: SAFE_TIMEZONE,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    };
    
    return targetDate.toLocaleDateString(SAFE_LOCALE, defaultOptions);
  },
  
  /**
   * Safe short date formatting
   */
  short: (date: Date | string): string => {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    
    return targetDate.toLocaleDateString(SAFE_LOCALE, {
      timeZone: SAFE_TIMEZONE,
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  },
  
  /**
   * Safe time formatting
   */
  time: (date: Date | string): string => {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    
    return targetDate.toLocaleTimeString(SAFE_LOCALE, {
      timeZone: SAFE_TIMEZONE,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  },
  
  /**
   * Safe ISO string formatting
   */
  iso: (date: Date | string): string => {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    return targetDate.toISOString();
  }
};

/**
 * Safe current year for copyright notices
 */
export const getCurrentYear = (): number => {
  // Always use UTC to prevent hydration mismatches
  return new Date().getUTCFullYear();
};

/**
 * Hook for client-side date display with fallback
 */
export const useClientDate = (
  date: Date | string,
  formatter: (date: Date) => string,
  fallback: string
): string => {
  const isMounted = useIsMounted();
  const [formattedDate, setFormattedDate] = useState(fallback);
  
  useEffect(() => {
    if (isMounted) {
      const targetDate = typeof date === 'string' ? new Date(date) : date;
      setFormattedDate(formatter(targetDate));
    }
  }, [date, formatter, isMounted]);
  
  return formattedDate;
};

/**
 * Hook for safe relative time that updates
 */
export const useRelativeTime = (date: Date | string): string => {
  const isMounted = useIsMounted();
  const [relativeTime, setRelativeTime] = useState('');
  
  useEffect(() => {
    if (!isMounted) return;
    
    const updateTime = () => {
      setRelativeTime(formatDate.relative(date));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [date, isMounted]);
  
  if (!isMounted) {
    // Return server-safe fallback
    return formatDate.short(date);
  }
  
  return relativeTime;
};

/**
 * Component for hydration-safe date display
 */
interface SafeDateProps {
  date: Date | string;
  format?: 'relative' | 'absolute' | 'short' | 'time';
  className?: string;
  updateInterval?: number; // For relative dates
}

export const SafeDate: React.FC<SafeDateProps> = ({ 
  date, 
  format = 'relative', 
  className = '',
  updateInterval = 60000
}) => {
  const isMounted = useIsMounted();
  const [displayDate, setDisplayDate] = useState<string>(() => {
    // Server-safe initial value
    switch (format) {
      case 'relative':
        return formatDate.short(date); // Fallback for SSR
      case 'absolute':
        return formatDate.absolute(date);
      case 'short':
        return formatDate.short(date);
      case 'time':
        return formatDate.time(date);
      default:
        return formatDate.short(date);
    }
  });
  
  useEffect(() => {
    if (!isMounted) return;
    
    const updateDate = () => {
      switch (format) {
        case 'relative':
          setDisplayDate(formatDate.relative(date));
          break;
        case 'absolute':
          setDisplayDate(formatDate.absolute(date));
          break;
        case 'short':
          setDisplayDate(formatDate.short(date));
          break;
        case 'time':
          setDisplayDate(formatDate.time(date));
          break;
      }
    };
    
    updateDate();
    
    // Only set up interval for relative dates
    if (format === 'relative' && updateInterval > 0) {
      const interval = setInterval(updateDate, updateInterval);
      return () => {
        clearInterval(interval);
      };
    }
  }, [date, format, isMounted, updateInterval]);
  
  return React.createElement('time', {
    dateTime: formatDate.iso(date),
    className: className
  }, displayDate);
};