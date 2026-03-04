import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntityConfig } from '../../config/entity.config';
import { useUIStore } from '../../stores/ui.store';
import { useEntityDelete } from '../hooks/useEntityDelete';
import BackButton from './BackButton';
import ConfirmationDialog from './ConfirmationDialog';

export interface EntityViewHeaderProps {
  entityName: string;
  id: string;
  heading: string;
}

export default function EntityViewHeader({ entityName, id, heading }: EntityViewHeaderProps) {
  const navigate = useNavigate();
  const entityConfig = getEntityConfig(entityName);
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const { deleteById, deletingId } = useEntityDelete(entityName);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleBack = useCallback(() => {
    navigate(entityConfig.routes.list);
  }, [navigate, entityConfig.routes.list]);

  const editUrl = entityConfig.routes.edit?.replace(':id', encodeURIComponent(id)) ?? '';

  const handleDeleteConfirm = useCallback(async () => {
    await deleteById(id, entityConfig.displayName);
    navigate(entityConfig.routes.list);
  }, [deleteById, id, entityConfig.displayName, entityConfig.routes.list, navigate]);

  const isDeleting = deletingId === id;

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1
          className={`text-2xl sm:text-3xl font-bold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          {heading}
        </h1>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {entityConfig.displayName} details
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <BackButton onClick={handleBack} />
        {entityConfig.routes.edit && (
          <button
            type="button"
            onClick={() => navigate(editUrl)}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${
              isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Edit
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowDeleteDialog(true)}
          disabled={isDeleting}
          className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${
            isDarkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
          } disabled:opacity-60`}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${entityConfig.displayName}`}
        message={`Are you sure you want to delete this ${entityConfig.displayName.toLowerCase()}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}

