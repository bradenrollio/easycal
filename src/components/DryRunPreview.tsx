'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Calendar, ArrowLeft, ExternalLink, X, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CSVCalendarRow, BrandConfig, CalendarDefaults, ValidationError, CalendarPayload } from '@/types/brand';
import { validateCSVRow } from '@/lib/utils/validation';
import { buildCalendarPayload, applyBranding } from '@/lib/constants/branding';

interface DryRunPreviewProps {
  csvRows: CSVCalendarRow[];
  brandConfig: BrandConfig;
  defaults: CalendarDefaults;
  onProceed: () => void;
  onBack: () => void;
}

interface PreviewRow {
  index: number;
  row: CSVCalendarRow;
  payload: CalendarPayload;
  errors: ValidationError[];
  warnings: ValidationError[];
  branding: {
    primaryColor: string;
    backgroundColor: string;
    buttonText: string;
    timezone: string;
  };
}

export function DryRunPreview({ csvRows, brandConfig, defaults, onProceed, onBack }: DryRunPreviewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locationId = searchParams.get('locationId') || '';
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [hasCheckedForErrors, setHasCheckedForErrors] = useState(false);

  useEffect(() => {
    processRows();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [csvRows]);

  const processRows = async () => {
    setIsProcessing(true);
    
    const processed: PreviewRow[] = [];
    
    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i];
      const validationErrors = validateCSVRow(row, i, brandConfig);
      const errors = validationErrors.filter(e => e.severity === 'error');
      const warnings = validationErrors.filter(e => e.severity === 'warning');
      
      const branding = applyBranding(row, brandConfig, defaults);
      
      try {
        const payload = buildCalendarPayload(row, brandConfig, defaults);
        
        processed.push({
          index: i,
          row,
          payload,
          errors,
          warnings,
          branding
        });
      } catch (error) {
        processed.push({
          index: i,
          row,
          payload: null as any,
          errors: [...errors, {
            row: i,
            field: 'general',
            message: `Failed to build payload: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'error'
          }],
          warnings,
          branding
        });
      }
    }

    setPreviewRows(processed);
    setIsProcessing(false);

    // Don't check for errors if we've already shown the modal
    if (!hasCheckedForErrors && processed.length > 0) {
      // Check if there are schedule block errors and show modal
      const hasScheduleErrors = processed.some(row =>
        row.errors.some(error => {
          // Check for schedule_blocks field or if the message contains schedule-related keywords
          return error.field === 'schedule_blocks' ||
                 error.field === 'schedule' ||
                 (error.message && error.message.toLowerCase().includes('schedule block'));
        })
      );

      if (hasScheduleErrors) {
        setShowScheduleModal(true);
        setHasCheckedForErrors(true);
      }
    }
  };

  const totalErrors = previewRows.reduce((sum, row) => sum + row.errors.length, 0);
  const totalWarnings = previewRows.reduce((sum, row) => sum + row.warnings.length, 0);
  const validRows = previewRows.filter(row => row.errors.length === 0).length;
  const hasScheduleBlockErrors = previewRows.some(row =>
    row.errors.some(error => {
      // More robust check for schedule-related errors
      const isScheduleError = error.field === 'schedule_blocks' ||
                             error.field === 'schedule' ||
                             (error.message && error.message.toLowerCase().includes('schedule'));
      return isScheduleError;
    })
  );

  // Also check showScheduleModal state when errors are present but modal hasn't been shown
  useEffect(() => {
    if (!hasCheckedForErrors && hasScheduleBlockErrors && previewRows.length > 0) {
      setShowScheduleModal(true);
      setHasCheckedForErrors(true);
    }
  }, [hasScheduleBlockErrors, previewRows.length, hasCheckedForErrors]);

  if (isProcessing) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-yellow mx-auto mb-4"></div>
        <p className="text-muted-foreground">Processing CSV data...</p>
      </div>
    );
  }

  return (
    <>
      {/* Schedule Builder Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowScheduleModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start space-x-3 mb-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Schedule Format Issues Detected
                </h3>
                <p className="text-sm text-gray-600">
                  Some schedule blocks in your CSV don&apos;t match the required format.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-gray-900 mb-2">
                Required Format:
              </p>
              <code className="text-xs bg-white px-2 py-1 rounded border block mb-2">
                Day HH:MM-HH:MM; Day HH:MM-HH:MM
              </code>
              <p className="text-xs text-gray-600">
                Example: Mon 09:00-17:00; Tue 09:00-17:00
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-700">
                We have a <span className="font-semibold">Schedule Builder tool</span> that helps you create properly formatted schedule blocks with an easy visual interface.
              </p>

              <div className="flex space-x-3">
                <Link
                  href={`/schedule-builder?locationId=${locationId}`}
                  className="flex-1 bg-brand-yellow hover:bg-yellow-500 text-brand-navy font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Clock className="w-4 h-4" />
                  <span>Open Schedule Builder</span>
                </Link>

                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Continue Reviewing
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                You can also find the Schedule Builder in the main navigation menu
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto relative">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-brand-navy mb-2">Import Preview</h1>
          <p className="text-muted-foreground">
            Review your calendar data and branding before importing.
          </p>
        </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-brand-navy">{csvRows.length}</div>
          <div className="text-sm text-muted-foreground">Total Rows</div>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{validRows}</div>
          <div className="text-sm text-muted-foreground">Valid</div>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{totalWarnings}</div>
          <div className="text-sm text-muted-foreground">Warnings</div>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{totalErrors}</div>
          <div className="text-sm text-muted-foreground">Errors</div>
        </div>
      </div>

        {/* Schedule Blocks Helper Message */}
        {hasScheduleBlockErrors && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-amber-900 mb-1">Schedule Blocks Format Issues Detected</h3>
                <p className="text-sm text-amber-700 mb-2">
                  Some of your schedule blocks don&apos;t match the required format. Use our Schedule Builder to create properly formatted schedule blocks.
                </p>
                <Link
                  href={`/schedule-builder?locationId=${locationId}`}
                  className="inline-flex items-center space-x-2 text-sm font-medium text-amber-900 hover:text-amber-700 underline"
                >
                  <span>Open Schedule Builder</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

      {/* Preview Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calendar</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branding</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Schedule</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Settings</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issues</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {previewRows.map((previewRow) => (
                <tr key={previewRow.index} className={
                  previewRow.errors.length > 0 ? 'bg-red-50' : 
                  previewRow.warnings.length > 0 ? 'bg-yellow-50' : ''
                }>
                  {/* Status */}
                  <td className="px-4 py-3">
                    {previewRow.errors.length > 0 ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : previewRow.warnings.length > 0 ? (
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </td>

                  {/* Calendar Info */}
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">{previewRow.row.calendar_name}</div>
                      <div className="text-sm text-gray-500">
                        Slug: {previewRow.payload?.slug || 'N/A'}
                      </div>
                      {previewRow.row.calendar_group && (
                        <div className="text-xs text-blue-600">
                          Group: {previewRow.row.calendar_group}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Branding */}
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: previewRow.branding.primaryColor }}
                        title={`Primary: ${previewRow.branding.primaryColor}`}
                      />
                      <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: previewRow.branding.backgroundColor }}
                        title={`Background: ${previewRow.branding.backgroundColor}`}
                      />
                      <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                        {previewRow.branding.buttonText}
                      </div>
                    </div>
                  </td>

                  {/* Schedule */}
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <div className="font-medium">Schedule Blocks</div>
                      <div className="text-xs text-gray-500">{previewRow.row.schedule_blocks}</div>
                    </div>
                  </td>

                  {/* Settings */}
                  <td className="px-4 py-3">
                    <div className="text-xs space-y-1">
                      <div>Duration: {previewRow.row.class_duration_minutes}min</div>
                      <div>Interval: {previewRow.row.slot_interval_minutes}min</div>
                      <div>Notice: {previewRow.row.min_scheduling_notice_days}d</div>
                      <div>Max/day: {previewRow.row.max_bookings_per_day}</div>
                      <div>Timezone: {previewRow.branding.timezone}</div>
                    </div>
                  </td>

                  {/* Issues */}
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {previewRow.errors.map((error, idx) => (
                        <div key={idx} className="text-xs text-red-600">
                          <div className="flex items-start">
                            <XCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                            <div>
                              <span>{error.message}</span>
                              {(error.field === 'schedule_blocks' || error.field === 'schedule') && (
                                <div className="mt-1">
                                  <Link
                                    href={`/schedule-builder?locationId=${locationId}`}
                                    className="text-red-700 hover:text-red-800 underline inline-flex items-center"
                                  >
                                    <span>Use Schedule Builder</span>
                                    <ExternalLink className="w-3 h-3 ml-1" />
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {previewRow.warnings.map((warning, idx) => (
                        <div key={idx} className="text-xs text-yellow-600 flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {warning.message}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Mapping
        </Button>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            {validRows} of {csvRows.length} rows ready to import
          </div>
          <Button
            onClick={onProceed}
            disabled={totalErrors > 0 || validRows === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Import {validRows} Calendars
          </Button>
        </div>
      </div>

      {totalErrors > 0 && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
            <h3 className="font-medium text-red-800">Cannot proceed with errors</h3>
          </div>
          <p className="text-sm text-red-700 mt-1">
            Please fix the {totalErrors} error(s) in your CSV data before importing.
          </p>
        </div>
      )}
      </div>
    </>
  );
}
