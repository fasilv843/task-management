import { FormControl } from '@angular/forms';

import { nonBlank } from './form.validators';

describe('nonBlank', () => {
  it('rejects whitespace-only text', () => {
    expect(nonBlank(new FormControl('   '))).toEqual({ nonBlank: true });
  });

  it('rejects a newline-only value', () => {
    expect(nonBlank(new FormControl('\n\n'))).toEqual({ nonBlank: true });
  });

  it('accepts real text', () => {
    expect(nonBlank(new FormControl('Write the form'))).toBeNull();
  });

  it('defers to the required validator on a non-string value', () => {
    expect(nonBlank(new FormControl(null))).toBeNull();
  });
});
