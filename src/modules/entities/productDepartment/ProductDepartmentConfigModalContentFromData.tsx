import { useState, useRef, useCallback } from 'react';
import { useUIStore } from '../../../stores/ui.store';
import { toast } from '../../../stores/toast.store';
import { updateEntity } from '../../admin/admin.api';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { getEntityConfig } from '../../../config/entity.config';
import ProductDepartmentForm, {
  type ProductDepartmentFormData,
  type ProductDepartmentFormRef,
} from './productDepartmentForm';
import { toProductDepartmentPayload } from './productDepartmentCreate';
import type { FormSelectOption } from '../../../shared/components/FormSelect';

const ENTITY_NAME = 'product_department';

export interface ProductDepartmentConfigModalContentFromDataProps {
  /** Initial form data from department group API (no id in response) */
  initialData: Partial<ProductDepartmentFormData>;
  /** Exact "name" from the department row (API response) - used as id param for product_department update */
  productDepartmentName: string;
  /** When true, show form as read-only with only a Close button (e.g. on view page) */
  readOnly?: boolean;
  /** @deprecated Kept for backward compatibility */
  departmentGroupIdOrName: string;
  productId: string;
  departmentId: string;
  onClose: () => void;
  onSaved?: () => void;
  productOptions?: FormSelectOption[];
  departmentOptions?: FormSelectOption[];
}

/**
 * Shows configurations form with Cancel + Save. On Save, calls product_department update API
 * with the exact "name" from the department row as the id param.
 */
export default function ProductDepartmentConfigModalContentFromData({
  initialData,
  productDepartmentName,
  readOnly = false,
  departmentGroupIdOrName: _departmentGroupIdOrName,
  productId: _productId,
  departmentId: _departmentId,
  onClose,
  onSaved,
  productOptions = [],
  departmentOptions = [],
}: ProductDepartmentConfigModalContentFromDataProps) {
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<ProductDepartmentFormRef>(null);

  const handleSave = useCallback(async () => {
    if (readOnly) return;
    if (!formRef.current) return;
    if (!formRef.current.validate()) return;
    if (!productDepartmentName.trim()) {
      showErrorToastUnlessAuth('Product department name is required to update.');
      return;
    }
    setSaving(true);
    try {
      const formData = formRef.current.getData();
      await updateEntity(ENTITY_NAME, productDepartmentName, toProductDepartmentPayload(formData));
      toast.success(`${entityConfig.displayName} updated successfully.`);
      onClose();
      onSaved?.();
    } catch (err) {
      showErrorToastUnlessAuth(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  }, [readOnly, productDepartmentName, entityConfig.displayName, onClose, onSaved]);

  return (
    <>
      <ProductDepartmentForm
        ref={formRef}
        initialData={initialData}
        productOptions={productOptions}
        departmentGroupOptions={[]}
        departmentOptions={departmentOptions}
        showSections={['configurations']}
        wrapInForm={false}
        showActions={false}
        readOnly={readOnly}
      />
      <div
        className={`flex items-center justify-end gap-3 pt-4 mt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
      >
        {readOnly ? (
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${
              isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            Close
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-lg font-semibold text-sm ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${
                isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
              } disabled:opacity-60`}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </>
        )}
      </div>
    </>
  );
}
