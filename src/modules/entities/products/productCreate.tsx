import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { createEntity } from '../../admin/admin.api';
import { getCreatedEntityId } from '../../../shared/utils/entityNavigation';
import { toast } from '../../../stores/toast.store';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import StaticProductForm, {
  type StaticProductFormData,
  type StaticProductFormRef,
} from './productForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';

const ENTITY_NAME = 'product';

export function toInitialProductData(
  entity: Record<string, unknown>
): Partial<StaticProductFormData> {
  const abbrev =
    entity.product_abbreviation ?? entity.product_abbrevation;
  return {
    product_name: entity.product_name != null ? String(entity.product_name) : '',
    product_abbrevation: abbrev != null ? String(abbrev) : '',
  };
}

const hasProductFields = (o: unknown): o is Record<string, unknown> =>
  typeof o === 'object' &&
  o != null &&
  ((o as Record<string, unknown>).product_name != null ||
    (o as Record<string, unknown>).product_abbreviation != null ||
    (o as Record<string, unknown>).product_abbrevation != null);

/**
 * Normalize getEntity response for product. Handles entity at top level,
 * in res.data, res.data.data, res.item, res.result.
 */
export function getProductEntityFromResponse(
  res: Record<string, unknown> | undefined | null
): Record<string, unknown> | undefined {
  if (res == null || typeof res !== 'object') return undefined;
  if (hasProductFields(res)) return res as Record<string, unknown>;
  const data = (res as Record<string, unknown>).data;
  if (data != null && typeof data === 'object') {
    const dataObj = data as Record<string, unknown>;
    if (hasProductFields(dataObj)) return dataObj as Record<string, unknown>;
    if (hasProductFields(dataObj['item'])) return dataObj['item'] as Record<string, unknown>;
    if (hasProductFields(dataObj['result'])) return dataObj['result'] as Record<string, unknown>;
    const inner = dataObj['data'];
    if (inner != null && typeof inner === 'object' && hasProductFields(inner)) return inner as Record<string, unknown>;
  }
  if (hasProductFields((res as Record<string, unknown>)['result'])) return (res as Record<string, unknown>)['result'] as Record<string, unknown>;
  if (hasProductFields((res as Record<string, unknown>)['item'])) return (res as Record<string, unknown>)['item'] as Record<string, unknown>;
  return undefined;
}

export function toProductPayload(data: StaticProductFormData): Record<string, unknown> {
  return {
    product_name: data.product_name.trim(),
    product_abbreviation: data.product_abbrevation.trim(),
  };
}

export default function ProductCreatePage() {
  const navigate = useNavigate();
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const [submitLoading, setSubmitLoading] = useState(false);
  const formRef = useRef<StaticProductFormRef>(null);

  const handleSubmit = useCallback(
    async (formData: StaticProductFormData) => {
      setSubmitLoading(true);
      try {
        const payload = toProductPayload(formData);
        const res = await createEntity(ENTITY_NAME, payload);
        toast.success(`${entityConfig.displayName} created successfully.`);
        const id = getCreatedEntityId(res, payload as Record<string, unknown>, ['product_name', 'id']);
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
          Create a new product.
        </p>
      </div>
      <form
        onSubmit={handleFormSubmit}
        className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <StaticProductForm
          ref={formRef}
          initialData={undefined}
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
            {submitLoading ? 'Saving...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
