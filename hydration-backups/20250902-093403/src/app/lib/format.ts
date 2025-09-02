/**
 * Hydration-safe date formatters for Daily Tidbit
 * These use fixed locale and timezone to prevent SSR/CSR mismatches
 */

// Fixed timezone - choose one for consistency across your app
const FIXED_TIMEZONE = 'America/New_York'; // Eastern Time for Daily Tidbit
// Alternative: 'UTC' if you prefer UTC everywhere

/**
 * Format date consistently for SSR/CSR compatibility
 * @param d - Date string, number, or Date object
 * @returns Formatted date string (e.g., "Dec 25, 2024")
 */
export const formatDate = (d: string | number | Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: FIXED_TIMEZONE,
    year: 'numeric',
    month: 'short', 
    day: 'numeric',
  }).format(new Date(d));
};

/**
 * Format date with full month name
 * @param d - Date string, number, or Date object  
 * @returns Formatted date string (e.g., "December 25, 2024")
 */
export const formatDateLong = (d: string | number | Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: FIXED_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(d));
};

/**
 * Format time consistently for SSR/CSR compatibility
 * @param d - Date string, number, or Date object
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export const formatTime = (d: string | number | Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: FIXED_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(d));
};

/**
 * Format datetime consistently 
 * @param d - Date string, number, or Date object
 * @returns Formatted datetime string (e.g., "Dec 25, 2024 at 2:30 PM")
 */
export const formatDateTime = (d: string | number | Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: FIXED_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(d));
};

/**
 * Format relative time safely (e.g., "2 hours ago")
 * @param d - Date string, number, or Date object
 * @returns Relative time string
 */
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
    // Fall back to absolute date for older content
    return formatDate(d);
  }
};

/**
 * HYDRATION SAFE: Get current year for copyright notices
 * Uses the same approach as your existing dateUtils.ts
 */
export const getCurrentYear = (): number => {
  // Always use UTC to prevent hydration mismatches
  return new Date().getUTCFullYear();
};

/**
 * Format date for display with fallback
 * @param d - Date string, number, or Date object
 * @param fallback - Fallback string if date is invalid
 */
export const formatDateSafe = (d: string | number | Date, fallback = 'Invalid date'): string => {
  try {
    return formatDate(d);
  } catch (error) {
    console.warn('Date formatting error:', error);
    return fallback;
  }
};

/**
 * Check if a date string/object is valid
 * @param d - Date to validate
 */
export const isValidDate = (d: string | number | Date): boolean => {
  try {
    const date = new Date(d);
    return date instanceof Date && !isNaN(date.getTime());
  } catch {
    return false;
  }
};