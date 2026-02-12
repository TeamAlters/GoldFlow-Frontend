import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { getEntity, getEntityList, updateEntity } from '../../admin/admin.api';
import { toast } from '../../../stores/toast.store';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import StaticCustomerMasterForm, {
  type StaticCustomerMasterFormData,
  type StaticCustomerMasterFormRef,
  type SelectOption,
} from './customerForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import { toInitialCustomerMasterData, toCustomerMasterPayload } from './customerCreate';

const ENTITY_NAME = 'customer';

export default function CustomerEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const entityConfig = getEntityConfig(ENTITY_NAME);

  const [initialData, setInitialData] = useState<Partial<StaticCustomerMasterFormData> | undefined>(
    undefined
  );
  const [dataLoading, setDataLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [purityOptions, setPurityOptions] = useState<SelectOption[]>([]);
  const [productOptions, setProductOptions] = useState<SelectOption[]>([]);
  const [productCategoryOptions, setProductCategoryOptions] = useState<SelectOption[]>([]);
  const [machineOptions, setMachineOptions] = useState<SelectOption[]>([]);
  const [designOptions, setDesignOptions] = useState<SelectOption[]>([]);
  const formRef = useRef<StaticCustomerMasterFormRef>(null);

  useEffect(() => {
    const mapList = (
      items: Record<string, unknown>[],
      valueKey: string,
      labelKey?: string
    ): SelectOption[] =>
      items.map((row) => {
        const val = row[valueKey];
        const value = String(val ?? '');
        const label = String((labelKey ? row[labelKey] : val) ?? value);
        return { value, label };
      });

    Promise.all([
      getEntityList('purity', { page: 1, page_size: 500 }).then((res) => {
        const data = res.data as { items?: Record<string, unknown>[] } | undefined;
        const items = Array.isArray(data?.items) ? data.items : [];
        setPurityOptions(mapList(items, 'purity'));
      }),
      getEntityList('product', { page: 1, page_size: 500 }).then((res) => {
        const data = res.data as { items?: Record<string, unknown>[] } | undefined;
        const items = Array.isArray(data?.items) ? data.items : [];
        const opts = items.map((row) => {
          const name = row.product_name ?? row.product_abbreviation ?? row.product_abbrevation;
          const value = String(row.product_name ?? name ?? '');
          return { value, label: String(name ?? value) };
        });
        setProductOptions(opts);
      }),
      getEntityList('product_category', { page: 1, page_size: 500 }).then((res) => {
        const data = res.data as { items?: Record<string, unknown>[] } | undefined;
        const items = Array.isArray(data?.items) ? data.items : [];
        setProductCategoryOptions(mapList(items, 'product_category'));
      }),
      getEntityList('machine', { page: 1, page_size: 500 }).then((res) => {
        const data = res.data as { items?: Record<string, unknown>[] } | undefined;
        const items = Array.isArray(data?.items) ? data.items : [];
        setMachineOptions(mapList(items, 'machine_name'));
      }),
      getEntityList('design', { page: 1, page_size: 500 }).then((res) => {
        const data = res.data as { items?: Record<string, unknown>[] } | undefined;
        const items = Array.isArray(data?.items) ? data.items : [];
        setDesignOptions(mapList(items, 'design_name'));
      }),
    ]).catch(() => { });
  }, []);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setDataLoading(true);
    getEntity(ENTITY_NAME, id, { signal: controller.signal })
      .then((res) => {
        if (controller.signal.aborted) return;
        if (res.data && typeof res.data === 'object') {
          const entity = res.data as Record<string, unknown>;
          setInitialData(toInitialCustomerMasterData(entity));
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        const msg = err instanceof Error ? err.message : 'Failed to load customer master';
        showErrorToastUnlessAuth(msg);
      })
      .finally(() => {
        if (!controller.signal.aborted) setDataLoading(false);
      });
    return () => controller.abort();
  }, [id]);

  const handleSubmit = useCallback(
    async (formData: StaticCustomerMasterFormData) => {
      if (!id) return;
      setSubmitLoading(true);
      try {
        await updateEntity(ENTITY_NAME, id, toCustomerMasterPayload(formData));
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
            Loading customer master...
          </p>
        </div>
      </div>
    );
  }

  const breadcrumbLabel = initialData?.customer_name ?? 'Edit Customer Master';

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
          Update customer master information.
        </p>
      </div>
      <form
        onSubmit={handleFormSubmit}
        className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <StaticCustomerMasterForm
          ref={formRef}
          initialData={initialData}
          purityOptions={purityOptions}
          productOptions={productOptions}
          productCategoryOptions={productCategoryOptions}
          machineOptions={machineOptions}
          designOptions={designOptions}
          isEdit={true}
          wrapInForm={false}
          showActions={false}
        />
        <div className="flex items-center justify-end gap-3 pt-6 mt-6">
          <button
            type="button"
            onClick={handleCancel}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm ${isDarkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitLoading}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${isDarkMode
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
              } disabled:opacity-60`}
          >
            {submitLoading ? 'Saving...' : `Update ${entityConfig.displayName}`}
          </button>
        </div>
      </form>
    </div>
  );
}
