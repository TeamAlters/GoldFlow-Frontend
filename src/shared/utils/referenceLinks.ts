import { getEntityConfig } from '../../config/entity.config';

/**
 * Maps field names to their referenced entity names.
 * Used to render reference field values as clickable links in list tables and view pages.
 */
export const FIELD_TO_ENTITY_MAP: Record<string, string> = {
  purity: 'purity',
  product_name: 'product',
  product: 'product',
  product_id: 'product',
  product_category: 'product_category',
  machine_size: 'machine',
  machine_name: 'machine',
  design_name: 'design',
  design: 'design',
  wire_size: 'wire_size',
  thickness: 'thickness',
  accessory_purity: 'accessory_purity',
  item_type: 'item_type',
  item_name: 'item',
  karigar_name: 'karigar',
  purity_range: 'purity_range',
  department: 'department',
  department_group: 'department_group',
};

/**
 * Returns the detail page route for a reference field value, or null if the field
 * is not a known entity reference or the value is empty.
 */
export function getEntityDetailRoute(fieldName: string, fieldValue: unknown): string | null {
  if (!fieldValue || typeof fieldValue !== 'string' || !fieldValue.trim()) return null;
  const entityName = FIELD_TO_ENTITY_MAP[fieldName];
  if (!entityName) return null;
  try {
    const config = getEntityConfig(entityName);
    return config.routes.detail.replace(':id', encodeURIComponent(fieldValue.trim()));
  } catch {
    return null;
  }
}
