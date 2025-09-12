'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Upload, Calendar, Settings, TrendingUp, Clock } from 'lucide-react';
import { getLocationId } from '@/lib/api/ghl/context';
import { Loading } from '@/components/Loading';
import { MobileHeader } from '@/components/MobileHeader';
import { InstallationRequired } from '@/components/InstallationRequired';

function DashboardContent() {
  const [metrics, setMetrics] = useState({
    activeCalendars: 0,
    createdToday: 0,
    importsInProgress: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [locationDetected, setLocationDetected] = useState(false);
  // Track authentication status - start as false until proven authenticated
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authCheckComplete, setAuthCheckComplete] = useState<boolean>(false);

  // Load metrics on mount
  useEffect(() => {
    // Force cache refresh for iframe
    console.log('EasyCal UI v2.0 - Modern Design Loaded');
    
    // Initialize iframe-specific styling
    if (window.parent !== window) {
      document.documentElement.setAttribute('data-iframe', 'true');
      document.body.setAttribute('data-iframe', 'true');
      console.log('Iframe mode detected - applying iframe-specific styles');
    }
    
    // Start by checking authentication immediately
    detectLocationId();
    
    // Fallback: if location detection takes too long, mark as detected
    const fallbackTimer = setTimeout(() => {
      if (!locationDetected) {
        console.warn('Location detection timeout');
        setLocationDetected(true);
        // Don't need to set authenticated false - already starts as false
      }
    }, 2000); // Reduced to 2 seconds

    return () => clearTimeout(fallbackTimer);
  }, []);

  // Remove duplicate effect - authentication is already checked in detectLocationId

  const detectLocationId = async () => {
    try {
      console.log('Detecting location ID...');
      
      // First check URL params for existing location ID
      const urlParams = new URLSearchParams(window.location.search);
      const urlLocationId = urlParams.get('locationId');
      
      if (urlLocationId && urlLocationId !== 'temp_location') {
        console.log('Location ID found in URL:', urlLocationId);
        setLocationId(urlLocationId);
        setLocationDetected(true);
        // Immediately check authentication for this location
        checkAuthenticationForLocation(urlLocationId);
        return;
      }
      
      // Try to detect from API
      const detectedLocationId = await Promise.race([
        getLocationId(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
      ]);
      
      if (detectedLocationId) {
        console.log('Location ID detected:', detectedLocationId);
        setLocationId(detectedLocationId as string);
        window.history.replaceState({}, '', `/?locationId=${detectedLocationId}`);
        // Immediately check authentication for this location
        checkAuthenticationForLocation(detectedLocationId as string);
      } else {
        console.warn('No location ID detected');
        setIsAuthenticated(false);
        setAuthCheckComplete(true);
        setIsLoading(false); // Set loading to false when no location detected
      }
    } catch (error) {
      console.error('Error detecting location ID:', error);
      setIsAuthenticated(false);
      setAuthCheckComplete(true);
      setIsLoading(false); // Set loading to false on error
    } finally {
      setLocationDetected(true);
    }
  };

  const checkAuthenticationForLocation = async (locId: string) => {
    try {
      // First try a simple test-auth check
      const response = await fetch(`/api/test-auth?locationId=${locId}`);
      
      if (!response.ok) {
        console.log('Auth check failed with status:', response.status);
        setIsAuthenticated(false);
        setAuthCheckComplete(true);
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
      
      if (!data.tokenFound) {
        console.log('No token found for location');
        setIsAuthenticated(false);
        setAuthCheckComplete(true);
        setIsLoading(false);
        return;
      }
      
      // Now try to actually load calendars to verify the token works
      console.log('Token found, verifying by loading calendars...');
      const calendarsResponse = await fetch(`/api/calendars?locationId=${locId}`);
      
      if (calendarsResponse.ok) {
        console.log('Authentication verified successfully');
        setIsAuthenticated(true);
        const calendarsData = await calendarsResponse.json();
        const calendars = calendarsData.calendars || [];
        
        const activeCalendars = calendars.filter((cal: any) => cal.isActive).length;
        const today = new Date().toDateString();
        const createdToday = calendars.filter((cal: any) => {
          const createdDate = new Date(cal.createdAt || cal.createdDate).toDateString();
          return createdDate === today;
        }).length;
        
        setMetrics({
          activeCalendars,
          createdToday,
          importsInProgress: 0
        });
        setAuthCheckComplete(true);
        setIsLoading(false); // Set loading to false after metrics are loaded
      } else {
        console.log('Calendar API failed, authentication invalid');
        setIsAuthenticated(false);
        setAuthCheckComplete(true);
        setIsLoading(false); // Set loading to false even on failure
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsAuthenticated(false);
      setAuthCheckComplete(true);
      setIsLoading(false); // Set loading to false on error
    }
  };

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const calendarsResponse = await fetch(`/api/calendars?locationId=${locationId}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (calendarsResponse.ok) {
        const calendarsData = await calendarsResponse.json();
        const calendars = calendarsData.calendars || [];
        
        const activeCalendars = calendars.filter((cal: any) => cal.isActive).length;
        
        const today = new Date().toDateString();
        const createdToday = calendars.filter((cal: any) => {
          const createdDate = new Date(cal.createdAt || cal.createdDate).toDateString();
          return createdDate === today;
        }).length;
        
        setMetrics(prev => ({
          ...prev,
          activeCalendars,
          createdToday
        }));
      } else {
        console.warn('Failed to load calendars:', calendarsResponse.status);
        
        // If we get a 401 or 404, the user is not authenticated
        if (calendarsResponse.status === 401 || calendarsResponse.status === 404) {
          console.log('Authentication failed, showing connect screen');
          setIsAuthenticated(false);
          return;
        }
        
        // For other errors, set default metrics
        setMetrics(prev => ({
          ...prev,
          activeCalendars: 0,
          createdToday: 0
        }));
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
      // Check if it's an auth error
      if (error instanceof Error && error.message.includes('auth')) {
        setIsAuthenticated(false);
        return;
      }
      // Set default metrics so UI still shows
      setMetrics(prev => ({
        ...prev,
        activeCalendars: 0,
        createdToday: 0
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Use detected location ID or require proper detection
  const displayLocationId = locationId || '';

  // Show installation required screen if not authenticated
  if (authCheckComplete && !isAuthenticated) {
    return <InstallationRequired locationId={displayLocationId} />;
  }

  // Show loading while checking authentication
  if (!authCheckComplete) {
    return <Loading isLoading={true} message="Checking authentication..." />;
  }

  return (
    <div className="flex-1 bg-white overflow-auto">
      <MobileHeader title="Dashboard" />
      
      <div className="p-6 md:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-black mb-2">
            Bulk Calendar Actions
          </h1>
          <p className="text-sm text-gray-600 mb-2">
            Import multiple calendars from a CSV or manage existing ones in bulk.
          </p>
          {displayLocationId && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-gray-500">Location ID:</span>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700">
                {displayLocationId}
              </code>
            </div>
          )}
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          {/* Import Section */}
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center mb-3">
              <div className="bg-yellow-50 p-2 md:p-3 rounded-lg">
                <Upload className="w-6 h-6 md:w-8 md:h-8 text-yellow-500" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">Import</h3>
            <p className="text-gray-600 text-sm mb-2">
              Upload a CSV file to create multiple calendars at once
            </p>
            <Link
              href={`/import?locationId=${displayLocationId}`}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm md:text-base hover:underline inline-flex items-center transition-all duration-200"
            >
              Upload CSV →
            </Link>
          </div>

          {/* Manage Section */}
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center mb-3">
              <div className="bg-yellow-50 p-2 md:p-3 rounded-lg">
                <Calendar className="w-6 h-6 md:w-8 md:h-8 text-yellow-500" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">Manage</h3>
            <p className="text-gray-600 text-sm mb-2">
              View, search, and bulk delete existing calendars
            </p>
            <Link
              href={`/calendars?locationId=${displayLocationId}`}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm md:text-base hover:underline inline-flex items-center transition-all duration-200"
            >
              Manage Calendars →
            </Link>
          </div>

          {/* Settings Section */}
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center mb-3">
              <div className="bg-yellow-50 p-2 md:p-3 rounded-lg">
                <Settings className="w-6 h-6 md:w-8 md:h-8 text-yellow-500" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">Settings</h3>
            <p className="text-gray-600 text-sm mb-2">
              Configure default settings and branding options
            </p>
            <Link
              href={`/settings?locationId=${displayLocationId}`}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm md:text-base hover:underline inline-flex items-center transition-all duration-200"
            >
              Configure →
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-50 p-2 md:p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-black">
                {isLoading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                ) : (
                  metrics.activeCalendars
                )}
              </div>
            </div>
            <div className="text-xs md:text-sm text-gray-500">Active Calendars</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-50 p-2 md:p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-black">
                {isLoading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                ) : (
                  metrics.createdToday
                )}
              </div>
            </div>
            <div className="text-xs md:text-sm text-gray-500">Created Today</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-50 p-2 md:p-3 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-black">
                {isLoading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                ) : (
                  metrics.importsInProgress
                )}
              </div>
            </div>
            <div className="text-xs md:text-sm text-gray-500">Imports in Progress</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<Loading isLoading={true} message="Loading dashboard..." />}>
      <DashboardContent />
    </Suspense>
  );
}