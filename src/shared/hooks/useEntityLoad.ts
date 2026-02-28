import { useState, useEffect } from 'react';
import { getEntity } from '../../modules/admin/admin.api';

function isAbortError(err: unknown): boolean {
  if (err instanceof Error) {
    if (err.name === 'AbortError') return true;
    const msg = err.message?.toLowerCase() ?? '';
    if (msg.includes('cancel') || msg.includes('aborted')) return true;
  }
  const code = (err as { code?: string })?.code;
  if (code === 'ERR_CANCELED' || code === 'ABORT_ERR') return true;
  return false;
}

/**
 * Normalize getEntity response: entity may be in res.data or at top level.
 * If backend wraps in an entity key (e.g. { data: { customer: { ... } } }), unwrap it.
 */
export function getEntityFromResponse(
  res: Record<string, unknown>,
  entityName: string
): Record<string, unknown> | undefined {
  if (res == null || typeof res !== 'object') return undefined;
  let inner = res.data;
  if (inner != null && typeof inner === 'object' && !Array.isArray(inner)) {
    inner = inner as Record<string, unknown>;
  } else {
    inner = res;
  }
  if (inner == null || typeof inner !== 'object' || Array.isArray(inner)) return undefined;
  const obj = inner as Record<string, unknown>;
  const entityKey = entityName.replace(/-/g, '_');
  if (Object.keys(obj).length === 1 && obj[entityKey] != null && typeof obj[entityKey] === 'object' && !Array.isArray(obj[entityKey])) {
    return obj[entityKey] as Record<string, unknown>;
  }
  return obj;
}

export type UseEntityLoadResult = {
  /** Raw entity from API (res.data when object). */
  data: Record<string, unknown> | undefined;
  loading: boolean;
  error: string | null;
  setError: (value: string | null) => void;
};

/**
 * Load a single entity by id with correct AbortController + mounted handling.
 * On unmount or id change the request is aborted; loading is still cleared when
 * the effect is still active (mounted) so the UI never gets stuck.
 *
 * @param entityName - Entity key (e.g. 'customer', 'product_category')
 * @param id - Entity id (undefined skips the request)
 * @param options.errorMessage - Fallback message when request fails (non-abort)
 */
export function useEntityLoad(
  entityName: string,
  id: string | undefined,
  options?: { errorMessage?: string }
): UseEntityLoadResult {
  const [data, setData] = useState<Record<string, unknown> | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fallbackMsg = options?.errorMessage ?? 'Failed to load';

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setData(undefined);
      setError(null);
      return;
    }

    let mounted = true;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getEntity(entityName, id, { signal: controller.signal })
      .then((res) => {
        if (!mounted) return;
        if (controller.signal.aborted) return;
        const entity = getEntityFromResponse(res as Record<string, unknown>, entityName);
        if (entity) {
          setData(entity);
          setError(null);
        } else {
          setData(undefined);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        if (controller.signal.aborted || isAbortError(err)) return;
        const msg = err instanceof Error ? err.message : fallbackMsg;
        setError(msg || fallbackMsg);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [entityName, id]);

  return { data, loading, error, setError };
}
