'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Trash2, MoreHorizontal, CheckSquare, Square, Upload } from 'lucide-react';
import { getLocationId } from '@/lib/api/ghl/context';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/Loading';
import { TopBar } from '@/components/TopBar';
import { useToast } from '@/components/Toast';

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
  const toast = useToast();
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
        // No fallback - require proper location detection
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
      
      const response = await fetch(`/api/calendars?locationId=${locationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          calendarIds
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Remove deleted calendars from state
        setCalendars(prev => prev.filter(cal => !result.success.includes(cal.id)));
        setSelectedCalendars(new Set());
        
        toast.success(`Successfully deleted ${result.success.length} calendar(s)`);
        
        if (result.failed.length > 0) {
          console.warn('Some deletions failed:', result.failed);
          toast.warning(`Failed to delete ${result.failed.length} calendar(s)`);
        }
      } else {
        throw new Error('Delete request failed');
      }
    } catch (error) {
      console.error('Bulk delete failed:', error);
      toast.error('Failed to delete calendars. Please try again.');
    } finally {
      setIsLoading(false);
      setShowBulkDelete(false);
    }
  };

  const allSelected = filteredCalendars.length > 0 && selectedCalendars.size === filteredCalendars.length;
  const someSelected = selectedCalendars.size > 0 && selectedCalendars.size < filteredCalendars.length;

  // Show loading overlay
  if (isLoading && calendars.length === 0) {
    return <Loading isLoading={true} message="Loading calendars..." />;
  }

  return (
    <div className="min-h-screen bg-white">
      <TopBar 
        showBackButton={true}
        onBack={() => router.push('/')}
      />
      
      <div className="flex-1 bg-white p-6 md:p-8 overflow-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl font-bold text-black mb-2">Calendars</h1>
            <p className="text-sm text-gray-600 mb-4">
              View, search, and manage your calendars
            </p>
          </div>

          {selectedCalendars.size > 0 && (
            <button
              onClick={() => setShowBulkDelete(true)}
              disabled={isLoading}
              className="bg-red-600 text-white rounded-md px-3 md:px-4 py-1.5 md:py-2 text-sm font-medium hover:bg-red-700 transition duration-200"
            >
              <Trash2 className="w-4 h-4 inline mr-2" />
              Delete Selected ({selectedCalendars.size})
            </button>
          )}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search calendars..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-md pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:border-yellow-300 focus:ring-yellow-200 focus:ring-2 focus:ring-opacity-50 text-sm placeholder-gray-400 transition-all duration-200"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 md:px-4 py-2 md:py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-300 hover:border-yellow-300 transition-colors duration-150"
                    />
                  </th>
                  <th className="px-3 md:px-4 py-2 md:py-3 text-left text-sm text-gray-600 font-medium">Name</th>
                  <th className="px-3 md:px-4 py-2 md:py-3 text-left text-sm text-gray-600 font-medium">Slug</th>
                  <th className="px-3 md:px-4 py-2 md:py-3 text-left text-sm text-gray-600 font-medium">Group</th>
                  <th className="px-3 md:px-4 py-2 md:py-3 text-left text-sm text-gray-600 font-medium">Status</th>
                  <th className="px-3 md:px-4 py-2 md:py-3 text-left text-sm text-gray-600 font-medium">Created</th>
                  <th className="px-3 md:px-4 py-2 md:py-3 text-left text-sm text-gray-600 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCalendars.map((calendar, index) => (
                  <tr key={calendar.id} className="hover:bg-gray-50 transition duration-150">
                    <td className="px-3 md:px-4 py-2 md:py-3 border-t border-gray-100">
                      <input
                        type="checkbox"
                        checked={selectedCalendars.has(calendar.id)}
                        onChange={(e) => handleCalendarSelect(calendar.id, e.target.checked)}
                        className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-300 hover:border-yellow-300 transition-colors duration-150"
                      />
                    </td>
                    <td className="px-3 md:px-4 py-2 md:py-3 border-t border-gray-100 text-sm font-medium text-black">
                      {calendar.name}
                    </td>
                    <td className="px-3 md:px-4 py-2 md:py-3 border-t border-gray-100 text-sm text-gray-600 font-mono">
                      {calendar.slug}
                    </td>
                    <td className="px-3 md:px-4 py-2 md:py-3 border-t border-gray-100 text-sm text-gray-600">
                      {calendar.groupId || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-3 md:px-4 py-2 md:py-3 border-t border-gray-100">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        calendar.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {calendar.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 md:px-4 py-2 md:py-3 border-t border-gray-100 text-sm text-gray-600">
                      {new Date(calendar.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-3 md:px-4 py-2 md:py-3 border-t border-gray-100">
                      <button className="text-gray-500 hover:text-yellow-500 cursor-pointer transition-colors duration-150">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

                {isLoading && calendars.length > 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="flex items-center justify-center mb-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                      </div>
                      <div className="text-gray-600 text-sm">Updating calendars...</div>
                    </td>
                  </tr>
                ) : filteredCalendars.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="text-gray-600 mb-4 text-sm">
                        {searchQuery ? 'No calendars match your search.' : 'No calendars found.'}
                      </div>
                      <a 
                        href="/import"
                        className="inline-flex items-center px-4 py-2 bg-yellow-500 text-black hover:bg-yellow-600 rounded-md font-medium text-sm transition-colors duration-200"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Import Calendars
                      </a>
                    </td>
                  </tr>
                ) : null}
      </div>

        {/* Bulk Delete Confirmation Modal */}
        {showBulkDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
              <h3 className="text-lg font-semibold text-black mb-4">
                Confirm Bulk Delete
              </h3>
              <p className="text-gray-600 mb-6 text-sm">
                Are you sure you want to delete <span className="font-semibold text-black">{selectedCalendars.size}</span> calendar(s)?
                This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowBulkDelete(false)}
                  disabled={isLoading}
                  className="flex-1 py-2 px-4 rounded-md border border-gray-300 hover:border-gray-400 text-gray-700 font-medium text-sm transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={isLoading}
                  className="flex-1 py-2 px-4 rounded-md bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-colors duration-200 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </div>
                  ) : (
                    'Delete'
                  )}
                </button>
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
    <Suspense fallback={<Loading isLoading={true} message="Loading calendars..." />}>
      <CalendarsContent />
    </Suspense>
  );
}
