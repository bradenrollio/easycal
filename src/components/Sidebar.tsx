/**
 * @fileoverview Sidebar navigation component
 * @description Dark sidebar with navigation links, logo, and user info
 */

'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Calendar, 
  Upload, 
  Settings, 
  BarChart3,
  User
} from 'lucide-react';

interface SidebarProps {
  /** Whether the sidebar is collapsed */
  isCollapsed?: boolean;
  /** Function to toggle sidebar */
  onToggle?: () => void;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Import Calendars',
    href: '/import',
    icon: Upload,
  },
  {
    name: 'Manage Calendars',
    href: '/calendars',
    icon: Calendar,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

/**
 * Sidebar navigation component with dark theme
 * @param props - Sidebar component props
 * @returns JSX element for the sidebar
 */
export function Sidebar({ isCollapsed = false, onToggle }: SidebarProps): React.JSX.Element {
  const pathname = usePathname();

  return (
    <div className={`bg-sidebar-dark border-r border-gray-800 flex flex-col transition-all duration-300 relative ${
      isCollapsed ? 'w-16' : 'w-64'
    } ${isCollapsed ? 'lg:w-16' : 'lg:w-64'} hidden md:flex`}>
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-brand-yellow rounded-lg flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-black" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-white font-bold text-lg">EasyCal</h1>
              <p className="text-gray-400 text-xs">Bulk Management</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-300 group ${
                    isActive
                      ? 'bg-brand-yellow text-black shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${
                    isActive ? 'text-black' : 'text-brand-yellow'
                  }`} />
                  {!isCollapsed && (
                    <span className={`font-medium ${
                      isActive ? 'text-black' : 'text-gray-300 group-hover:text-white'
                    }`}>
                      {item.name}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-800">
        <div className={`flex items-center space-x-3 px-3 py-3 rounded-xl bg-gray-800 ${
          isCollapsed ? 'justify-center' : ''
        }`}>
          <div className="w-8 h-8 bg-brand-yellow rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-black" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">User Account</p>
              <p className="text-gray-400 text-xs truncate">Connected</p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      {onToggle && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 w-6 h-6 bg-sidebar-dark border border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-300"
        >
          <svg 
            className={`w-3 h-3 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}
