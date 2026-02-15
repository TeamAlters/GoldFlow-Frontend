import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import {
  getEntity,
  updateEntity,
  getEntityReferences,
  getEntityListOptions,
  getDepartmentOptions,
  mapProductReferencesToOptions,
  mapDepartmentReferencesToOptions,
} from '../../admin/admin.api';
import { toast } from '../../../stores/toast.store';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import StaticDepartmentGroupForm, {
  type StaticDepartmentGroupFormData,
  type StaticDepartmentGroupFormRef,
} from './departmentGroupForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import {
  getEditPageTitle,
  getEditBreadcrumbLabel,
  getEditPageDescription,
} from '../../../shared/utils/entityPageLabels';
import type { FormSelectOption } from '../../../shared/components/FormSelect';
import type { SortableTableRow } from '../../../shared/components/SortableTableWithAdd';
import { toProductDepartmentGroupPayload } from './departmentGroupCreate';

const ENTITY_NAME = 'product_department_group';

function parseDepartments(rows: unknown): SortableTableRow[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((r, i) => {
    const obj = r as Record<string, unknown>;
    const dept = obj.department;
    const departmentVal =
      typeof dept === 'string'
        ? dept
        : dept && typeof dept === 'object' && dept !== null && 'name' in dept
          ? String((dept as { name?: unknown }).name ?? '')
          : String(obj.department ?? '');
    return {
      id: String(obj.id ?? obj.name ?? `row-${i}-${Date.now()}`),
      order: i + 1,
      department_id: departmentVal,
      is_active: true,
    };
  });
}

export function toInitialDepartmentGroupData(
  entity: Record<string, unknown>
): Partial<StaticDepartmentGroupFormData> {
  return {
    name: entity.department_group_name != null ? String(entity.department_group_name) : '',
    order: entity.step_no != null ? String(entity.step_no) : '1',
    product_id: entity.product != null ? String(entity.product) : '',
    departments: parseDepartments(entity.departments),
  };
}

export default function DepartmentGroupEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const decodedId =
    id != null && String(id).trim() !== '' ? decodeURIComponent(String(id).trim()) : undefined;
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const [initialData, setInitialData] = useState<Partial<StaticDepartmentGroupFormData> | undefined>(
    undefined
  );
  const [dataLoading, setDataLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [productOptions, setProductOptions] = useState<FormSelectOption[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<FormSelectOption[]>([]);
  const formRef = useRef<StaticDepartmentGroupFormRef>(null);

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
      .then((items) => {
        const opts = mapDepartmentReferencesToOptions(items);
        if (opts.length > 0) return setDepartmentOptions(opts);
        return getEntityListOptions('department', 'department_name', 'department_name').then(setDepartmentOptions);
      })
      .catch(() =>
        getEntityListOptions('department', 'department_name', 'department_name')
          .then(setDepartmentOptions)
          .catch(() => setDepartmentOptions([]))
      );
  }, []);

  useEffect(() => {
    if (!decodedId) return;
    setDataLoading(true);
    getEntity(ENTITY_NAME, decodedId)
      .then((res) => {
        type ResShape = { data?: Record<string, unknown> };
        const data = (res as ResShape).data ?? (res as Record<string, unknown>);
        if (data && typeof data === 'object') {
          setInitialData(toInitialDepartmentGroupData(data));
        }
      })
      .catch((err) => {
        showErrorToastUnlessAuth(err instanceof Error ? err.message : 'Failed to load department group');
      })
      .finally(() => setDataLoading(false));
  }, [decodedId]);

  const handleSubmit = useCallback(
    async (formData: StaticDepartmentGroupFormData) => {
      if (!decodedId) return;
      setSubmitLoading(true);
      try {
        const payload = toProductDepartmentGroupPayload(formData, productOptions, departmentOptions);
        await updateEntity(ENTITY_NAME, decodedId, payload);
        toast.success(`${entityConfig.displayName} updated successfully.`);
        navigate(entityConfig.routes.list);
      } catch (err) {
        showErrorToastUnlessAuth(err instanceof Error ? err.message : 'Request failed');
      } finally {
        setSubmitLoading(false);
      }
    },
    [decodedId, navigate, entityConfig, productOptions, departmentOptions]
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
  const breadcrumbLabel = getEditBreadcrumbLabel(entityConfig, initialData?.name);

  if (!decodedId) {
    return <Navigate to={entityConfig.routes.list} replace />;
  }

  if (dataLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading department group...
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
        <h1
          className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          {getEditPageTitle(entityConfig)}
        </h1>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {getEditPageDescription(entityConfig)}
        </p>
      </div>
      <form
        onSubmit={handleFormSubmit}
        className={`p-6 rounded-xl border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
        }`}
      >
        <StaticDepartmentGroupForm
          ref={formRef}
          initialData={initialData}
          productOptions={productOptions}
          departmentOptions={departmentOptions}
          isEdit={true}
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
            {submitLoading ? 'Saving...' : `Update ${entityConfig.displayName}`}
          </button>
        </div>
      </form>
    </div>
  );
}
