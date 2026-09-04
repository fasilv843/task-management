import {
  formatDateLabel,
  formatDateOnly,
  isBeforeToday,
  parseDateOnly,
  startOfToday,
  todayDateOnly,
} from './date.utils';

describe('date utils', () => {
  describe('parseDateOnly', () => {
    it('reads the value in local time, not UTC', () => {
      const date = parseDateOnly('2026-09-05');

      // `new Date('2026-09-05')` is UTC midnight, which is Sep 4 west of
      // Greenwich. Local parsing has to give Sep 5 in every zone.
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(8);
      expect(date.getDate()).toBe(5);
      expect(date.getHours()).toBe(0);
    });

    it('rejects a date that does not exist rather than rolling into the next month', () => {
      expect(Number.isNaN(parseDateOnly('2026-02-31').getTime())).toBe(true);
    });

    it('rejects a value that is not a date at all', () => {
      expect(Number.isNaN(parseDateOnly('not-a-date').getTime())).toBe(true);
    });
  });

  describe('formatDateOnly', () => {
    it('pads month and day to two digits', () => {
      expect(formatDateOnly(new Date(2026, 0, 9))).toBe('2026-01-09');
    });

    it('round-trips with parseDateOnly', () => {
      expect(formatDateOnly(parseDateOnly('2026-12-31'))).toBe('2026-12-31');
    });

    it('agrees with todayDateOnly', () => {
      expect(todayDateOnly()).toBe(formatDateOnly(startOfToday()));
    });
  });

  describe('isBeforeToday', () => {
    it('is false for today', () => {
      expect(isBeforeToday(todayDateOnly())).toBe(false);
    });

    it('is true for yesterday', () => {
      const today = startOfToday();
      const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

      expect(isBeforeToday(formatDateOnly(yesterday))).toBe(true);
    });

    it('is false for tomorrow', () => {
      const today = startOfToday();
      const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      expect(isBeforeToday(formatDateOnly(tomorrow))).toBe(false);
    });

    it('is false for a value that is not a date, leaving that to validation', () => {
      expect(isBeforeToday('')).toBe(false);
    });
  });

  describe('formatDateLabel', () => {
    it('renders the date rather than the stored string', () => {
      const label = formatDateLabel('2026-09-05');

      expect(label).toContain('2026');
      expect(label).not.toBe('2026-09-05');
    });

    it('falls back to the raw value when it cannot be parsed', () => {
      expect(formatDateLabel('whenever')).toBe('whenever');
    });
  });
});
