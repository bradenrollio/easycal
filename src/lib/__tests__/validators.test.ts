/**
 * @fileoverview Tests for validation utilities
 * @author AI Assistant
 */

import { describe, it, expect } from 'vitest';
import {
  validateColor,
  validateButtonText,
  validateTimezone,
  validateBrandConfig,
  parseScheduleBlocks,
  slugify,
  validateCSVRow,
} from '../utils/validation';
import { createMockBrandConfig, createMockCSVRow } from '@/test/utils';

describe('validators', () => {
  describe('validateColor', () => {
    it('should validate valid hex colors', () => {
      expect(validateColor('#FF0000')).toBe(true);
      expect(validateColor('#ff0000')).toBe(true);
      expect(validateColor('#123ABC')).toBe(true);
      expect(validateColor('#000000')).toBe(true);
      expect(validateColor('#FFFFFF')).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      expect(validateColor('#FF00')).toBe(false);     // too short
      expect(validateColor('#FF00000')).toBe(false);  // too long
      expect(validateColor('FF0000')).toBe(false);    // missing #
      expect(validateColor('#GG0000')).toBe(false);   // invalid characters
      expect(validateColor('red')).toBe(false);       // not hex
      expect(validateColor('')).toBe(false);          // empty
    });
  });

  describe('validateButtonText', () => {
    it('should validate valid button text', () => {
      expect(validateButtonText('Book')).toBe(true);
      expect(validateButtonText('Book Now')).toBe(true);
      expect(validateButtonText('Schedule Appointment')).toBe(true);
      expect(validateButtonText('A'.repeat(30))).toBe(true); // exactly 30 chars
    });

    it('should reject invalid button text', () => {
      expect(validateButtonText('Hi')).toBe(false);           // too short
      expect(validateButtonText('A'.repeat(31))).toBe(false); // too long
      expect(validateButtonText('')).toBe(false);             // empty
    });
  });

  describe('validateTimezone', () => {
    it('should validate valid IANA timezones', () => {
      expect(validateTimezone('America/New_York')).toBe(true);
      expect(validateTimezone('Europe/London')).toBe(true);
      expect(validateTimezone('Asia/Tokyo')).toBe(true);
      expect(validateTimezone('UTC')).toBe(true);
    });

    it('should reject invalid timezones', () => {
      expect(validateTimezone('Invalid/Zone')).toBe(false);
      expect(validateTimezone('EST')).toBe(false);
      expect(validateTimezone('')).toBe(false);
      expect(validateTimezone('America/NotReal')).toBe(false);
    });
  });

  describe('validateBrandConfig', () => {
    it('should validate complete valid config', () => {
      const config = createMockBrandConfig();
      const errors = validateBrandConfig(config);
      expect(errors).toEqual([]);
    });

    it('should return errors for missing required fields', () => {
      const config = createMockBrandConfig({
        locationId: '',
        primaryColorHex: '',
        backgroundColorHex: '',
        defaultButtonText: '',
      });
      
      const errors = validateBrandConfig(config);
      expect(errors).toHaveLength(4);
      expect(errors).toContain('Location ID is required');
      expect(errors).toContain('Primary color must be a valid hex color (#RRGGBB)');
      expect(errors).toContain('Background color must be a valid hex color (#RRGGBB)');
      expect(errors).toContain('Default button text must be 3-30 characters');
    });

    it('should validate optional timezone', () => {
      const config = createMockBrandConfig({
        defaultTimezone: 'Invalid/Zone',
      });
      
      const errors = validateBrandConfig(config);
      expect(errors).toContain('Invalid timezone format');
    });
  });

  describe('parseScheduleBlocks', () => {
    it('should parse valid schedule blocks', () => {
      const blocks = parseScheduleBlocks('Mon 09:00-10:00; Wed 14:30-15:30');
      expect(blocks).toEqual([
        { day: 'Monday', start: '09:00', end: '10:00' },
        { day: 'Wednesday', start: '14:30', end: '15:30' },
      ]);
    });

    it('should handle different day formats', () => {
      const blocks = parseScheduleBlocks('Monday 09:00-10:00; Tue 14:00-15:00');
      expect(blocks).toEqual([
        { day: 'Monday', start: '09:00', end: '10:00' },
        { day: 'Tuesday', start: '14:00', end: '15:00' },
      ]);
    });

    it('should return empty array for invalid format', () => {
      expect(parseScheduleBlocks('')).toEqual([]);
      expect(parseScheduleBlocks('Invalid format')).toEqual([]);
      expect(parseScheduleBlocks('Mon 25:00-26:00')).toEqual([]);
    });

    it('should handle mixed valid and invalid blocks', () => {
      const blocks = parseScheduleBlocks('Mon 09:00-10:00; Invalid; Wed 14:30-15:30');
      expect(blocks).toEqual([
        { day: 'Monday', start: '09:00', end: '10:00' },
        { day: 'Wednesday', start: '14:30', end: '15:30' },
      ]);
    });
  });

  describe('slugify', () => {
    it('should create valid slugs', () => {
      expect(slugify('Test Calendar')).toBe('test-calendar');
      expect(slugify('Yoga Class (Beginner)')).toBe('yoga-class-beginner');
      expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces');
      expect(slugify('Special-Characters!@#')).toBe('special-characters');
    });

    it('should handle edge cases', () => {
      expect(slugify('')).toBe('');
      expect(slugify('---')).toBe('');
      expect(slugify('123')).toBe('123');
      expect(slugify('A')).toBe('a');
    });
  });

  describe('validateCSVRow', () => {
    it('should validate complete valid row', () => {
      const row = createMockCSVRow();
      const errors = validateCSVRow(row, 1);
      expect(errors).toEqual([]);
    });

    it('should return errors for missing required fields', () => {
      const row = createMockCSVRow({
        calendar_type: '',
        calendar_name: '',
        schedule_blocks: '',
      });
      
      const errors = validateCSVRow(row, 1);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.field === 'calendar_type')).toBe(true);
      expect(errors.some(e => e.field === 'calendar_name')).toBe(true);
      expect(errors.some(e => e.field === 'schedule_blocks')).toBe(true);
    });

    it('should validate numeric fields', () => {
      const row = createMockCSVRow({
        slot_interval_minutes: 'invalid',
        class_duration_minutes: '-1',
        min_scheduling_notice_days: 'abc',
        max_bookings_per_day: '0',
      });
      
      const errors = validateCSVRow(row, 1);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.field === 'slot_interval_minutes')).toBe(true);
      expect(errors.some(e => e.field === 'class_duration_minutes')).toBe(true);
      expect(errors.some(e => e.field === 'min_scheduling_notice_days')).toBe(true);
      expect(errors.some(e => e.field === 'max_bookings_per_day')).toBe(true);
    });

    it('should validate optional color fields', () => {
      const row = createMockCSVRow({
        primary_color_hex: '#invalid',
        background_color_hex: 'not-hex',
      });
      
      const errors = validateCSVRow(row, 1);
      expect(errors.some(e => e.field === 'primary_color_hex')).toBe(true);
      expect(errors.some(e => e.field === 'background_color_hex')).toBe(true);
    });

    it('should generate warnings for duration/interval mismatch', () => {
      const row = createMockCSVRow({
        slot_interval_minutes: '30',
        class_duration_minutes: '45', // Not divisible by 30
      });
      
      const errors = validateCSVRow(row, 1);
      const warning = errors.find(e => e.severity === 'warning');
      expect(warning).toBeTruthy();
      expect(warning?.field).toBe('class_duration_minutes');
    });
  });
});
