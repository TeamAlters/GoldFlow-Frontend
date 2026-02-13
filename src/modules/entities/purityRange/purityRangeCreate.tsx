import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { createEntity, getEntityReferences, mapReferenceItemsToOptions } from '../../admin/admin.api';
import { toast } from '../../../stores/toast.store';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import StaticPurityRangeForm, {
  type StaticPurityRangeFormData,
  type StaticPurityRangeFormRef,
  type PurityOption,
} from './purityRangeForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';

const ENTITY_NAME = 'purity_range';

export function toInitialPurityRangeData(
  entity: Record<string, unknown>
): Partial<StaticPurityRangeFormData> {
  const fromVal = entity.from_value;
  const toVal = entity.to_value;
  return {
    purity_range: entity.purity_range != null ? String(entity.purity_range) : '',
    from_value:
      fromVal !== undefined && fromVal !== null ? String(fromVal) : '',
    to_value: toVal !== undefined && toVal !== null ? String(toVal) : '',
    purity: entity.purity != null ? String(entity.purity) : '',
  };
}

export function toPurityRangePayload(
  data: StaticPurityRangeFormData
): Record<string, unknown> {
  const fromNum = parseFloat(data.from_value.trim());
  const toNum = parseFloat(data.to_value.trim());
  return {
    purity_range: data.purity_range.trim(),
    from_value: Number.isNaN(fromNum) ? 0 : fromNum,
    to_value: Number.isNaN(toNum) ? 0 : toNum,
    purity: data.purity.trim(),
  };
}

export default function PurityRangeCreatePage() {
  const navigate = useNavigate();
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [purityOptions, setPurityOptions] = useState<PurityOption[]>([]);
  const formRef = useRef<StaticPurityRangeFormRef>(null);

  useEffect(() => {
    getEntityReferences('purity')
      .then((items) => setPurityOptions(mapReferenceItemsToOptions(items, 'purity')))
      .catch(() => setPurityOptions([]));
  }, []);

  const handleSubmit = useCallback(
    async (formData: StaticPurityRangeFormData) => {
      setSubmitLoading(true);
      try {
        await createEntity(ENTITY_NAME, toPurityRangePayload(formData));
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
          Create a new purity range linked to a purity.
        </p>
      </div>
      <form
        onSubmit={handleFormSubmit}
        className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <StaticPurityRangeForm
          ref={formRef}
          initialData={undefined}
          purityOptions={purityOptions}
          isEdit={false}
          wrapInForm={false}
          showActions={false}
          hidePurityRangeField={true}
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
