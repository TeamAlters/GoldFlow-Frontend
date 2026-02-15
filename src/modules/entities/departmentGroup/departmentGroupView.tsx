import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import {
  getEntity,
  getEntityReferences,
  getEntityListOptions,
  getDepartmentOptions,
  mapProductReferencesToOptions,
} from '../../admin/admin.api';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import StaticDepartmentGroupForm, {
  type StaticDepartmentGroupFormData,
} from './departmentGroupForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import {
  getViewPageHeading,
  getViewBreadcrumbLabel,
  getViewPageDescription,
} from '../../../shared/utils/entityPageLabels';
import { toInitialDepartmentGroupData } from './departmentGroupEdit';
import type { FormSelectOption } from '../../../shared/components/FormSelect';

const ENTITY_NAME = 'product_department_group';

export default function DepartmentGroupViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const [initialData, setInitialData] = useState<Partial<StaticDepartmentGroupFormData> | undefined>(
    undefined
  );
  const [dataLoading, setDataLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [productOptions, setProductOptions] = useState<FormSelectOption[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<FormSelectOption[]>([]);

  useEffect(() => {
    getEntityReferences('product')
      .then((items) => {
        const opts = mapProductReferencesToOptions(items);
        if (opts.length > 0) return setProductOptions(opts);
        return getEntityListOptions('product', 'product_name', 'product_name').then(setProductOptions);
      })
      .catch(() =>
        getEntityListOptions('product', 'product_name', 'product_name')
          .then(setProductOptions)
          .catch(() => setProductOptions([]))
      );

    getDepartmentOptions()
      .then(setDepartmentOptions)
      .catch(() => setDepartmentOptions([]));
  }, []);

  useEffect(() => {
    if (!id) return;
    setDataLoading(true);
    setLoadError(null);
    const decodedId = decodeURIComponent(String(id).trim());
    getEntity(ENTITY_NAME, decodedId)
      .then((res) => {
        type ResShape = { data?: Record<string, unknown> };
        const data = (res as ResShape).data ?? (res as Record<string, unknown>);
        if (data && typeof data === 'object') {
          setInitialData(toInitialDepartmentGroupData(data));
          setLoadError(null);
        }
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Failed to load department group';
        showErrorToastUnlessAuth(msg);
        setLoadError(msg);
        setInitialData(undefined);
      })
      .finally(() => setDataLoading(false));
  }, [id]);

  const handleBack = useCallback(() => {
    navigate(entityConfig.routes.list);
  }, [navigate, entityConfig.routes.list]);

  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const editUrl = entityConfig.routes.edit.replace(':id', id ?? '');

  if (!id) {
    return <Navigate to={entityConfig.routes.list} replace />;
  }

  const displayValue = initialData?.name as string | undefined;
  const viewPageHeading = getViewPageHeading(entityConfig, displayValue);
  const breadcrumbLabel = getViewBreadcrumbLabel(entityConfig, displayValue);

  if (dataLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading department group...
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    const isEntityNotRegistered =
      /not registered|Entity .* not|404|not found/i.test(loadError);
    return (
      <div className="w-full">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: entityConfig.displayNamePlural, href: entityConfig.routes.list },
            { label: 'View' },
          ]}
          className="mb-4"
        />
        <div
          className={`p-6 rounded-xl border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
          }`}
        >
          <h2
            className={`text-lg font-semibold mb-3 ${
              isDarkMode ? 'text-red-400' : 'text-red-600'
            }`}
          >
            Cannot load department group
          </h2>
          <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {loadError}
          </p>
          {isEntityNotRegistered && (
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              The API may not be available yet. Please check your backend configuration.
            </p>
          )}
          <button
            type="button"
            onClick={handleBack}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            Back to list
          </button>
        </div>
      </div>
    );
  }

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
          {viewPageHeading}
        </h1>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {getViewPageDescription(entityConfig)}
        </p>
      </div>
      <div
        className={`p-6 rounded-xl border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
        }`}
      >
        <StaticDepartmentGroupForm
          initialData={initialData}
          productOptions={productOptions}
          departmentOptions={departmentOptions}
          isEdit={true}
          readOnly={true}
          wrapInForm={false}
          showActions={false}
        />
        <div className={`flex items-center justify-end gap-3 pt-6 mt-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            type="button"
            onClick={handleBack}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm ${
              isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            Back
          </button>
          <Link
            to={editUrl}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Edit {entityConfig.displayName}
          </Link>
        </div>
      </div>
    </div>
  );
}
