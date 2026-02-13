import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { getEntity } from '../../admin/admin.api';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import StaticDesignForm, { type StaticDesignFormData } from './designForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import { toInitialDesignData, getDesignEntityFromResponse } from './designCreate';
import AuditTrailsCard from '../../../shared/components/AuditTrailsCard';
import BackButton from '../../../shared/components/BackButton';
import {
  getViewPageHeading,
  getViewBreadcrumbLabel,
  getViewPageDescription,
} from '../../../shared/utils/entityPageLabels';

const ENTITY_NAME = 'design';

export default function DesignViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const entityConfig = getEntityConfig(ENTITY_NAME);

  const [initialData, setInitialData] = useState<Partial<StaticDesignFormData> | undefined>(
    undefined
  );
  const [rawEntity, setRawEntity] = useState<Record<string, unknown> | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!id || String(id).trim() === '') return;
    let mounted = true;
    const decodedId = decodeURIComponent(String(id).trim());
    setDataLoading(true);
    setLoadError(null);
    getEntity(ENTITY_NAME, decodedId)
      .then((res) => {
        if (!mounted) return;
        const entity = getDesignEntityFromResponse(res, decodedId);
        if (entity) {
          setInitialData(toInitialDesignData(entity));
          setRawEntity(entity);
          setLoadError(null);
        } else {
          setLoadError('Design not found or invalid response from server.');
        }
      })
      .catch((err) => {
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : '';
        if (msg === 'canceled' || msg === 'aborted' || msg.toLowerCase().includes('cancel')) return;
        setLoadError(msg || 'Failed to load design');
        showErrorToastUnlessAuth(msg || 'Failed to load design');
      })
      .finally(() => {
        if (mounted) setDataLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleBack = useCallback(() => {
    navigate(entityConfig.routes.list);
  }, [navigate, entityConfig.routes.list]);

  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const editUrl = entityConfig.routes.edit.replace(':id', id != null ? encodeURIComponent(id) : '');

  if (!id) {
    return <Navigate to={entityConfig.routes.list} replace />;
  }

  if (dataLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading design...
          </p>
        </div>
      </div>
    );
  }

  if (loadError || !initialData) {
    return (
      <div className="w-full">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: entityConfig.displayNamePlural, href: entityConfig.routes.list },
            { label: getViewPageHeading(entityConfig, undefined) },
          ]}
          className="mb-4"
        />
        <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
            {loadError ?? 'Design not found.'}
          </p>
          <div className="flex items-center gap-3 mt-4">
            <BackButton onClick={handleBack} />
            <button
              type="button"
              onClick={handleBack}
              className={`px-4 py-2.5 rounded-lg font-semibold text-sm ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
            >
              Back to list
            </button>
          </div>
        </div>
      </div>
    );
  }

  const viewPageHeading = getViewPageHeading(entityConfig, initialData?.design_name);
  const breadcrumbLabel = getViewBreadcrumbLabel(entityConfig, initialData?.design_name);

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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1
            className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {viewPageHeading}
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {getViewPageDescription(entityConfig)}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <BackButton onClick={handleBack} />
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
      <div
        className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <h2
          className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          {entityConfig.displayName} Info
        </h2>
        <StaticDesignForm
          key={initialData?.design_name ?? id}
          initialData={initialData}
          productOptions={[]}
          isEdit={true}
          readOnly={true}
          wrapInForm={false}
          showActions={false}
        />
        <AuditTrailsCard entity={rawEntity} asSection />
      </div>
    </div>
  );
}
