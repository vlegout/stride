import { describe, it, expect } from 'vitest';
import { formatSpeed, formatDistance, formatDuration, formatDateTime, formatInterval } from '../src/utils';

describe('utils', () => {
  describe('formatSpeed', () => {
    it('should format speed with 2 decimal places and km/h unit', () => {
      expect(formatSpeed(25.5)).toBe('25.50 km/h');
      expect(formatSpeed(10.123)).toBe('10.12 km/h');
      expect(formatSpeed(0)).toBe('0.00 km/h');
    });

    it('should return empty string for null speed', () => {
      expect(formatSpeed(null as unknown as number)).toBe('');
    });

    it('should return empty string for undefined speed', () => {
      expect(formatSpeed(undefined as unknown as number)).toBe('');
    });
  });

  describe('formatDistance', () => {
    it('should convert meters to kilometers with 2 decimal places', () => {
      expect(formatDistance(5000)).toBe('5.00 km');
      expect(formatDistance(1500)).toBe('1.50 km');
      expect(formatDistance(999)).toBe('1.00 km');
      expect(formatDistance(500)).toBe('0.50 km');
    });

    it('should handle zero distance', () => {
      expect(formatDistance(0)).toBe('0.00 km');
    });
  });

  describe('formatDuration', () => {
    it('should format duration in human readable format', () => {
      expect(formatDuration(3661)).toBe('1h, 1m, 1s');
      expect(formatDuration(3600)).toBe('1h');
      expect(formatDuration(60)).toBe('1m');
      expect(formatDuration(30)).toBe('30s');
    });

    it('should handle zero duration', () => {
      expect(formatDuration(0)).toBe('');
    });

    it('should floor fractional seconds', () => {
      expect(formatDuration(60.9)).toBe('1m');
      expect(formatDuration(30.7)).toBe('30s');
    });
  });

  describe('formatDateTime', () => {
    it('should format unix timestamp to readable date with weekday', () => {
      const timestamp = 1609459200; // 2021-01-01 00:00:00 UTC
      const result = formatDateTime(timestamp);
      expect(result).toContain('Jan');
      expect(result).toContain('1');
      expect(result).toContain('2021');
    });
  });

  describe('formatInterval', () => {
    it('should format ISO duration to HH:MM:SS format', () => {
      expect(formatInterval('PT1H30M45S')).toBe('01:30:45');
      expect(formatInterval('PT45M30S')).toBe('00:45:30');
      expect(formatInterval('PT30S')).toBe('00:00:30');
      expect(formatInterval('PT2H')).toBe('02:00:00');
    });

    it('should handle zero duration', () => {
      expect(formatInterval('PT0S')).toBe('00:00:00');
    });
  });
});