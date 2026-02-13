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
