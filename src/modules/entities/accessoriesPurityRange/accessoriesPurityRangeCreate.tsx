import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { createEntity, getEntityList } from '../../admin/admin.api';
import { toast } from '../../../stores/toast.store';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import StaticAccessoriesPurityRangeForm, {
  type StaticAccessoriesPurityRangeFormData,
  type StaticAccessoriesPurityRangeFormRef,
  type DropdownOption,
} from './accessoriesPurityRangeForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';

const ENTITY_NAME = 'accessories_purity_range';

function toOptionList(items: Record<string, unknown>[], valueKey: string): DropdownOption[] {
  return items.map((row) => {
    const value = String(row[valueKey] ?? '');
    return { value, label: value };
  });
}

export function toInitialAccessoriesPurityRangeData(
  entity: Record<string, unknown>
): Partial<StaticAccessoriesPurityRangeFormData> {
  return {
    accessories_purity_range:
      entity.accessories_purity_range != null ? String(entity.accessories_purity_range) : '',
    purity_range: entity.purity_range != null ? String(entity.purity_range) : '',
    accessory_purity: entity.accessory_purity != null ? String(entity.accessory_purity) : '',
  };
}

export function toAccessoriesPurityRangePayload(
  data: StaticAccessoriesPurityRangeFormData
): Record<string, unknown> {
  return {
    accessories_purity_range: data.accessories_purity_range.trim(),
    purity_range: data.purity_range.trim(),
    accessory_purity: data.accessory_purity.trim(),
  };
}

export default function AccessoriesPurityRangeCreatePage() {
  const navigate = useNavigate();
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [purityRangeOptions, setPurityRangeOptions] = useState<DropdownOption[]>([]);
  const [accessoryPurityOptions, setAccessoryPurityOptions] = useState<DropdownOption[]>([]);
  const formRef = useRef<StaticAccessoriesPurityRangeFormRef>(null);

  useEffect(() => {
    Promise.all([
      getEntityList('purity_range', { page: 1, page_size: 500 }),
      getEntityList('accessory_purity', { page: 1, page_size: 500 }),
    ])
      .then(([purityRangeRes, accessoryPurityRes]) => {
        const prData = purityRangeRes.data as { items?: Record<string, unknown>[] } | undefined;
        const apData = accessoryPurityRes.data as { items?: Record<string, unknown>[] } | undefined;
        setPurityRangeOptions(toOptionList(Array.isArray(prData?.items) ? prData.items : [], 'purity_range'));
        setAccessoryPurityOptions(toOptionList(Array.isArray(apData?.items) ? apData.items : [], 'accessory_purity'));
      })
      .catch(() => {
        setPurityRangeOptions([]);
        setAccessoryPurityOptions([]);
      });
  }, []);

  const handleSubmit = useCallback(
    async (formData: StaticAccessoriesPurityRangeFormData) => {
      setSubmitLoading(true);
      try {
        await createEntity(ENTITY_NAME, toAccessoriesPurityRangePayload(formData));
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
        <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Add {entityConfig.displayName}
        </h1>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Create a new accessories purity range linked to purity range and accessory purity.
        </p>
      </div>
      <form
        onSubmit={handleFormSubmit}
        className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <StaticAccessoriesPurityRangeForm
          ref={formRef}
          initialData={undefined}
          purityRangeOptions={purityRangeOptions}
          accessoryPurityOptions={accessoryPurityOptions}
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
      </form>
    </div>
  );
}
