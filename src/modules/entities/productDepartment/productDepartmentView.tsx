import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import { useEntityLoad } from '../../../shared/hooks/useEntityLoad';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import { toInitialProductDepartmentData } from './productDepartmentCreate';
import {
  getViewPageHeading,
  getViewBreadcrumbLabel,
  getViewPageDescription,
} from '../../../shared/utils/entityPageLabels';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';
import AuditTrailsCard from '../../../shared/components/AuditTrailsCard';
import ViewPageActionBar from '../../../shared/components/ViewPageActionBar';
import { NOT_FOUND_PATH, NOT_FOUND_REASON_DEFAULT, NOT_FOUND_REASON_INVALID_URL } from '../../../config/navigation.config';
import ProductDepartmentDetailContent from './ProductDepartmentDetailContent';
import { useEntityDelete } from '../../../shared/hooks/useEntityDelete';

const ENTITY_NAME = 'product_department';

export default function ProductDepartmentViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const {
    data: rawEntity,
    loading: dataLoading,
    error: loadError,
    notFound,
  } = useEntityLoad(ENTITY_NAME, id ?? undefined, {
    errorMessage: 'Failed to load product department',
  });
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { deleteById, deletingId } = useEntityDelete(ENTITY_NAME);

  const initialData = useMemo(
    () => (rawEntity ? toInitialProductDepartmentData(rawEntity) : undefined),
    [rawEntity]
  );

  useEffect(() => {
    if (loadError && !notFound) showErrorToastUnlessAuth(loadError);
  }, [loadError, notFound]);

  const handleBack = useCallback(() => {
    navigate(entityConfig.routes.list);
  }, [navigate, entityConfig.routes.list]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    await deleteById(id, entityConfig.displayName);
    setShowDeleteDialog(false);
    navigate(entityConfig.routes.list);
  }, [id, deleteById, entityConfig.displayName, entityConfig.routes.list, navigate]);

  const isDeleting = deletingId === (id ?? '');

  if (!id) {
    return (
      <Navigate to={NOT_FOUND_PATH} state={{ reason: NOT_FOUND_REASON_INVALID_URL }} replace />
    );
  }

  if (notFound) {
    return (
      <Navigate to={NOT_FOUND_PATH} state={{ reason: NOT_FOUND_REASON_DEFAULT }} replace />
    );
  }

  if (dataLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading product department...
          </p>
        </div>
      </div>
    );
  }

  if (loadError && !initialData) {
    return (
      <Navigate to={NOT_FOUND_PATH} state={{ reason: NOT_FOUND_REASON_DEFAULT }} replace />
    );
  }

  const displayValue =
    initialData?.product && initialData?.department
      ? `${initialData.product} / ${initialData.department}`
      : initialData?.product ?? initialData?.department ?? undefined;
  const viewPageHeading = getViewPageHeading(entityConfig, displayValue);
  const breadcrumbLabel = getViewBreadcrumbLabel(entityConfig, displayValue);

  const editUrlResolved = entityConfig.routes.edit?.replace(':id', encodeURIComponent(id ?? '')) ?? '';
  const viewActions = [
    ...(editUrlResolved ? [{ label: 'Edit' as const, href: editUrlResolved }] : []),
    { label: 'Delete' as const, onClick: () => setShowDeleteDialog(true), variant: 'danger' as const, disabled: isDeleting },
  ];

  return (
    <div className="w-full">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: entityConfig.displayNamePlural, href: entityConfig.routes.list },
          { label: breadcrumbLabel },
        ]}
        className="mb-4"
      />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1
            className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {viewPageHeading}
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {getViewPageDescription(entityConfig)}
          </p>
        </div>
          <ViewPageActionBar onBack={handleBack} actions={viewActions} isDarkMode={isDarkMode} />
      </div>
      <div
        className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <ProductDepartmentDetailContent data={initialData ?? null} />
        <AuditTrailsCard entity={rawEntity} asSection />
      </div>

      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title={`Delete ${entityConfig.displayName}`}
        message={`Are you sure you want to delete this ${entityConfig.displayName.toLowerCase()}? This action cannot be undone.`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}
