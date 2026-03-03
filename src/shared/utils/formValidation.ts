/** Max length for entity form text fields (add/edit). Do not allow more than this. */
export const MAX_TEXT_FIELD_LENGTH = 32;

/** Max length for description fields. */
export const MAX_DESCRIPTION_LENGTH = 256;

// ============================================
// METAL LEDGER FIELD LENGTH CONSTANTS
// ============================================

/** Max length for voucher_no field (varchar(30)). */
export const MAX_VOUCHER_NO_LENGTH = 30;

/** Max length for entry_type field (varchar(20)). */
export const MAX_ENTRY_TYPE_LENGTH = 20;

/** Max length for metal_type field (varchar(20)). */
export const MAX_METAL_TYPE_LENGTH = 20;

/** Max length for transaction_type field (varchar(50)). */
export const MAX_TRANSACTION_TYPE_LENGTH = 50;

/** Max length for item_name field (varchar(100)). */
export const MAX_ITEM_NAME_LENGTH = 100;

/** Max length for created_by/modified_by fields (varchar(255)). */
export const MAX_USER_NAME_LENGTH = 255;

/**
 * NUMERIC(18,4): up to 18 digits total; if decimal, max 4 digits after.
 * Max 19 chars: 18 digits + decimal point (e.g. 123456789012345678.1234).
 */
export const MAX_NUMERIC_184_LENGTH = 19;

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

/** Max value for step no field (0-99). */
export const MAX_STEP_NO_VALUE = 99;

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
 * NUMERIC(5,2): up to 5 digits total; if decimal, max 2 digits after. e.g. 999.99, 123.45.
 * Max 6 chars: 5 digits + decimal point (e.g. 999.99).
 */
export const MAX_NUMERIC_52_LENGTH = 6;

export interface ValidateNumeric52Options {
  /** When true, value must be >= 0 (e.g. for percentages). */
  nonNegative?: boolean;
}

/**
 * Validates NUMERIC(5,2): up to 5 digits total; if decimal, max 2 digits after. Max 999.99.
 * Returns error message or null.
 */
export function validateNumeric52(
  value: string,
  fieldLabel: string,
  options?: ValidateNumeric52Options
): string | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const hasMinus = trimmed.startsWith('-');
  const s = hasMinus ? trimmed.slice(1) : trimmed;
  if (/[^\d.]/.test(s)) {
    return `${fieldLabel} must be a number with up to 5 digits (up to 2 decimal places), e.g. 999.99`;
  }
  const dotCount = (s.match(/\./g) || []).length;
  if (dotCount > 1) {
    return `${fieldLabel} must be a number with up to 5 digits (up to 2 decimal places), e.g. 999.99`;
  }
  if (dotCount === 0) {
    if (s.length === 0 || s.length > 5) {
      return `${fieldLabel} must be a number with up to 5 digits (up to 2 decimal places), e.g. 999.99`;
    }
  } else {
    const [intPart, decPart] = s.split('.');
    const intLen = (intPart || '').length;
    const decLen = (decPart || '').length;
    if (intLen === 0) {
      return `${fieldLabel} must be a number with up to 5 digits (up to 2 decimal places), e.g. 999.99`;
    }
    if (decLen > 2) {
      return `${fieldLabel} must have at most 2 digits after the decimal`;
    }
    if (intLen + decLen > 5) {
      return `${fieldLabel} must have at most 5 digits total (e.g. 999.99 or 99.99)`;
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
 * Sanitizes input for NUMERIC(5,2): up to 5 digits total; if decimal, max 2 digits after.
 */
export function sanitizeNumeric52Input(value: string, allowNegative = false): string {
  const hasMinus = allowNegative && value.startsWith('-');
  let s = value.replace(allowNegative ? /[^\d.-]/g : /[^\d.]/g, '');
  if (allowNegative && s.startsWith('-')) s = s.slice(1);
  const firstDot = s.indexOf('.');
  let intPart = (firstDot === -1 ? s : s.slice(0, firstDot)).replace(/\D/g, '');
  let decPart = (firstDot === -1 ? '' : s.slice(firstDot + 1).replace(/\D/g, ''));

  if (firstDot === -1) {
    intPart = intPart.slice(0, 5);
    return (hasMinus ? '-' : '') + intPart;
  }
  intPart = intPart.slice(0, 5);
  const maxDec = Math.min(2, 5 - intPart.length);
  decPart = decPart.slice(0, maxDec);
  return (hasMinus ? '-' : '') + intPart + '.' + decPart;
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

export interface ValidateNumeric184Options {
  /** When true, value must be >= 0 (e.g. for weights, amounts). */
  nonNegative?: boolean;
  /** When true, allows zero value. Default true. */
  allowZero?: boolean;
}

/**
 * Validates NUMERIC(18,4): up to 18 digits total; if decimal, max 4 digits after.
 * Returns error message or null.
 */
export function validateNumeric184(
  value: string,
  fieldLabel: string,
  options?: ValidateNumeric184Options
): string | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const hasMinus = trimmed.startsWith('-');
  const s = hasMinus ? trimmed.slice(1) : trimmed;
  if (/[^\d.]/.test(s)) {
    return `${fieldLabel} must be a number with up to 18 digits (up to 4 decimal places)`;
  }
  const dotCount = (s.match(/\./g) || []).length;
  if (dotCount > 1) {
    return `${fieldLabel} must be a number with up to 18 digits (up to 4 decimal places)`;
  }
  if (dotCount === 0) {
    if (s.length === 0 || s.length > 18) {
      return `${fieldLabel} must be a number with up to 18 digits (up to 4 decimal places)`;
    }
  } else {
    const [intPart, decPart] = s.split('.');
    const intLen = (intPart || '').length;
    const decLen = (decPart || '').length;
    if (intLen === 0) {
      return `${fieldLabel} must be a number with up to 18 digits (up to 4 decimal places)`;
    }
    if (decLen > 4) {
      return `${fieldLabel} must have at most 4 digits after the decimal`;
    }
    if (intLen + decLen > 18) {
      return `${fieldLabel} must have at most 18 digits total`;
    }
  }
  const num = parseFloat(trimmed);
  if (!Number.isFinite(num)) return `${fieldLabel} must be a valid number`;
  if (options?.nonNegative && num < 0) {
    return `${fieldLabel} must be zero or greater`;
  }
  if (options?.allowZero === false && num === 0) {
    return `${fieldLabel} must be greater than zero`;
  }
  return null;
}

/**
 * Sanitizes input for NUMERIC(18,4): up to 18 digits total; if decimal, max 4 digits after.
 * Use in onChange so users cannot type more than 18 digits or more than 4 after the decimal.
 */
export function sanitizeNumeric184Input(value: string, allowNegative = false): string {
  const hasMinus = allowNegative && value.startsWith('-');
  let s = value.replace(allowNegative ? /[^\d.-]/g : /[^\d.]/g, '');
  if (allowNegative && s.startsWith('-')) s = s.slice(1);
  const firstDot = s.indexOf('.');
  let intPart = (firstDot === -1 ? s : s.slice(0, firstDot)).replace(/\D/g, '');
  let decPart = (firstDot === -1 ? '' : s.slice(firstDot + 1).replace(/\D/g, ''));

  if (firstDot === -1) {
    intPart = intPart.slice(0, 18);
    return (hasMinus ? '-' : '') + intPart;
  }
  intPart = intPart.slice(0, 18);
  const maxDec = Math.min(4, 18 - intPart.length);
  decPart = decPart.slice(0, maxDec);
  return (hasMinus ? '-' : '') + intPart + '.' + decPart;
}

/**
 * Interactive sanitization helper for NUMERIC(18,4) fields.
 * - Keeps optional leading '-'
 * - Keeps digits and at most one '.'
 * - Limits whole digits to 14 and fractional digits to 4
 * - Ensures total digits (whole + fractional) do not exceed 18; if exceeded, falls back to previous.
 *
 * Use this in onChange/onPaste handlers for strict numeric(18,4) UX in the UI.
 */
export function sanitizeNumeric184Interactive(
  raw: string,
  previous: string,
  allowNegative = false
): string {
  let s = raw.replace(/\s+/g, '');

  // Extract sign
  let sign = '';
  if (allowNegative && s.startsWith('-')) {
    sign = '-';
    s = s.slice(1);
  }

  // Keep only digits and dots
  s = s.replace(/[^0-9.]/g, '');

  const firstDot = s.indexOf('.');
  let whole = '';
  let frac = '';

  if (firstDot === -1) {
    whole = s;
  } else {
    whole = s.slice(0, firstDot);
    frac = s.slice(firstDot + 1).replace(/\./g, '');
  }

  if (whole.length > 14) whole = whole.slice(0, 14);
  if (frac.length > 4) frac = frac.slice(0, 4);

  let result = sign + (whole || '0');
  if (frac.length > 0) result += `.${frac}`;

  // Allow empty to fully clear field
  if (raw.trim() === '') return '';

  const unsigned = result.startsWith('-') ? result.slice(1) : result;
  const [w, f = ''] = unsigned.split('.');
  const wholeDigits = (w.replace(/^0+/, '') || '0').length;
  const totalDigits = wholeDigits + f.length;

  if (totalDigits > 18) {
    return previous;
  }

  return result;
}

/**
 * Returns whether a key press is allowed for a NUMERIC(18,4) input, enforcing:
 * - Digits only
 * - Single optional leading '-'
 * - Single '.'
 * - Max 14 whole digits, 4 fractional digits, 18 digits total
 *
 * Use this in onKeyDown:
 * if (!canAcceptNumeric184Key(value, selectionStart, selectionEnd, e.key, true)) e.preventDefault();
 */
export function canAcceptNumeric184Key(
  current: string,
  selectionStart: number | null,
  selectionEnd: number | null,
  key: string,
  allowNegative = false
): boolean {
  const allowedControlKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
    'Enter',
  ];

  if (allowedControlKeys.includes(key)) return true;

  // Digits
  if (key >= '0' && key <= '9') {
    const selStart = selectionStart ?? current.length;
    const selEnd = selectionEnd ?? current.length;
    const replacing = selEnd > selStart;

    const negative = allowNegative && current.startsWith('-');
    const unsigned = negative ? current.slice(1) : current;
    const dotIndex = unsigned.indexOf('.');
    const [wholeRaw, fracRaw = ''] = unsigned.split('.');
    let wholeDigits = (wholeRaw.replace(/^0+/, '') || '0').length;
    let fracDigits = fracRaw.length;

    if (replacing) {
      const beforeSel = current.slice(0, selStart);
      const afterSel = current.slice(selEnd);
      const tmp = (beforeSel + afterSel).replace(allowNegative ? /^-/ : '', '');
      const [w2, f2 = ''] = tmp.split('.');
      wholeDigits = (w2.replace(/^0+/, '') || '0').length;
      fracDigits = f2.length;
    }

    const absoluteDotIndex = dotIndex === -1 ? -1 : dotIndex + (negative ? 1 : 0);
    const inFraction = absoluteDotIndex !== -1 && selStart > absoluteDotIndex;

    if (inFraction) {
      if (fracDigits >= 4) return false;
    } else {
      if (wholeDigits >= 14) return false;
    }

    if (wholeDigits + fracDigits >= 18) return false;
    return true;
  }

  // Decimal point
  if (key === '.') {
    if (current.includes('.')) return false;
    return true;
  }

  // Minus sign only at start and only once
  if (key === '-' && allowNegative) {
    const selStart = selectionStart ?? 0;
    if (current.startsWith('-') || selStart !== 0) return false;
    return true;
  }

  // Block everything else
  return false;
}
