import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { getEntity } from '../../admin/admin.api';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { useUIStore } from '../../../stores/ui.store';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import { toFromToAccessoryInitialData } from './accessoriesPurityRangeCreate';
import {
  getViewPageTitle,
  getViewBreadcrumbLabel,
  getViewPageDescription,
} from '../../../shared/utils/entityPageLabels';
import AuditTrailsCard from '../../../shared/components/AuditTrailsCard';
import BackButton from '../../../shared/components/BackButton';

const ENTITY_NAME = 'accessories_purity_range';

export default function AccessoriesPurityRangeViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const entityConfig = getEntityConfig(ENTITY_NAME);

  const [data, setData] = useState<{
    from_value: string;
    to_value: string;
    accessory_purity: string;
    purity_range: string;
  } | undefined>(undefined);
  const [rawEntity, setRawEntity] = useState<Record<string, unknown> | undefined>(undefined);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setDataLoading(true);
    getEntity(ENTITY_NAME, decodeURIComponent(id))
      .then((res) => {
        if (res.data && typeof res.data === 'object') {
          const entity = res.data as Record<string, unknown>;
          setData(toFromToAccessoryInitialData(entity));
          setRawEntity(entity);
        }
      })
      .catch((err) => {
        const msg =
          err instanceof Error ? err.message : 'Failed to load accessories purity range';
        showErrorToastUnlessAuth(msg);
      })
      .finally(() => setDataLoading(false));
  }, [id]);

  const handleBack = useCallback(() => {
    navigate(entityConfig.routes.list);
  }, [navigate, entityConfig.routes.list]);

  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const editUrl = id
    ? entityConfig.routes.edit.replace(':id', encodeURIComponent(id))
    : '';

  if (!id) {
    return <Navigate to={entityConfig.routes.list} replace />;
  }

  if (dataLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading accessories purity range...
          </p>
        </div>
      </div>
    );
  }

  const labelClass = `block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`;
  const readOnlyInputClass = `w-full px-4 py-2.5 text-sm rounded-lg border ${isDarkMode
      ? 'bg-gray-700/50 border-gray-600 text-white'
      : 'bg-white border-gray-300 text-gray-900'
    }`;
  const viewPageTitle = getViewPageTitle(entityConfig);
  const breadcrumbLabel = getViewBreadcrumbLabel(entityConfig, data?.purity_range);

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
            {viewPageTitle}
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {getViewPageDescription(entityConfig)}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <BackButton onClick={handleBack} />
          <Link
            to={editUrl}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${isDarkMode
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>From Value</label>
            <div className={readOnlyInputClass}>{data?.from_value ?? '—'}</div>
          </div>
          <div>
            <label className={labelClass}>To Value</label>
            <div className={readOnlyInputClass}>{data?.to_value ?? '—'}</div>
          </div>
          <div>
            <label className={labelClass}>Accessory Purity</label>
            <div className={readOnlyInputClass}>{data?.accessory_purity ?? '—'}</div>
          </div>
        </div>
        <AuditTrailsCard entity={rawEntity} asSection />
      </div>
    </div>
  );
}
