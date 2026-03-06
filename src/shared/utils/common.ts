import React from 'react';
import { formatDateTime, isDateTimeValue } from './dateUtils';
import { BooleanCellIcon } from '../components/BooleanCellIcon';

// Map metadata field names to row keys (for mock/API compatibility: username→name, status→role, etc.)
export function getRowDisplayValue(
  row: Record<string, unknown>,
  fieldKey: string,
  fieldType: string
): string | React.ReactNode {
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
          design: 'design_name',
          design_name: 'design',
          product: 'product_name',
        };
        const mappedKey = aliases[fieldKey];
        return mappedKey ? row[mappedKey] : undefined;
      })();
  if (resolved === undefined || resolved === null) return '–';
  if (fieldType === 'DateTime' || isDateTimeValue(resolved))
    return formatDateTime(resolved as string);
  const typeLower = (fieldType || '').toLowerCase();
  if (
    (typeLower === 'boolean' || typeLower === 'bool') &&
    (resolved === true || resolved === false || resolved === 'true' || resolved === 'false')
  ) {
    const isTrue = resolved === true || resolved === 'true';
    return React.createElement(BooleanCellIcon, { value: isTrue });
  }
  return String(resolved);
}

/** Returns a sortValue function for boolean columns (for use with DataTable sortValue when accessor returns JSX). */
export function getBooleanSortValue(fieldName: string) {
  return (row: Record<string, unknown>) =>
    row[fieldName] === true || row[fieldName] === 'true' ? 1 : 0;
}
