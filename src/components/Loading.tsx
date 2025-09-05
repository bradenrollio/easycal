/**
 * @fileoverview Loading component with smooth fade-out animation
 * @description Full-screen loading overlay with yellow spinning dialer and fade-out transition
 */

'use client';

import React, { useEffect, useState } from 'react';

interface LoadingProps {
  /** Whether the loading state is active */
  isLoading: boolean;
  /** Loading message to display */
  message?: string;
  /** Callback when fade-out animation completes */
  onComplete?: () => void;
}

/**
 * Full-screen loading component with smooth animations
 * @param props - Loading component props
 * @returns JSX element for loading overlay
 */
export function Loading({ 
  isLoading, 
  message = "Your account is loading", 
  onComplete 
}: LoadingProps): React.JSX.Element | null {
  const [shouldRender, setShouldRender] = useState(isLoading);
  const [isVisible, setIsVisible] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setShouldRender(true);
      setIsVisible(true);
    } else {
      // Start fade out
      setIsVisible(false);
      // Remove from DOM after animation completes
      const timer = setTimeout(() => {
        setShouldRender(false);
        onComplete?.();
      }, 300); // Match the transition duration

      return () => clearTimeout(timer);
    }
  }, [isLoading, onComplete]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div 
      className={`fixed inset-0 z-50 bg-white flex items-center justify-center transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="text-center">
        {/* Pure CSS Spinning Loader */}
        <div className="relative w-20 h-20 mx-auto mb-8">
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-brand-yellow border-r-brand-yellow rounded-full animate-spin"></div>
        </div>
        
        {/* Loading Message */}
        <p className="text-xl text-black font-semibold">
          {message}
        </p>
      </div>
    </div>
  );
}

/**
 * Hook for managing loading state with automatic timeout
 * @param initialLoading - Initial loading state
 * @param timeout - Auto-hide timeout in milliseconds
 * @returns Loading state and setter function
 */
export function useLoading(initialLoading = false, timeout?: number) {
  const [isLoading, setIsLoading] = useState(initialLoading);

  useEffect(() => {
    if (isLoading && timeout) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, timeout);

      return () => clearTimeout(timer);
    }
  }, [isLoading, timeout]);

  return [isLoading, setIsLoading] as const;
}
