'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/button';

interface CSVColumn {
  name: string;
  index: number;
  sampleValues: string[];
}

interface FieldMapping {
  field: string;
  columnIndex: number | null;
  required: boolean;
  description: string;
}

interface FieldMapperProps {
  csvColumns: CSVColumn[];
  onMappingChange: (mappings: Record<string, number | null>) => void;
  initialMappings?: Record<string, number | null>;
}

const CALENDAR_FIELDS: Omit<FieldMapping, 'columnIndex'>[] = [
  {
    field: 'calendar_name',
    required: true,
    description: 'Display name for the calendar',
  },
  {
    field: 'slug',
    required: false,
    description: 'URL-friendly identifier (auto-generated if empty)',
  },
  {
    field: 'group_id',
    required: false,
    description: 'Group to organize calendars',
  },
  {
    field: 'availability_timezone',
    required: true,
    description: 'Timezone for calendar availability',
  },
  {
    field: 'slot_duration_minutes',
    required: true,
    description: 'Duration of each time slot in minutes',
  },
  {
    field: 'min_notice_minutes',
    required: true,
    description: 'Minimum notice required for bookings',
  },
  {
    field: 'booking_window_days',
    required: true,
    description: 'How many days in advance bookings are allowed',
  },
  {
    field: 'is_active',
    required: true,
    description: 'Whether the calendar is active for bookings',
  },
];

export function FieldMapper({
  csvColumns,
  onMappingChange,
  initialMappings = {},
}: FieldMapperProps) {
  const [mappings, setMappings] = useState<Record<string, number | null>>(initialMappings);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  useEffect(() => {
    onMappingChange(mappings);
  }, [mappings, onMappingChange]);

  const handleFieldMapping = (field: string, columnIndex: number | null) => {
    const newMappings = { ...mappings, [field]: columnIndex };
    setMappings(newMappings);
    setDropdownOpen(null);
  };

  const getColumnName = (index: number | null) => {
    if (index === null) return 'Not mapped';
    const column = csvColumns.find(col => col.index === index);
    return column ? column.name : `Column ${index + 1}`;
  };

  const getSampleValues = (index: number | null) => {
    if (index === null) return [];
    const column = csvColumns.find(col => col.index === index);
    return column ? column.sampleValues : [];
  };

  return (
    <div className="space-y-4">
      <div className="bg-muted/30 rounded-lg p-4">
        <h3 className="font-medium text-brand-navy mb-3">Map CSV Columns to Calendar Fields</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select which CSV columns correspond to each calendar field. Required fields are marked with an asterisk (*).
        </p>

        <div className="space-y-3">
          {CALENDAR_FIELDS.map((fieldConfig) => {
            const currentMapping = mappings[fieldConfig.field] ?? null;
            const isMapped = currentMapping !== null;
            const sampleValues = getSampleValues(currentMapping);

            return (
              <div key={fieldConfig.field} className="flex items-start space-x-4 p-3 bg-white rounded-lg border border-border">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <label className="font-medium text-brand-navy">
                      {fieldConfig.field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                  </div>
                  <p className="text-sm text-muted-foreground">{fieldConfig.description}</p>

                  {sampleValues.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Sample values:</p>
                      <div className="flex flex-wrap gap-1">
                        {sampleValues.slice(0, 3).map((value, idx) => (
                          <span key={idx} className="inline-block px-2 py-1 bg-muted text-xs rounded">
                            {value}
                          </span>
                        ))}
                        {sampleValues.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{sampleValues.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative min-w-[200px]">
                  <button
                    onClick={() => setDropdownOpen(
                      dropdownOpen === fieldConfig.field ? null : fieldConfig.field
                    )}
                    className={clsx(
                      'w-full flex items-center justify-between p-2 border border-border rounded-lg bg-white hover:border-brand-yellow focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-transparent transition-colors',
                      isMapped ? 'text-brand-navy' : 'text-muted-foreground'
                    )}
                  >
                    <span className="truncate">{getColumnName(currentMapping)}</span>
                    <ChevronDown className="w-4 h-4 flex-shrink-0" />
                  </button>

                  {dropdownOpen === fieldConfig.field && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                      <button
                        onClick={() => handleFieldMapping(fieldConfig.field, null)}
                        className="w-full px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none text-muted-foreground"
                      >
                        Not mapped
                      </button>

                      {csvColumns.map((column) => (
                        <button
                          key={column.index}
                          onClick={() => handleFieldMapping(fieldConfig.field, column.index)}
                          className="w-full px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none flex items-center justify-between"
                        >
                          <div>
                            <div className="font-medium">{column.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {column.sampleValues.slice(0, 2).join(', ')}
                              {column.sampleValues.length > 2 && '...'}
                            </div>
                          </div>
                          {currentMapping === column.index && (
                            <Check className="w-4 h-4 text-brand-navy" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mapping Summary */}
      <div className="bg-white rounded-lg p-4 border border-border">
        <h4 className="font-medium text-brand-navy mb-3">Mapping Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Required fields mapped:</span>
            <span className="ml-2 font-medium">
              {CALENDAR_FIELDS.filter(f => f.required && mappings[f.field] !== null).length} / {CALENDAR_FIELDS.filter(f => f.required).length}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Optional fields mapped:</span>
            <span className="ml-2 font-medium">
              {CALENDAR_FIELDS.filter(f => !f.required && mappings[f.field] !== null).length} / {CALENDAR_FIELDS.filter(f => !f.required).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
