import { FormControl } from '@angular/forms';

import { richTextRequired } from './task-form.validators';

describe('task form validators', () => {
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
