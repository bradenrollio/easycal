/**
 * @fileoverview TopBar component for application header
 * @description Provides consistent header with logo, navigation, and iframe height management.
 * Automatically adjusts iframe height for embedded usage.
 * @author AI Assistant
 */

'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';

/**
 * Props for TopBar component
 */
interface TopBarProps {
  /** Whether to show back navigation button */
  showBackButton?: boolean;
  /** Callback function when back button is clicked */
  onBack?: () => void;
  /** Additional content to render in the header (e.g., user menu, actions) */
  children?: React.ReactNode;
}

/**
 * Application header component with iframe support
 * @description Renders a sticky header with logo, optional back button, and children.
 * Automatically manages iframe height adjustments for embedded usage.
 * 
 * Features:
 * - Responsive design with consistent branding
 * - Automatic iframe height adjustment via postMessage
 * - ResizeObserver for dynamic content changes
 * - Accessible navigation controls
 * 
 * @param props - TopBar component props
 * @returns JSX element representing the application header
 * 
 * @example
 * ```tsx
 * <TopBar showBackButton onBack={() => router.back()}>
 *   <UserMenu />
 * </TopBar>
 * ```
 * 
 * AI-OPTIMIZE: Consider memoizing this component if parent re-renders frequently
 */
export function TopBar({ showBackButton = false, onBack, children }: TopBarProps): React.JSX.Element {
  /**
   * Handle iframe height adjustments for embedded usage
   * @description Sets up automatic height adjustment when component is rendered in iframe.
   * Uses ResizeObserver to detect content changes and postMessage to communicate with parent.
   * 
   * AI-OPTIMIZE: Consider throttling resize events for better performance
   */
  useEffect(() => {
    /**
     * Adjusts iframe height by posting message to parent window
     */
    const adjustHeight = (): void => {
      if (window.parent !== window) {
        // We're in an iframe - calculate and send height to parent
        const height = Math.max(
          document.body.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.clientHeight,
          document.documentElement.scrollHeight,
          document.documentElement.offsetHeight
        );
        
        // Send multiple message formats for better compatibility
        window.parent.postMessage(
          {
            type: 'resize',
            height: height,
            source: 'easycal-app'
          },
          '*' // AI-NOTE: In production, specify exact parent origin for security
        );
        
        // Alternative format for GHL
        window.parent.postMessage(
          {
            action: 'setHeight',
            height: height,
            app: 'easycal'
          },
          '*'
        );
      }
    };

    // Initial height adjustment on component mount
    adjustHeight();

    // Set up ResizeObserver for dynamic content changes
    const resizeObserver = new ResizeObserver(() => {
      // Debounce the height adjustment to prevent excessive calls
      setTimeout(adjustHeight, 100);
    });

    // Observe document body for size changes
    resizeObserver.observe(document.body);

    // Cleanup observer on component unmount
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-lg">
      <div className="flex h-20 items-center justify-between px-6">
        <div className="flex items-center space-x-6">
          {showBackButton && (
            <button
              onClick={onBack}
              className="flex items-center space-x-3 text-black hover:text-brand-yellow transition-all duration-300 bg-gray-50 hover:bg-brand-yellow/10 px-4 py-2 rounded-xl font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
          )}
          <div className="flex items-center space-x-3">
            <Image
              src="/app-logo-wide.png"
              alt="EasyCal"
              width={140}
              height={36}
              className="h-9 w-auto"
            />
            <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
            <span className="text-sm text-gray-500 font-medium hidden sm:inline">
              Bulk Calendar Management
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {children}
        </div>
      </div>
    </header>
  );
}
