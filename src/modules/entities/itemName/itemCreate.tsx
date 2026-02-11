import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { createEntity, getEntityList } from '../../admin/admin.api';
import { toast } from '../../../stores/toast.store';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import StaticItemForm, {
  type StaticItemFormData,
  type StaticItemFormRef,
  type ItemTypeOption,
} from './itemForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';

const ENTITY_NAME = 'item';

export function toInitialItemData(
  entity: Record<string, unknown>
): Partial<StaticItemFormData> {
  return {
    item_name: entity.item_name != null ? String(entity.item_name) : '',
    item_type: entity.item_type != null ? String(entity.item_type) : '',
  };
}

export function toItemPayload(data: StaticItemFormData): Record<string, unknown> {
  return {
    item_name: data.item_name.trim(),
    item_type: data.item_type.trim(),
  };
}

export default function ItemCreatePage() {
  const navigate = useNavigate();
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [itemTypeOptions, setItemTypeOptions] = useState<ItemTypeOption[]>([]);
  const formRef = useRef<StaticItemFormRef>(null);

  useEffect(() => {
    getEntityList('item_type', { page: 1, page_size: 500 })
      .then((res) => {
        const data = res.data as { items?: Record<string, unknown>[] } | undefined;
        const items = Array.isArray(data?.items) ? data.items : [];
        const options: ItemTypeOption[] = items.map((row) => {
          const value = String(row.item_type ?? '');
          return { value, label: value };
        });
        setItemTypeOptions(options);
      })
      .catch(() => setItemTypeOptions([]));
  }, []);

  const handleSubmit = useCallback(
    async (formData: StaticItemFormData) => {
      setSubmitLoading(true);
      try {
        await createEntity(ENTITY_NAME, toItemPayload(formData));
        toast.success(`${entityConfig.displayName} created successfully.`);
        navigate(entityConfig.routes.list);
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
          Create a new item name linked to an item type.
        </p>
      </div>
      <form
        onSubmit={handleFormSubmit}
        className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <StaticItemForm
          ref={formRef}
          initialData={undefined}
          itemTypeOptions={itemTypeOptions}
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
            {submitLoading ? 'Saving...' : 'Create Item Name'}
          </button>
        </div>
      </form>
    </div>
  );
}
