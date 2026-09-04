import {
  DEFAULT_VALIDATION_MESSAGES,
  VALIDATION_ERROR_PRIORITY,
  ValidationMessages,
  resolveValidationMessage,
} from './validation-messages';
import { todayDateOnly } from '../utils/date.utils';

describe('resolveValidationMessage', () => {
  it('names the field, so one entry serves every control', () => {
    expect(resolveValidationMessage({ required: true }, 'Title')).toBe('Title is required.');
    expect(resolveValidationMessage({ required: true }, 'Deadline')).toBe('Deadline is required.');
  });

  it('reads both the limit and what was entered out of the error', () => {
    const message = resolveValidationMessage(
      { maxlength: { requiredLength: 100, actualLength: 140 } },
      'Title',
    );

    expect(message).toBe('Title must be 100 characters or fewer — 140 entered.');
  });

  it('speaks about emptiness first when a field breaks several rules at once', () => {
    // Insertion order deliberately puts the less useful error first.
    const message = resolveValidationMessage(
      { maxlength: { requiredLength: 5, actualLength: 9 }, required: true },
      'Title',
    );

    expect(message).toBe('Title is required.');
  });

  it('treats a blank value the same as a missing one', () => {
    expect(resolveValidationMessage({ nonBlank: true }, 'Title')).toBe('Title is required.');
  });

  it('lets an override restate the wording without touching the defaults', () => {
    const overrides: ValidationMessages = { required: 'Comment cannot be empty.' };

    expect(resolveValidationMessage({ required: true }, 'Add a comment', overrides)).toBe(
      'Comment cannot be empty.',
    );
    expect(resolveValidationMessage({ required: true }, 'Title')).toBe('Title is required.');
  });

  it('applies overrides in order, so a field beats the app-wide registry', () => {
    const appWide: ValidationMessages = { required: 'Please fill this in.' };
    const perField: ValidationMessages = { required: 'We need a title.' };

    expect(resolveValidationMessage({ required: true }, 'Title', appWide, perField)).toBe(
      'We need a title.',
    );
  });

  it('accepts a factory override so wording can still use the error', () => {
    const overrides: ValidationMessages = {
      maxlength: (_error: unknown, label: string) => `${label} is too long.`,
    };

    expect(
      resolveValidationMessage(
        { maxlength: { requiredLength: 5, actualLength: 9 } },
        'Title',
        overrides,
      ),
    ).toBe('Title is too long.');
  });

  it('says nothing for an error key it has no wording for', () => {
    expect(resolveValidationMessage({ somethingElse: true }, 'Title')).toBeNull();
    expect(resolveValidationMessage(null, 'Title')).toBeNull();
  });

  it('covers our own validators as well as Angular built-ins', () => {
    expect(resolveValidationMessage({ invalidDate: true }, 'Deadline')).toBe('Enter a valid date.');

    // The validator reports the boundary it enforced, so the message can name a
    // date instead of the vague "cannot be in the past".
    const message = resolveValidationMessage(
      { notInPast: { earliest: todayDateOnly() } },
      'Deadline',
    );

    expect(message).toMatch(/^Deadline cannot be earlier than .+\.$/);
    expect(message).not.toContain(todayDateOnly());
  });

  it('has a message for every key it claims to know', () => {
    for (const key of Object.keys(DEFAULT_VALIDATION_MESSAGES)) {
      expect(typeof DEFAULT_VALIDATION_MESSAGES[key as never]).toBe('function');
    }
  });

  it('orders every known key, so none can be left to validator run order', () => {
    expect([...VALIDATION_ERROR_PRIORITY].sort()).toEqual(
      Object.keys(DEFAULT_VALIDATION_MESSAGES).sort(),
    );
  });
});
