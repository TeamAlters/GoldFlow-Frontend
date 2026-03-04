import { useCallback, useState } from 'react';
import { deleteEntity } from '../../modules/admin/admin.api';
import { showErrorToastUnlessAuth } from '../utils/errorHandling';
import { toast } from '../../stores/toast.store';

export function useEntityDelete(entityName: string) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteById = useCallback(
    async (id: string, displayName?: string) => {
      if (!id) return;
      if (deletingId === id) return; // prevent double-click duplicate calls

      setDeletingId(id);
      try {
        await deleteEntity(entityName, id);
        const label = displayName || entityName;
        toast.success(`${label} deleted successfully.`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to delete';
        showErrorToastUnlessAuth(msg);
      } finally {
        setDeletingId((current) => (current === id ? null : current));
      }
    },
    [entityName, deletingId]
  );

  return { deleteById, deletingId };
}

