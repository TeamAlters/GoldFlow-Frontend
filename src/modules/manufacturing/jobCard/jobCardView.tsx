import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { getEntityDetailRoute } from '../../../shared/utils/referenceLinks';
import { getEntity } from '../../admin/admin.api';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { getSectionClass } from '../../../shared/utils/viewPageStyles';
import { formatDateTime } from '../../../shared/utils/dateUtils';
import { useUIStore } from '../../../stores/ui.store';
import AuditTrailsCard from '../../../shared/components/AuditTrailsCard';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import BackButton from '../../../shared/components/BackButton';
import {
  getViewPageHeading,
  getViewBreadcrumbLabel,
  getViewPageDescription,
} from '../../../shared/utils/entityPageLabels';

const ENTITY_NAME = 'job_card';
const JOB_CARD_TRANSACTION_ENTITY = 'job_card_transaction';

interface JobCardTransaction {
  name: string;
  transaction_type: string;
  job_card: string;
  item: string;
  weight: string;
  fine_weight: string;
  karigar: string | null;
  purity: string | null;
  qty: string | null;
  created_at: string;
  modified_at: string;
  created_by: string;
  modified_by: string;
}

interface JobCardData {
  name: string;
  product: string;
  parent_melting_lot: string | null;
  melting_lot: string;
  purity: string;
  department: string;
  department_group: string;
  design: string;
  previous_job_card: string | null;
  qty: number | null;
  created_at: string;
  modified_at: string;
  created_by: string;
  modified_by: string;
  transactions?: JobCardTransaction[];
}

const REFERENCE_FIELDS = [
  'product',
  'parent_melting_lot',
  'melting_lot',
  'purity',
  'department',
  'department_group',
  'design',
  'previous_job_card',
] as const;

function RenderFieldValue({
  fieldKey,
  value,
  isDarkMode,
}: {
  fieldKey: string;
  value: unknown;
  isDarkMode: boolean;
}) {
  const strVal = value != null && value !== '' ? String(value) : null;
  const route = strVal && REFERENCE_FIELDS.includes(fieldKey as (typeof REFERENCE_FIELDS)[number])
    ? getEntityDetailRoute(fieldKey, strVal)
    : null;
  const linkClass = isDarkMode
    ? 'text-amber-400 hover:text-amber-300'
    : 'text-amber-600 hover:text-amber-700';
  if (route) {
    return (
      <Link to={route} className={linkClass}>
        {strVal}
      </Link>
    );
  }
  return <span>{strVal ?? '–'}</span>;
}

export default function JobCardViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const jobCardTransactionConfig = getEntityConfig(JOB_CARD_TRANSACTION_ENTITY);
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const sectionClass = getSectionClass(isDarkMode);

  const [data, setData] = useState<JobCardData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setDataLoading(true);
    getEntity(ENTITY_NAME, decodeURIComponent(id))
      .then((res) => {
        if (res.data && typeof res.data === 'object') {
          setData(res.data as unknown as JobCardData);
        }
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Failed to load job card';
        showErrorToastUnlessAuth(msg);
      })
      .finally(() => setDataLoading(false));
  }, [id]);

  const handleBack = useCallback(() => {
    navigate(entityConfig.routes.list);
  }, [navigate, entityConfig.routes.list]);

  if (!id) {
    return <Navigate to={entityConfig.routes.list} replace />;
  }

  const displayValue = data?.name ?? decodeURIComponent(id);
  const viewPageHeading = getViewPageHeading(entityConfig, displayValue);
  const breadcrumbLabel = getViewBreadcrumbLabel(entityConfig, displayValue);
  const editUrl = entityConfig.routes.edit?.replace(':id', encodeURIComponent(id)) ?? '';

  const labelClass = `block text-sm font-semibold mb-1 ${
    isDarkMode ? 'text-gray-400' : 'text-gray-600'
  }`;

  const valueClass = `min-h-[42px] px-4 py-2.5 flex items-center rounded-lg border text-sm font-medium ${
    isDarkMode ? 'bg-gray-700/50 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'
  }`;

  const transactions = data?.transactions ?? [];

  if (dataLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading job card...
          </p>
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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1
            className={`text-2xl sm:text-3xl font-bold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
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
            Edit
          </Link>
        </div>
      </div>

      <div
        className={`p-6 rounded-xl border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
        }`}
      >
        <div className={sectionClass}>
          <h2
            className={`text-lg font-semibold mb-4 pb-2 border-b ${
              isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-300'
            }`}
          >
            Job Card Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Name</label>
              <div className={valueClass}>{data?.name ?? '–'}</div>
            </div>
            <div>
              <label className={labelClass}>Product</label>
              <div className={valueClass}>
                <RenderFieldValue fieldKey="product" value={data?.product} isDarkMode={isDarkMode} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Parent Melting Lot</label>
              <div className={valueClass}>
                <RenderFieldValue
                  fieldKey="parent_melting_lot"
                  value={data?.parent_melting_lot}
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Melting Lot</label>
              <div className={valueClass}>
                <RenderFieldValue
                  fieldKey="melting_lot"
                  value={data?.melting_lot}
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Purity</label>
              <div className={valueClass}>
                <RenderFieldValue fieldKey="purity" value={data?.purity} isDarkMode={isDarkMode} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Department</label>
              <div className={valueClass}>
                <RenderFieldValue
                  fieldKey="department"
                  value={data?.department}
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Department Group</label>
              <div className={valueClass}>
                <RenderFieldValue
                  fieldKey="department_group"
                  value={data?.department_group}
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Design</label>
              <div className={valueClass}>
                <RenderFieldValue fieldKey="design" value={data?.design} isDarkMode={isDarkMode} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Previous Job Card</label>
              <div className={valueClass}>
                <RenderFieldValue
                  fieldKey="previous_job_card"
                  value={data?.previous_job_card}
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Qty</label>
              <div className={valueClass}>{data?.qty != null ? data.qty : '–'}</div>
            </div>
          </div>
        </div>

        <AuditTrailsCard entity={data as Record<string, unknown> | null} asSection />

        {transactions.length > 0 && (
          <div className={`${sectionClass} mt-4`}>
            <h2
              className={`text-lg font-semibold mb-4 pb-2 border-b ${
                isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-300'
              }`}
            >
              Transactions
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    className={`border-b ${
                      isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-teal-700 border-teal-800'
                    }`}
                  >
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-left text-white">
                      Name
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-left text-white">
                      Type
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-left text-white">
                      Item
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-left text-white">
                      Weight
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-left text-white">
                      Fine Weight
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-left text-white">
                      Karigar
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-left text-white">
                      Purity
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-left text-white">
                      Created At
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {transactions.map((tx) => {
                    const txDetailUrl = jobCardTransactionConfig.routes.detail.replace(
                      ':id',
                      encodeURIComponent(tx.name)
                    );
                    return (
                      <tr
                        key={tx.name}
                        className={isDarkMode ? 'bg-gray-800' : 'bg-white'}
                      >
                        <td className="px-4 py-3 text-sm">
                          <Link
                            to={txDetailUrl}
                            className={
                              isDarkMode
                                ? 'text-amber-400 hover:text-amber-300'
                                : 'text-amber-600 hover:text-amber-700'
                            }
                          >
                            {tx.name}
                          </Link>
                        </td>
                        <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {tx.transaction_type ?? '–'}
                        </td>
                        <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {tx.item ?? '–'}
                        </td>
                        <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {tx.weight ?? '–'}
                        </td>
                        <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {tx.fine_weight ?? '–'}
                        </td>
                        <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {tx.karigar ?? '–'}
                        </td>
                        <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {tx.purity ?? '–'}
                        </td>
                        <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {tx.created_at ? formatDateTime(tx.created_at) : '–'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
