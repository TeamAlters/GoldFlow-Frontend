import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import { getEntityDetailRoute } from '../../../shared/utils/referenceLinks';
import { useUIStore } from '../../../stores/ui.store';
import { getSectionClass } from '../../../shared/utils/viewPageStyles';
import { getEntityConfig } from '../../../config/entity.config';
import { getEntity } from '../../admin/admin.api';
import { showErrorToastUnlessAuth, isNotFoundError } from '../../../shared/utils/errorHandling';
import BackButton from '../../../shared/components/BackButton';
import AuditTrailsCard from '../../../shared/components/AuditTrailsCard';
import { NOT_FOUND_PATH, NOT_FOUND_REASON_DEFAULT, NOT_FOUND_REASON_INVALID_URL } from '../../../config/navigation.config';

const ENTITY_NAME = 'job_card_transaction';

export default function JobCardTransactionViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const sectionClass = getSectionClass(isDarkMode);
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const [loading, setLoading] = useState(true);
  const [entity, setEntity] = useState<Record<string, unknown> | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const entityRes = await getEntity(ENTITY_NAME, decodeURIComponent(id));
        if (!mounted) return;
        setEntity(
          entityRes.data && typeof entityRes.data === 'object'
            ? (entityRes.data as Record<string, unknown>)
            : null
        );
      } catch (err) {
        if (!mounted) return;
        if (isNotFoundError(err)) {
          setNotFound(true);
          return;
        }
        const msg = err instanceof Error ? err.message : 'Failed to load job card transaction view';
        showErrorToastUnlessAuth(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleBack = () => {
    navigate(entityConfig.routes.list);
  };

  if (!id) return (
    <Navigate to={NOT_FOUND_PATH} state={{ reason: NOT_FOUND_REASON_INVALID_URL }} replace />
  );

  if (notFound) {
    return (
      <Navigate to={NOT_FOUND_PATH} state={{ reason: NOT_FOUND_REASON_DEFAULT }} replace />
    );
  }

  const labelClass = `block text-sm font-semibold mb-1 ${
    isDarkMode ? 'text-gray-400' : 'text-gray-600'
  }`;

  const valueClass = `min-h-[42px] px-4 py-2.5 flex items-center rounded-lg border text-sm font-medium ${
    isDarkMode ? 'bg-gray-700/50 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'
  }`;

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '–';
    if (typeof value === 'string') return value || '–';
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading job card transaction...
          </p>
        </div>
      </div>
    );
  }

  const auditFields = ['created_at', 'modified_at', 'created_by', 'modified_by'];
  const excludeFromDetails = ['id', 'name', ...auditFields];
  const fields = entity ? Object.keys(entity).filter((key) => !excludeFromDetails.includes(key)) : [];

  return (
    <div className="w-full">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: entityConfig.displayNamePlural, href: entityConfig.routes.list },
          { label: decodeURIComponent(id) },
        ]}
        className="mb-4"
      />
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1
            className={`text-2xl sm:text-3xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            {decodeURIComponent(id)}
          </h1>
          <div className="flex items-center gap-3">
            <BackButton onClick={handleBack} />
          </div>
        </div>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          View job card transaction details
        </p>
      </div>

      <div
        className={`p-6 rounded-xl border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
        }`}
      >
        <div className={sectionClass}>
          <h3
            className={`text-lg font-semibold mb-4 pb-2 border-b ${
              isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-300'
            }`}
          >
            Transaction Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.map((key) => {
              const value = entity?.[key];
              const referenceRoute =
                typeof value === 'string' && value ? getEntityDetailRoute(key, value) : null;
              return (
                <div key={key}>
                  <label className={labelClass}>
                    {key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </label>
                  <div className={valueClass}>
                    {referenceRoute ? (
                      <Link
                        to={referenceRoute}
                        className={
                          isDarkMode
                            ? 'text-amber-400 hover:text-amber-300'
                            : 'text-amber-600 hover:text-amber-700'
                        }
                      >
                        {formatValue(value)}
                      </Link>
                    ) : (
                      formatValue(value)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <AuditTrailsCard entity={entity} asSection />
      </div>
    </div>
  );
}
