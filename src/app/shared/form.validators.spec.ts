import { FormControl } from '@angular/forms';

import { nonBlank, notInPast } from './form.validators';
import { formatDateOnly, startOfToday, todayDateOnly } from '../utils/date.utils';

/** A date that is always safely in the future, whatever day the suite runs. */
function futureDate(): string {
  const today = startOfToday();

  return formatDateOnly(new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()));
}

describe('shared form validators', () => {
  describe('nonBlank', () => {
    it('rejects whitespace-only text', () => {
      expect(nonBlank(new FormControl('   '))).toEqual({ nonBlank: true });
    });

    it('accepts text with content', () => {
      expect(nonBlank(new FormControl(' Ada '))).toBeNull();
    });
  });

  describe('notInPast', () => {
    const validator = notInPast();

    it('rejects a past date and reports the earliest it will accept', () => {
      expect(validator(new FormControl('2000-01-01'))).toEqual({
        notInPast: { earliest: todayDateOnly() },
      });
    });

    it('accepts today', () => {
      expect(validator(new FormControl(todayDateOnly()))).toBeNull();
    });

    it('accepts a future date', () => {
      expect(validator(new FormControl(futureDate()))).toBeNull();
    });

    it('defers to the required validator when empty', () => {
      expect(validator(new FormControl(''))).toBeNull();
    });

    it('reports an unparseable value separately from a past one', () => {
      expect(validator(new FormControl('2026-02-31'))).toEqual({ invalidDate: true });
    });

    it('lets an exempt past value through but still rejects other past dates', () => {
      const exempting = notInPast(() => '2000-01-01');

      expect(exempting(new FormControl('2000-01-01'))).toBeNull();
      expect(exempting(new FormControl('2000-06-01'))).toEqual({
        notInPast: { earliest: todayDateOnly() },
      });
    });
  });
});
