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

  // Get location ID from URL params
  const locationId = searchParams.get('locationId') || 'temp_location';

  // Load metrics on mount
  useEffect(() => {
    if (locationId) {
      loadMetrics();
    }
  }, [locationId]);

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
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-brand-navy mb-2">
          Move fast with bulk calendar actions
        </h2>
        <p className="text-muted-foreground">
          Import multiple calendars from a CSV or manage existing ones in bulk.
        </p>
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
