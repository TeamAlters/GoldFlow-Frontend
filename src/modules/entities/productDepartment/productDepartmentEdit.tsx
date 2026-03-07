import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { getEntityConfig, getRedirectToViewAfterEditUrl } from '../../../config/entity.config';
import { getEntityReferenceOptions, updateEntity } from '../../admin/admin.api';
import { getRedirectIdAfterUpdate } from '../../../shared/utils/entityNavigation';
import { toast } from '../../../stores/toast.store';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import { getSectionClass } from '../../../shared/utils/viewPageStyles';
import { useEntityLoad } from '../../../shared/hooks/useEntityLoad';
import ProductDepartmentForm, {
  type ProductDepartmentFormData,
  type ProductDepartmentFormRef,
} from './productDepartmentForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import {
  toInitialProductDepartmentData,
  toProductDepartmentPayload,
} from './productDepartmentCreate';
import {
  getEditPageTitle,
  getEditBreadcrumbLabel,
  getEditPageDescription,
} from '../../../shared/utils/entityPageLabels';
import type { FormSelectOption } from '../../../shared/components/FormSelect';
import { NOT_FOUND_PATH, NOT_FOUND_REASON_INVALID_URL } from '../../../config/navigation.config';

const ENTITY_NAME = 'product_department';

/** Shared options promise across mounts so we only fetch once per edit-page visit (survives Strict Mode remount). */
let sharedEditPageOptionsPromise: Promise<[FormSelectOption[], FormSelectOption[], FormSelectOption[]]> | null = null;

export default function ProductDepartmentEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const decodedId =
    id != null && String(id).trim() !== ''
      ? decodeURIComponent(String(id).trim())
      : undefined;
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const { data: rawEntity, loading: dataLoading, error: loadError } = useEntityLoad(
    ENTITY_NAME,
    decodedId,
    { errorMessage: 'Failed to load product department' }
  );

  const initialData = useMemo(
    () => (rawEntity ? toInitialProductDepartmentData(rawEntity) : undefined),
    [rawEntity]
  );

  const [submitLoading, setSubmitLoading] = useState(false);
  const [productOptions, setProductOptions] = useState<FormSelectOption[]>([]);
  const [departmentGroupOptions, setDepartmentGroupOptions] = useState<FormSelectOption[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<FormSelectOption[]>([]);
  const formRef = useRef<ProductDepartmentFormRef>(null);

  useEffect(() => {
    if (loadError) showErrorToastUnlessAuth(loadError);
  }, [loadError]);

  useEffect(() => {
    if (dataLoading) return;
    if (!sharedEditPageOptionsPromise) {
      sharedEditPageOptionsPromise = Promise.all([
        getEntityReferenceOptions('product', 'product_name', 'product_name'),
        getEntityReferenceOptions('product_department', 'name', 'name'),
        getEntityReferenceOptions('department', 'name', 'name'),
      ]);
    }
    let ignore = false;
    sharedEditPageOptionsPromise
      .then(([products, deptGroups, departments]) => {
        if (ignore) return;
        setProductOptions(products);
        setDepartmentGroupOptions(deptGroups);
        setDepartmentOptions(departments);
      })
      .catch(() => {
        if (!ignore) {
          setProductOptions([]);
          setDepartmentGroupOptions([]);
          setDepartmentOptions([]);
        }
      });
    return () => {
      ignore = true;
    };
  }, [dataLoading]);

  const handleSubmit = useCallback(
    async (formData: ProductDepartmentFormData) => {
      if (!decodedId) return;
      setSubmitLoading(true);
      try {
        const res = await updateEntity(ENTITY_NAME, decodedId, toProductDepartmentPayload(formData));
        toast.success(`${entityConfig.displayName} updated successfully.`);
        const newId = getRedirectIdAfterUpdate(res, formData as Record<string, unknown>, decodedId, [
          'product_department',
          'name',
          'id',
        ]);
        navigate(getRedirectToViewAfterEditUrl(ENTITY_NAME, newId));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Request failed';
        showErrorToastUnlessAuth(msg);
      } finally {
        setSubmitLoading(false);
      }
    },
    [decodedId, navigate, entityConfig]
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

  if (!decodedId) {
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
            Loading product department...
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
        <div
          className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
        >
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

  const displayValue = initialData?.product && initialData?.department
    ? `${initialData.product} / ${initialData.department}`
    : initialData?.product ?? initialData?.department ?? undefined;
  const breadcrumbLabel = getEditBreadcrumbLabel(entityConfig, displayValue);

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
          <ProductDepartmentForm
            ref={formRef}
            initialData={initialData}
            productOptions={productOptions}
            departmentGroupOptions={departmentGroupOptions}
            departmentOptions={departmentOptions}
            isEdit={true}
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
              {submitLoading ? 'Saving...' : 'Update'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
