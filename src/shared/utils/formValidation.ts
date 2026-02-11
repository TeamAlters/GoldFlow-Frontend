/** Max length for entity form text fields (add/edit). Do not allow more than this. */
export const MAX_TEXT_FIELD_LENGTH = 32;

/** Returns error message when value exceeds max length. Use in form validate(). */
export function maxLengthError(fieldLabel: string, max = MAX_TEXT_FIELD_LENGTH): string {
  return `${fieldLabel} must be at most ${max} characters`;
}
