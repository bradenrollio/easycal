/**
 * @fileoverview Validation utilities for EasyCal application
 * @description Provides comprehensive validation functions for user inputs,
 * CSV data, brand configurations, and API payloads.
 * @author AI Assistant
 */

import { BrandConfig, CSVCalendarRow, ValidationError, ScheduleBlock } from '@/types/brand';

/**
 * Validates hex color format
 * @param color - Color string to validate
 * @returns True if color is valid 6-digit hex format (#RRGGBB)
 * 
 * @example
 * ```typescript
 * validateColor('#FF0000') // true
 * validateColor('#ff0000') // true  
 * validateColor('#F00')    // false (too short)
 * validateColor('red')     // false (not hex)
 * ```
 */
export function validateColor(color: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(color);
}

/**
 * Validates button text length and content
 * @param text - Button text to validate
 * @returns True if text is between 3-30 characters
 * 
 * @example
 * ```typescript
 * validateButtonText('Book Now')     // true
 * validateButtonText('Hi')          // false (too short)
 * validateButtonText('Very long button text that exceeds limit') // false (too long)
 * ```
 */
export function validateButtonText(text: string): boolean {
  return text.length >= 3 && text.length <= 30;
}

/**
 * Validates IANA timezone format using browser API
 * @param timezone - Timezone string to validate (e.g., 'America/New_York')
 * @returns True if timezone is valid IANA format
 * 
 * @example
 * ```typescript
 * validateTimezone('America/New_York')  // true
 * validateTimezone('Europe/London')     // true
 * validateTimezone('Invalid/Zone')      // false
 * validateTimezone('EST')               // false (not IANA format)
 * ```
 */
export function validateTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates brand configuration object
 * @param config - Partial brand configuration to validate
 * @returns Array of validation error messages (empty if valid)
 * 
 * @example
 * ```typescript
 * const config = {
 *   locationId: 'loc123',
 *   primaryColorHex: '#FF0000',
 *   backgroundColorHex: '#FFFFFF',
 *   defaultButtonText: 'Book Now'
 * };
 * const errors = validateBrandConfig(config); // []
 * ```
 */
export function validateBrandConfig(config: Partial<BrandConfig>): string[] {
  const errors: string[] = [];
  
  if (!config.locationId) {
    errors.push('Location ID is required');
  }
  
  if (!config.primaryColorHex || !validateColor(config.primaryColorHex)) {
    errors.push('Primary color must be a valid hex color (#RRGGBB)');
  }
  
  if (!config.backgroundColorHex || !validateColor(config.backgroundColorHex)) {
    errors.push('Background color must be a valid hex color (#RRGGBB)');
  }
  
  if (!config.defaultButtonText || !validateButtonText(config.defaultButtonText)) {
    errors.push('Default button text must be 3-30 characters');
  }
  
  if (config.defaultTimezone && !validateTimezone(config.defaultTimezone)) {
    errors.push('Invalid timezone format');
  }
  
  return errors;
}

// Parse schedule blocks: "Mon 09:00-10:00; Wed 14:30-15:30"
export function parseScheduleBlocks(scheduleStr: string): ScheduleBlock[] {
  const blocks: ScheduleBlock[] = [];
  
  if (!scheduleStr?.trim()) return blocks;
  
  const dayMap: Record<string, string> = {
    'mon': 'Monday', 'monday': 'Monday',
    'tue': 'Tuesday', 'tuesday': 'Tuesday', 'tues': 'Tuesday',
    'wed': 'Wednesday', 'wednesday': 'Wednesday',
    'thu': 'Thursday', 'thursday': 'Thursday', 'thurs': 'Thursday',
    'fri': 'Friday', 'friday': 'Friday',
    'sat': 'Saturday', 'saturday': 'Saturday',
    'sun': 'Sunday', 'sunday': 'Sunday'
  };
  
  const segments = scheduleStr.split(';').map(s => s.trim());
  
  for (const segment of segments) {
    if (!segment) continue;
    
    // Match pattern: "Mon 09:00-10:00" or "Monday 09:00-10:00"
    const match = segment.match(/^(\w+)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/);
    
    if (match) {
      const [, dayToken, start, end] = match;
      const normalizedDay = dayToken ? dayMap[dayToken.toLowerCase()] : undefined;
      
      if (normalizedDay && start && end && isValidTime(start) && isValidTime(end)) {
        blocks.push({
          day: normalizedDay,
          start,
          end
        });
      }
    }
  }
  
  return blocks;
}

/**
 * Validates time format (HH:MM)
 * @param time - Time string to validate
 * @returns True if time is valid 24-hour format
 */
export function isValidTime(time: string): boolean {
  const match = time.match(/^(\d{2}):(\d{2})$/);
  if (!match) return false;
  
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

// Slugify calendar name
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')         // Replace spaces with hyphens
    .replace(/-+/g, '-')          // Collapse multiple hyphens
    .replace(/^-|-$/g, '');       // Remove leading/trailing hyphens
}

// Generate unique slug
export async function generateUniqueSlug(
  baseName: string, 
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  let slug = slugify(baseName);
  let counter = 1;
  
  while (await checkExists(slug)) {
    counter++;
    slug = `${slugify(baseName)}-${counter}`;
  }
  
  return slug;
}

// Validate CSV row
export function validateCSVRow(
  row: CSVCalendarRow, 
  rowIndex: number, 
  brandConfig?: BrandConfig
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Calendar type is always 'event' - no need to validate, it's set automatically
  
  if (!row.calendar_name?.trim()) {
    errors.push({
      row: rowIndex,
      field: 'calendar_name',
      message: 'Calendar name is required',
      severity: 'error'
    });
  }
  
  // Validate schedule - either schedule_blocks OR day_of_week + time_of_week
  const hasScheduleBlocks = row.schedule_blocks?.trim();
  const hasDayAndTime = row.day_of_week?.trim() && row.time_of_week?.trim();
  
  if (!hasScheduleBlocks && !hasDayAndTime) {
    errors.push({
      row: rowIndex,
      field: 'schedule',
      message: 'Either schedule_blocks OR both day_of_week and time_of_week are required',
      severity: 'error'
    });
  } else if (hasScheduleBlocks) {
    const blocks = parseScheduleBlocks(row.schedule_blocks!);
    if (blocks.length === 0) {
      errors.push({
        row: rowIndex,
        field: 'schedule_blocks',
        message: 'Invalid schedule blocks format. Use "Mon 09:00-10:00; Wed 14:30-15:30"',
        severity: 'error'
      });
    }
  } else if (hasDayAndTime) {
    // Validate time format for time_of_week
    if (!isValidTime(row.time_of_week!)) {
      errors.push({
        row: rowIndex,
        field: 'time_of_week',
        message: 'Invalid time format. Use HH:MM format (e.g., 09:00, 14:30)',
        severity: 'error'
      });
    }
    
    // Validate day of week
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayCapitalized = row.day_of_week!.charAt(0).toUpperCase() + row.day_of_week!.slice(1).toLowerCase();
    if (!validDays.includes(dayCapitalized)) {
      errors.push({
        row: rowIndex,
        field: 'day_of_week',
        message: 'Day must be one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday',
        severity: 'error'
      });
    }
  }
  
  // Validate numeric fields
  const slotInterval = parseInt(row.slot_interval_minutes);
  const classDuration = parseInt(row.class_duration_minutes);
  const minNotice = parseInt(row.min_scheduling_notice_days);
  const maxBookings = parseInt(row.max_bookings_per_day);
  
  if (isNaN(slotInterval) || slotInterval <= 0) {
    errors.push({
      row: rowIndex,
      field: 'slot_interval_minutes',
      message: 'Slot interval must be a positive number',
      severity: 'error'
    });
  }
  
  if (isNaN(classDuration) || classDuration <= 0) {
    errors.push({
      row: rowIndex,
      field: 'class_duration_minutes',
      message: 'Class duration must be a positive number',
      severity: 'error'
    });
  }
  
  if (isNaN(minNotice) || minNotice < 0) {
    errors.push({
      row: rowIndex,
      field: 'min_scheduling_notice_days',
      message: 'Minimum scheduling notice must be 0 or greater',
      severity: 'error'
    });
  }
  
  if (isNaN(maxBookings) || maxBookings <= 0) {
    errors.push({
      row: rowIndex,
      field: 'max_bookings_per_day',
      message: 'Max bookings per day must be a positive number',
      severity: 'error'
    });
  }
  
  // Check if duration is divisible by slot interval
  if (!isNaN(slotInterval) && !isNaN(classDuration) && classDuration % slotInterval !== 0) {
    errors.push({
      row: rowIndex,
      field: 'class_duration_minutes',
      message: `Class duration (${classDuration}) should be divisible by slot interval (${slotInterval})`,
      severity: 'warning'
    });
  }
  
  // Validate optional color overrides
  if (row.primary_color_hex && !validateColor(row.primary_color_hex)) {
    errors.push({
      row: rowIndex,
      field: 'primary_color_hex',
      message: 'Primary color must be a valid hex color (#RRGGBB)',
      severity: 'error'
    });
  }
  
  if (row.background_color_hex && !validateColor(row.background_color_hex)) {
    errors.push({
      row: rowIndex,
      field: 'background_color_hex',
      message: 'Background color must be a valid hex color (#RRGGBB)',
      severity: 'error'
    });
  }
  
  // Note: Timezone is now handled via settings, not CSV columns
  
  // Validate button text override
  if (row.button_text && !validateButtonText(row.button_text)) {
    errors.push({
      row: rowIndex,
      field: 'button_text',
      message: 'Button text must be 3-30 characters',
      severity: 'error'
    });
  }
  
  return errors;
}
