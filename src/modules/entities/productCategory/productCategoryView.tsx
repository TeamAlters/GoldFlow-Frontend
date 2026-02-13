import { useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import { useEntityLoad } from '../../../shared/hooks/useEntityLoad';
import StaticProductCategoryForm from './productCategoryForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import { toInitialProductCategoryData } from './productCategoryCreate';
import {
  getViewPageTitle,
  getViewBreadcrumbLabel,
  getViewPageDescription,
} from '../../../shared/utils/entityPageLabels';

const ENTITY_NAME = 'product_category';

export default function ProductCategoryViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const { data: rawEntity, loading: dataLoading, error: loadError } = useEntityLoad(
    ENTITY_NAME,
    id ?? undefined,
    { errorMessage: 'Failed to load product category' }
  );

  const initialData = useMemo(
    () => (rawEntity ? toInitialProductCategoryData(rawEntity) : undefined),
    [rawEntity]
  );

  useEffect(() => {
    if (loadError) showErrorToastUnlessAuth(loadError);
  }, [loadError]);

  const handleBack = useCallback(() => {
    navigate(entityConfig.routes.list);
  }, [navigate, entityConfig.routes.list]);

  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const editUrl = entityConfig.routes.edit.replace(':id', id ?? '');

  if (!id) {
    return <Navigate to={entityConfig.routes.list} replace />;
  }

  if (dataLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading product category...
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
            { label: getViewPageTitle(entityConfig) },
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

  const viewPageTitle = getViewPageTitle(entityConfig);
  const breadcrumbLabel = getViewBreadcrumbLabel(entityConfig, initialData?.product_category);

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
          {viewPageTitle}
        </h1>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {getViewPageDescription(entityConfig)}
        </p>
      </div>
      <div
        className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <StaticProductCategoryForm
          initialData={initialData}
          isEdit={true}
          readOnly={true}
          wrapInForm={false}
          showActions={false}
        />
        <div className="flex items-center justify-end gap-3 pt-6 mt-6">
          <button
            type="button"
            onClick={handleBack}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
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
