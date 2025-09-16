'use client';

import { useState, Suspense } from 'react';
import { Plus, Trash2, Copy, Clock } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { TopBar } from '@/components/TopBar';

interface TimeSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const FULL_DAY_NAMES: Record<string, string> = {
  'Mon': 'Monday',
  'Tue': 'Tuesday',
  'Wed': 'Wednesday',
  'Thu': 'Thursday',
  'Fri': 'Friday',
  'Sat': 'Saturday',
  'Sun': 'Sunday'
};

function ScheduleBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locationId = searchParams.get('locationId') || '';
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { id: '1', day: 'Mon', startTime: '09:00', endTime: '17:00' }
  ]);
  const [generatedSchedule, setGeneratedSchedule] = useState('');
  const toast = useToast();

  const handleBack = () => {
    // Check where the user came from and navigate accordingly
    const referrer = document.referrer;
    if (referrer && referrer.includes('/import')) {
      router.push(`/import?locationId=${locationId}`);
    } else if (referrer && referrer.includes('/dashboard')) {
      router.push(`/dashboard?locationId=${locationId}`);
    } else {
      // Default to main page
      router.push(`/?locationId=${locationId}`);
    }
  };

  const addTimeSlot = () => {
    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      day: 'Mon',
      startTime: '09:00',
      endTime: '17:00'
    };
    setTimeSlots([...timeSlots, newSlot]);
  };

  const removeTimeSlot = (id: string) => {
    setTimeSlots(timeSlots.filter(slot => slot.id !== id));
  };

  const updateTimeSlot = (id: string, field: keyof TimeSlot, value: string) => {
    setTimeSlots(timeSlots.map(slot =>
      slot.id === id ? { ...slot, [field]: value } : slot
    ));
  };

  const generateSchedule = () => {
    // Sort slots by day order then by start time
    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const sortedSlots = [...timeSlots].sort((a, b) => {
      const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      if (dayDiff !== 0) return dayDiff;
      return a.startTime.localeCompare(b.startTime);
    });

    // Group by day to merge overlapping or adjacent slots
    const groupedByDay: Record<string, TimeSlot[]> = {};
    sortedSlots.forEach(slot => {
      if (!groupedByDay[slot.day]) {
        groupedByDay[slot.day] = [];
      }
      groupedByDay[slot.day].push(slot);
    });

    // Generate schedule string
    const scheduleBlocks: string[] = [];
    Object.keys(groupedByDay)
      .sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b))
      .forEach(day => {
        const slots = groupedByDay[day];
        slots.forEach(slot => {
          // Ensure times have proper format
          const startTime = slot.startTime.padStart(5, '0');
          const endTime = slot.endTime.padStart(5, '0');
          scheduleBlocks.push(`${day} ${startTime}-${endTime}`);
        });
      });

    const schedule = scheduleBlocks.join('; ');
    setGeneratedSchedule(schedule);

    // Copy to clipboard
    navigator.clipboard.writeText(schedule).then(() => {
      toast.success('Schedule copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  const validateTimeSlot = (slot: TimeSlot): boolean => {
    // Basic validation
    if (!slot.startTime || !slot.endTime) return false;

    // Check if end time is after start time
    const [startHour, startMin] = slot.startTime.split(':').map(Number);
    const [endHour, endMin] = slot.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    return endMinutes > startMinutes;
  };

  const applyTemplate = (template: string) => {
    const templates: Record<string, TimeSlot[]> = {
      'weekdays': [
        { id: '1', day: 'Mon', startTime: '09:00', endTime: '17:00' },
        { id: '2', day: 'Tue', startTime: '09:00', endTime: '17:00' },
        { id: '3', day: 'Wed', startTime: '09:00', endTime: '17:00' },
        { id: '4', day: 'Thu', startTime: '09:00', endTime: '17:00' },
        { id: '5', day: 'Fri', startTime: '09:00', endTime: '17:00' }
      ],
      'weekends': [
        { id: '1', day: 'Sat', startTime: '10:00', endTime: '14:00' },
        { id: '2', day: 'Sun', startTime: '10:00', endTime: '14:00' }
      ],
      'full-week': [
        { id: '1', day: 'Mon', startTime: '09:00', endTime: '17:00' },
        { id: '2', day: 'Tue', startTime: '09:00', endTime: '17:00' },
        { id: '3', day: 'Wed', startTime: '09:00', endTime: '17:00' },
        { id: '4', day: 'Thu', startTime: '09:00', endTime: '17:00' },
        { id: '5', day: 'Fri', startTime: '09:00', endTime: '17:00' },
        { id: '6', day: 'Sat', startTime: '10:00', endTime: '14:00' },
        { id: '7', day: 'Sun', startTime: '10:00', endTime: '14:00' }
      ],
      'mornings': [
        { id: '1', day: 'Mon', startTime: '08:00', endTime: '12:00' },
        { id: '2', day: 'Tue', startTime: '08:00', endTime: '12:00' },
        { id: '3', day: 'Wed', startTime: '08:00', endTime: '12:00' },
        { id: '4', day: 'Thu', startTime: '08:00', endTime: '12:00' },
        { id: '5', day: 'Fri', startTime: '08:00', endTime: '12:00' }
      ],
      'afternoons': [
        { id: '1', day: 'Mon', startTime: '13:00', endTime: '17:00' },
        { id: '2', day: 'Tue', startTime: '13:00', endTime: '17:00' },
        { id: '3', day: 'Wed', startTime: '13:00', endTime: '17:00' },
        { id: '4', day: 'Thu', startTime: '13:00', endTime: '17:00' },
        { id: '5', day: 'Fri', startTime: '13:00', endTime: '17:00' }
      ]
    };

    setTimeSlots(templates[template]);
    toast.info(`Loaded ${template} template`);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar
        showBackButton={true}
        onBack={handleBack}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-brand-navy mb-2">Schedule Builder</h1>
            <p className="text-gray-600">
              Create properly formatted schedule blocks for your calendar imports
            </p>
          </div>

      {/* Quick Templates */}
      <div className="mb-6 bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-brand-navy mb-4">Quick Templates</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => applyTemplate('weekdays')}
            className="px-4 py-2 bg-brand-yellow/10 text-brand-navy hover:bg-brand-yellow/20 rounded-lg transition-colors"
          >
            Weekdays (Mon-Fri)
          </button>
          <button
            onClick={() => applyTemplate('weekends')}
            className="px-4 py-2 bg-brand-yellow/10 text-brand-navy hover:bg-brand-yellow/20 rounded-lg transition-colors"
          >
            Weekends Only
          </button>
          <button
            onClick={() => applyTemplate('full-week')}
            className="px-4 py-2 bg-brand-yellow/10 text-brand-navy hover:bg-brand-yellow/20 rounded-lg transition-colors"
          >
            Full Week
          </button>
          <button
            onClick={() => applyTemplate('mornings')}
            className="px-4 py-2 bg-brand-yellow/10 text-brand-navy hover:bg-brand-yellow/20 rounded-lg transition-colors"
          >
            Mornings Only
          </button>
          <button
            onClick={() => applyTemplate('afternoons')}
            className="px-4 py-2 bg-brand-yellow/10 text-brand-navy hover:bg-brand-yellow/20 rounded-lg transition-colors"
          >
            Afternoons Only
          </button>
        </div>
      </div>

      {/* Schedule Builder */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-brand-navy">Time Slots</h2>
          <button
            onClick={addTimeSlot}
            className="flex items-center space-x-2 px-4 py-2 bg-brand-yellow hover:bg-yellow-500 text-brand-navy font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Time Slot</span>
          </button>
        </div>

        <div className="space-y-3">
          {timeSlots.map((slot, index) => {
            const isValid = validateTimeSlot(slot);
            return (
              <div
                key={slot.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border ${
                  isValid ? 'border-gray-200' : 'border-red-300 bg-red-50'
                }`}
              >
                <span className="text-sm text-gray-500 w-8">#{index + 1}</span>

                <select
                  value={slot.day}
                  onChange={(e) => updateTimeSlot(slot.id, 'day', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                >
                  {DAYS.map(day => (
                    <option key={day} value={day}>
                      {day} ({FULL_DAY_NAMES[day]})
                    </option>
                  ))}
                </select>

                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => updateTimeSlot(slot.id, 'startTime', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />

                <span className="text-gray-500">to</span>

                <input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => updateTimeSlot(slot.id, 'endTime', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />

                <button
                  onClick={() => removeTimeSlot(slot.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  disabled={timeSlots.length === 1}
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {!isValid && (
                  <span className="text-sm text-red-600">End time must be after start time</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Generated Schedule */}
      <div className="mt-6 bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-brand-navy">Generated Schedule</h2>
          <button
            onClick={generateSchedule}
            className="flex items-center space-x-2 px-4 py-2 bg-brand-navy hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
            disabled={timeSlots.some(slot => !validateTimeSlot(slot))}
          >
            <Copy className="w-4 h-4" />
            <span>Generate & Copy</span>
          </button>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          {generatedSchedule ? (
            <div>
              <code className="text-sm text-brand-navy break-all">{generatedSchedule}</code>
              <p className="text-xs text-gray-500 mt-2">
                ✓ Schedule copied to clipboard! Paste this into your CSV file.
              </p>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              Click &quot;Generate & Copy&quot; to create your schedule blocks
            </p>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2 flex items-center">
          <Clock className="w-4 h-4 mr-2" />
          How to use this tool
        </h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Choose a quick template or manually add time slots</li>
          <li>Select the day and set start/end times for each slot</li>
          <li>Click &quot;Generate & Copy&quot; to create the formatted schedule</li>
          <li>Paste the generated schedule into your CSV file&apos;s schedule_blocks column</li>
        </ol>
        <p className="text-xs text-blue-700 mt-2">
          <strong>Format:</strong> Day HH:MM-HH:MM separated by semicolons (e.g., &quot;Mon 09:00-17:00; Tue 09:00-17:00&quot;)
        </p>
      </div>
        </div>
      </div>
    </div>
  );
}

export default function ScheduleBuilderPage() {
  return (
    <Suspense fallback={
      <div className="max-w-5xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
          <div className="h-10 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="space-y-3">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <ScheduleBuilderContent />
    </Suspense>
  );
}