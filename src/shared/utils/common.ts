import { formatDateTime, isDateTimeValue } from './dateUtils';

// Map metadata field names to row keys (for mock/API compatibility: username→name, status→role, etc.)
export function getRowDisplayValue(
  row: Record<string, unknown>,
  fieldKey: string,
  fieldType: string
): string {
  const val = row[fieldKey];
  const resolved =
    val !== undefined && val !== null
      ? val
      : (() => {
        const aliases: Record<string, string> = {
          username: 'name',
          status: 'role',
          mobile_number: 'mobileNo',
          name: 'product_name',
          product_name: 'name',
        };
        const mappedKey = aliases[fieldKey];
        return mappedKey ? row[mappedKey] : undefined;
      })();
  if (resolved === undefined || resolved === null) return '—';
  if (fieldType === 'DateTime' || isDateTimeValue(resolved))
    return formatDateTime(resolved as string);
  return String(resolved);
}
