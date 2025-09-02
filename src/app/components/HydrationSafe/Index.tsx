// src/components/HydrationSafe/index.tsx
// Hydration-safe component patterns for Daily Tidbit

import React, { useState, useEffect } from 'react';
import { safeWindow, safeLocalStorage } from '../../lib/clientUtils';

/**
 * Simple client check function (inline to avoid import issues)
 */
const isClient = (): boolean => typeof window !== 'undefined';

/**
 * Simple mounted hook (inline to avoid import issues)  
 */
const useIsMounted = (): boolean => {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  return isMounted;
};

/**
 * Generic client-only wrapper component
 */
interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export const ClientOnly: React.FC<ClientOnlyProps> = ({ 
  children, 
  fallback = null, 
  className = '' 
}) => {
  const isMounted = useIsMounted();
  
  if (!isMounted) {
    return fallback ? <div className={className}>{fallback}</div> : null;
  }
  
  return <div className={className}>{children}</div>;
};

/**
 * Loading skeleton for hydration states
 */
interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width = '100%', 
  height = '1rem',
  rounded = true 
}) => (
  <div
    className={`animate-pulse bg-gray-200 ${rounded ? 'rounded' : ''} ${className}`}
    style={{ 
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height 
    }}
  />
);

/**
 * Hydration-safe counter component
 */
interface SafeCounterProps {
  initialValue: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export const SafeCounter: React.FC<SafeCounterProps> = ({ 
  initialValue, 
  className = '',
  prefix = '',
  suffix = ''
}) => {
  const isMounted = useIsMounted();
  const [count, setCount] = useState(initialValue);
  
  // Only show interactive counter after hydration
  if (!isMounted) {
    return (
      <span className={className}>
        {prefix}{initialValue}{suffix}
      </span>
    );
  }
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button 
        onClick={() => setCount(c => c - 1)}
        className="w-8 h-8 rounded-full bg-brand-green hover:bg-brand-greenDark text-white flex items-center justify-center text-sm font-medium transition-colors"
        aria-label="Decrease"
      >
        −
      </button>
      <span className="min-w-[3ch] text-center font-mono">
        {prefix}{count}{suffix}
      </span>
      <button 
        onClick={() => setCount(c => c + 1)}
        className="w-8 h-8 rounded-full bg-brand-green hover:bg-brand-greenDark text-white flex items-center justify-center text-sm font-medium transition-colors"
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
};

/**
 * Hydration-safe modal component
 */
interface SafeModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export const SafeModal: React.FC<SafeModalProps> = ({ 
  isOpen, 
  onClose, 
  children, 
  title,
  className = ''
}) => {
  const isMounted = useIsMounted();
  
  // Don't render portal until hydrated
  if (!isMounted || !isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal panel */}
        <div className={`relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 ${className}`}>
          {title && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
            </div>
          )}
          
          {children}
          
          <div className="mt-5 sm:mt-6">
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md bg-brand-green px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-greenDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Hydration-safe tooltip component
 */
interface SafeTooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const SafeTooltip: React.FC<SafeTooltipProps> = ({ 
  content, 
  children, 
  position = 'top',
  className = ''
}) => {
  const isMounted = useIsMounted();
  const [isVisible, setIsVisible] = useState(false);
  
  // Fallback to title attribute if not hydrated
  if (!isMounted) {
    return (
      <span title={content} className={className}>
        {children}
      </span>
    );
  }
  
  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };
  
  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && (
        <div className={`absolute z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg whitespace-nowrap ${positionClasses[position]}`}>
          {content}
          {/* Arrow */}
          <div className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
            position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2' :
            position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2' :
            position === 'left' ? 'left-full top-1/2 -translate-x-1/2 -translate-y-1/2' :
            'right-full top-1/2 translate-x-1/2 -translate-y-1/2'
          }`} />
        </div>
      )}
    </div>
  );
};

/**
 * FIXED: Hydration-safe share button using safeWindow
 */
interface SafeShareProps {
  title: string;
  text: string;
  url: string;
  className?: string;
}

export const SafeShare: React.FC<SafeShareProps> = ({ 
  title, 
  text, 
  url, 
  className = '' 
}) => {
  const isMounted = useIsMounted();
  const [canShare, setCanShare] = useState(false);
  
  useEffect(() => {
    if (isMounted && isClient()) {
      // Use safeWindow.navigator to check share capability
      const userAgent = safeWindow.navigator.userAgent();
      setCanShare(userAgent.length > 0 && 'share' in navigator);
    }
  }, [isMounted]);
  
  const handleShare = async () => {
    if (canShare && isClient()) {
      try {
        // Use safeWindow.navigator.share instead of direct navigator access
        await safeWindow.navigator.share({ title, text, url });
      } catch (err) {
        // Share was cancelled or failed - fallback to clipboard
        if (window.navigator?.clipboard) {
          try {
            await window.navigator.clipboard.writeText(url);
          } catch (clipErr) {
            console.log('Clipboard access failed');
          }
        }
      }
    } else if (isClient() && window.navigator?.clipboard) {
      // Fallback to copying URL
      try {
        await window.navigator.clipboard.writeText(url);
      } catch (err) {
        console.log('Clipboard access failed');
      }
    }
  };
  
  if (!isMounted) {
    // Server fallback - just show a link
    return (
      <a 
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 text-brand-blue hover:text-brand-blueDark ${className}`}
      >
        Share
      </a>
    );
  }
  
  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-2 bg-brand-blue hover:bg-brand-blueDark text-white px-4 py-2 rounded-lg transition-colors ${className}`}
    >
      {canShare ? 'Share' : 'Copy Link'}
    </button>
  );
};

/**
 * FIXED: Hydration-safe theme toggle using safeLocalStorage
 */
interface SafeThemeToggleProps {
  className?: string;
}

export const SafeThemeToggle: React.FC<SafeThemeToggleProps> = ({ 
  className = '' 
}) => {
  const isMounted = useIsMounted();
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    if (isMounted && isClient()) {
      // Use safeLocalStorage instead of direct localStorage access
      const saved = safeLocalStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(saved === 'dark' || (!saved && prefersDark));
    }
  }, [isMounted]);
  
  const toggleTheme = () => {
    if (!isMounted || !isClient()) return;
    
    const newTheme = !isDark;
    setIsDark(newTheme);
    // Use safeLocalStorage instead of direct localStorage access
    safeLocalStorage.setItem('theme', newTheme ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newTheme);
  };
  
  if (!isMounted) {
    // Show placeholder button
    return (
      <div className={`w-10 h-6 bg-gray-300 rounded-full ${className}`} />
    );
  }
  
  return (
    <button
      onClick={toggleTheme}
      className={`relative w-10 h-6 bg-gray-300 rounded-full transition-colors ${isDark ? 'bg-brand-green' : ''} ${className}`}
      aria-label="Toggle theme"
    >
      <div className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${isDark ? 'translate-x-5' : 'translate-x-1'}`} />
    </button>
  );
};