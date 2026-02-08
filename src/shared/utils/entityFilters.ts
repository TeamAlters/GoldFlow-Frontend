import type { FilterConfig } from '../components/FilterComponent';
import { getOperatorsForType } from '../constants/filterOperators';
import type { EntityFilterField } from '../../modules/admin/admin.api';

export function mapFieldTypeToDataType(
  apiType: string
): 'string' | 'number' | 'select' | 'multi-select' | 'datetime' {
  if (apiType === 'Boolean') return 'select';
  if (apiType === 'DateTime') return 'datetime';
  return 'string';
}

export function defaultOperatorForType(apiType: string, operators: string[]): string {
  if (apiType === 'DateTime' && operators.includes('=')) return '=';
  if (apiType === 'Boolean' && operators.includes('=')) return '=';
  if (operators.includes('contains')) return 'contains';
  return operators[0] ?? '=';
}

export function metadataToFilterConfig(f: EntityFilterField): FilterConfig {
  const dataType = mapFieldTypeToDataType(f.type);
  const operatorOptions = getOperatorsForType(f.type);
  const operators = operatorOptions.map((o) => o.value);
  return {
    key: f.field,
    label: f.label,
    dataType,
    operatorOptions,
    operators,
    defaultOperator: defaultOperatorForType(f.type, operators),
  };
}
