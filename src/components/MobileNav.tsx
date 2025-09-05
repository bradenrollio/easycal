/**
 * @fileoverview Mobile navigation component
 * @description Bottom navigation bar for mobile devices
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Calendar, 
  Upload, 
  Settings
} from 'lucide-react';

const mobileNavItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
  },
  {
    name: 'Import',
    href: '/import',
    icon: Upload,
  },
  {
    name: 'Calendars',
    href: '/calendars',
    icon: Calendar,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

/**
 * Mobile navigation component
 * @returns JSX element for mobile navigation
 */
export function MobileNav(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <nav className="flex justify-around py-2">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-300 ${
                isActive
                  ? 'text-brand-yellow'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${
                isActive ? 'text-brand-yellow' : 'text-gray-500'
              }`} />
              <span className={`text-xs font-medium ${
                isActive ? 'text-brand-yellow' : 'text-gray-500'
              }`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
