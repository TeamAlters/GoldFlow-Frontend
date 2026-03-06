import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import {
  getEntityReferences,
  getEntityReferenceOptionsFiltered,
  mapReferenceItemsToOptions,
  updateEntity,
} from '../../admin/admin.api';
import { toast } from '../../../stores/toast.store';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import { getSectionClass } from '../../../shared/utils/viewPageStyles';
import { useEntityLoad } from '../../../shared/hooks/useEntityLoad';
import StaticCustomerMasterForm, {
  type StaticCustomerMasterFormData,
  type StaticCustomerMasterFormRef,
  type SelectOption,
} from './customerForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import { toInitialCustomerMasterData, toCustomerMasterPayload } from './customerCreate';
import {
  getEditPageTitle,
  getEditBreadcrumbLabel,
  getEditPageDescription,
} from '../../../shared/utils/entityPageLabels';
import { NOT_FOUND_PATH, NOT_FOUND_REASON_INVALID_URL } from '../../../config/navigation.config';

const ENTITY_NAME = 'customer';

export default function CustomerEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const { data: rawEntity, loading: dataLoading, error: loadError } = useEntityLoad(
    ENTITY_NAME,
    id ?? undefined,
    { errorMessage: 'Failed to load customer' }
  );

  const initialData = useMemo(
    () => (rawEntity ? toInitialCustomerMasterData(rawEntity) : undefined),
    [rawEntity]
  );

  const [submitLoading, setSubmitLoading] = useState(false);
  const [purityOptions, setPurityOptions] = useState<SelectOption[]>([]);
  const [productOptions, setProductOptions] = useState<SelectOption[]>([]);
  const [productCategoryOptions, setProductCategoryOptions] = useState<SelectOption[]>([]);
  const [machineOptions, setMachineOptions] = useState<SelectOption[]>([]);
  const [designOptions, setDesignOptions] = useState<SelectOption[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const formRef = useRef<StaticCustomerMasterFormRef>(null);

  useEffect(() => {
    if (loadError) showErrorToastUnlessAuth(loadError);
  }, [loadError]);

  useEffect(() => {
    if (initialData?.product_name) {
      setSelectedProduct(initialData.product_name);
    }
  }, [initialData?.product_name]);

  useEffect(() => {
    Promise.all([
      getEntityReferences('purity').then((items) =>
        setPurityOptions(mapReferenceItemsToOptions(items, 'purity'))
      ),
      getEntityReferences('product').then((items) => {
        const opts = items.map((row) => {
          const name = row.product_name ?? row.product_abbreviation ?? row.product_abbrevation;
          const value = String(row.product_name ?? name ?? '');
          return { value, label: String(name ?? value) };
        });
        setProductOptions(opts);
      }),
    ]).catch(() => {});
  }, []);

  useEffect(() => {
    const productName = selectedProduct?.trim();
    if (!productName) {
      setProductCategoryOptions([]);
      setMachineOptions([]);
      setDesignOptions([]);
      return;
    }
    let ignore = false;
    Promise.all([
      getEntityReferenceOptionsFiltered('product_category', productName, 'product_category', 'product_category'),
      getEntityReferenceOptionsFiltered('machine', productName, 'machine_name', 'machine_name'),
      getEntityReferenceOptionsFiltered('design', productName, 'design_name', 'design_name'),
    ])
      .then(([productCategory, machine, design]) => {
        if (ignore) return;
        setProductCategoryOptions(productCategory);
        setMachineOptions(machine);
        setDesignOptions(design);
      })
      .catch(() => {
        if (ignore) return;
        setProductCategoryOptions([]);
        setMachineOptions([]);
        setDesignOptions([]);
      });
    return () => {
      ignore = true;
    };
  }, [selectedProduct]);

  const handleProductNameChange = useCallback((productName: string) => {
    setSelectedProduct(productName);
  }, []);

  const handleSubmit = useCallback(
    async (formData: StaticCustomerMasterFormData) => {
      if (!id) return;
      setSubmitLoading(true);
      try {
        await updateEntity(ENTITY_NAME, id, toCustomerMasterPayload(formData));
        toast.success(`${entityConfig.displayName} updated successfully.`);
        navigate(entityConfig.routes.list);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Request failed';
        showErrorToastUnlessAuth(msg);
      } finally {
        setSubmitLoading(false);
      }
    },
    [id, navigate, entityConfig]
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

  if (!id) {
    return (
      <Navigate to={NOT_FOUND_PATH} state={{ reason: NOT_FOUND_REASON_INVALID_URL }} replace />
    );
  }

  if (dataLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading customer...
          </p>
        </div>
      </div>
    );
  }

  if (loadError && !initialData) {
    return (
      <div className="w-full">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: entityConfig.displayNamePlural, href: entityConfig.routes.list },
            { label: getEditPageTitle(entityConfig) },
          ]}
          className="mb-4"
        />
        <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{loadError}</p>
          <button
            type="button"
            onClick={() => navigate(entityConfig.routes.list)}
            className={`mt-4 px-4 py-2.5 rounded-lg font-semibold text-sm ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
          >
            Back to list
          </button>
        </div>
      </div>
    );
  }

  const breadcrumbLabel = getEditBreadcrumbLabel(entityConfig, initialData?.customer_name);

  return (
    <div className="w-full">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: entityConfig.displayNamePlural, href: entityConfig.routes.list },
          { label: breadcrumbLabel },
        ]}
        className="mb-4"
      />
      <div className="mb-6">
        <h1
          className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          {getEditPageTitle(entityConfig)}
        </h1>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {getEditPageDescription(entityConfig)}
        </p>
      </div>
      <form
        onSubmit={handleFormSubmit}
        className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <div className={sectionClass}>
        <StaticCustomerMasterForm
          ref={formRef}
          initialData={initialData}
          purityOptions={purityOptions}
          productOptions={productOptions}
          productCategoryOptions={productCategoryOptions}
          machineOptions={machineOptions}
          designOptions={designOptions}
          onProductNameChange={handleProductNameChange}
          isEdit={true}
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
            {submitLoading ? 'Saving...' : 'Update'}
          </button>
        </div>
        </div>
      </form>
    </div>
  );
}
