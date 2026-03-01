import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { getEntityDetailRoute } from '../../../shared/utils/referenceLinks';
import { getEntity } from '../../admin/admin.api';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import {
  getSectionHeaderClass,
} from '../../../shared/utils/viewPageStyles';
import { formatDateTime } from '../../../shared/utils/dateUtils';
import { useUIStore } from '../../../stores/ui.store';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import BackButton from '../../../shared/components/BackButton';
import {
  getViewPageHeading,
  getViewBreadcrumbLabel,
  getViewPageDescription,
} from '../../../shared/utils/entityPageLabels';
import JobCardReadOnlyTable from '../../../shared/components/JobCardReadOnlyTable';

const ENTITY_NAME = 'job_card';
const JOB_CARD_TRANSACTION_ENTITY = 'job_card_transaction';

const RECEIPT_TYPE = 'Receipt';
const ISSUE_TYPE = 'Issue';

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
  design?: string;
  created_at: string;
  modified_at: string;
  created_by: string;
  modified_by: string;
}

interface CardFlowStep {
  label?: string;
  department?: string;
  purity?: string;
  completed?: boolean;
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
  receipts?: JobCardTransaction[];
  issues?: JobCardTransaction[];
  balance_weight?: number | string;
  balance_fine_weight?: number | string;
  issued_weight?: number | string;
  card_flow?: CardFlowStep[];
}

function computeIssuedWeight(issues: Array<{ weight?: string | number }>): number {
  return (issues ?? []).reduce((sum, o) => sum + (parseFloat(String(o.weight ?? 0)) || 0), 0);
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

/** Simple neutral tag style - text color from isDarkMode so it stays black in light theme. */
function getSimpleTagClass(isDarkMode: boolean): string {
  return `inline-flex items-center text-sm font-medium ${isDarkMode ? 'text-gray-100' : 'text-black'}`;
}

function FieldTag({
  fieldKey,
  value,
  simpleTagClass,
}: {
  fieldKey: string;
  value: unknown;
  simpleTagClass: string;
}) {
  const strVal = value != null && value !== '' ? String(value) : null;
  const route =
    strVal && REFERENCE_FIELDS.includes(fieldKey as (typeof REFERENCE_FIELDS)[number])
      ? getEntityDetailRoute(fieldKey, strVal)
      : null;
  const content = <span className={simpleTagClass}>{strVal ?? '–'}</span>;
  if (route) {
    return <Link to={route} className="inline-block">{content}</Link>;
  }
  return content;
}

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
  const route =
    strVal && REFERENCE_FIELDS.includes(fieldKey as (typeof REFERENCE_FIELDS)[number])
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

function formatBalance(val: number | string | undefined): string {
  if (val === undefined || val === null) return '–';
  const n = typeof val === 'number' ? val : parseFloat(String(val));
  return Number.isFinite(n) ? `${n.toFixed(4)} g` : '–';
}

export default function JobCardViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const jobCardTransactionConfig = getEntityConfig(JOB_CARD_TRANSACTION_ENTITY);
  const isDarkMode = useUIStore((state) => state.isDarkMode);

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

  const labelClass = `block text-sm font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
    }`;

  const valueClass = `min-h-[42px] px-4 py-2.5 flex items-center rounded-lg border text-sm font-medium ${isDarkMode ? 'bg-gray-700/50 border-gray-600 text-gray-100' : 'bg-gray-50 border-gray-200 text-black'
    }`;

  const transactions = data?.transactions ?? [];
  const receiptTransactions =
    data?.receipts ?? transactions.filter((tx) => String(tx.transaction_type).trim() === RECEIPT_TYPE);
  const issueTransactions =
    data?.issues ?? transactions.filter((tx) => String(tx.transaction_type).trim() === ISSUE_TYPE);

  const balanceWeight = data?.balance_weight;
  const balanceFineWeight = data?.balance_fine_weight;
  const issuedWeight =
    data?.issued_weight != null
      ? data.issued_weight
      : computeIssuedWeight(issueTransactions);
  const cardFlow = data?.card_flow;

  const cardWrapperClass = `p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
    }`;

  const headerClass = getSectionHeaderClass(isDarkMode);

  const simpleTagClass = getSimpleTagClass(isDarkMode);

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
    <div className={`w-full ${!isDarkMode ? 'bg-[#F5F2EE] min-h-[calc(100vh-8rem)]' : ''}`}>
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
            className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'
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
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${isDarkMode
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
          >
            Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Card Details */}
          <div className={cardWrapperClass}>
            <h2 className={`${headerClass} pb-2 border-b`}>
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
                  <FieldTag fieldKey="product" value={data?.product} simpleTagClass={simpleTagClass} />
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
                  <FieldTag fieldKey="melting_lot" value={data?.melting_lot} simpleTagClass={simpleTagClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Purity</label>
                <div className={valueClass}>
                  <FieldTag fieldKey="purity" value={data?.purity} simpleTagClass={simpleTagClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Department</label>
                <div className={valueClass}>
                  <FieldTag fieldKey="department" value={data?.department} simpleTagClass={simpleTagClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Department Group</label>
                <div className={valueClass}>
                  <FieldTag fieldKey="department_group" value={data?.department_group} simpleTagClass={simpleTagClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Design</label>
                <div className={valueClass}>
                  <FieldTag fieldKey="design" value={data?.design} simpleTagClass={simpleTagClass} />
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
                <label className={labelClass}>Quantity</label>
                <div className={valueClass}>{data?.qty != null ? data.qty : '–'}</div>
              </div>
            </div>
          </div>

          {/* Receipt Weights */}
          <div className={cardWrapperClass}>
            <h2 className={`${headerClass} pb-2 border-b`}>
              Receipt Weights
            </h2>
            <p className={`text-xs mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Inbound · transaction_type: Receipt.
            </p>
            {receiptTransactions.length > 0 ? (
              <JobCardReadOnlyTable
                columns={[
                  { key: 'item', header: 'Item' },
                  { key: 'weight', header: 'Weight (G)' },
                  { key: 'fine_weight', header: 'Fine Weight (G)' },
                  { key: 'purity', header: 'Purity', type: 'tag' },
                  { key: 'name', header: 'Ref', type: 'link' },
                  { key: 'created_at', header: 'Date', type: 'date' },
                ]}
                rows={receiptTransactions as unknown as Record<string, unknown>[]}
                getLinkHref={(row, key) => {
                  if (key === 'name' && row.name) {
                    return jobCardTransactionConfig.routes.detail.replace(':id', encodeURIComponent(String(row.name)));
                  }
                  if (key === 'purity') {
                    return getEntityDetailRoute('purity', row.purity) ?? null;
                  }
                  return null;
                }}
                tagClass={simpleTagClass}
                formatDate={(val) => (val ? formatDateTime(String(val)) : '–')}
                isDarkMode={isDarkMode}
                rowKey={(row) => String(row.name ?? '')}
              />
            ) : (
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No receipt transactions.
              </p>
            )}
          </div>

          {/* Issue Balance */}
          <div className={cardWrapperClass}>
            <h2 className={`${headerClass} pb-2 border-b`}>
              Issue Balance
            </h2>
            {issueTransactions.length > 0 ? (
              <JobCardReadOnlyTable
                columns={[
                  { key: 'item', header: 'Item' },
                  { key: 'weight', header: 'Weight (G)' },
                  { key: 'fine_weight', header: 'Fine WT (G)' },
                  { key: 'karigar', header: 'Karigar' },
                  { key: 'qty', header: 'Qty' },
                  { key: 'design', header: 'Design' },
                  { key: 'purity', header: 'Purity', type: 'tag' },
                ]}
                rows={issueTransactions as unknown as Record<string, unknown>[]}
                tagClass={simpleTagClass}
                isDarkMode={isDarkMode}
                rowKey={(row) => String(row.name ?? '')}
              />
            ) : (
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No issue transactions.
              </p>
            )}
          </div>
        </div>

        {/* Right column: sidebar */}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-[6.75rem] lg:self-start">
          {/* Live Balance */}
          <div
            className={
              isDarkMode
                ? 'p-6 rounded-xl border border-gray-700 bg-gray-800'
                : 'p-6 rounded-xl border border-gray-200 shadow-sm bg-[#FDF5E6] border-t-4 border-t-[#B87820]'
            }
          >
            <h2
              className={
                isDarkMode
                  ? 'text-sm font-semibold uppercase tracking-wider text-white pb-2 border-b border-gray-600'
                  : 'text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2 text-amber-900'
              }
            >
              {!isDarkMode && <span className="w-2 h-2 rounded-full bg-[#B87820] shrink-0" aria-hidden />}
              Live Balance
            </h2>
            <div className={`space-y-3 border-t pt-3 ${isDarkMode ? 'border-gray-600' : 'border-amber-200'}`}>
              <div>
                <p className={isDarkMode ? 'block text-sm font-medium mb-1 text-gray-400' : 'block text-sm font-semibold mb-1 text-amber-800'}>
                  Balance Weight
                </p>
                <p
                  className={
                    isDarkMode
                      ? 'text-base font-semibold text-white'
                      : 'text-lg font-semibold text-[#B87820]'
                  }
                >
                  {formatBalance(balanceWeight)}
                </p>
              </div>
              <div>
                <p className={isDarkMode ? 'block text-sm font-medium mb-1 text-gray-400' : 'block text-sm font-semibold mb-1 text-amber-800'}>
                  Balance Fine Weight
                </p>
                <p
                  className={
                    isDarkMode
                      ? 'text-base font-semibold text-white'
                      : 'text-lg font-semibold text-[#B87820]'
                  }
                >
                  {formatBalance(balanceFineWeight)}
                </p>
              </div>
              <div>
                <p className={isDarkMode ? 'block text-sm font-medium mb-1 text-gray-400' : 'block text-sm font-semibold mb-1 text-amber-800'}>
                  Issued Weight
                </p>
                <p
                  className={
                    isDarkMode
                      ? 'text-base font-semibold text-white'
                      : 'text-lg font-semibold text-[#B87820]'
                  }
                >
                  {formatBalance(issuedWeight)}
                </p>
              </div>
            </div>
          </div>

          {/* Card Flow */}
          <div className={cardWrapperClass}>
            <h2
              className={
                isDarkMode
                  ? headerClass
                  : 'text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2 text-gray-900'
              }
            >
              {!isDarkMode && <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" aria-hidden />}
              Card Flow
            </h2>
            {cardFlow && cardFlow.length > 0 ? (
              <div
                className={`border-t pt-3 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} ml-1 pl-4 border-l-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} space-y-3`}
              >
                {cardFlow.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    {step.completed ? (
                      <span
                        className={`shrink-0 mt-0.5 flex items-center justify-center rounded-lg ${isDarkMode ? 'text-green-500' : 'bg-teal-100 text-teal-600 p-0.5'}`}
                        aria-hidden
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    ) : (
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                          }`}
                      >
                        {idx + 1}
                      </span>
                    )}
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                        {step.label ?? step.department ?? 'Step'}
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {step.department && step.purity
                          ? `${step.department} · ${step.purity}`
                          : step.department ?? 'Not assigned'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} border-t pt-3 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                Not assigned
              </p>
            )}
          </div>

          {/* Audit */}
          <div className={cardWrapperClass}>
            <h2
              className={
                isDarkMode
                  ? headerClass
                  : 'text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2 text-gray-900'
              }
            >
              {!isDarkMode && <span className="w-2 h-2 rounded-full bg-gray-500 shrink-0" aria-hidden />}
              Audit
            </h2>
            <div className={`border-t pt-3 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
              <div className={`flex justify-between items-baseline py-2 ${isDarkMode ? 'border-b border-gray-600' : 'border-b border-gray-200'}`}>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Created By</span>
                <span className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                  {data?.created_by ?? '–'}
                </span>
              </div>
              <div className={`flex justify-between items-baseline py-2 ${isDarkMode ? 'border-b border-gray-600' : 'border-b border-gray-200'}`}>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Created At</span>
                <span className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                  {data?.created_at ? formatDateTime(data.created_at) : '–'}
                </span>
              </div>
              <div className={`flex justify-between items-baseline py-2 ${isDarkMode ? 'border-b border-gray-600' : 'border-b border-gray-200'}`}>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Modified At</span>
                <span className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                  {data?.modified_at ? formatDateTime(data.modified_at) : '–'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
