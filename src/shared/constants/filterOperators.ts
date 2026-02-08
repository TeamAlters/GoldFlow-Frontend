/**
 * Centralized filter operator definitions by field type.
 * Used by FilterComponent to show operator dropdowns; operator values are sent to the list API.
 */

export type FilterOperatorOption = {
  value: string;
  label: string;
  requiresValue: boolean;
  isArray?: boolean;
  arrayLength?: number;
};

export const OPERATOR_MAP: Record<string, FilterOperatorOption[]> = {
  String: [
    { value: '=', label: 'Equals', requiresValue: true },
    { value: '≠', label: 'Not Equals', requiresValue: true },
    { value: 'contains', label: 'Contains', requiresValue: true },
    { value: 'starts with', label: 'Starts With', requiresValue: true },
    { value: 'ends with', label: 'Ends With', requiresValue: true },
    { value: 'in', label: 'In List', requiresValue: true, isArray: true },
    { value: 'is not set', label: 'Is Not Set', requiresValue: false },
    { value: 'is set', label: 'Is Set', requiresValue: false },
  ],
  Integer: [
    { value: '=', label: 'Equals', requiresValue: true },
    { value: '≠', label: 'Not Equals', requiresValue: true },
    { value: '>', label: 'Greater Than', requiresValue: true },
    { value: '<', label: 'Less Than', requiresValue: true },
    { value: '≥', label: 'Greater Than or Equal', requiresValue: true },
    { value: '≤', label: 'Less Than or Equal', requiresValue: true },
    { value: 'between', label: 'Between', requiresValue: true, isArray: true, arrayLength: 2 },
    { value: 'in', label: 'In List', requiresValue: true, isArray: true },
    { value: 'is not set', label: 'Is Not Set', requiresValue: false },
    { value: 'is set', label: 'Is Set', requiresValue: false },
  ],
  DateTime: [
    { value: '=', label: 'Equals', requiresValue: true },
    { value: '>', label: 'After', requiresValue: true },
    { value: '<', label: 'Before', requiresValue: true },
    { value: '≥', label: 'On or After', requiresValue: true },
    { value: '≤', label: 'On or Before', requiresValue: true },
    { value: 'between', label: 'Between', requiresValue: true, isArray: true, arrayLength: 2 },
    { value: 'is not set', label: 'Is Not Set', requiresValue: false },
    { value: 'is set', label: 'Is Set', requiresValue: false },
  ],
  Boolean: [
    { value: '=', label: 'Equals', requiresValue: true },
    { value: 'is not set', label: 'Is Not Set', requiresValue: false },
    { value: 'is set', label: 'Is Set', requiresValue: false },
  ],
  UUID: [
    { value: '=', label: 'Equals', requiresValue: true },
    { value: 'in', label: 'In List', requiresValue: true, isArray: true },
    { value: 'is not set', label: 'Is Not Set', requiresValue: false },
    { value: 'is set', label: 'Is Set', requiresValue: false },
  ],
};

const TYPE_ALIASES: Record<string, string> = {
  string: 'String',
  str: 'String',
  text: 'String',
  integer: 'Integer',
  int: 'Integer',
  number: 'Integer',
  datetime: 'DateTime',
  date: 'DateTime',
  date_time: 'DateTime',
  boolean: 'Boolean',
  bool: 'Boolean',
  uuid: 'UUID',
};

/**
 * Get operators for a field type. Normalizes common API type names to OPERATOR_MAP keys.
 */
export function getOperatorsForType(fieldType: string): FilterOperatorOption[] {
  const normalized =
    TYPE_ALIASES[fieldType?.toLowerCase()] ?? (fieldType ? fieldType : 'String');
  const key = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  return OPERATOR_MAP[key] ?? OPERATOR_MAP.String ?? [];
}
