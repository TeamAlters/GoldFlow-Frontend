import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { getEntity, updateEntity, getEntityReferenceOptions, getProductReferenceOptions } from '../../admin/admin.api';
import { toast } from '../../../stores/toast.store';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import { getSectionClass } from '../../../shared/utils/viewPageStyles';
import StaticDepartmentGroupForm, {
  type StaticDepartmentGroupFormData,
  type StaticDepartmentGroupFormRef,
} from './departmentGroupForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import { toDepartmentGroupPayload } from './departmentGroupCreate';
import {
  getEditPageTitle,
  getEditBreadcrumbLabel,
  getEditPageDescription,
} from '../../../shared/utils/entityPageLabels';
import type { FormSelectOption } from '../../../shared/components/FormSelect';
import type { SortableTableRow } from '../../../shared/components/SortableTableWithAdd';
import { NOT_FOUND_PATH, NOT_FOUND_REASON_INVALID_URL } from '../../../config/navigation.config';

const ENTITY_NAME = 'product_department_group';

function parseDepartments(rows: unknown): SortableTableRow[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((r, i) => {
    const obj = r as Record<string, unknown>;
    const dept = obj.department;
    const departmentId =
      obj.department != null
        ? String(obj.department)
        : obj.department_id != null
          ? String(obj.department_id)
          : dept && typeof dept === 'object' && dept !== null && 'id' in dept
            ? String((dept as { id?: unknown }).id ?? '')
            : '';
    const serverId = obj.id != null ? String(obj.id) : '';
    const isClientId = serverId.startsWith('row-');
    const productDepartmentId =
      obj.product_department_id != null
        ? String(obj.product_department_id)
        : serverId && !isClientId
          ? serverId
          : undefined;
    return {
      id: serverId || `row-${i}-${Date.now()}`,
      order: typeof obj.order === 'number' ? obj.order : (obj.step_no as number) ?? i + 1,
      department_id: departmentId,
      is_active: obj.is_active === true,
      ...(productDepartmentId ? { product_department_id: productDepartmentId } : {}),
    };
  });
}

export function toInitialDepartmentGroupData(
  entity: Record<string, unknown>
): Partial<StaticDepartmentGroupFormData> {
  const departments = entity.departments;
  return {
    name: entity.name != null ? String(entity.name) : '',
    order: entity.step_no != null ? String(entity.step_no) : '',
    product_id: entity.product != null ? String(entity.product) : entity.product_id != null ? String(entity.product_id) : '',
    is_active: entity.is_active === true,
    departments: parseDepartments(departments),
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
  const [departmentsConfig, setDepartmentsConfig] = useState<Record<string, unknown>[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [productOptions, setProductOptions] = useState<FormSelectOption[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<FormSelectOption[]>([]);
  const formRef = useRef<StaticDepartmentGroupFormRef>(null);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      getProductReferenceOptions(),
      getEntityReferenceOptions('department'),
    ])
      .then(([products, departments]) => {
        if (ignore) return;
        setProductOptions(products);
        setDepartmentOptions(departments);
      })
      .catch(() => {
        if (!ignore) {
          setProductOptions([]);
          setDepartmentOptions([]);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!decodedId) return;
    let ignore = false;
    setDataLoading(true);
    getEntity(ENTITY_NAME, decodedId)
      .then((res) => {
        if (ignore) return;
        if (res.data && typeof res.data === 'object') {
          const entity = res.data as Record<string, unknown>;
          setInitialData(toInitialDepartmentGroupData(entity));
          const raw = entity.departments;
          setDepartmentsConfig(Array.isArray(raw) ? (raw as Record<string, unknown>[]) : []);
        }
      })
      .catch((err) => {
        if (!ignore) {
          showErrorToastUnlessAuth(err instanceof Error ? err.message : 'Failed to load department group');
        }
      })
      .finally(() => {
        if (!ignore) setDataLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [decodedId]);

  const refetchDepartmentGroup = useCallback(() => {
    if (!decodedId) return;
    getEntity(ENTITY_NAME, decodedId)
      .then((res) => {
        if (res.data && typeof res.data === 'object') {
          const entity = res.data as Record<string, unknown>;
          setInitialData(toInitialDepartmentGroupData(entity));
          const raw = entity.departments;
          setDepartmentsConfig(Array.isArray(raw) ? (raw as Record<string, unknown>[]) : []);
        }
      })
      .catch(() => {});
  }, [decodedId]);

  const handleSubmit = useCallback(
    async (formData: StaticDepartmentGroupFormData) => {
      if (!decodedId) return;
      setSubmitLoading(true);
      try {
        await updateEntity(ENTITY_NAME, decodedId, toDepartmentGroupPayload(formData, departmentsConfig));
        toast.success(`${entityConfig.displayName} updated successfully.`);
        navigate(entityConfig.routes.list);
      } catch (err) {
        showErrorToastUnlessAuth(err instanceof Error ? err.message : 'Request failed');
      } finally {
        setSubmitLoading(false);
      }
    },
    [decodedId, navigate, entityConfig]
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
  const sectionClass = getSectionClass(isDarkMode);
  const breadcrumbLabel = getEditBreadcrumbLabel(entityConfig, initialData?.name);

  if (!decodedId) {
    return (
      <Navigate to={NOT_FOUND_PATH} state={{ reason: NOT_FOUND_REASON_INVALID_URL }} replace />
    );
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
        className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
          }`}
      >
        <div className={sectionClass}>
        <h2
          className={`text-lg font-semibold mb-4 pb-2 border-b ${isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-300'}`}
        >
          {entityConfig.displayName} Info
        </h2>
        <StaticDepartmentGroupForm
          ref={formRef}
          initialData={initialData}
          productOptions={productOptions}
          departmentOptions={departmentOptions}
          isEdit={true}
          wrapInForm={false}
          showActions={false}
          departmentsConfig={departmentsConfig}
          departmentGroupId={decodedId}
          onConfigSaved={refetchDepartmentGroup}
        />
        <div className="flex items-center justify-end gap-3 pt-6 mt-6">
          <button
            type="button"
            onClick={handleCancel}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
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
            {submitLoading ? 'Saving...' : 'Update'}
          </button>
        </div>
        </div>
      </form>
    </div>
  );
}
