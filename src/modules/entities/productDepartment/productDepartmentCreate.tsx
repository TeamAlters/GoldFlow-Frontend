import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { createEntity, getEntityListOptions } from '../../admin/admin.api';
import { getCreatedEntityId } from '../../../shared/utils/entityNavigation';
import { toast } from '../../../stores/toast.store';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import { getSectionClass } from '../../../shared/utils/viewPageStyles';
import ProductDepartmentForm, {
  type ProductDepartmentFormData,
  type ProductDepartmentFormRef,
} from './productDepartmentForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import type { FormSelectOption } from '../../../shared/components/FormSelect';

const ENTITY_NAME = 'product_department';

export function toInitialProductDepartmentData(
  entity: Record<string, unknown>
): Partial<ProductDepartmentFormData> {
  return {
    product: String(entity.product ?? entity.product_name ?? ''),
    department_group: String(
      entity.department_group ?? entity.department_group_name ?? ''
    ),
    department: String(entity.department ?? entity.department_name ?? ''),
    step_no: entity.step_no != null ? String(entity.step_no) : '',
    requires_issue: Boolean(entity.requires_issue),
    requires_receive: Boolean(entity.requires_receive),
    allows_loss: Boolean(entity.allows_loss),
    loss_percentage: entity.loss_percentage != null ? String(entity.loss_percentage) : '',
    is_optional: Boolean(entity.is_optional),
    allow_rework: Boolean(entity.allow_rework),
    is_final_department: Boolean(entity.is_final_department),
    allow_wastage: Boolean(entity.allow_wastage),
    allow_weight_changes: Boolean(entity.allow_weight_changes),
    approval_required: Boolean(entity.approval_required),
    expected_processing_time_mins:
      entity.expected_processing_time_mins != null
        ? String(entity.expected_processing_time_mins)
        : '',
    show_delay_alert: Boolean(entity.show_delay_alert),
    allow_weight_splits: Boolean(entity.allow_weight_splits),
    loss_requires_reason: Boolean(entity.loss_requires_reason),
    loss_approval_required: Boolean(entity.loss_approval_required),
  };
}

export function toProductDepartmentPayload(
  data: ProductDepartmentFormData
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    product: data.product.trim(),
    department_group: data.department_group.trim(),
    department: data.department.trim(),
    step_no: data.step_no.trim() !== '' ? parseInt(data.step_no, 10) : 1,
    requires_issue: data.requires_issue,
    requires_receive: data.requires_receive,
    allows_loss: data.allows_loss,
    is_optional: data.is_optional,
    allow_rework: data.allow_rework,
    is_final_department: data.is_final_department,
    allow_wastage: data.allow_wastage,
    allow_weight_changes: data.allow_weight_changes,
    approval_required: data.approval_required,
    show_delay_alert: data.show_delay_alert,
    allow_weight_splits: data.allow_weight_splits,
    loss_requires_reason: data.loss_requires_reason,
    loss_approval_required: data.loss_approval_required,
  };
  if (data.loss_percentage.trim() !== '') {
    payload.loss_percentage = parseFloat(data.loss_percentage);
  }
  if (data.expected_processing_time_mins.trim() !== '') {
    payload.expected_processing_time_mins = parseInt(
      data.expected_processing_time_mins,
      10
    );
  }
  return payload;
}

/**
 * Builds the composite id used by the product_department entities API (same format as edit page route param).
 * Example: "Earing-Melting Process-Stamping"
 */
export function getProductDepartmentCompositeId(data: {
  product: string;
  department_group: string;
  department: string;
}): string {
  return [data.product.trim(), data.department_group.trim(), data.department.trim()].join('-');
}

export default function ProductDepartmentCreatePage() {
  const navigate = useNavigate();
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [productOptions, setProductOptions] = useState<FormSelectOption[]>([]);
  const [departmentGroupOptions, setDepartmentGroupOptions] = useState<FormSelectOption[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<FormSelectOption[]>([]);
  const formRef = useRef<ProductDepartmentFormRef>(null);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      getEntityListOptions('product', 'product_name', 'product_name'),
      getEntityListOptions('product_department_group', 'name', 'name'),
      getEntityListOptions('department', 'name', 'name'),
    ])
      .then(([products, deptGroups, departments]) => {
        if (ignore) return;
        setProductOptions(products);
        setDepartmentGroupOptions(deptGroups);
        setDepartmentOptions(departments);
      })
      .catch(() => {
        if (!ignore) {
          setProductOptions([]);
          setDepartmentGroupOptions([]);
          setDepartmentOptions([]);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleSubmit = useCallback(
    async (formData: ProductDepartmentFormData) => {
      setSubmitLoading(true);
      try {
        const payload = toProductDepartmentPayload(formData);
        const res = await createEntity(ENTITY_NAME, payload);
        toast.success(`${entityConfig.displayName} created successfully.`);
        const id = getCreatedEntityId(res, payload as Record<string, unknown>, ['id']);
        navigate(
          id != null
            ? entityConfig.routes.detail.replace(':id', encodeURIComponent(String(id)))
            : entityConfig.routes.list
        );
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
          Create a new product department.
        </p>
      </div>
      <form
        onSubmit={handleFormSubmit}
        className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <div className={sectionClass}>
          <ProductDepartmentForm
            ref={formRef}
            initialData={undefined}
            productOptions={productOptions}
            departmentGroupOptions={departmentGroupOptions}
            departmentOptions={departmentOptions}
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
        </div>
      </form>
    </div>
  );
}
