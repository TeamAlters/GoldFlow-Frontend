import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { getEntity, updateEntityStatus } from '../../admin/admin.api';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { getSectionClass } from '../../../shared/utils/viewPageStyles';
import { useUIStore } from '../../../stores/ui.store';
import { toast } from '../../../stores/toast.store';
import MetalLedgerForm, { type MetalLedgerFormData } from './metalLedgerForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import { toInitialMetalLedgerData } from './metalLedgerCreate';
import BackButton from '../../../shared/components/BackButton';
import { closeMetalLedger } from './metalLedger.api';
import { NOT_FOUND_PATH, NOT_FOUND_REASON_INVALID_URL } from '../../../config/navigation.config';

const ENTITY_NAME = 'metal_ledger';

export default function MetalLedgerViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const entityConfig = getEntityConfig(ENTITY_NAME);

  const [initialData, setInitialData] = useState<Partial<MetalLedgerFormData> | undefined>(
    undefined
  );
  const [rawEntity, setRawEntity] = useState<Record<string, unknown> | undefined>(undefined);
  const [dataLoading, setDataLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Check if status is Draft
  const isDraft = initialData?.status === 'Draft';

  const loadData = useCallback(() => {
    if (!id) return;
    setDataLoading(true);
    getEntity(ENTITY_NAME, id)
      .then((res) => {
        if (res.data && typeof res.data === 'object') {
          const wrapper = res.data as { data?: unknown };
          const inner =
            wrapper.data && typeof wrapper.data === 'object'
              ? (wrapper.data as Record<string, unknown>)
              : (res.data as Record<string, unknown>);

          setInitialData(toInitialMetalLedgerData(inner));
          setRawEntity(inner);
        }
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Failed to load metal ledger';
        showErrorToastUnlessAuth(msg);
      })
      .finally(() => setDataLoading(false));
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBack = useCallback(() => {
    navigate(entityConfig.routes.list);
  }, [navigate, entityConfig.routes.list]);

  const handleSendToManufacturing = useCallback(async () => {
    if (!id) return;
    setStatusUpdating(true);
    try {
      const res = await updateEntityStatus(ENTITY_NAME, id, 'Sent to Manufacturing');
      if (res.success) {
        toast.success('Metal Ledger sent to Manufacturing successfully');
        // Reload data to get updated status
        loadData();
      } else {
        showErrorToastUnlessAuth(res.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('[MetalLedgerView] Update error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to send to Manufacturing';
      showErrorToastUnlessAuth(msg);
    } finally {
      setStatusUpdating(false);
    }
  }, [id, loadData]);

  const handleCloseLedger = useCallback(async () => {
    if (!id) return;
    setStatusUpdating(true);
    try {
      const res = await closeMetalLedger(id);
      if (res.success) {
        toast.success('Metal Ledger closed successfully');
        loadData();
      } else {
        showErrorToastUnlessAuth(res.message || 'Failed to close metal ledger');
      }
    } catch (err) {
      console.error('[MetalLedgerView] Close error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to close metal ledger';
      showErrorToastUnlessAuth(msg);
    } finally {
      setStatusUpdating(false);
    }
  }, [id, loadData]);

  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const sectionClass = getSectionClass(isDarkMode);

  const editUrl = entityConfig.routes.edit?.replace(':id', id ?? '') ?? '';

  if (!id) {
    return (
      <Navigate to={NOT_FOUND_PATH} state={{ reason: NOT_FOUND_REASON_INVALID_URL }} replace />
    );
  }

  const displayValue = initialData?.voucher_no ?? id;
  const entryType =
    (initialData?.entry_type && String(initialData.entry_type).toUpperCase()) ||
    '';

  const breadcrumbLabel = displayValue;

  if (dataLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading metal ledger...
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
            className={`text-2xl sm:text-3xl font-bold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            {displayValue}
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            View the metal ledger details below.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <BackButton onClick={handleBack} />
          {isDraft && (
            <>
              <Link
                to={editUrl}
                className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${
                  isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                Edit
              </Link>
              {entryType === 'RECEIPT' && (
                <button
                  type="button"
                  onClick={handleSendToManufacturing}
                  disabled={statusUpdating}
                  className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${
                    isDarkMode
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  } disabled:opacity-60`}
                >
                  {statusUpdating ? 'Sending...' : 'Send to Manufacturing'}
                </button>
              )}
              {entryType === 'ISSUE' && (
                <button
                  type="button"
                  onClick={handleCloseLedger}
                  disabled={statusUpdating}
                  className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${
                    isDarkMode
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  } disabled:opacity-60`}
                >
                  {statusUpdating ? 'Closing...' : 'Close'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
      <div
        className={`p-6 rounded-xl border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
        }`}
      >
        <div className={sectionClass}>
          <h2
            className={`text-lg font-semibold mb-4 pb-2 border-b ${
              isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-300'
            }`}
          >
            {entityConfig.displayName} Info
          </h2>
          <MetalLedgerForm
            initialData={initialData}
            isEdit={true}
            readOnly={true}
            wrapInForm={false}
            showActions={false}
          />
        </div>
      </div>
    </div>
  );
}
