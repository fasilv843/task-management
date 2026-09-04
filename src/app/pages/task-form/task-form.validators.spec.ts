import { FormControl } from '@angular/forms';

import { DateService } from '../../services/date-service';
import { notInPast, richTextRequired } from './task-form.validators';

describe('task form validators', () => {
  const dateService = new DateService();

  /** A date that is always safely in the future, whatever day the suite runs. */
  function futureDate(): string {
    const today = dateService.startOfToday();
    const future = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    const month = `${future.getMonth() + 1}`.padStart(2, '0');
    const day = `${future.getDate()}`.padStart(2, '0');

    return `${future.getFullYear()}-${month}-${day}`;
  }

  describe('notInPast', () => {
    const validator = notInPast(dateService);

    it('rejects a past date', () => {
      expect(validator(new FormControl('2000-01-01'))).toEqual({ notInPast: true });
    });

    it('accepts today', () => {
      const today = dateService.startOfToday();
      const month = `${today.getMonth() + 1}`.padStart(2, '0');
      const day = `${today.getDate()}`.padStart(2, '0');

      expect(validator(new FormControl(`${today.getFullYear()}-${month}-${day}`))).toBeNull();
    });

    it('accepts a future date', () => {
      expect(validator(new FormControl(futureDate()))).toBeNull();
    });

    it('defers to the required validator when empty', () => {
      expect(validator(new FormControl(''))).toBeNull();
    });

    it('lets an exempt past value through but still rejects other past dates', () => {
      const exempting = notInPast(dateService, () => '2000-01-01');

      expect(exempting(new FormControl('2000-01-01'))).toBeNull();
      expect(exempting(new FormControl('2000-06-01'))).toEqual({ notInPast: true });
    });
  });

  describe('richTextRequired', () => {
    it("rejects Quill's empty-editor markup", () => {
      expect(richTextRequired(new FormControl('<p><br></p>'))).toEqual({ required: true });
    });

    it('rejects markup holding only whitespace entities', () => {
      expect(richTextRequired(new FormControl('<p>&nbsp; </p>'))).toEqual({ required: true });
    });

    it('rejects the null Quill reports for an empty editor', () => {
      expect(richTextRequired(new FormControl(null))).toEqual({ required: true });
    });

    it('accepts markup containing real text', () => {
      expect(richTextRequired(new FormControl('<p>Ship <strong>it</strong></p>'))).toBeNull();
    });

    it('accepts a list with text', () => {
      expect(richTextRequired(new FormControl('<ul><li>Define user flow</li></ul>'))).toBeNull();
    });
  });
});
