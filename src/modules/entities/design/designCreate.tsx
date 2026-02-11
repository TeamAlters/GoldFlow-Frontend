import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { createEntity, getEntityList } from '../../admin/admin.api';
import { toast } from '../../../stores/toast.store';
import { useAuthStore } from '../../../auth/auth.store';
import { useUIStore } from '../../../stores/ui.store';
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
  return {
    design_name: entity.design_name != null ? String(entity.design_name) : '',
    product_name: entity.product_name != null ? String(entity.product_name) : '',
  };
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
  const logout = useAuthStore((state) => state.logout);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const formRef = useRef<StaticDesignFormRef>(null);

  const handleAuthError = useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  useEffect(() => {
    getEntityList('product', { page: 1, page_size: 500 })
      .then((res) => {
        const data = res.data as { items?: Record<string, unknown>[] } | undefined;
        const items = Array.isArray(data?.items) ? data.items : [];
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
        await createEntity(ENTITY_NAME, toDesignPayload(formData));
        toast.success(`${entityConfig.displayName} created successfully.`);
        navigate(entityConfig.routes.list);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Request failed';
        toast.error(msg);
        if (/401|unauthorized/i.test(msg)) handleAuthError();
      } finally {
        setSubmitLoading(false);
      }
    },
    [navigate, entityConfig, handleAuthError]
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
          Create a new design linked to a product.
        </p>
      </div>
      <form
        onSubmit={handleFormSubmit}
        className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
      >
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
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitLoading}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            } disabled:opacity-60`}
          >
            {submitLoading ? 'Saving...' : 'Create Design'}
          </button>
        </div>
      </form>
    </div>
  );
}
