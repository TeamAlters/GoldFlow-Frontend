import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { getEntity } from '../../admin/admin.api';
import { showErrorToastUnlessAuth, isNotFoundErrorOrMessage, isNotFoundResponse } from '../../../shared/utils/errorHandling';
import { getSectionClass } from '../../../shared/utils/viewPageStyles';
import { useUIStore } from '../../../stores/ui.store';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import { toFromToAccessoryInitialData } from './accessoriesPurityRangeCreate';
import {
  getViewPageHeading,
  getViewBreadcrumbLabel,
  getViewPageDescription,
} from '../../../shared/utils/entityPageLabels';
import { getEntityDetailRoute } from '../../../shared/utils/referenceLinks';
import AuditTrailsCard from '../../../shared/components/AuditTrailsCard';
import ViewPageActionBar from '../../../shared/components/ViewPageActionBar';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';
import { useEntityDelete } from '../../../shared/hooks/useEntityDelete';
import { NOT_FOUND_PATH, NOT_FOUND_REASON_DEFAULT, NOT_FOUND_REASON_INVALID_URL } from '../../../config/navigation.config';

const ENTITY_NAME = 'accessories_purity_range';

export default function AccessoriesPurityRangeViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const entityConfig = getEntityConfig(ENTITY_NAME);

  const [data, setData] = useState<{
    from_value: string;
    to_value: string;
    accessory_purity: string;
    purity_range: string;
  } | undefined>(undefined);
  const [rawEntity, setRawEntity] = useState<Record<string, unknown> | undefined>(undefined);
  const [dataLoading, setDataLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  
  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { deleteById, deletingId } = useEntityDelete(ENTITY_NAME);
  const isDeleting = id != null && deletingId === id;

  useEffect(() => {
    if (!id) return;
    setDataLoading(true);
    getEntity(ENTITY_NAME, decodeURIComponent(id))
      .then((res) => {
        if (isNotFoundResponse(res)) {
          setNotFound(true);
          return;
        }
        if (res.data && typeof res.data === 'object') {
          const entity = res.data as Record<string, unknown>;
          setData(toFromToAccessoryInitialData(entity));
          setRawEntity(entity);
        }
      })
      .catch((err) => {
        if (isNotFoundErrorOrMessage(err)) {
          setNotFound(true);
          return;
        }
        const msg =
          err instanceof Error ? err.message : 'Failed to load accessories purity range';
        showErrorToastUnlessAuth(msg);
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
            Loading accessories purity range...
          </p>
        </div>
      </div>
    );
  }

  const labelClass = `block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`;
  const readOnlyInputClass = `w-full px-4 py-2.5 text-sm rounded-lg border ${isDarkMode
      ? 'bg-gray-700/50 border-gray-600 text-white'
      : 'bg-white border-gray-300 text-gray-900'
    }`;
  const viewPageHeading = getViewPageHeading(entityConfig, data?.purity_range);
  const breadcrumbLabel = getViewBreadcrumbLabel(entityConfig, data?.purity_range);

  const editUrlResolved = id
    ? (entityConfig.routes?.edit?.replace(':id', encodeURIComponent(id)) ?? '')
    : '';
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
        <div className={sectionClass}>
          <h2
            className={`text-lg font-semibold mb-4 pb-2 border-b ${
              isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-300'
            }`}
          >
            {entityConfig.displayName} Info
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>From Value</label>
              <div className={readOnlyInputClass}>{data?.from_value ?? '–'}</div>
            </div>
            <div>
              <label className={labelClass}>To Value</label>
              <div className={readOnlyInputClass}>{data?.to_value ?? '–'}</div>
            </div>
            <div>
              <label className={labelClass}>Accessory Purity</label>
              {(() => {
                const accessoryPurityValue = data?.accessory_purity ?? '–';
                const accessoryPurityRoute = getEntityDetailRoute('accessory_purity', data?.accessory_purity);
                if (accessoryPurityRoute) {
                  return (
                      <div className={readOnlyInputClass}>
                      <Link
                        to={accessoryPurityRoute}
                        className={isDarkMode
                          ? 'text-amber-400 hover:text-amber-300'
                          : 'text-amber-600 hover:text-amber-700'
                        }
                      >
                        {accessoryPurityValue}
                      </Link>
                    </div>
                  );
                }
                return <div className={readOnlyInputClass}>{accessoryPurityValue}</div>;
              })()}
            </div>
          </div>
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
