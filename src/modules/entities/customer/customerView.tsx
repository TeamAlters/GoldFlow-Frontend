import { useEffect, useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { getSectionClass } from '../../../shared/utils/viewPageStyles';
import { useUIStore } from '../../../stores/ui.store';
import { useEntityLoad } from '../../../shared/hooks/useEntityLoad';
import StaticCustomerMasterForm from './customerForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import { toInitialCustomerMasterData } from './customerCreate';
import {
  getViewPageHeading,
  getViewBreadcrumbLabel,
  getViewPageDescription,
} from '../../../shared/utils/entityPageLabels';
import AuditTrailsCard from '../../../shared/components/AuditTrailsCard';
import ViewPageActionBar from '../../../shared/components/ViewPageActionBar';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';
import { useEntityDelete } from '../../../shared/hooks/useEntityDelete';
import { NOT_FOUND_PATH, NOT_FOUND_REASON_DEFAULT, NOT_FOUND_REASON_INVALID_URL } from '../../../config/navigation.config';

const ENTITY_NAME = 'customer';

/** View page: only load the customer entity. Dropdown options are not fetched; form shows values as text when options are empty. */
const EMPTY_OPTIONS: { value: string; label: string }[] = [];

export default function CustomerViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const { data: rawEntity, loading: dataLoading, error: loadError, notFound } = useEntityLoad(
    ENTITY_NAME,
    id ?? undefined,
    { errorMessage: 'Failed to load customer details' }
  );

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { deleteById, deletingId } = useEntityDelete(ENTITY_NAME);

  const initialData = useMemo(
    () => (rawEntity ? toInitialCustomerMasterData(rawEntity) : undefined),
    [rawEntity]
  );

  useEffect(() => {
    if (loadError && !notFound) showErrorToastUnlessAuth(loadError);
  }, [loadError, notFound]);

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

  if (dataLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading customer details...
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

  const viewPageHeading = getViewPageHeading(entityConfig, initialData?.customer_name);
  const breadcrumbLabel = getViewBreadcrumbLabel(entityConfig, initialData?.customer_name);

  const viewActions = [
    { label: 'Edit', href: editUrl },
    { label: 'Delete', onClick: () => setShowDeleteDialog(true), variant: 'danger' as const },
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
        <div className={sectionClass}>
          <h2
            className={`text-lg font-semibold mb-4 pb-2 border-b ${
              isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-300'
            }`}
          >
            {entityConfig.displayName} Info
          </h2>
          <StaticCustomerMasterForm
            initialData={initialData}
            purityOptions={EMPTY_OPTIONS}
            productOptions={EMPTY_OPTIONS}
            productCategoryOptions={EMPTY_OPTIONS}
            machineOptions={EMPTY_OPTIONS}
            designOptions={EMPTY_OPTIONS}
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
