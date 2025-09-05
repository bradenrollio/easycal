'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Upload, Calendar, Settings, TrendingUp, Clock, BarChart3, MapPin, ChevronDown } from 'lucide-react';
import { getLocationId } from '@/lib/api/ghl/context';
import { Loading } from '@/components/Loading';
import { MobileHeader } from '@/components/MobileHeader';

interface Location {
  id: string;
  name: string;
  timeZone: string;
  isEnabled: boolean;
}

function BulkActionsContent() {
  const [metrics, setMetrics] = useState({
    activeCalendars: 0,
    createdToday: 0,
    importsInProgress: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [locationDetected, setLocationDetected] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // Load metrics on mount
  useEffect(() => {
    detectLocationId();
    
    // Fallback: if location detection takes too long, force show the UI
    const fallbackTimer = setTimeout(() => {
      if (!locationDetected) {
        console.warn('Location detection timeout, showing UI with fallback');
        const fallbackLocationId = 'HgTZdA5INm0uiGh9KvHC';
        setLocationId(fallbackLocationId);
        setLocationDetected(true);
      }
    }, 3000);

    return () => clearTimeout(fallbackTimer);
  }, [locationDetected]);

  useEffect(() => {
    if (locationId) {
      loadMetrics();
      loadLocations();
    }
  }, [locationId]);

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
        return;
      }
      
      // Try to detect from API
      const detectedLocationId = await Promise.race([
        getLocationId(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
      ]);
      
      if (detectedLocationId) {
        console.log('Location ID detected:', detectedLocationId);
        setLocationId(detectedLocationId as string);
        window.history.replaceState({}, '', `?locationId=${detectedLocationId}`);
      } else {
        console.warn('No location ID detected, using fallback');
        const fallbackLocationId = 'HgTZdA5INm0uiGh9KvHC';
        setLocationId(fallbackLocationId);
        window.history.replaceState({}, '', `?locationId=${fallbackLocationId}`);
      }
    } catch (error) {
      console.error('Error detecting location ID:', error);
      // Use fallback location ID
      const fallbackLocationId = 'HgTZdA5INm0uiGh9KvHC';
      setLocationId(fallbackLocationId);
      window.history.replaceState({}, '', `?locationId=${fallbackLocationId}`);
    } finally {
      setLocationDetected(true);
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
        setMetrics(prev => ({
          ...prev,
          activeCalendars: 0,
          createdToday: 0
        }));
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
      setMetrics(prev => ({
        ...prev,
        activeCalendars: 0,
        createdToday: 0
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const loadLocations = async () => {
    // Mock locations for now - replace with actual API call
    setLocations([
      { id: locationId || '', name: 'Current Location', timeZone: 'America/New_York', isEnabled: true }
    ]);
  };

  const handleLocationChange = (newLocationId: string) => {
    setLocationId(newLocationId);
    window.history.replaceState({}, '', `?locationId=${newLocationId}`);
    setShowLocationDropdown(false);
  };

  const displayLocationId = locationId || 'agency_EnUqtThIwW8pdTLOvuO7';
  const selectedLocation = locations.find(loc => loc.id === locationId);

  return (
    <div className="flex-1 bg-white p-6 md:p-8 overflow-auto">
      <MobileHeader title="Bulk Actions" />
      
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-black mb-2">
          Bulk Calendar Actions
        </h1>
        <p className="text-sm text-gray-600 mb-4">
          Import multiple calendars from a CSV or manage existing ones in bulk.
        </p>
        
        {/* Location Switcher */}
        <div className="relative inline-block">
          <button
            onClick={() => setShowLocationDropdown(!showLocationDropdown)}
            className="flex items-center space-x-2 px-3 py-2 bg-yellow-50 rounded-md border border-gray-300 hover:bg-gray-100 text-black transition-all duration-200"
          >
            <MapPin className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium">
              {selectedLocation?.name || 'Select Location'}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
          
          {showLocationDropdown && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              <div className="py-1">
                {locations.map((location) => (
                  <button
                    key={location.id}
                    onClick={() => handleLocationChange(location.id)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 text-black text-sm"
                  >
                    {location.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Sections */}
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

      {/* Stats Section */}
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
  );
}

export default function BulkActionsPage() {
  return (
    <Suspense fallback={<Loading isLoading={true} message="Loading bulk actions..." />}>
      <BulkActionsContent />
    </Suspense>
  );
}
