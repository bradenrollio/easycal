'use client';

import { useEffect } from 'react';
import Image from 'next/image';

interface TopBarProps {
  showBackButton?: boolean;
  onBack?: () => void;
  children?: React.ReactNode;
}

export function TopBar({ showBackButton = false, onBack, children }: TopBarProps) {
  // Handle iframe height adjustments
  useEffect(() => {
    const adjustHeight = () => {
      if (window.parent !== window) {
        // We're in an iframe
        const height = document.body.scrollHeight;
        window.parent.postMessage(
          {
            type: 'resize',
            height: height,
          },
          '*'
        );
      }
    };

    // Initial adjustment
    adjustHeight();

    // Set up ResizeObserver for dynamic content changes
    const resizeObserver = new ResizeObserver(() => {
      // Debounce the height adjustment
      setTimeout(adjustHeight, 100);
    });

    resizeObserver.observe(document.body);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white card-shadow">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          {showBackButton && (
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-brand-navy hover:text-brand-yellow transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
          )}
          <Image
            src="/app-logo-wide.png"
            alt="EasyCal"
            width={120}
            height={32}
            className="h-8 w-auto"
          />
        </div>

        <div className="flex items-center space-x-4">
          {children}
        </div>
      </div>
    </header>
  );
}
