import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { createEntity, getEntityList } from '../../admin/admin.api';
import { getCreatedEntityId } from '../../../shared/utils/entityNavigation';
import { toast } from '../../../stores/toast.store';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import { getSectionClass, getCreateEditViewPageWrapperClass } from '../../../shared/utils/viewPageStyles';
import StaticAccessoryPurityForm, {
  type StaticAccessoryPurityFormData,
  type StaticAccessoryPurityFormRef,
  type PurityOption,
} from './accessoryPurityForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';

const ENTITY_NAME = 'accessory_purity';

export function toInitialAccessoryPurityData(
  entity: Record<string, unknown>
): Partial<StaticAccessoryPurityFormData> {
  const percentage =
    entity.accessory_purity_percentage !== undefined && entity.accessory_purity_percentage !== null
      ? String(entity.accessory_purity_percentage)
      : entity.purity != null
        ? String(entity.purity)
        : '';
  return {
    accessory_purity: entity.accessory_purity != null ? String(entity.accessory_purity) : '',
    purity: percentage,
  };
}

export function toAccessoryPurityPayload(
  data: StaticAccessoryPurityFormData
): Record<string, unknown> {
  const pctStr = data.purity.trim();
  const pctNum = pctStr === '' ? NaN : Number(pctStr);
  return {
    accessory_purity: data.accessory_purity.trim(),
    accessory_purity_percentage: Number.isNaN(pctNum) ? pctStr : pctNum,
  };
}

export default function AccessoryPurityCreatePage() {
  const navigate = useNavigate();
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [purityOptions, setPurityOptions] = useState<PurityOption[]>([]);
  const formRef = useRef<StaticAccessoryPurityFormRef>(null);

  useEffect(() => {
    getEntityList('purity', { page: 1, page_size: 100 })
      .then((res) => {
        const data = res.data as { items?: Record<string, unknown>[] } | undefined;
        const listItems = Array.isArray(data?.items) ? data.items : [];
        const options: PurityOption[] = listItems.map((row) => {
          const value = String(row.purity ?? '');
          return { value, label: value };
        });
        setPurityOptions(options);
      })
      .catch(() => setPurityOptions([]));
  }, []);

  const handleSubmit = useCallback(
    async (formData: StaticAccessoryPurityFormData) => {
      setSubmitLoading(true);
      try {
        const payload = toAccessoryPurityPayload(formData);
        const res = await createEntity(ENTITY_NAME, payload);
        toast.success(`${entityConfig.displayName} created successfully.`);
        const id = getCreatedEntityId(res, payload as Record<string, unknown>, ['accessory_purity', 'id']);
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
    <div className={getCreateEditViewPageWrapperClass(isDarkMode)}>
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
          Create a new accessory purity with accessory percentage.
        </p>
      </div>
      <form
        onSubmit={handleFormSubmit}
        className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <div className={sectionClass}>
        <StaticAccessoryPurityForm
          ref={formRef}
          initialData={undefined}
          purityOptions={purityOptions}
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
