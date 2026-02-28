import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { createEntity, getEntityReferences, mapReferenceItemsToOptions } from '../../admin/admin.api';
import { getCreatedEntityId } from '../../../shared/utils/entityNavigation';
import { toast } from '../../../stores/toast.store';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import { getSectionClass } from '../../../shared/utils/viewPageStyles';
import StaticThicknessForm, {
  type StaticThicknessFormData,
  type StaticThicknessFormRef,
  type ProductOption,
} from './thicknessForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';

const ENTITY_NAME = 'thickness';

export function toInitialThicknessData(
  entity: Record<string, unknown>
): Partial<StaticThicknessFormData> {
  const thicknessVal = entity.thickness ?? entity.thikness;
  return {
    thickness: thicknessVal != null ? String(thicknessVal) : '',
    product_name: entity.product_name != null ? String(entity.product_name) : '',
  };
}

export function toThicknessPayload(data: StaticThicknessFormData): Record<string, unknown> {
  return {
    thickness: data.thickness.trim(),
    product_name: data.product_name.trim(),
  };
}

export default function ThicknessCreatePage() {
  const navigate = useNavigate();
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const formRef = useRef<StaticThicknessFormRef>(null);

  useEffect(() => {
    getEntityReferences('product')
      .then((items) => {
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
    async (formData: StaticThicknessFormData) => {
      setSubmitLoading(true);
      try {
        const payload = toThicknessPayload(formData);
        const res = await createEntity(ENTITY_NAME, payload);
        toast.success(`${entityConfig.displayName} created successfully.`);
        const id = getCreatedEntityId(res, payload as Record<string, unknown>, ['thickness', 'id']);
        navigate(id != null ? entityConfig.routes.detail.replace(':id', encodeURIComponent(String(id))) : entityConfig.routes.list);
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
          Create a new thickness linked to a product.
        </p>
      </div>
      <form
        onSubmit={handleFormSubmit}
        className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <div className={sectionClass}>
          <StaticThicknessForm
            ref={formRef}
            initialData={undefined}
            productOptions={productOptions}
            isEdit={false}
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
              {submitLoading ? 'Saving...' : 'Create Thickness'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
