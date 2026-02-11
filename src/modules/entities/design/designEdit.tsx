import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { getEntity, updateEntity, getEntityList } from '../../admin/admin.api';
import { toast } from '../../../stores/toast.store';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import StaticDesignForm, {
  type StaticDesignFormData,
  type StaticDesignFormRef,
  type ProductOption,
} from './designForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import { toInitialDesignData, toDesignPayload } from './designCreate';

const ENTITY_NAME = 'design';

export default function DesignEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const [initialData, setInitialData] = useState<Partial<StaticDesignFormData> | undefined>(
    undefined
  );
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const formRef = useRef<StaticDesignFormRef>(null);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setDataLoading(true);
    getEntity(ENTITY_NAME, id, { signal: controller.signal })
      .then((res) => {
        if (controller.signal.aborted) return;
        if (res.data && typeof res.data === 'object') {
          const entity = res.data as Record<string, unknown>;
          setInitialData(toInitialDesignData(entity));
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        const msg = err instanceof Error ? err.message : 'Failed to load design';
        showErrorToastUnlessAuth(msg);
      })
      .finally(() => {
        if (!controller.signal.aborted) setDataLoading(false);
      });
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    getEntityList('product', { page: 1, page_size: 500 })
      .then((res) => {
        const data = res.data as { items?: Record<string, unknown>[] } | undefined;
        const items = Array.isArray(data?.items) ? data.items : [];
        const options: ProductOption[] = items.map((row) => {
          const name = row.product_name ?? row.product_abbreviation ?? row.product_abbrevation;
          const value = String(row.product_name ?? name ?? '');
          return { value, label: String(name ?? value) };
        });
        setProductOptions(options);
      })
      .catch(() => setProductOptions([]));
  }, []);

  const handleSubmit = useCallback(
    async (formData: StaticDesignFormData) => {
      if (!id) return;
      setSubmitLoading(true);
      try {
        await updateEntity(ENTITY_NAME, id, toDesignPayload(formData));
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
      if (formRef.current?.validate()) {
        handleSubmit(formRef.current.getData());
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
            Loading design...
          </p>
        </div>
      </div>
    );
  }

  const breadcrumbLabel = initialData?.design_name ?? 'Edit Design';

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
          className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          Edit {entityConfig.displayName}
        </h1>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Update design information.
        </p>
      </div>
      <form
        onSubmit={handleFormSubmit}
        className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <StaticDesignForm
          key={id}
          ref={formRef}
          initialData={initialData}
          productOptions={productOptions}
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
            {submitLoading ? 'Saving...' : 'Update Design'}
          </button>
        </div>
      </form>
    </div>
  );
}
