import { create } from 'zustand';


type EntityMutationState = {
  /** Per-entity version counter; bump on create/edit/delete so lists can refetch. */
  versions: Record<string, number>;
  bumpVersion: (entityName: string) => void;
};

const MUTATION_STORAGE_KEY = 'goldflow-entity-mutation';
let isHandlingStorageEvent = false;

export const useEntityMutationStore = create<EntityMutationState>()((set) => ({
  versions: {},
  bumpVersion: (entityName: string) =>
    set((state) => {
      const current = state.versions[entityName] ?? 0;
      const nextVersions = {
        ...state.versions,
        [entityName]: current + 1,
      };

      // Broadcast mutation to other tabs so they can invalidate cache and refetch.
      if (!isHandlingStorageEvent && typeof window !== 'undefined') {
        try {
          const payload = JSON.stringify({ entityName, ts: Date.now() });
          window.localStorage.setItem(MUTATION_STORAGE_KEY, payload);
        } catch {
          // ignore storage errors
        }
      }

      return { versions: nextVersions };
    }),
}));

export function useEntityVersion(entityName: string): number {
  return useEntityMutationStore((state) => state.versions[entityName] ?? 0);
}

// Cross-tab listener: when any tab writes a mutation event, bump version locally
// and clear list cache for that entity so next list fetch is fresh.
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('storage', (event: StorageEvent) => {
    if (event.key !== MUTATION_STORAGE_KEY || !event.newValue) return;
    try {
      const parsed = JSON.parse(event.newValue) as { entityName?: string };
      const entityName = parsed.entityName;
      if (!entityName) return;

      isHandlingStorageEvent = true;
      useEntityMutationStore.getState().bumpVersion(entityName);
    } catch {
      // ignore malformed payloads
    } finally {
      isHandlingStorageEvent = false;
    }
  });
}

