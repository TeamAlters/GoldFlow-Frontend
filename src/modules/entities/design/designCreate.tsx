import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { createEntity, getEntityReferences } from '../../admin/admin.api';
import { getCreatedEntityId } from '../../../shared/utils/entityNavigation';
import { toast } from '../../../stores/toast.store';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import { getSectionClass } from '../../../shared/utils/viewPageStyles';
import StaticDesignForm, {
  type StaticDesignFormData,
  type StaticDesignFormRef,
  type ProductOption,
} from './designForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';

const ENTITY_NAME = 'design';

export function toInitialDesignData(
  entity: Record<string, unknown>
): Partial<StaticDesignFormData> {
  const designVal = entity.design ?? entity.design_name;
  return {
    design_name: designVal != null ? String(designVal) : '',
    product_name: entity.product_name != null ? String(entity.product_name) : '',
  };
}

const hasDesignFields = (o: unknown): o is Record<string, unknown> =>
  typeof o === 'object' &&
  o != null &&
  ((o as Record<string, unknown>).design_name != null ||
    (o as Record<string, unknown>).design != null ||
    (o as Record<string, unknown>).product_name != null);

/**
 * Normalize getEntity response for design. Backend may return:
 * - Single entity at top level: { design_name, product_name } or { design, product_name }
 * - Wrapped: { data: { design_name, product_name } }
 * - With result/item: { result: {...} } or { data: { item: {...} } }
 * - List shape: { data: { items: [...], pagination } } or { data: [...] }
 * Returns the single design entity or undefined.
 */
export function getDesignEntityFromResponse(
  res: Record<string, unknown> | undefined | null,
  id: string | undefined
): Record<string, unknown> | undefined {
  if (res == null || typeof res !== 'object') return undefined;
  const idNorm = id ? decodeURIComponent(String(id)).trim() : '';

  if (hasDesignFields(res)) return res as Record<string, unknown>;

  const data = (res as Record<string, unknown>).data;
  if (data != null && typeof data === 'object') {
    const dataObj = data as Record<string, unknown>;
    if (hasDesignFields(dataObj)) return dataObj as Record<string, unknown>;
    const dataItem = dataObj['item'];
    if (hasDesignFields(dataItem)) return dataItem as Record<string, unknown>;
    const dataResult = dataObj['result'];
    if (hasDesignFields(dataResult)) return dataResult as Record<string, unknown>;
    const inner = (dataObj['data'] != null && typeof dataObj['data'] === 'object' ? dataObj['data'] : dataObj) as Record<string, unknown>;
    if (hasDesignFields(inner)) return inner as Record<string, unknown>;

    const items = Array.isArray(dataObj['items']) ? dataObj['items'] : Array.isArray(data) ? data : null;
    if (Array.isArray(items) && items.length > 0) {
      const match = items.find((item: unknown) => {
        if (item == null || typeof item !== 'object') return false;
        const row = item as Record<string, unknown>;
        const name = String(row?.design_name ?? row?.design ?? '').trim();
        const itemId = String(row?.id ?? row?.design_id ?? '').trim();
        return name === idNorm || itemId === idNorm || name === id || itemId === id;
      });
      if (match != null && typeof match === 'object') return match as Record<string, unknown>;
      if (items.length === 1 && items[0] != null && typeof items[0] === 'object') return items[0] as Record<string, unknown>;
    }
  }

  const resResult = (res as Record<string, unknown>)['result'];
  if (hasDesignFields(resResult)) return resResult as Record<string, unknown>;
  const resItem = (res as Record<string, unknown>)['item'];
  if (hasDesignFields(resItem)) return resItem as Record<string, unknown>;
  return undefined;
}

export function toDesignPayload(data: StaticDesignFormData): Record<string, unknown> {
  return {
    design_name: data.design_name.trim(),
    product_name: data.product_name.trim(),
  };
}

export default function DesignCreatePage() {
  const navigate = useNavigate();
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const formRef = useRef<StaticDesignFormRef>(null);

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
    async (formData: StaticDesignFormData) => {
      setSubmitLoading(true);
      try {
        const payload = toDesignPayload(formData);
        const res = await createEntity(ENTITY_NAME, payload);
        toast.success(`${entityConfig.displayName} created successfully.`);
        const id = getCreatedEntityId(res, payload as Record<string, unknown>, ['design_name', 'id']);
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
          Create a new design linked to a product.
        </p>
      </div>
      <form
        onSubmit={handleFormSubmit}
        className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <div className={sectionClass}>
        <StaticDesignForm
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
            {submitLoading ? 'Saving...' : 'Create Design'}
          </button>
        </div>
        </div>
      </form>
    </div>
  );
}
