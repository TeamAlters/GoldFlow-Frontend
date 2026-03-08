import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { getEntityDetailRoute } from '../../../shared/utils/referenceLinks';
import { getEntity } from '../../admin/admin.api';
import { closeParentMeltingLot } from './parentMeltingLot.api';
import { showErrorToastUnlessAuth, isNotFoundErrorOrMessage, isNotFoundResponse } from '../../../shared/utils/errorHandling';
import { getSectionClass } from '../../../shared/utils/viewPageStyles';
import { toast } from '../../../stores/toast.store';
import { useUIStore } from '../../../stores/ui.store';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import ViewPageActionBar from '../../../shared/components/ViewPageActionBar';
import type { ViewPageAction } from '../../../shared/components/ViewPageActions';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';
import AuditTrailsCard from '../../../shared/components/AuditTrailsCard';
import { useEntityDelete } from '../../../shared/hooks/useEntityDelete';
import {
  getViewPageHeading,
  getViewBreadcrumbLabel,
  getViewPageDescription,
} from '../../../shared/utils/entityPageLabels';
import { NOT_FOUND_PATH, NOT_FOUND_REASON_DEFAULT, NOT_FOUND_REASON_INVALID_URL } from '../../../config/navigation.config';

const ENTITY_NAME = 'parent_melting_lot';

interface ParentMeltingLotData {
  name: string;
  product: string;
  product_abbreviation: string;
  purity: string;
  status: string;
  created_at: string;
  modified_at: string;
  created_by: string;
  modified_by: string;
}

export default function ParentMeltingLotViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const sectionClass = getSectionClass(isDarkMode);

  const [data, setData] = useState<ParentMeltingLotData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
          const entity = res.data as unknown as ParentMeltingLotData;
          setData(entity);
        }
      })
      .catch((err) => {
        if (isNotFoundErrorOrMessage(err)) {
          setNotFound(true);
          return;
        }
        const msg = err instanceof Error ? err.message : 'Failed to load parent melting lot';
        showErrorToastUnlessAuth(msg);
      })
      .finally(() => setDataLoading(false));
  }, [id]);

  const handleBack = useCallback(() => {
    navigate(entityConfig.routes.list);
  }, [navigate, entityConfig.routes.list]);

  const handleCloseClick = useCallback(() => {
    setShowCloseConfirm(true);
  }, []);

  const handleCloseConfirm = useCallback(async () => {
    setShowCloseConfirm(false);
    if (!data?.name) return;
    
    setIsClosing(true);
    try {
      const response = await closeParentMeltingLot(data.name);

      if (response.success) {
        toast.success(response.message || 'Parent melting lot closed successfully');
        // Refresh the data
        const res = await getEntity(ENTITY_NAME, id!);
        if (res.data && typeof res.data === 'object') {
          setData(res.data as unknown as ParentMeltingLotData);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to close parent melting lot';
      showErrorToastUnlessAuth(msg);
    } finally {
      setIsClosing(false);
    }
  }, [data?.name, id]);

  const handleCloseCancel = useCallback(() => {
    setShowCloseConfirm(false);
  }, []);

  // When Closed: show no actions (no Edit, Delete, Close). Draft: show Delete + Close; otherwise show Edit.
  const statusLower = data?.status?.trim().toLowerCase() ?? '';
  const isClosed = statusLower === 'closed';
  const isDraft = statusLower === 'draft';
  const canEdit = !isClosed;
  const editUrl = entityConfig.routes.edit?.replace(':id', id ?? '') ?? '';
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

  const displayValue = data?.name || 'Parent Melting Lot';
  const viewPageHeading = getViewPageHeading(entityConfig, displayValue);
  const breadcrumbLabel = getViewBreadcrumbLabel(entityConfig, displayValue);

  const viewActions: ViewPageAction[] = [];
  if (isDraft) {
    viewActions.push({
      label: 'Delete',
      onClick: () => setShowDeleteConfirm(true),
      variant: 'danger',
      disabled: isDeleting,
    });
    viewActions.push({
      label: 'Close',
      onClick: handleCloseClick,
      variant: 'danger',
      disabled: isClosing,
    });
  }
  if (canEdit) {
    viewActions.push({ label: 'Edit', href: editUrl });
  }

  const labelClass = `block text-sm font-semibold mb-1 ${
    isDarkMode ? 'text-gray-400' : 'text-gray-600'
  }`;

  const valueClass = `min-h-[42px] px-4 py-2.5 flex items-center rounded-lg border text-sm font-medium ${
    isDarkMode ? 'bg-gray-700/50 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'
  }`;

  if (dataLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading parent melting lot...
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
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1
            className={`text-2xl sm:text-3xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            {viewPageHeading}
          </h1>
          <div className="flex items-center gap-3">
            <ViewPageActionBar onBack={handleBack} actions={viewActions} isDarkMode={isDarkMode} />
          </div>
        </div>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {getViewPageDescription(entityConfig)}
        </p>
      </div>

      <div
        className={`p-6 rounded-xl border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
        }`}
      >
        {/* Parent Melting Lot Details Section */}
        <div className={sectionClass}>
          <h2
            className={`text-lg font-semibold mb-4 pb-2 border-b ${
              isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-300'
            }`}
          >
            Parent Melting Lot Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Product</label>
              <div className={valueClass}>
                {data?.product
                  ? (() => {
                      const r = getEntityDetailRoute('product', data.product);
                      return r ? (
                        <Link
                          to={r}
                          className={
                            isDarkMode
                              ? 'text-amber-400 hover:text-amber-300'
                              : 'text-amber-600 hover:text-amber-700'
                          }
                        >
                          {data.product}
                        </Link>
                      ) : (
                        data.product
                      );
                    })()
                  : '–'}
              </div>
            </div>
            <div>
              <label className={labelClass}>Product Abbreviation</label>
              <div className={valueClass}>{data?.product_abbreviation || '–'}</div>
            </div>
            <div>
              <label className={labelClass}>Purity</label>
              <div className={valueClass}>
                {data?.purity
                  ? (() => {
                      const r = getEntityDetailRoute('purity', data.purity);
                      return r ? (
                        <Link
                          to={r}
                          className={
                            isDarkMode
                              ? 'text-amber-400 hover:text-amber-300'
                              : 'text-amber-600 hover:text-amber-700'
                          }
                        >
                          {data.purity}
                        </Link>
                      ) : (
                        data.purity
                      );
                    })()
                  : '–'}
              </div>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <div className={valueClass}>{data?.status || '–'}</div>
            </div>
          </div>
        </div>

        <AuditTrailsCard entity={data as Record<string, unknown> | null} asSection />
      </div>

      <ConfirmationDialog
        isOpen={showCloseConfirm}
        onClose={handleCloseCancel}
        onConfirm={handleCloseConfirm}
        title="Close Parent Melting Lot"
        message={`Are you sure you want to close "${data?.name}"? This action cannot be undone.`}
        confirmLabel="Close"
        cancelLabel="Cancel"
        variant="danger"
      />
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          if (!id) return;
          await deleteById(id, entityConfig.displayName);
          setShowDeleteConfirm(false);
          navigate(entityConfig.routes.list);
        }}
        title={`Delete ${entityConfig.displayName}`}
        message={`Are you sure you want to delete "${data?.name || entityConfig.displayName}"? This action cannot be undone.`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}
