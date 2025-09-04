'use client';

import { useState, useEffect } from 'react';
import { Save, Settings, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarDefaults } from '@/types/brand';
import { validateTimezone } from '@/lib/utils/validation';
import { getCommonTimezones } from '@/lib/utils/formatting';

interface CalendarDefaultsProps {
  locationId: string;
  onSave?: (defaults: CalendarDefaults) => void;
}

export function CalendarDefaultsComponent({ locationId, onSave }: CalendarDefaultsProps) {
  const [defaults, setDefaults] = useState<Partial<CalendarDefaults>>({
    locationId,
    defaultSlotDurationMinutes: 30,
    minSchedulingNoticeDays: 1,
    bookingWindowDays: 30,
    spotsPerBooking: 1
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load defaults on mount
  useEffect(() => {
    loadDefaults();
  }, [locationId]);

  const loadDefaults = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/settings/defaults?locationId=${locationId}`);
      
      if (response.ok) {
        const data = await response.json();
        setDefaults(data);
      }
    } catch (error) {
      console.error('Error loading defaults:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!defaults.defaultSlotDurationMinutes || defaults.defaultSlotDurationMinutes < 1) {
      newErrors.defaultSlotDurationMinutes = 'Must be a positive number';
    }

    if (!defaults.minSchedulingNoticeDays || defaults.minSchedulingNoticeDays < 0) {
      newErrors.minSchedulingNoticeDays = 'Must be 0 or greater';
    }

    if (!defaults.bookingWindowDays || defaults.bookingWindowDays < 1) {
      newErrors.bookingWindowDays = 'Must be at least 1 day';
    }

    if (!defaults.spotsPerBooking || defaults.spotsPerBooking < 1) {
      newErrors.spotsPerBooking = 'Must be at least 1';
    }

    if (defaults.defaultTimezone && !validateTimezone(defaults.defaultTimezone)) {
      newErrors.defaultTimezone = 'Invalid timezone format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      
      const response = await fetch('/api/settings/defaults', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(defaults),
      });

      if (response.ok) {
        const savedDefaults = await response.json();
        setDefaults(savedDefaults);
        onSave?.(savedDefaults);
      } else {
        const errorData = await response.json();
        console.error('Save failed:', errorData);
      }
    } catch (error) {
      console.error('Error saving defaults:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof CalendarDefaults, value: string | number) => {
    setDefaults(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Calendar Defaults</h3>
            <p className="text-sm text-blue-700 mt-1">
              Set default values for new calendars. These can be overridden in individual CSV rows.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Default Timezone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Timezone
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={defaults.defaultTimezone || ''}
              onChange={(e) => handleInputChange('defaultTimezone', e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-yellow focus:border-transparent"
            >
              <option value="">Use location timezone</option>
              {getCommonTimezones().map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
          {errors.defaultTimezone && (
            <p className="text-sm text-red-600 mt-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.defaultTimezone}
            </p>
          )}
        </div>

        {/* Default Slot Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Slot Duration (minutes)
          </label>
          <input
            type="number"
            min="5"
            max="480"
            step="5"
            value={defaults.defaultSlotDurationMinutes}
            onChange={(e) => handleInputChange('defaultSlotDurationMinutes', parseInt(e.target.value) || 30)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-yellow focus:border-transparent"
            placeholder="30"
          />
          {errors.defaultSlotDurationMinutes && (
            <p className="text-sm text-red-600 mt-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.defaultSlotDurationMinutes}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">Common values: 15, 30, 45, 60 minutes</p>
        </div>

        {/* Minimum Notice */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Notice (days)
          </label>
          <input
            type="number"
            min="0"
            max="30"
            value={defaults.minSchedulingNoticeDays}
            onChange={(e) => handleInputChange('minSchedulingNoticeDays', parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-yellow focus:border-transparent"
            placeholder="1"
          />
          {errors.minSchedulingNoticeDays && (
            <p className="text-sm text-red-600 mt-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.minSchedulingNoticeDays}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">How many days in advance customers must book</p>
        </div>

        {/* Booking Window */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Booking Window (days)
          </label>
          <input
            type="number"
            min="1"
            max="365"
            value={defaults.bookingWindowDays}
            onChange={(e) => handleInputChange('bookingWindowDays', parseInt(e.target.value) || 30)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-yellow focus:border-transparent"
          />
          {errors.bookingWindowDays && (
            <p className="text-sm text-red-600 mt-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.bookingWindowDays}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">How far in advance customers can book</p>
        </div>

        {/* Spots per Booking */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Spots per Booking
          </label>
          <input
            type="number"
            min="1"
            max="50"
            value={defaults.spotsPerBooking}
            onChange={(e) => handleInputChange('spotsPerBooking', parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-yellow focus:border-transparent"
            placeholder="1"
          />
          {errors.spotsPerBooking && (
            <p className="text-sm text-red-600 mt-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.spotsPerBooking}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">How many spots are available per time slot</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} isLoading={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          Save Defaults
        </Button>
      </div>
    </div>
  );
}
