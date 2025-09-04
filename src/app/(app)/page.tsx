'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Upload, Trash2, Settings } from 'lucide-react';

function DashboardContent() {
  const searchParams = useSearchParams();
  const [metrics, setMetrics] = useState({
    liveCalendars: 0,
    createdToday: 0,
    importsInProgress: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Get location ID from URL params or try to detect it
  const [locationId, setLocationId] = useState(searchParams.get('locationId') || null);
  const [locationDetected, setLocationDetected] = useState(false);

  // Load metrics on mount
  useEffect(() => {
    if (locationId) {
      loadMetrics();
    } else if (!locationDetected) {
      // Try to detect location ID from available tokens
      detectLocationId();
    }
  }, [locationId, locationDetected]);

  const detectLocationId = async () => {
    try {
      console.log('Detecting location ID...');
      // Try to get the correct location ID from our detection API
      const response = await fetch('/api/detect-location');
      if (response.ok) {
        const data = await response.json();
        console.log('Detected location:', data);
        if (data.locationId) {
          setLocationId(data.locationId);
          // Update URL with location ID
          window.history.replaceState({}, '', `/?locationId=${data.locationId}`);
        }
      } else {
        console.error('Failed to detect location:', await response.text());
      }
    } catch (error) {
      console.error('Error detecting location ID:', error);
    } finally {
      setLocationDetected(true);
    }
  };

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      
      // Fetch calendars to calculate metrics
      const calendarsResponse = await fetch(`/api/calendars?locationId=${locationId}`);
      if (calendarsResponse.ok) {
        const calendarsData = await calendarsResponse.json();
        const calendars = calendarsData.calendars || [];
        
        // Calculate live calendars
        const liveCalendars = calendars.filter(cal => cal.isActive).length;
        
        // Calculate created today
        const today = new Date().toDateString();
        const createdToday = calendars.filter(cal => {
          const createdDate = new Date(cal.createdAt || cal.createdDate).toDateString();
          return createdDate === today;
        }).length;
        
        setMetrics(prev => ({
          ...prev,
          liveCalendars,
          createdToday
        }));
      }
      
      // Fetch job status for imports in progress
      // TODO: Implement jobs API endpoint
      
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };
  // Show loading state if no location ID detected yet
  if (!locationId && !locationDetected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-yellow mx-auto mb-4"></div>
          <p className="text-muted-foreground">Connecting to your GHL account...</p>
        </div>
      </div>
    );
  }

  // Show error if no location found
  if (!locationId && locationDetected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <h2 className="text-xl font-bold">No Location Found</h2>
            <p>Unable to detect your GHL location. Please try reinstalling the app.</p>
          </div>
          <a href="/auth/install" className="text-brand-yellow hover:underline">
            Reinstall EasyCal
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-brand-navy mb-2">
          Move fast with bulk calendar actions
        </h2>
        <p className="text-muted-foreground">
          Import multiple calendars from a CSV or manage existing ones in bulk.
        </p>
        {locationId && (
          <p className="text-xs text-gray-500 mt-2">
            Location: {locationId}
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3 max-w-6xl">
        {/* Import Calendars Card */}
        <Link
          href={`/import?locationId=${locationId}`}
          className="group block p-6 bg-white rounded-2xl card-shadow border border-border hover:card-shadow-lg transition-all duration-200 focus-ring"
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-brand-yellow/10 rounded-lg flex items-center justify-center group-hover:bg-brand-yellow/20 transition-colors">
                <Upload className="w-6 h-6 text-brand-yellow" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-brand-navy mb-2">
                Import Calendars
              </h3>
              <p className="text-muted-foreground mb-4">
                Upload a CSV, map fields, and create calendars in seconds.
              </p>
              <div className="text-sm text-brand-yellow font-medium">
                Get started →
              </div>
            </div>
          </div>
        </Link>

        {/* Manage Calendars Card */}
        <Link
          href={`/calendars?locationId=${locationId}`}
          className="group block p-6 bg-white rounded-2xl card-shadow border border-border hover:card-shadow-lg transition-all duration-200 focus-ring"
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-brand-navy mb-2">
                Manage Calendars
              </h3>
              <p className="text-muted-foreground mb-4">
                View, search, and bulk delete existing calendars.
              </p>
              <div className="text-sm text-red-600 font-medium">
                Manage now →
              </div>
            </div>
          </div>
        </Link>

        {/* Settings Card */}
        <Link
          href={`/settings?locationId=${locationId}`}
          className="group block p-6 bg-white rounded-2xl card-shadow border border-border hover:card-shadow-lg transition-all duration-200 focus-ring"
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-brand-navy mb-2">
                Settings
              </h3>
              <p className="text-muted-foreground mb-4">
                Configure brand colors, button text, and calendar defaults.
              </p>
              <div className="text-sm text-blue-600 font-medium">
                Configure →
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="mt-12 grid gap-4 md:grid-cols-3 max-w-4xl">
        <div className="bg-white rounded-lg p-4 card-shadow border border-border">
          <div className="text-2xl font-bold text-brand-navy">
            {isLoading ? '—' : metrics.liveCalendars}
          </div>
          <div className="text-sm text-muted-foreground">Live Calendars</div>
        </div>
        <div className="bg-white rounded-lg p-4 card-shadow border border-border">
          <div className="text-2xl font-bold text-green-600">
            {isLoading ? '—' : metrics.createdToday}
          </div>
          <div className="text-sm text-muted-foreground">Created Today</div>
        </div>
        <div className="bg-white rounded-lg p-4 card-shadow border border-border">
          <div className="text-2xl font-bold text-blue-600">
            {isLoading ? '—' : metrics.importsInProgress}
          </div>
          <div className="text-sm text-muted-foreground">Imports in Progress</div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-yellow"></div>
    </div>}>
      <DashboardContent />
    </Suspense>
  );
}
