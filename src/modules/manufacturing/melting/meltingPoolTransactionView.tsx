import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import { useUIStore } from '../../../stores/ui.store';
import { getEntityConfig } from '../../../config/entity.config';
import { getEntity, getEntityMetadata, type EntityField } from '../../admin/admin.api';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { getRowDisplayValue } from '../../../shared/utils/common';
import BackButton from '../../../shared/components/BackButton';

const ENTITY_NAME = 'melting_pool_transaction';

export default function MeltingPoolTransactionViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<EntityField[]>([]);
  const [entity, setEntity] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [metaRes, entityRes] = await Promise.all([
          getEntityMetadata(ENTITY_NAME),
          getEntity(ENTITY_NAME, decodeURIComponent(id)),
        ]);
        if (!mounted) return;
        setFields(Array.isArray(metaRes.data?.fields) ? metaRes.data.fields : []);
        setEntity(
          entityRes.data && typeof entityRes.data === 'object'
            ? (entityRes.data as Record<string, unknown>)
            : null
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load transaction view';
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

  const displayFields = useMemo(() => {
    return fields.length > 0 ? fields : [];
  }, [fields]);

  if (!id) return <Navigate to={entityConfig.routes.list} replace />;

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

      <div
        className={`p-6 rounded-xl border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {id} 
          </h1>
          <BackButton onClick={() => navigate(entityConfig.routes.list)} />
        </div>

        {loading ? (
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Loading...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayFields.map((field) => (
              <div
                key={field.name}
                className={`rounded-lg border p-3 ${
                  isDarkMode ? 'border-gray-700 bg-gray-900/40' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {field.label}
                </div>
                <div className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                  {getRowDisplayValue(entity ?? {}, field.name, field.type)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}