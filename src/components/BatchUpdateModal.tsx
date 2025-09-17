'use client';

import { useState } from 'react';
import { X, Clock, Ban, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BatchUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCalendars: string[];
  onUpdate: (updateData: BatchUpdateData) => Promise<void>;
}

export interface BatchUpdateData {
  type: 'override' | 'block' | 'remove';
  date?: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export function BatchUpdateModal({ isOpen, onClose, selectedCalendars, onUpdate }: BatchUpdateModalProps) {
  const [updateType, setUpdateType] = useState<'override' | 'block' | 'remove'>('override');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [blockReason, setBlockReason] = useState('Holiday');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    // Date is not required for remove operation
    if (updateType !== 'remove' && !date) {
      alert('Please select a date');
      return;
    }

    if (updateType === 'override' && (!startTime || !endTime)) {
      alert('Please select both start and end times');
      return;
    }

    setIsProcessing(true);

    try {
      const updateData: BatchUpdateData = {
        type: updateType,
        ...(updateType !== 'remove' && { date }),
        ...(updateType === 'override' && { startTime, endTime }),
        ...(updateType === 'block' && { reason: blockReason })
      };

      await onUpdate(updateData);

      // Reset form
      setDate('');
      setStartTime('09:00');
      setEndTime('17:00');
      setBlockReason('Holiday');
      onClose();
    } catch (error) {
      console.error('Batch update failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-brand-navy">Batch Update Calendars</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Updating <span className="font-semibold">{selectedCalendars.length}</span> selected calendar{selectedCalendars.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Update Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Update Type
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setUpdateType('override')}
              className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center space-y-2 ${
                updateType === 'override'
                  ? 'border-brand-yellow bg-brand-yellow/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium">Set Time</span>
              <span className="text-xs text-gray-500">Override schedule</span>
            </button>
            <button
              onClick={() => setUpdateType('block')}
              className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center space-y-2 ${
                updateType === 'block'
                  ? 'border-brand-yellow bg-brand-yellow/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Ban className="w-5 h-5" />
              <span className="text-sm font-medium">Block Day</span>
              <span className="text-xs text-gray-500">No bookings</span>
            </button>
            <button
              onClick={() => setUpdateType('remove')}
              className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center space-y-2 ${
                updateType === 'remove'
                  ? 'border-brand-yellow bg-brand-yellow/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Trash2 className="w-5 h-5" />
              <span className="text-sm font-medium">Clear All</span>
              <span className="text-xs text-gray-500">Remove all overrides</span>
            </button>
          </div>
        </div>

        {/* Date Selection (not needed for remove) */}
        {updateType !== 'remove' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow"
            />
          </div>
        )}

        {/* Time Selection (for override) */}
        {updateType === 'override' && (
          <div className="mb-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  This will override the regular schedule for the selected date only.
                  The calendars will be available during the specified time range.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Block Reason (for block) */}
        {updateType === 'block' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason (Optional)
            </label>
            <input
              type="text"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="e.g., Holiday, Maintenance, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow"
            />
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-700">
                  This will block all bookings for the selected date.
                  Customers won&apos;t be able to book any time slots on this day.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Remove Info */}
        {updateType === 'remove' && (
          <div className="mb-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-700">
                  This will remove ALL date-specific overrides and blocked dates.
                  The calendars will revert to their regular schedules only.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={(updateType !== 'remove' && !date) || isProcessing}
            isLoading={isProcessing}
            className="flex-1"
          >
            {updateType === 'override' ? 'Update Schedule' : updateType === 'block' ? 'Block Day' : 'Clear All Overrides'}
          </Button>
        </div>

        {/* Summary */}
        {(date || updateType === 'remove') && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Summary:</strong> {updateType === 'override' ? (
                <>Set {selectedCalendars.length} calendar{selectedCalendars.length !== 1 ? 's' : ''} to {startTime} - {endTime} on {new Date(date + 'T00:00:00').toLocaleDateString()}</>
              ) : updateType === 'block' ? (
                <>Block {selectedCalendars.length} calendar{selectedCalendars.length !== 1 ? 's' : ''} on {new Date(date + 'T00:00:00').toLocaleDateString()} ({blockReason})</>
              ) : (
                <>Clear all date-specific overrides for {selectedCalendars.length} calendar{selectedCalendars.length !== 1 ? 's' : ''}</>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}