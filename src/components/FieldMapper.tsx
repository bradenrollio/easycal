'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { clsx } from 'clsx';

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
    field: 'schedule_blocks',
    required: true,
    description: 'Schedule times - Format: "Day HH:MM-HH:MM" separated by semicolons. Example: "Mon 09:00-17:00; Tue 09:00-17:00; Wed 09:00-17:00". Days: Mon, Tue, Wed, Thu, Fri, Sat, Sun.',
  },
  {
    field: 'slot_interval_minutes',
    required: true,
    description: 'Time slot interval in minutes (e.g., 15, 30, 60)',
  },
  {
    field: 'class_duration_minutes',
    required: true,
    description: 'Duration of each session in minutes',
  },
  {
    field: 'min_scheduling_notice_days',
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
  {
    field: 'button_text',
    required: false,
    description: 'Custom button text for calendar (e.g., "Book Now", "Reserve Spot")',
  },
  {
    field: 'primary_color_hex',
    required: false,
    description: 'Primary color in hex format (e.g., #FFC300)',
  },
  {
    field: 'background_color_hex',
    required: false,
    description: 'Background color in hex format (e.g., #FFFFFF)',
  },
  {
    field: 'calendar_purpose',
    required: false,
    description: 'Purpose of calendar (trial, regular, makeup)',
  },
];

// Auto-detection patterns for field mapping
const AUTO_DETECT_PATTERNS: Record<string, RegExp[]> = {
  calendar_name: [/^(calendar[_\s]?)?name$/i, /^title$/i, /^class[_\s]?name$/i],
  class_description: [/^description$/i, /^class[_\s]?description$/i, /^desc$/i],
  calendar_group: [/^(calendar[_\s]?)?group$/i, /^category$/i, /^group[_\s]?name$/i],
  custom_url: [/^(custom[_\s]?)?url$/i, /^slug$/i, /^path$/i],
  schedule_blocks: [/^schedule[_\s]?(blocks?|times?)$/i, /^times?$/i, /^schedule$/i, /^day([_\s]?of[_\s]?week)?$/i, /^weekday$/i, /^dow$/i, /^time([_\s]?of[_\s]?day)?$/i, /^start[_\s]?time$/i, /^time$/i],
  slot_interval_minutes: [/^slot[_\s]?interval([_\s]?minutes?)?$/i, /^interval$/i, /^slot[_\s]?duration$/i],
  class_duration_minutes: [/^(class[_\s]?)?duration([_\s]?minutes?)?$/i, /^length$/i, /^session[_\s]?duration$/i],
  min_scheduling_notice_days: [/^min([_\s]?scheduling)?[_\s]?notice([_\s]?days?)?$/i, /^min[_\s]?notice$/i, /^advance[_\s]?notice$/i],
  max_bookings_per_day: [/^max[_\s]?bookings?([_\s]?per[_\s]?day)?$/i, /^daily[_\s]?limit$/i, /^max[_\s]?daily$/i],
  spots_per_booking: [/^spots?([_\s]?per[_\s]?booking)?$/i, /^capacity$/i, /^max[_\s]?participants$/i],
  button_text: [/^button[_\s]?text$/i, /^cta[_\s]?text$/i, /^button[_\s]?label$/i],
  primary_color_hex: [/^primary[_\s]?color([_\s]?hex)?$/i, /^main[_\s]?color$/i, /^brand[_\s]?color$/i],
  background_color_hex: [/^background[_\s]?color([_\s]?hex)?$/i, /^bg[_\s]?color$/i, /^secondary[_\s]?color$/i],
  calendar_purpose: [/^(calendar[_\s]?)?purpose$/i, /^type$/i, /^category$/i],
};

function autoDetectMapping(csvColumns: CSVColumn[]): Record<string, number | null> {
  const detectedMappings: Record<string, number | null> = {};
  
  // Initialize all fields to null
  CALENDAR_FIELDS.forEach(field => {
    detectedMappings[field.field] = null;
  });
  
  // Try to match CSV columns to fields
  csvColumns.forEach((column, index) => {
    const normalizedColumnName = column.name.trim();
    
    // Check each field's patterns
    for (const [fieldName, patterns] of Object.entries(AUTO_DETECT_PATTERNS)) {
      // Skip if already mapped
      if (detectedMappings[fieldName] !== null) continue;
      
      // Check if any pattern matches
      const matches = patterns.some(pattern => pattern.test(normalizedColumnName));
      if (matches) {
        detectedMappings[fieldName] = index;
        break; // Stop checking other fields for this column
      }
    }
  });
  
  return detectedMappings;
}

export function FieldMapper({ csvColumns, onMappingChange, initialMappings = {} }: FieldMapperProps) {
  const [mappings, setMappings] = useState<Record<string, number | null>>(initialMappings);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [hasAutoDetected, setHasAutoDetected] = useState(false);

  // Auto-detect mappings on first load
  useEffect(() => {
    if (csvColumns.length > 0 && !hasAutoDetected && Object.keys(initialMappings).length === 0) {
      const autoMappings = autoDetectMapping(csvColumns);
      setMappings(autoMappings);
      setHasAutoDetected(true);
    }
  }, [csvColumns, hasAutoDetected, initialMappings]);

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
    // Check all required fields are mapped
    return CALENDAR_FIELDS
      .filter(f => f.required)
      .every(field => mappings[field.field] !== null && mappings[field.field] !== undefined);
  };

  const resetToAutoDetect = () => {
    const autoMappings = autoDetectMapping(csvColumns);
    setMappings(autoMappings);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium text-blue-900 mb-2">Field Mapping Instructions</h3>
            <p className="text-sm text-blue-700">
              Map each CSV column to the corresponding calendar field. Auto-detection has been applied based on column names.
            </p>
            <p className="text-xs text-blue-600 mt-2">
              <strong>Note:</strong> All calendars are automatically created as &quot;Event&quot; type calendars. You don&apos;t need to specify calendar type in your CSV.
            </p>
          </div>
          <button
            onClick={resetToAutoDetect}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Auto-Detect Again
          </button>
        </div>
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

      {/* Missing Fields Section */}
      {!isValid() && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h3 className="font-medium text-amber-900 mb-2">Missing Required Fields</h3>
          <p className="text-sm text-amber-700 mb-3">
            Please map the following required fields to enable the Review Import button:
          </p>
          <ul className="space-y-1">
            {CALENDAR_FIELDS
              .filter(f => f.required && (mappings[f.field] === null || mappings[f.field] === undefined))
              .map(field => (
                <li key={field.field} className="flex items-start">
                  <span className="text-amber-600 mr-2">•</span>
                  <div>
                    <span className="font-medium text-amber-900">
                      {field.field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <span className="text-sm text-amber-700 ml-2">
                      - {field.description}
                    </span>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Success Message */}
      {isValid() && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-600 mr-2" />
            <div>
              <h3 className="font-medium text-green-900">All Required Fields Mapped</h3>
              <p className="text-sm text-green-700 mt-1">
                Your field mappings are complete. You can now proceed to review the import.
              </p>
            </div>
          </div>
        </div>
      )}

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