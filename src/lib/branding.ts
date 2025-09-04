import { BrandConfig, CSVCalendarRow, CalendarPayload, ScheduleBlock } from '@/types/brand';
import { parseScheduleBlocks, slugify } from './validators';

// Apply branding rules with precedence
export function applyBranding(
  row: CSVCalendarRow, 
  brandConfig: BrandConfig
): { primaryColor: string; backgroundColor: string; buttonText: string } {
  // Primary color: row override > brand config
  const primaryColor = row.primary_color_hex || brandConfig.primaryColorHex;
  
  // Background color: row override > brand config
  const backgroundColor = row.background_color_hex || brandConfig.backgroundColorHex;
  
  // Button text: row override > purpose-specific > brand default
  let buttonText = row.button_text;
  
  if (!buttonText) {
    if (row.calendar_purpose === 'makeup') {
      buttonText = 'Schedule Make-Up';
    } else {
      buttonText = brandConfig.defaultButtonText;
    }
  }
  
  return {
    primaryColor,
    backgroundColor,
    buttonText
  };
}

// Convert CSV row to GHL calendar payload
export function buildCalendarPayload(
  row: CSVCalendarRow,
  brandConfig: BrandConfig,
  groupId?: string
): CalendarPayload {
  const branding = applyBranding(row, brandConfig);
  
  // Generate slug
  const slug = row.custom_url || slugify(row.calendar_name);
  
  // Parse availability
  let availability: CalendarPayload['availability'];
  
  if (row.schedule_blocks) {
    // Use schedule blocks if provided
    const blocks = parseScheduleBlocks(row.schedule_blocks);
    availability = {
      weekly: blocks.map(block => ({
        day: block.day.substring(0, 3), // GHL expects 3-letter day codes
        start: block.start,
        end: block.end
      })),
      slotInterval: parseInt(row.slot_interval)
    };
  } else {
    // Fallback to single day/time
    const timeRange = row.time_of_week.split('-');
    const start = timeRange[0];
    const end = timeRange[1] || addMinutesToTime(start, parseInt(row.class_duration));
    
    availability = {
      weekly: [{
        day: row.day_of_week.substring(0, 3),
        start,
        end
      }],
      slotInterval: parseInt(row.slot_interval)
    };
  }
  
  // Determine timezone
  const timezone = row.timezone || brandConfig.timezone || 'America/New_York';
  
  return {
    locationId: brandConfig.locationId,
    name: row.calendar_name,
    description: row.class_description,
    widgetType: 'default',
    customizations: branding,
    duration: parseInt(row.class_duration),
    timeZone: timezone,
    availability,
    minSchedulingNotice: parseInt(row.min_scheduling_notice),
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
