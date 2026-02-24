import { useEffect, useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { deleteEntity } from '../../admin/admin.api';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import { toast } from '../../../stores/toast.store';
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
import BackButton from '../../../shared/components/BackButton';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';

const ENTITY_NAME = 'customer';

/** View page: only load the customer entity. Dropdown options are not fetched; form shows values as text when options are empty. */
const EMPTY_OPTIONS: { value: string; label: string }[] = [];

export default function CustomerViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const { data: rawEntity, loading: dataLoading, error: loadError } = useEntityLoad(
    ENTITY_NAME,
    id ?? undefined,
    { errorMessage: 'Failed to load customer details' }
  );

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const initialData = useMemo(
    () => (rawEntity ? toInitialCustomerMasterData(rawEntity) : undefined),
    [rawEntity]
  );

  useEffect(() => {
    if (loadError) showErrorToastUnlessAuth(loadError);
  }, [loadError]);

  const handleBack = useCallback(() => {
    navigate(entityConfig.routes.list);
  }, [navigate, entityConfig.routes.list]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deleteEntity(ENTITY_NAME, id);
      toast.success(`${entityConfig.displayName} deleted successfully.`);
      navigate(entityConfig.routes.list);
    } catch (err) {
      const msg = err instanceof Error ? err.message : `Failed to delete ${entityConfig.displayName}`;
      showErrorToastUnlessAuth(msg);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  }, [id, entityConfig, navigate]);

  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const editUrl = entityConfig.routes.edit.replace(':id', id ?? '');

  if (!id) {
    return <Navigate to={entityConfig.routes.list} replace />;
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
      <div className="w-full">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: entityConfig.displayNamePlural, href: entityConfig.routes.list },
            { label: getViewPageHeading(entityConfig, undefined) },
          ]}
          className="mb-4"
        />
        <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{loadError}</p>
          <div className="flex items-center gap-3 mt-4">
            <BackButton onClick={handleBack} />
            <button
              type="button"
              onClick={handleBack}
              className={`px-4 py-2.5 rounded-lg font-semibold text-sm ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
            >
              Back to list
            </button>
          </div>
        </div>
      </div>
    );
  }

  const viewPageHeading = getViewPageHeading(entityConfig, initialData?.customer_name);
  const breadcrumbLabel = getViewBreadcrumbLabel(entityConfig, initialData?.customer_name);

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
        <div className="flex items-center gap-3 shrink-0">
          <BackButton onClick={handleBack} />
          <Link
            to={editUrl}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${isDarkMode
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
          >
            Edit {entityConfig.displayName}
          </Link>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${
              isDarkMode
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            Delete
          </button>
        </div>
      </div>
      <div
        className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <h2
          className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
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
