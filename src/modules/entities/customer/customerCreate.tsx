import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { createEntity, getEntityList } from '../../admin/admin.api';
import { toast } from '../../../stores/toast.store';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import StaticCustomerMasterForm, {
  type StaticCustomerMasterFormData,
  type StaticCustomerMasterFormRef,
  type SelectOption,
} from './customerForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';

const ENTITY_NAME = 'customer';

function parseNum(s: string): number | null {
  const t = s.trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function toInitialCustomerMasterData(
  entity: Record<string, unknown>
): Partial<StaticCustomerMasterFormData> {
  return {
    customer_name: entity.customer_name != null ? String(entity.customer_name) : '',
    purity: entity.purity != null ? String(entity.purity) : '',
    issue_purity:
      entity.issue_purity != null ? String(entity.issue_purity) : '',
    product_name: entity.product_name != null ? String(entity.product_name) : '',
    product_category:
      entity.product_category != null ? String(entity.product_category) : '',
    machine_size: entity.machine_size != null ? String(entity.machine_size) : '',
    design_name: entity.design_name != null ? String(entity.design_name) : '',
    wastage: entity.wastage != null ? String(entity.wastage) : '',
  };
}

export function toCustomerMasterPayload(
  data: StaticCustomerMasterFormData
): Record<string, unknown> {
  const issuePurity = parseNum(data.issue_purity);
  const wastageNum = parseNum(data.wastage);
  const payload: Record<string, unknown> = {
    customer_name: data.customer_name.trim(),
    purity: data.purity.trim(),
    product_name: data.product_name.trim(),
  };
  if (issuePurity !== null) payload.issue_purity = issuePurity;
  if (data.product_category.trim() !== '') payload.product_category = data.product_category.trim();
  if (data.machine_size.trim() !== '') payload.machine_size = data.machine_size.trim();
  if (data.design_name.trim() !== '') payload.design_name = data.design_name.trim();
  if (wastageNum !== null) payload.wastage = wastageNum;
  return payload;
}

export default function CustomerCreatePage() {
  const navigate = useNavigate();
  const entityConfig = getEntityConfig(ENTITY_NAME);
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
        const label = String(
          (labelKey ? row[labelKey] : val) ?? value
        );
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

  const handleSubmit = useCallback(
    async (formData: StaticCustomerMasterFormData) => {
      setSubmitLoading(true);
      try {
        await createEntity(ENTITY_NAME, toCustomerMasterPayload(formData));
        toast.success(`${entityConfig.displayName} created successfully.`);
        navigate(entityConfig.routes.list);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Request failed';
        showErrorToastUnlessAuth(msg);
      } finally {
        setSubmitLoading(false);
      }
    },
    [navigate, entityConfig]
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

  return (
    <div className="w-full">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: entityConfig.displayNamePlural, href: entityConfig.routes.list },
          { label: `Add ${entityConfig.displayName}` },
        ]}
        className="mb-4"
      />
      <div className="mb-6">
        <h1
          className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          Add {entityConfig.displayName}
        </h1>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Create a new customer record.
        </p>
      </div>
      <form
        onSubmit={handleFormSubmit}
        className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <StaticCustomerMasterForm
          ref={formRef}
          initialData={undefined}
          purityOptions={purityOptions}
          productOptions={productOptions}
          productCategoryOptions={productCategoryOptions}
          machineOptions={machineOptions}
          designOptions={designOptions}
          isEdit={false}
          wrapInForm={false}
          showActions={false}
        />
        <div className="flex items-center justify-end gap-3 pt-6 mt-6">
          <button
            type="button"
            onClick={handleCancel}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitLoading}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'} disabled:opacity-60`}
          >
            {submitLoading ? 'Saving...' : `Create ${entityConfig.displayName}`}
          </button>
        </div>
      </form>
    </div>
  );
}
