'use client';

import { useEffect } from 'react';

interface TopBarProps {
  title?: string;
  children?: React.ReactNode;
}

export function TopBar({ title = 'EasyCal', children }: TopBarProps) {
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
          <h1 className="text-xl font-bold text-brand-navy">{title}</h1>
        </div>

        <div className="flex items-center space-x-4">
          {children}
        </div>
      </div>
    </header>
  );
}
