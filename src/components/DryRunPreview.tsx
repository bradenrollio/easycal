'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Palette, Calendar, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CSVCalendarRow, BrandConfig, ValidationError, CalendarPayload } from '@/types/brand';
import { validateCSVRow } from '@/lib/validators';
import { buildCalendarPayload, applyBranding } from '@/lib/branding';

interface DryRunPreviewProps {
  csvRows: CSVCalendarRow[];
  brandConfig: BrandConfig;
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
  };
}

export function DryRunPreview({ csvRows, brandConfig, onProceed, onBack }: DryRunPreviewProps) {
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    processRows();
  }, [csvRows, brandConfig]);

  const processRows = async () => {
    setIsProcessing(true);
    
    const processed: PreviewRow[] = [];
    
    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i];
      const validationErrors = validateCSVRow(row, i, brandConfig);
      const errors = validationErrors.filter(e => e.severity === 'error');
      const warnings = validationErrors.filter(e => e.severity === 'warning');
      
      const branding = applyBranding(row, brandConfig);
      
      try {
        const payload = buildCalendarPayload(row, brandConfig);
        
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
          payload: null,
          errors: [...errors, {
            row: i,
            field: 'general',
            message: `Failed to build payload: ${error.message}`,
            severity: 'error'
          }],
          warnings,
          branding
        });
      }
    }
    
    setPreviewRows(processed);
    setIsProcessing(false);
  };

  const totalErrors = previewRows.reduce((sum, row) => sum + row.errors.length, 0);
  const totalWarnings = previewRows.reduce((sum, row) => sum + row.warnings.length, 0);
  const validRows = previewRows.filter(row => row.errors.length === 0).length;

  if (isProcessing) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-yellow mx-auto mb-4"></div>
        <p className="text-muted-foreground">Processing CSV data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
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
                      {previewRow.row.schedule_blocks ? (
                        <div>
                          <div className="font-medium">Multi-block</div>
                          <div className="text-xs text-gray-500">{previewRow.row.schedule_blocks}</div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium">{previewRow.row.day_of_week}</div>
                          <div className="text-xs text-gray-500">{previewRow.row.time_of_week}</div>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Settings */}
                  <td className="px-4 py-3">
                    <div className="text-xs space-y-1">
                      <div>Duration: {previewRow.row.class_duration}min</div>
                      <div>Interval: {previewRow.row.slot_interval}min</div>
                      <div>Notice: {previewRow.row.min_scheduling_notice}d</div>
                      <div>Max/day: {previewRow.row.max_bookings_per_day}</div>
                    </div>
                  </td>

                  {/* Issues */}
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {previewRow.errors.map((error, idx) => (
                        <div key={idx} className="text-xs text-red-600 flex items-center">
                          <XCircle className="w-3 h-3 mr-1" />
                          {error.message}
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
  );
}
