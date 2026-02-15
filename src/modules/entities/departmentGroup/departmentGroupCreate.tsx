import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import {
  createEntity,
  getEntityReferences,
  getEntityListOptions,
  getDepartmentOptions,
  mapProductReferencesToOptions,
} from '../../admin/admin.api';
import { toast } from '../../../stores/toast.store';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import StaticDepartmentGroupForm, {
  type StaticDepartmentGroupFormData,
  type StaticDepartmentGroupFormRef,
} from './departmentGroupForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import type { FormSelectOption } from '../../../shared/components/FormSelect';

const ENTITY_NAME = 'product_department_group';

/** Map form data to API payload for POST /api/v1/product/department-groups */
export function toProductDepartmentGroupPayload(
  data: StaticDepartmentGroupFormData,
  productOptions: FormSelectOption[],
  departmentOptions: FormSelectOption[]
): Record<string, unknown> {
  const productName = productOptions.find((o) => o.value === data.product_id)?.label ?? data.product_id;
  const departments = data.departments.map((r, i) => ({
    department: departmentOptions.find((o) => o.value === r.department_id)?.label ?? r.department_id,
    step_no: i + 1,
    requires_issue: true,
    requires_receive: true,
    allows_loss: false,
    loss_percentage: 100,
    is_optional: false,
    allow_rework: true,
    is_final_department: false,
  }));
  return {
    product: productName,
    department_group_name: data.name.trim(),
    step_no: data.order.trim() !== '' ? parseInt(data.order, 10) : 1,
    departments,
  };
}

export default function DepartmentGroupCreatePage() {
  const navigate = useNavigate();
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [productOptions, setProductOptions] = useState<FormSelectOption[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<FormSelectOption[]>([]);
  const [deptLoadStatus, setDeptLoadStatus] = useState<'loading' | 'ok' | 'fail'>('loading');
  const formRef = useRef<StaticDepartmentGroupFormRef>(null);
  const initialFormData = useMemo(
    () => ({
      departments: [
        { id: `row-init-${Date.now()}`, order: 1, department_id: '', is_active: true },
      ],
    }),
    []
  );

  useEffect(() => {
    getEntityReferences('product')
      .then((items) => {
        const opts = mapProductReferencesToOptions(items);
        if (opts.length > 0) return setProductOptions(opts);
        return getEntityListOptions('product', 'product_name', 'product_name').then(setProductOptions);
      })
      .catch(() =>
        getEntityListOptions('product', 'product_name', 'product_name')
          .then(setProductOptions)
          .catch(() => setProductOptions([]))
      );

    getDepartmentOptions()
      .then((opts) => {
        setDepartmentOptions(opts ?? []);
        setDeptLoadStatus('ok');
      })
      .catch(() => {
        setDepartmentOptions([]);
        setDeptLoadStatus('fail');
        toast.error('Could not load departments. Please refresh the page or sign in again.');
      });
  }, []);

  const handleSubmit = useCallback(
    async (formData: StaticDepartmentGroupFormData) => {
      setSubmitLoading(true);
      try {
        const payload = toProductDepartmentGroupPayload(formData, productOptions, departmentOptions);
        const res = await createEntity(ENTITY_NAME, payload);
        toast.success(`${entityConfig.displayName} created successfully.`);
        const data = (res as { data?: Record<string, unknown> })?.data ?? res;
        const name = (data as Record<string, unknown>)?.department_group_name as string | undefined;
        navigate( 
          name != null
            ? entityConfig.routes.detail.replace(':id', encodeURIComponent(String(name)))
            : entityConfig.routes.list
        );
      } catch (err) {
        showErrorToastUnlessAuth(err instanceof Error ? err.message : 'Request failed');
      } finally {
        setSubmitLoading(false);
      }
    },
    [navigate, entityConfig, productOptions, departmentOptions]
  );

  const handleCancel = useCallback(() => {
    navigate(entityConfig.routes.list);
  }, [navigate, entityConfig.routes.list]);

  const retryLoadDepartments = useCallback(() => {
    setDeptLoadStatus('loading');
    getDepartmentOptions()
      .then((opts) => {
        setDepartmentOptions(opts ?? []);
        setDeptLoadStatus('ok');
        if ((opts ?? []).length > 0) toast.success('Departments loaded.');
      })
      .catch(() => {
        setDepartmentOptions([]);
        setDeptLoadStatus('fail');
        toast.error('Could not load departments. Please sign in and try again.');
      });
  }, []);

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
          Create a new product department group.
        </p>
      </div>
      {(deptLoadStatus === 'fail' || (deptLoadStatus === 'ok' && departmentOptions.length === 0)) && (
        <div className={`mb-4 p-3 rounded-lg text-sm flex items-center justify-between gap-4 ${isDarkMode ? 'bg-amber-900/30 border border-amber-700 text-amber-200' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}>
          <span>
            Departments {deptLoadStatus === 'fail' ? 'failed to load. Please sign in or check your connection.' : 'returned no options.'}
          </span>
          <button
            type="button"
            onClick={retryLoadDepartments}
            className={`px-3 py-1.5 rounded font-medium text-sm shrink-0 ${isDarkMode ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-amber-200 hover:bg-amber-300 text-amber-900'}`}
          >
            Retry
          </button>
        </div>
      )}
      <form
        onSubmit={handleFormSubmit}
        className={`p-6 rounded-xl border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
        }`}
      >
        <StaticDepartmentGroupForm
          ref={formRef}
          initialData={initialFormData}
          productOptions={productOptions}
          departmentOptions={departmentOptions}
          isEdit={false}
          wrapInForm={false}
          showActions={false}
        />
        <div className={`flex items-center justify-end gap-3 pt-6 mt-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            type="button"
            onClick={handleCancel}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm ${
              isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
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
            {submitLoading ? 'Saving...' : `Create ${entityConfig.displayName}`}
          </button>
        </div>
      </form>
    </div>
  );
}
