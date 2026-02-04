/**
 * Browser cache for entity metadata (and other entity data).
 * - Use cache when navigating within the app; refetch on full page refresh.
 * - Clear all entity caches on logout.
 */

const CACHE_PREFIX = 'goldflow-entity-cache-'

function metadataKey(entityName: string): string {
  return `${CACHE_PREFIX}metadata-${entityName}`
}

export type CachedEntityMetadata = {
  display_name: string
  fields: Array<{ name: string; label: string; type: string; visible_in_list: boolean }>
  filters: {
    default_visible: Array<{ field: string; label: string; type: string; operators: string[] }>
    additional: Array<{ field: string; label: string; type: string; operators: string[] }>
  }
  fetchedAt: number
}

/** Get cached entity metadata if present. Returns null on miss or parse error. */
export function getEntityMetadataCache(entityName: string): CachedEntityMetadata | null {
  try {
    const raw = sessionStorage.getItem(metadataKey(entityName))
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedEntityMetadata
    if (!parsed?.display_name && !parsed?.fields?.length) return null
    return parsed
  } catch {
    return null
  }
}

/** Store entity metadata in cache. */
export function setEntityMetadataCache(
  entityName: string,
  data: Omit<CachedEntityMetadata, 'fetchedAt'>
): void {
  try {
    const entry: CachedEntityMetadata = { ...data, fetchedAt: Date.now() }
    sessionStorage.setItem(metadataKey(entityName), JSON.stringify(entry))
  } catch {
    // ignore
  }
}

/** Clear all entity caches (call on logout). */
export function clearEntityCache(): void {
  try {
    const keys: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key?.startsWith(CACHE_PREFIX)) keys.push(key)
    }
    keys.forEach((k) => sessionStorage.removeItem(k))
  } catch {
    // ignore
  }
}

/** True if the current page load was a full reload (F5 / refresh). */
export function isPageReload(): boolean {
  try {
    const nav = performance.getEntriesByType?.('navigation')?.[0] as PerformanceNavigationTiming | undefined
    return nav?.type === 'reload'
  } catch {
    return false
  }
}
