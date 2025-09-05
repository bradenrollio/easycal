/**
 * @fileoverview Mobile header component
 * @description Simple header for mobile screens with logo and title
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { Calendar } from 'lucide-react';

interface MobileHeaderProps {
  /** Page title */
  title?: string;
  /** Additional content */
  children?: React.ReactNode;
}

/**
 * Mobile header component
 * @param props - MobileHeader component props
 * @returns JSX element for mobile header
 */
export function MobileHeader({ title, children }: MobileHeaderProps): React.JSX.Element {
  return (
    <div className="md:hidden bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-brand-yellow rounded-lg flex items-center justify-center">
          <Calendar className="w-5 h-5 text-black" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-black">EasyCal</h1>
          {title && <p className="text-sm text-gray-600">{title}</p>}
        </div>
      </div>
      
      {children && (
        <div className="flex items-center space-x-2">
          {children}
        </div>
      )}
    </div>
  );
}
