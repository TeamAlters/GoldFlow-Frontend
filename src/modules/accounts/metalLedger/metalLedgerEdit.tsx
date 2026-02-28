import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { getEntity, updateEntity } from '../../admin/admin.api';
import { toast } from '../../../stores/toast.store';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import MetalLedgerForm, {
  type MetalLedgerFormData,
  type MetalLedgerFormRef,
} from './metalLedgerForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import {
  toInitialMetalLedgerData,
  toMetalLedgerPayload,
} from './metalLedgerCreate';

const ENTITY_NAME = 'metal_ledger';

export default function MetalLedgerEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const entityConfig = getEntityConfig(ENTITY_NAME);

  const [initialData, setInitialData] = useState<Partial<MetalLedgerFormData> | undefined>(
    undefined
  );
  const [dataLoading, setDataLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  const metalLedgerFormRef = useRef<MetalLedgerFormRef>(null);

  useEffect(() => {
    if (!id) return;
    setDataLoading(true);
    getEntity(ENTITY_NAME, id)
      .then((res) => {
        if (res.data && typeof res.data === 'object') {
          const entity = res.data as Record<string, unknown>;
          setInitialData(toInitialMetalLedgerData(entity));
        }
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Failed to load metal ledger';
        showErrorToastUnlessAuth(msg);
      })
      .finally(() => setDataLoading(false));
  }, [id]);

  const handleSubmit = useCallback(
    async (formData: MetalLedgerFormData) => {
      if (!id) return;
      const payload = toMetalLedgerPayload(formData);
      setSubmitLoading(true);
      try {
        await updateEntity(ENTITY_NAME, id, payload);
        toast.success(`${entityConfig.displayName} updated successfully.`);
        navigate(entityConfig.routes.list);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Request failed';
        showErrorToastUnlessAuth(msg);
      } finally {
        setSubmitLoading(false);
      }
    },
    [id, navigate, entityConfig]
  );

  const handleCancel = useCallback(() => {
    navigate(entityConfig.routes.list);
  }, [navigate, entityConfig.routes.list]);

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (metalLedgerFormRef.current?.validate()) {
        const formData = metalLedgerFormRef.current.getData();
        handleSubmit(formData);
      }
    },
    [handleSubmit]
  );

  const isDarkMode = useUIStore((state) => state.isDarkMode);

  if (!id) {
    return <Navigate to={entityConfig.routes.list} replace />;
  }

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

  const breadcrumbLabel = `${initialData?.voucher_no ?? id}`;

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
        <h1
          className={`text-2xl sm:text-3xl font-bold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          {initialData?.voucher_no ?? id}
        </h1>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Update the metal ledger details below.
        </p>
      </div>
      <form
        onSubmit={handleFormSubmit}
        className={`p-6 rounded-xl border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
        }`}
      >
        <MetalLedgerForm
          ref={metalLedgerFormRef}
          initialData={initialData}
          isEdit={true}
          wrapInForm={false}
          showActions={false}
        />

        <div className="flex items-center justify-end gap-3 pt-6 mt-6">
          <button
            type="button"
            onClick={handleCancel}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitLoading}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            } disabled:opacity-60`}
          >
            {submitLoading ? 'Saving...' : 'Update'}
          </button>
        </div>
      </form>
    </div>
  );
}
