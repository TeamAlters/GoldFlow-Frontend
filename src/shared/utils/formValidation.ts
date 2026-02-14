/** Max length for entity form text fields (add/edit). Do not allow more than this. */
export const MAX_TEXT_FIELD_LENGTH = 32;

/** Max length for description fields. */
export const MAX_DESCRIPTION_LENGTH = 256;

/** Max length 24 for specific entity fields. */
export const MAX_LENGTH_24 = 24;

/** Max length 36 for specific entity fields. */
export const MAX_LENGTH_36 = 36;

/** Max length 4 for product abbreviation (uppercase only). */
export const MAX_LENGTH_4 = 4;

/** Max length for department name. */
export const MAX_DEPARTMENT_NAME_LENGTH = 36;

/** Max length for department group name. */
export const MAX_DEPARTMENT_GROUP_NAME_LENGTH = 64;

/** Max value for order field (0-99). */
export const MAX_ORDER_VALUE = 99;

/** Sanitizes department abbreviation: uppercase letters only, max 4 chars. */
export function sanitizeDepartmentAbbreviationInput(value: string): string {
  return value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, MAX_LENGTH_4);
}

/** Returns error message when value exceeds max length. Use in form validate(). */
export function maxLengthError(fieldLabel: string, max = MAX_TEXT_FIELD_LENGTH): string {
  return `${fieldLabel} must be at most ${max} characters`;
}

/** Returns error message if value contains lowercase; use for uppercase-only fields. */
export function uppercaseOnlyError(fieldLabel: string): string {
  return `${fieldLabel} must be uppercase only (lowercase not allowed)`;
}

/** Validates uppercase-only (A-Z, optional digits). Returns error message or null. */
export function validateUppercaseOnly(value: string, fieldLabel: string): string | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  if (/[a-z]/.test(trimmed)) return uppercaseOnlyError(fieldLabel);
  if (!/^[A-Z0-9]*$/.test(trimmed)) return `${fieldLabel} must contain only uppercase letters and numbers`;
  return null;
}

/**
 * NUMERIC(6,3): up to 6 digits total; if decimal, max 3 digits after. e.g. 123456, 1.234, 123.456, 12345.6.
 * Max 7 chars: 6 digits + decimal point (e.g. 12345.6).
 */
export const MAX_NUMERIC_63_LENGTH = 7;

export interface ValidateNumeric63Options {
  /** When true, value must be >= 0 (e.g. for percentages, range values). */
  nonNegative?: boolean;
}

/**
 * Validates NUMERIC(6,3): up to 6 digits total; if decimal, max 3 digits after. e.g. 123456, 1.234, 123.456.
 * Returns error message or null.
 */
export function validateNumeric63(
  value: string,
  fieldLabel: string,
  options?: ValidateNumeric63Options
): string | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const hasMinus = trimmed.startsWith('-');
  const s = hasMinus ? trimmed.slice(1) : trimmed;
  if (/[^\d.]/.test(s)) {
    return `${fieldLabel} must be a number with up to 6 digits (up to 3 decimal places), e.g. 123456 or 123.456`;
  }
  const dotCount = (s.match(/\./g) || []).length;
  if (dotCount > 1) {
    return `${fieldLabel} must be a number with up to 6 digits (up to 3 decimal places), e.g. 123456 or 123.456`;
  }
  if (dotCount === 0) {
    if (s.length === 0 || s.length > 6) {
      return `${fieldLabel} must be a number with up to 6 digits (up to 3 decimal places), e.g. 123456 or 123.456`;
    }
  } else {
    const [intPart, decPart] = s.split('.');
    const intLen = (intPart || '').length;
    const decLen = (decPart || '').length;
    if (intLen === 0) {
      return `${fieldLabel} must be a number with up to 6 digits (up to 3 decimal places), e.g. 123456 or 123.456`;
    }
    if (decLen > 3) {
      return `${fieldLabel} must have at most 3 digits after the decimal`;
    }
    if (intLen + decLen > 6) {
      return `${fieldLabel} must have at most 6 digits total (e.g. 123.456 or 12345.6)`;
    }
  }
  const num = parseFloat(trimmed);
  if (!Number.isFinite(num)) return `${fieldLabel} must be a valid number`;
  if (options?.nonNegative && num < 0) {
    return `${fieldLabel} must be zero or greater`;
  }
  return null;
}

/**
 * Sanitizes input for NUMERIC(6,3): up to 6 digits total; if decimal, max 3 digits after.
 * Use in onChange so users cannot type more than 6 digits or more than 3 after the decimal.
 */
export function sanitizeNumeric63Input(value: string, allowNegative = false): string {
  const hasMinus = allowNegative && value.startsWith('-');
  let s = value.replace(allowNegative ? /[^\d.-]/g : /[^\d.]/g, '');
  if (allowNegative && s.startsWith('-')) s = s.slice(1);
  const firstDot = s.indexOf('.');
  let intPart = (firstDot === -1 ? s : s.slice(0, firstDot)).replace(/\D/g, '');
  let decPart = (firstDot === -1 ? '' : s.slice(firstDot + 1).replace(/\D/g, ''));

  if (firstDot === -1) {
    intPart = intPart.slice(0, 6);
    return (hasMinus ? '-' : '') + intPart;
  }
  intPart = intPart.slice(0, 6);
  const maxDec = Math.min(3, 6 - intPart.length);
  decPart = decPart.slice(0, maxDec);
  return (hasMinus ? '-' : '') + intPart + '.' + decPart;
}
