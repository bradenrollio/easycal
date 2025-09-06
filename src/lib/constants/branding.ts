import { BrandConfig, CSVCalendarRow, CalendarPayload, CalendarDefaults, ScheduleBlock } from '@/types/brand';
import { parseScheduleBlocks, slugify } from '../utils/validation';

// Apply branding rules with precedence
export function applyBranding(
  row: CSVCalendarRow, 
  brandConfig: BrandConfig,
  defaults?: CalendarDefaults,
  locationTz?: string
): { primaryColor: string; backgroundColor: string; buttonText: string; timezone: string } {
  const result = {
    primaryColorHex: row.primary_color_hex || brandConfig.primaryColorHex,
    backgroundColorHex: row.background_color_hex || brandConfig.backgroundColorHex,
    buttonText: row.button_text || brandConfig.defaultButtonText,
  };
  
  return {
    primaryColor: result.primaryColorHex,
    backgroundColor: result.backgroundColorHex,
    buttonText: result.buttonText,
    timezone: locationTz || brandConfig.defaultTimezone || 'UTC'
  };
}

// Convert CSV row to GHL calendar payload
export function buildCalendarPayload(
  row: CSVCalendarRow,
  brandConfig: BrandConfig,
  defaults?: CalendarDefaults,
  locationTz?: string,
  groupId?: string
): CalendarPayload {
  const branding = applyBranding(row, brandConfig, defaults, locationTz);
  
  // Generate slug
  const slug = row.custom_url || slugify(row.calendar_name);
  
  // Parse availability from schedule blocks or day_of_week/time_of_week
  let blocks: ScheduleBlock[];
  if (row.schedule_blocks) {
    blocks = parseScheduleBlocks(row.schedule_blocks);
  } else if (row.day_of_week && row.time_of_week) {
    // Create schedule_blocks from day_of_week and time_of_week
    const duration = parseInt(row.class_duration_minutes) || 60;
    const [hours, minutes] = row.time_of_week.split(':').map(Number);
    const endHours = Math.floor((hours * 60 + minutes + duration) / 60);
    const endMinutes = (hours * 60 + minutes + duration) % 60;
    const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    
    blocks = [{
      day: row.day_of_week.charAt(0).toUpperCase() + row.day_of_week.slice(1).toLowerCase(),
      start: row.time_of_week,
      end: endTime
    }];
  } else {
    blocks = []; // This shouldn't happen if validation passes
  }
  
  const availability: CalendarPayload['availability'] = {
    weekly: blocks.map(block => ({
      day: block.day, // Keep full day format
      start: block.start,
      end: block.end
    })),
    slotInterval: parseInt(row.slot_interval_minutes) || defaults?.defaultSlotDurationMinutes || 30
  };
  
  return {
    locationId: brandConfig.locationId,
    name: row.calendar_name,
    description: row.class_description,
    widgetType: 'default',
    customizations: {
      primaryColor: branding.primaryColor,
      backgroundColor: branding.backgroundColor,
      buttonText: branding.buttonText
    },
    duration: parseInt(row.class_duration_minutes),
    timeZone: branding.timezone,
    availability,
    minSchedulingNotice: parseInt(row.min_scheduling_notice_days) || defaults?.minSchedulingNoticeDays || 1,
    maxBookingsPerDay: parseInt(row.max_bookings_per_day),
    groupId,
    slug
  };
}

// Helper function to add minutes to time string
function addMinutesToTime(timeStr: string, minutes: number): string {
  const [hours, mins] = timeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

// Generate idempotency key for a calendar row
export function generateIdempotencyKey(
  locationId: string, 
  calendarName: string, 
  customUrl?: string
): string {
  const input = `${locationId}:${calendarName}:${customUrl || ''}`;
  
  // Simple hash function (in production, use crypto.subtle.digest)
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

// Normalize day names for consistency
export function normalizeDay(dayToken: string): string {
  const dayMap: Record<string, string> = {
    'mon': 'Monday', 'monday': 'Monday',
    'tue': 'Tuesday', 'tuesday': 'Tuesday', 'tues': 'Tuesday',
    'wed': 'Wednesday', 'wednesday': 'Wednesday',
    'thu': 'Thursday', 'thursday': 'Thursday', 'thurs': 'Thursday',
    'fri': 'Friday', 'friday': 'Friday',
    'sat': 'Saturday', 'saturday': 'Saturday',
    'sun': 'Sunday', 'sunday': 'Sunday'
  };
  
  return dayMap[dayToken.toLowerCase()] || dayToken;
}
