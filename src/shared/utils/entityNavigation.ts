/**
 * Get the id to use for the detail/view URL after creating an entity.
 * Tries response.data[idKey] for each idKey, then payload[idKey].
 * idKeys should list the primary identifier field(s) for the entity (e.g. ['product_name', 'id']).
 */
export function getCreatedEntityId(
  response: { data?: Record<string, unknown> } | undefined,
  payload: Record<string, unknown>,
  idKeys: string[]
): string | number | undefined {
  const data = response?.data;
  if (data && typeof data === 'object') {
    const dataRecord = data as Record<string, unknown>;
    for (const key of idKeys) {
      const v = dataRecord[key];
      if (v !== undefined && v !== null && v !== '') return typeof v === 'string' || typeof v === 'number' ? v : String(v);
    }
  }
  for (const key of idKeys) {
    const v = payload[key];
    if (v !== undefined && v !== null && v !== '') return typeof v === 'string' || typeof v === 'number' ? v : String(v);
  }
  return undefined;
}

/**
 * Get the id to use for redirect to view page after updating an entity.
 * Tries response.data[idField], then formData[idField], then currentId.
 * Use so that when the entity's key can change on edit (e.g. name, composite id), we redirect to the new id.
 * idFields: e.g. ['product_name', 'id'] or ['name', 'id'] – first match wins.
 */
export function getRedirectIdAfterUpdate(
  response: { data?: Record<string, unknown> } | undefined,
  formData: Record<string, unknown> | undefined,
  currentId: string,
  idFields: string[]
): string {
  const data = response?.data;
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    const inner = d.data && typeof d.data === 'object' && !Array.isArray(d.data) ? (d.data as Record<string, unknown>) : d;
    for (const key of idFields) {
      const v = inner[key] ?? d[key];
      if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    }
  }
  if (formData && typeof formData === 'object') {
    for (const key of idFields) {
      const v = (formData as Record<string, unknown>)[key];
      if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    }
  }
  return currentId;
}
