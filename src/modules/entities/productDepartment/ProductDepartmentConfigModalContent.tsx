import { useState, useRef, useCallback, useEffect } from 'react';
import { useUIStore } from '../../../stores/ui.store';
import { toast } from '../../../stores/toast.store';
import { updateEntity } from '../../admin/admin.api';
import { useEntityLoad } from '../../../shared/hooks/useEntityLoad';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { getEntityConfig } from '../../../config/entity.config';
import ProductDepartmentForm, {
  type ProductDepartmentFormRef,
} from './productDepartmentForm';
import { toInitialProductDepartmentData, toProductDepartmentPayload, getProductDepartmentCompositeId } from './productDepartmentCreate';

const ENTITY_NAME = 'product_department';

export interface ProductDepartmentConfigModalContentProps {
  productDepartmentId: string;
  onClose: () => void;
  onSaved?: () => void;
}

export default function ProductDepartmentConfigModalContent({
  productDepartmentId,
  onClose,
  onSaved,
}: ProductDepartmentConfigModalContentProps) {
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const { data: rawEntity, loading, error: loadError } = useEntityLoad(
    ENTITY_NAME,
    productDepartmentId,
    { errorMessage: 'Failed to load product department' }
  );
  const data = rawEntity ? toInitialProductDepartmentData(rawEntity) : undefined;
  const [saving, setSaving] = useState(false);
  const formRef = useRef<ProductDepartmentFormRef>(null);

  useEffect(() => {
    if (loadError) showErrorToastUnlessAuth(loadError);
  }, [loadError]);

  const handleSave = useCallback(async () => {
    if (!formRef.current) return;
    if (!formRef.current.validate()) return;
    setSaving(true);
    try {
      const formData = formRef.current.getData();
      const compositeId = getProductDepartmentCompositeId(formData);
      await updateEntity(ENTITY_NAME, compositeId, toProductDepartmentPayload(formData));
      toast.success(`${entityConfig.displayName} updated successfully.`);
      onClose();
      onSaved?.();
    } catch (err) {
      showErrorToastUnlessAuth(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  }, [entityConfig.displayName, onClose, onSaved]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
        {loadError ?? 'Failed to load configurations.'}
      </p>
    );
  }

  return (
    <>
      <ProductDepartmentForm
        ref={formRef}
        initialData={data}
        productOptions={[]}
        departmentGroupOptions={[]}
        departmentOptions={[]}
        showSections={['configurations']}
        wrapInForm={false}
        showActions={false}
      />
      <div
        className={`flex items-center justify-end gap-3 pt-4 mt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
      >
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
      </div>
    </>
  );
}
