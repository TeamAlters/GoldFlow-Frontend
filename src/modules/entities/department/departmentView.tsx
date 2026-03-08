  import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { getEntity } from '../../admin/admin.api';
import { showErrorToastUnlessAuth, isNotFoundErrorOrMessage, isNotFoundResponse } from '../../../shared/utils/errorHandling';
import { getSectionClass } from '../../../shared/utils/viewPageStyles';
import { useUIStore } from '../../../stores/ui.store';
import StaticDepartmentForm, { type StaticDepartmentFormData } from './departmentForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import {
  getViewPageHeading,
  getViewBreadcrumbLabel,
  getViewPageDescription,
} from '../../../shared/utils/entityPageLabels';
import { toInitialDepartmentData } from './departmentEdit';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';
import AuditTrailsCard from '../../../shared/components/AuditTrailsCard';
import ViewPageActionBar from '../../../shared/components/ViewPageActionBar';
import { useEntityDelete } from '../../../shared/hooks/useEntityDelete';
import { NOT_FOUND_PATH, NOT_FOUND_REASON_DEFAULT, NOT_FOUND_REASON_INVALID_URL } from '../../../config/navigation.config';

const ENTITY_NAME = 'department';

export default function DepartmentViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const [initialData, setInitialData] = useState<Partial<StaticDepartmentFormData> | undefined>(
    undefined
  );
  const [rawEntity, setRawEntity] = useState<Record<string, unknown> | undefined>(undefined);
  const [dataLoading, setDataLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  
  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { deleteById, deletingId } = useEntityDelete(ENTITY_NAME);

  useEffect(() => {
    if (!id) return;
    setDataLoading(true);
    getEntity(ENTITY_NAME, id)
      .then((res) => {
        if (isNotFoundResponse(res)) {
          setNotFound(true);
          return;
        }
        if (res.data && typeof res.data === 'object') {
          const entity = res.data as Record<string, unknown>;
          setInitialData(toInitialDepartmentData(entity));
          setRawEntity(entity);
        }
      })
      .catch((err) => {
        if (isNotFoundErrorOrMessage(err)) {
          setNotFound(true);
          return;
        }
        showErrorToastUnlessAuth(err instanceof Error ? err.message : 'Failed to load department');
      })
      .finally(() => setDataLoading(false));
  }, [id]);

  const handleBack = useCallback(() => {
    navigate(entityConfig.routes.list);
  }, [navigate, entityConfig.routes.list]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!id) return;
    await deleteById(id, entityConfig.displayName);
    setShowDeleteDialog(false);
    navigate(entityConfig.routes.list);
  }, [id, deleteById, entityConfig.displayName, entityConfig.routes.list, navigate]);

  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const sectionClass = getSectionClass(isDarkMode);
  const isDeleting = deletingId === (id ?? '');

  const editUrl = entityConfig.routes.edit?.replace(':id', id ?? '') ?? '';
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

  const displayValue = initialData?.name as string | undefined;
  const viewPageHeading = getViewPageHeading(entityConfig, displayValue);
  const breadcrumbLabel = getViewBreadcrumbLabel(entityConfig, displayValue);

  const viewActions = [
    { label: 'Edit', href: editUrl },
    { label: 'Delete', onClick: () => setShowDeleteDialog(true), variant: 'danger' as const },
  ];

  if (dataLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading department...
          </p>
        </div>
      </div>
    );
  }

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
        <div className={sectionClass}>
          <h2
            className={`text-lg font-semibold mb-4 pb-2 border-b ${
              isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-300'
            }`}
          >
            {entityConfig.displayName} Info
          </h2>
          <StaticDepartmentForm
            initialData={initialData}
            isEdit={true}
            readOnly={true}
            wrapInForm={false}
            showActions={false}
          />
        </div>
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
