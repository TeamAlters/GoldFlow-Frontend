import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { getEntity } from '../../admin/admin.api';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import StaticDesignForm, { type StaticDesignFormData } from './designForm';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import { toInitialDesignData } from './designCreate';
import AuditTrailsCard from '../../../shared/components/AuditTrailsCard';
import BackButton from '../../../shared/components/BackButton';

const ENTITY_NAME = 'design';

export default function DesignViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const entityConfig = getEntityConfig(ENTITY_NAME);

  const [initialData, setInitialData] = useState<Partial<StaticDesignFormData> | undefined>(
    undefined
  );
  const [rawEntity, setRawEntity] = useState<Record<string, unknown> | undefined>(undefined);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setDataLoading(true);
    getEntity(ENTITY_NAME, id, { signal: controller.signal })
      .then((res) => {
        if (controller.signal.aborted) return;
        if (res.data && typeof res.data === 'object') {
          const entity = res.data as Record<string, unknown>;
          setInitialData(toInitialDesignData(entity));
          setRawEntity(entity);
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        const msg = err instanceof Error ? err.message : 'Failed to load design';
        showErrorToastUnlessAuth(msg);
      })
      .finally(() => {
        if (!controller.signal.aborted) setDataLoading(false);
      });
    return () => controller.abort();
  }, [id]);

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
            Loading design...
          </p>
        </div>
      </div>
    );
  }

  const breadcrumbLabel = initialData?.design_name ?? 'View Design';

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
            View {entityConfig.displayName}
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Read-only design information.
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
            Edit Design
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
