export interface BrandConfig {
  locationId: string;
  primaryColorHex: string;        // e.g. "#FFC300"
  backgroundColorHex: string;     // e.g. "#FFFFFF"
  defaultButtonText: string;      // e.g. "Book Now"
  defaultTimezone?: string;       // IANA; optional—if not set, use location timezone
  coverImageUrl?: string;         // optional (for Group view / your UI), not used by GHL API
  updatedAt: string;              // ISO
}

export interface CalendarDefaults {
  locationId: string;
  defaultSlotDurationMinutes: number; // e.g. 30
  minSchedulingNoticeDays: number;    // e.g. 1
  bookingWindowDays: number;          // e.g. 30 (if your flow uses it)
  spotsPerBooking: number;            // e.g. 1 (maps to max bookings per slot if needed)
  defaultTimezone?: string;           // optional; same precedence as in BrandConfig
  updatedAt: string;                  // ISO
}

export interface CSVCalendarRow {
  // Required fields
  calendar_type: string;
  calendar_name: string;
  slot_interval_minutes: string;
  class_duration_minutes: string;
  min_scheduling_notice_days: string;
  max_bookings_per_day: string;
  
  // Schedule fields - either schedule_blocks OR day_of_week + time_of_week
  schedule_blocks?: string;
  day_of_week?: string;
  time_of_week?: string;
  
  // Optional fields
  calendar_group?: string;
  class_description?: string;
  custom_url?: string;
  button_text?: string;
  primary_color_hex?: string;
  background_color_hex?: string;
  calendar_purpose?: 'trial' | 'makeup' | 'regular';
}

export interface CalendarPayload {
  locationId: string;
  name: string;
  description?: string;
  widgetType: 'default';
  customizations: {
    primaryColor: string;
    backgroundColor: string;
    buttonText: string;
  };
  duration: number;
  timeZone: string;
  availability: {
    weekly: Array<{
      day: string;
      start: string;
      end: string;
    }>;
    slotInterval: number;
  };
  minSchedulingNotice: number;
  maxBookingsPerDay: number;
  groupId?: string;
  slug: string;
}

export interface ScheduleBlock {
  day: string;
  start: string;
  end: string;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ImportResult {
  success: boolean;
  calendarId?: string;
  slug: string;
  name: string;
  error?: string;
  warnings?: string[];
}
