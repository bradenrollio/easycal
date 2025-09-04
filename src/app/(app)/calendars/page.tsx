'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Trash2, MoreHorizontal, CheckSquare, Square } from 'lucide-react';
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

// Mock data for demonstration
const mockCalendars: Calendar[] = [
  {
    id: 'cal_1',
    name: 'General Consultations',
    slug: 'general-consultations',
    groupId: 'group_1',
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'cal_2',
    name: 'Emergency Appointments',
    slug: 'emergency-appointments',
    groupId: 'group_1',
    isActive: true,
    createdAt: '2024-01-14T14:30:00Z',
  },
  {
    id: 'cal_3',
    name: 'Follow-up Visits',
    slug: 'follow-up-visits',
    groupId: 'group_2',
    isActive: false,
    createdAt: '2024-01-13T09:15:00Z',
  },
];

export default function CalendarsPage() {
  const router = useRouter();
  const [calendars, setCalendars] = useState<Calendar[]>(mockCalendars);
  const [selectedCalendars, setSelectedCalendars] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showBulkDelete, setShowBulkDelete] = useState(false);

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
      // In a real app, this would call your API
      console.log('Deleting calendars:', Array.from(selectedCalendars));

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Remove deleted calendars from state
      setCalendars(prev => prev.filter(cal => !selectedCalendars.has(cal.id)));
      setSelectedCalendars(new Set());

      // Show success message (you would use a toast library)
      alert(`Successfully deleted ${selectedCalendars.size} calendar(s)`);

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
            Manage your calendar configurations
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

        {filteredCalendars.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-2">
              {searchQuery ? 'No calendars match your search.' : 'No calendars found.'}
            </div>
            <Button variant="outline" asChild>
              <a href="/import">Import Calendars</a>
            </Button>
          </div>
        )}
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
