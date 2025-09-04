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
    field: 'calendar_type',
    required: true,
    description: 'Calendar type (must be "Event Calendar")',
  },
  {
    field: 'calendar_name',
    required: true,
    description: 'The display name for the calendar (e.g., class name)',
  },
  {
    field: 'class_description',
    required: false,
    description: 'Brief description of the class or service',
  },
  {
    field: 'calendar_group',
    required: false,
    description: 'Group/category to organize calendars (will be created if needed)',
  },
  {
    field: 'custom_url',
    required: false,
    description: 'Custom URL slug (auto-generated if not provided)',
  },
  {
    field: 'day_of_week',
    required: true,
    description: 'Day of the week (Monday, Tuesday, etc.)',
  },
  {
    field: 'time_of_week',
    required: true,
    description: 'Time of day in 24-hour format (e.g., 09:00, 14:30)',
  },
  {
    field: 'slot_interval',
    required: true,
    description: 'Time slot interval in minutes (e.g., 30, 60)',
  },
  {
    field: 'class_duration',
    required: true,
    description: 'Duration of each session in minutes',
  },
  {
    field: 'min_scheduling_notice',
    required: true,
    description: 'Minimum days notice required for booking',
  },
  {
    field: 'max_bookings_per_day',
    required: true,
    description: 'Maximum number of bookings allowed per day',
  },
  {
    field: 'spots_per_booking',
    required: false,
    description: 'Number of spots available per time slot (default: 1)',
  },
];

export function FieldMapper({ csvColumns, onMappingChange, initialMappings = {} }: FieldMapperProps) {
  const [mappings, setMappings] = useState<Record<string, number | null>>(initialMappings);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    onMappingChange(mappings);
  }, [mappings, onMappingChange]);

  const handleFieldMapping = (field: string, columnIndex: number | null) => {
    setMappings(prev => ({
      ...prev,
      [field]: columnIndex,
    }));
    setOpenDropdown(null);
  };

  const getSelectedColumn = (field: string) => {
    const columnIndex = mappings[field];
    return columnIndex !== null && columnIndex !== undefined 
      ? csvColumns[columnIndex] 
      : null;
  };

  const isValid = () => {
    const requiredFields = CALENDAR_FIELDS.filter(f => f.required);
    return requiredFields.every(field => mappings[field.field] !== null && mappings[field.field] !== undefined);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-blue-900 mb-2">Field Mapping Instructions</h3>
        <p className="text-sm text-blue-700">
          Map each CSV column to the corresponding calendar field. Required fields must be mapped to proceed.
        </p>
      </div>

      <div className="space-y-4">
        {CALENDAR_FIELDS.map((field) => {
          const selectedColumn = getSelectedColumn(field.field);
          const isRequired = field.required;
          
          return (
            <div
              key={field.field}
              className={clsx(
                'border rounded-lg p-4 transition-colors',
                isRequired && !selectedColumn ? 'border-red-200 bg-red-50' : 'border-border bg-white'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-medium text-brand-navy">
                      {field.field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h3>
                    {isRequired && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {field.description}
                  </p>
                </div>

                <div className="relative ml-4">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === field.field ? null : field.field)}
                    className={clsx(
                      'flex items-center justify-between w-48 px-3 py-2 text-left border rounded-md transition-colors',
                      selectedColumn
                        ? 'border-green-300 bg-green-50 text-green-800'
                        : 'border-border bg-background hover:bg-accent'
                    )}
                  >
                    <span className="truncate">
                      {selectedColumn ? selectedColumn.name : 'Select column...'}
                    </span>
                    <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
                  </button>

                  {openDropdown === field.field && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                      <button
                        onClick={() => handleFieldMapping(field.field, null)}
                        className="w-full px-3 py-2 text-left hover:bg-accent transition-colors text-muted-foreground"
                      >
                        (No mapping)
                      </button>
                      {csvColumns.map((column, index) => (
                        <button
                          key={index}
                          onClick={() => handleFieldMapping(field.field, index)}
                          className={clsx(
                            'w-full px-3 py-2 text-left hover:bg-accent transition-colors flex items-center justify-between',
                            selectedColumn?.index === index && 'bg-green-50 text-green-800'
                          )}
                        >
                          <span className="truncate">{column.name}</span>
                          {selectedColumn?.index === index && (
                            <Check className="w-4 h-4 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedColumn && (
                <div className="mt-3 p-3 bg-gray-50 rounded border">
                  <p className="text-xs text-muted-foreground mb-1">Sample values:</p>
                  <p className="text-sm font-mono">
                    {selectedColumn.sampleValues.slice(0, 3).join(', ')}
                    {selectedColumn.sampleValues.length > 3 && '...'}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-6 border-t">
        <div className="text-sm text-muted-foreground">
          {CALENDAR_FIELDS.filter(f => f.required && mappings[f.field] !== null && mappings[f.field] !== undefined).length} of {CALENDAR_FIELDS.filter(f => f.required).length} required fields mapped
        </div>
        <div className={clsx(
          'text-sm font-medium',
          isValid() ? 'text-green-600' : 'text-red-600'
        )}>
          {isValid() ? '✓ Ready to proceed' : '✗ Missing required mappings'}
        </div>
      </div>
    </div>
  );
}