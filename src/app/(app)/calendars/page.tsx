'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Trash2, MoreHorizontal, CheckSquare, Square } from 'lucide-react';
import { getLocationId } from '@/lib/api/ghl/context';
import { Button } from '@/components/ui/button';
import { TopBar } from '@/components/TopBar';

interface Calendar {
  id: string;
  name: string;
  slug: string;
  groupId?: string;
  isActive: boolean;
  createdAt: string;
}

function CalendarsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedCalendars, setSelectedCalendars] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [locationDetected, setLocationDetected] = useState(false);

  // Detect location ID using comprehensive detection
  useEffect(() => {
    detectLocationId();
  }, []);

  // Load calendars when location ID is available
  useEffect(() => {
    if (locationId && locationDetected) {
      loadCalendars();
    }
  }, [locationId, locationDetected]);

  const detectLocationId = async () => {
    try {
      console.log('Detecting location ID for calendar page...');
      
      // First check URL params
      const urlLocationId = searchParams.get('locationId');
      if (urlLocationId && urlLocationId !== 'temp_location') {
        console.log('Location ID from URL params:', urlLocationId);
        setLocationId(urlLocationId);
        setLocationDetected(true);
        return;
      }
      
      // Use comprehensive location detection
      const detectedLocationId = await getLocationId();
      
      if (detectedLocationId) {
        console.log('Location ID detected for calendars:', detectedLocationId);
        setLocationId(detectedLocationId);
        // Update URL with location ID
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('locationId', detectedLocationId);
        window.history.replaceState({}, '', newUrl.toString());
      } else {
        console.warn('No location ID detected for calendars page');
        setLocationId('temp_location'); // Fallback
      }
    } catch (error) {
      console.error('Error detecting location ID for calendars:', error);
      setLocationId('temp_location'); // Fallback
    } finally {
      setLocationDetected(true);
    }
  };

  const loadCalendars = async () => {
    try {
      setIsLoading(true);
      console.log('Loading calendars for location:', locationId);
      
      const response = await fetch(`/api/calendars?locationId=${locationId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Calendars loaded:', data);
        setCalendars(data.calendars || []);
      } else {
        console.error('Failed to load calendars:', response.status, await response.text());
        // Fallback to empty array for now
        setCalendars([]);
      }
    } catch (error) {
      console.error('Error loading calendars:', error);
      setCalendars([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter calendars based on search query
  const filteredCalendars = calendars.filter(calendar =>
    calendar.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    calendar.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle individual calendar selection
  const handleCalendarSelect = (calendarId: string, isSelected: boolean) => {
    const newSelected = new Set(selectedCalendars);
    if (isSelected) {
      newSelected.add(calendarId);
    } else {
      newSelected.delete(calendarId);
    }
    setSelectedCalendars(newSelected);
  };

  // Handle select all
  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedCalendars(new Set(filteredCalendars.map(cal => cal.id)));
    } else {
      setSelectedCalendars(new Set());
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedCalendars.size === 0) return;

    setIsLoading(true);

    try {
      const calendarIds = Array.from(selectedCalendars);
      
      const response = await fetch('/api/calendars', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          calendarIds,
          locationId: locationId
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Remove deleted calendars from state
        setCalendars(prev => prev.filter(cal => !result.success.includes(cal.id)));
        setSelectedCalendars(new Set());
        
        alert(`Successfully deleted ${result.summary.deleted} calendars`);
        
        if (result.failed.length > 0) {
          console.warn('Some deletions failed:', result.failed);
        }
      } else {
        throw new Error('Delete request failed');
      }
    } catch (error) {
      console.error('Bulk delete failed:', error);
      alert('Failed to delete calendars. Please try again.');
    } finally {
      setIsLoading(false);
      setShowBulkDelete(false);
    }
  };

  const allSelected = filteredCalendars.length > 0 && selectedCalendars.size === filteredCalendars.length;
  const someSelected = selectedCalendars.size > 0 && selectedCalendars.size < filteredCalendars.length;

  return (
    <div className="min-h-screen bg-background">
      <TopBar 
        showBackButton={true}
        onBack={() => router.push('/')}
      />
      <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Calendars</h1>
          <p className="text-muted-foreground">
            View, search, and manage your class calendars
          </p>
        </div>

        {selectedCalendars.size > 0 && (
          <Button
            variant="destructive"
            onClick={() => setShowBulkDelete(true)}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Selected ({selectedCalendars.size})</span>
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search calendars..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSelectAll(!allSelected)}
                    className="flex items-center space-x-2 hover:bg-muted/70 rounded px-2 py-1"
                  >
                    {allSelected ? (
                      <CheckSquare className="w-4 h-4 text-brand-navy" />
                    ) : someSelected ? (
                      <div className="w-4 h-4 border-2 border-brand-navy bg-brand-yellow/20 rounded" />
                    ) : (
                      <Square className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-brand-navy">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-brand-navy">Slug</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-brand-navy">Group</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-brand-navy">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-brand-navy">Created</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-brand-navy">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCalendars.map((calendar) => (
                <tr key={calendar.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleCalendarSelect(calendar.id, !selectedCalendars.has(calendar.id))}
                      className="flex items-center space-x-2"
                    >
                      {selectedCalendars.has(calendar.id) ? (
                        <CheckSquare className="w-4 h-4 text-brand-navy" />
                      ) : (
                        <Square className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-brand-navy">{calendar.name}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {calendar.slug}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {calendar.groupId || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      calendar.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {calendar.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(calendar.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button className="p-1 hover:bg-muted rounded">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy"></div>
            </div>
            <div className="text-muted-foreground">Loading calendars...</div>
          </div>
        ) : filteredCalendars.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-2">
              {searchQuery ? 'No calendars match your search.' : 'No calendars found.'}
            </div>
            <Button variant="outline" asChild>
              <a href="/import">Import Calendars</a>
            </Button>
          </div>
        ) : null}
      </div>

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-brand-navy mb-4">
              Confirm Bulk Delete
            </h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete {selectedCalendars.size} calendar(s)?
              This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowBulkDelete(false)}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                isLoading={isLoading}
                className="flex-1"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default function CalendarsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-yellow"></div>
    </div>}>
      <CalendarsContent />
    </Suspense>
  );
}
