import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { createEntity, getEntityReferenceOptions } from '../../admin/admin.api';
import { getCreatedEntityId } from '../../../shared/utils/entityNavigation';
import { toast } from '../../../stores/toast.store';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import { getSectionClass } from '../../../shared/utils/viewPageStyles';
import StaticDepartmentGroupForm, {
  type StaticDepartmentGroupFormData,
  type StaticDepartmentGroupFormRef,
} from './departmentGroupForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import type { FormSelectOption } from '../../../shared/components/FormSelect';
const ENTITY_NAME = 'product_department_group';

export function toDepartmentGroupPayload(
  data: StaticDepartmentGroupFormData
): Record<string, unknown> {
  const departments = data.departments.map((r, i) => ({
    order: i + 1,
    department_id: r.department_id || null,
    is_active: r.is_active,
  }));
  return {
    name: data.name.trim(),
    order: data.order.trim() !== '' ? parseInt(data.order, 10) : 0,
    product_id: data.product_id.trim() || null,
    departments,
  };
}

export default function DepartmentGroupCreatePage() {
  const navigate = useNavigate();
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [productOptions, setProductOptions] = useState<FormSelectOption[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<FormSelectOption[]>([]);
  const formRef = useRef<StaticDepartmentGroupFormRef>(null);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      getEntityReferenceOptions('product', 'product_name', 'product_name'),
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

  const handleSubmit = useCallback(
    async (formData: StaticDepartmentGroupFormData) => {
      setSubmitLoading(true);
      try {
        const payload = toDepartmentGroupPayload(formData);
        const res = await createEntity(ENTITY_NAME, payload);
        toast.success(`${entityConfig.displayName} created successfully.`);
        const id = getCreatedEntityId(res, payload as Record<string, unknown>, ['id', 'name']);
        navigate(
          id != null
            ? entityConfig.routes.detail.replace(':id', encodeURIComponent(String(id)))
            : entityConfig.routes.list
        );
      } catch (err) {
        showErrorToastUnlessAuth(err instanceof Error ? err.message : 'Request failed');
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
  const sectionClass = getSectionClass(isDarkMode);

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
          Create a new department group.
        </p>
      </div>
      <form
        onSubmit={handleFormSubmit}
        className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
          }`}
      >
        <div className={sectionClass}>
        <StaticDepartmentGroupForm
          ref={formRef}
          initialData={undefined}
          productOptions={productOptions}
          departmentOptions={departmentOptions}
          isEdit={false}
          wrapInForm={false}
          showActions={false}
        />
        <div className={`flex items-center justify-end gap-3 pt-6 mt-6  ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
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
            {submitLoading ? 'Saving...' : `Create ${entityConfig.displayName}`}
          </button>
        </div>
        </div>
      </form>
    </div>
  );
}
