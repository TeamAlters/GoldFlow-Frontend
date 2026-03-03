import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import { getEntity } from '../../admin/admin.api';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { formatDateTime } from '../../../shared/utils/dateUtils';
import { getEntityDetailRoute } from '../../../shared/utils/referenceLinks';
import { useUIStore } from '../../../stores/ui.store';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import BackButton from '../../../shared/components/BackButton';
import JobCardReadOnlyTable from '../../../shared/components/JobCardReadOnlyTable';
import {
  getViewPageHeading,
  getViewBreadcrumbLabel,
  getViewPageDescription,
} from '../../../shared/utils/entityPageLabels';
import type { IssueTransaction } from './jobCardTransactions.api';

const ENTITY_NAME = 'job_card';

interface CardFlowStep {
  label?: string;
  department?: string;
  department_group?: string;
  purity?: string;
  completed?: boolean;
}

interface JobCardData {
  name?: string;
  product?: string;
  parent_melting_lot?: string;
  melting_lot?: string;
  purity?: string;
  department?: string;
  department_group?: string;
  design?: string;
  previous_job_card?: string;
  qty?: string | number | null;
  receipts?: IssueTransaction[];
  issues?: IssueTransaction[];
  balance_weight?: number;
  balance_fine_weight?: number;
  card_flow?: CardFlowStep[];
  next_department_group?: string;
  next_department?: string;
  created_by?: string;
  created_at?: string;
  modified_at?: string;
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
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  const [data, setData] = useState<JobCardData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setDataLoading(true);
    const decodedId = decodeURIComponent(id);
    getEntity(ENTITY_NAME, decodedId)
      .then((res) => {
        if (res.data && typeof res.data === 'object') {
          const entity = res.data as Record<string, unknown>;
          setData({
            name: entity.name != null ? String(entity.name) : undefined,
            product: entity.product != null ? String(entity.product) : undefined,
            parent_melting_lot:
              entity.parent_melting_lot != null ? String(entity.parent_melting_lot) : undefined,
            melting_lot: entity.melting_lot != null ? String(entity.melting_lot) : undefined,
            purity: entity.purity != null ? String(entity.purity) : undefined,
            department: entity.department != null ? String(entity.department) : undefined,
            department_group:
              entity.department_group != null ? String(entity.department_group) : undefined,
            design: entity.design != null ? String(entity.design) : undefined,
            previous_job_card:
              entity.previous_job_card != null ? String(entity.previous_job_card) : undefined,
            qty:
              entity.qty !== undefined && entity.qty !== null
                ? String(entity.qty)
                : undefined,
            receipts: (entity.receipts as IssueTransaction[] | undefined) ?? [],
            issues: (entity.issues as IssueTransaction[] | undefined) ?? [],
            balance_weight: entity.balance_weight as number | undefined,
            balance_fine_weight: entity.balance_fine_weight as number | undefined,
            card_flow: entity.card_flow as CardFlowStep[] | undefined,
            next_department_group:
              entity.next_department_group != null
                ? String(entity.next_department_group)
                : undefined,
            next_department:
              entity.next_department != null ? String(entity.next_department) : undefined,
            created_by: entity.created_by as string | undefined,
            created_at: entity.created_at as string | undefined,
            modified_at: entity.modified_at as string | undefined,
          });
        }
      })
      .catch((err) => {
        showErrorToastUnlessAuth(
          err instanceof Error ? err.message : 'Failed to load job card'
        );
      })
      .finally(() => setDataLoading(false));
  }, [id]);

  const handleBack = useCallback(() => {
    navigate(entityConfig.routes.list);
  }, [navigate, entityConfig.routes.list]);

  const labelClass = `block text-sm font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
    }`;
  const valueClass = `min-h-[42px] px-4 py-2.5 flex items-center rounded-lg border text-sm font-medium ${isDarkMode
    ? 'bg-gray-700/50 border-gray-600 text-gray-200'
    : 'bg-gray-50 border-gray-200 text-gray-700'
    }`;
  const linkClass = isDarkMode
    ? 'text-amber-400 hover:text-amber-300'
    : 'text-[#B87820] hover:text-[#B87820]/80';
  const cardFlowValueClass =
    'text-lg font-semibold ' +
    (isDarkMode ? 'text-white' : 'text-[rgb(217,119,6)]');

  if (!id) {
    return <Navigate to={entityConfig.routes.list} replace />;
  }

  const displayValue = data?.name ?? decodeURIComponent(id);
  const viewPageHeading = getViewPageHeading(entityConfig, displayValue);
  const breadcrumbLabel = getViewBreadcrumbLabel(entityConfig, displayValue);
  const editUrl = entityConfig.routes.edit?.replace(':id', id) ?? '';

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

  const receipts = data?.receipts ?? [];
  const issues = data?.issues ?? [];
  const receiptRows = receipts.map((tx) => ({
    name: tx.name,
    item: tx.item ?? '',
    weight: tx.weight ?? '',
    fine_weight: tx.fine_weight ?? '',
    karigar: tx.karigar ?? '',
    qty: tx.qty ?? '',
    design: tx.design ?? '',
    purity: tx.purity ?? '',
  }));
  const issueRows = issues.map((tx) => ({
    name: tx.name,
    item: tx.item ?? '',
    weight: tx.weight ?? '',
    fine_weight: tx.fine_weight ?? '',
    karigar: tx.karigar ?? '',
    qty: tx.qty ?? '',
    next_job_card: tx.next_job_card ? String(tx.next_job_card) : '',
  }));

  const getLinkHref = (row: Record<string, unknown>, key: string): string | null => {
    const val = row[key];
    if (val == null || String(val).trim() === '') return null;
    return getEntityDetailRoute(key, val);
  };

  return (
    <div className="w-full relative">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-start">
        <div className="lg:col-span-2 space-y-6">
          {/* Job Card Details */}
          <div
            className={
              isDarkMode
                ? 'p-6 rounded-xl border border-gray-700 bg-gray-800'
                : 'p-6 rounded-xl border border-gray-200 shadow-sm bg-white'
            }
          >
            <h2
              className={`text-lg font-semibold mb-4 pb-2 border-b ${isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-300'
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
                  {data?.product ? (
                    (() => {
                      const r = getEntityDetailRoute('product', data.product);
                      return r ? (
                        <Link to={r} className={linkClass}>
                          {data.product}
                        </Link>
                      ) : (
                        data.product
                      );
                    })()
                  ) : (
                    '–'
                  )}
                </div>
              </div>
              <div>
                <label className={labelClass}>Parent Melting Lot</label>
                <div className={valueClass}>
                  {data?.parent_melting_lot ? (
                    (() => {
                      const r = getEntityDetailRoute(
                        'parent_melting_lot',
                        data.parent_melting_lot
                      );
                      return r ? (
                        <Link to={r} className={linkClass}>
                          {data.parent_melting_lot}
                        </Link>
                      ) : (
                        data.parent_melting_lot
                      );
                    })()
                  ) : (
                    '–'
                  )}
                </div>
              </div>
              <div>
                <label className={labelClass}>Melting Lot</label>
                <div className={valueClass}>
                  {data?.melting_lot ? (
                    (() => {
                      const r = getEntityDetailRoute('melting_lot', data.melting_lot);
                      return r ? (
                        <Link to={r} className={linkClass}>
                          {data.melting_lot}
                        </Link>
                      ) : (
                        data.melting_lot
                      );
                    })()
                  ) : (
                    '–'
                  )}
                </div>
              </div>
              <div>
                <label className={labelClass}>Purity</label>
                <div className={valueClass}>
                  {data?.purity ? (
                    (() => {
                      const r = getEntityDetailRoute('purity', data.purity);
                      return r ? (
                        <Link to={r} className={linkClass}>
                          {data.purity}
                        </Link>
                      ) : (
                        data.purity
                      );
                    })()
                  ) : (
                    '–'
                  )}
                </div>
              </div>
              <div>
                <label className={labelClass}>Department</label>
                <div className={valueClass}>
                  {data?.department ? (
                    (() => {
                      const r = getEntityDetailRoute('department', data.department);
                      return r ? (
                        <Link to={r} className={linkClass}>
                          {data.department}
                        </Link>
                      ) : (
                        data.department
                      );
                    })()
                  ) : (
                    '–'
                  )}
                </div>
              </div>
              <div>
                <label className={labelClass}>Department Group</label>
                <div className={valueClass}>
                  {data?.department_group ? (
                    (() => {
                      const r = getEntityDetailRoute(
                        'department_group',
                        data.department_group
                      );
                      return r ? (
                        <Link to={r} className={linkClass}>
                          {data.department_group}
                        </Link>
                      ) : (
                        data.department_group
                      );
                    })()
                  ) : (
                    '–'
                  )}
                </div>
              </div>
              <div>
                <label className={labelClass}>Design</label>
                <div className={valueClass}>{data?.design ?? '–'}</div>
              </div>
              <div>
                <label className={labelClass}>Previous Job Card</label>
                <div className={valueClass}>
                  {data?.previous_job_card ? (
                    (() => {
                      const r = getEntityDetailRoute(
                        'previous_job_card',
                        data.previous_job_card
                      );
                      return r ? (
                        <Link to={r} className={linkClass}>
                          {data.previous_job_card}
                        </Link>
                      ) : (
                        data.previous_job_card
                      );
                    })()
                  ) : (
                    '–'
                  )}
                </div>
              </div>
              <div>
                <label className={labelClass}>Qty</label>
                <div className={valueClass}>
                  {data?.qty != null && data.qty !== '' ? String(data.qty) : '–'}
                </div>
              </div>
            </div>
          </div>

          {/* Receipt */}
          <div
            className={
              isDarkMode
                ? 'p-6 rounded-xl border border-gray-700 bg-gray-800'
                : 'p-6 rounded-xl border border-gray-200 shadow-sm bg-white'
            }
          >
            <h2
              className={`text-lg font-semibold mb-4 pb-2 border-b ${isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-300'
                }`}
            >
              Receipt
            </h2>
            <p
              className={`text-xs mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
            >
              Inbound · transaction_type: Receipt.
            </p>
            {receiptRows.length > 0 ? (
              <JobCardReadOnlyTable
                columns={[
                  { key: 'item', header: 'Item', type: 'link' },
                  { key: 'weight', header: 'Weight (G)' },
                  { key: 'fine_weight', header: 'Fine WT (G)' },
                  { key: 'karigar', header: 'Karigar' },
                  { key: 'qty', header: 'Qty' },
                  { key: 'design', header: 'Design' },
                  { key: 'purity', header: 'Purity', type: 'link' },
                ]}
                rows={receiptRows}
                getLinkHref={getLinkHref}
                isDarkMode={isDarkMode}
                rowKey={(row) => String(row.name ?? '')}
              />
            ) : (
              <p
                className={`text-sm py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}
              >
                No receipts.
              </p>
            )}
          </div>

          {/* Issue */}
          <div
            className={
              isDarkMode
                ? 'p-6 rounded-xl border border-gray-700 bg-gray-800'
                : 'p-6 rounded-xl border border-gray-200 shadow-sm bg-white'
            }
          >
            <h2
              className={`text-lg font-semibold mb-4 pb-2 border-b ${isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-300'
                }`}
            >
              Issue
            </h2>
            <p
              className={`text-xs mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
            >
              Outbound · transaction_type: Issue.
            </p>
            {issueRows.length > 0 ? (
              <JobCardReadOnlyTable
                columns={[
                  { key: 'name', header: 'Name', type: 'link' },
                  { key: 'item', header: 'Item', type: 'link' },
                  { key: 'weight', header: 'Weight (G)' },
                  { key: 'fine_weight', header: 'Fine WT (G)' },
                  { key: 'karigar', header: 'Karigar' },
                  { key: 'qty', header: 'Qty' },
                  { key: 'next_job_card', header: 'Next Job Card', type: 'link' },
                ]}
                rows={issueRows}
                getLinkHref={getLinkHref}
                isDarkMode={isDarkMode}
                rowKey={(row) => String(row.name ?? '')}
              />
            ) : (
              <p
                className={`text-sm py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}
              >
                No issues.
              </p>
            )}
          </div>
        </div>

        {/* Right column: Balance, Card Flow, Audit */}
        <div className="space-y-6 lg:sticky lg:top-[var(--header-height)] lg:self-start lg:max-h-[calc(100vh-var(--header-height))] lg:overflow-y-auto lg:pb-4 scrollbar-hide">
          {/* Live Balance */}
          <div
            className={
              isDarkMode
                ? 'p-6 rounded-xl border border-gray-700 bg-gray-800'
                : 'p-6 rounded-xl border border-gray-200 shadow-sm bg-[#FDF5E6] border-t-4'
            }
          >
            <h2
              className={
                isDarkMode
                  ? 'text-sm font-semibold uppercase tracking-wider text-white pb-2 border-b border-gray-600'
                  : 'text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2 text-amber-900'
              }
            >
              {!isDarkMode && (
                <span
                  className="w-2 h-2 rounded-full bg-[#B87820] shrink-0"
                  aria-hidden
                />
              )}
              Live Balance
            </h2>
            <div
              className={`space-y-3 border-t pt-3 ${isDarkMode ? 'border-gray-600' : 'border-amber-200'
                }`}
            >
              <div>
                <p
                  className={
                    isDarkMode
                      ? 'block text-sm font-medium mb-1 text-gray-400'
                      : 'block text-sm font-semibold mb-1 text-amber-800'
                  }
                >
                  Balance Weight
                </p>
                <p
                  className={
                    isDarkMode
                      ? 'text-base font-semibold text-white'
                      : 'text-lg font-semibold text-[#B87820]'
                  }
                >
                  {formatBalance(data?.balance_weight)}
                </p>
              </div>
              <div>
                <p
                  className={
                    isDarkMode
                      ? 'block text-sm font-medium mb-1 text-gray-400'
                      : 'block text-sm font-semibold mb-1 text-amber-800'
                  }
                >
                  Balance Fine Weight
                </p>
                <p
                  className={
                    isDarkMode
                      ? 'text-base font-semibold text-white'
                      : 'text-lg font-semibold text-[#B87820]'
                  }
                >
                  {formatBalance(data?.balance_fine_weight)}
                </p>
              </div>
            </div>
          </div>

          {/* Card Flow */}
          <div
            className={
              isDarkMode
                ? 'p-6 rounded-xl border border-gray-700 bg-gray-800'
                : 'p-6 rounded-xl border border-gray-200 shadow-sm bg-[#FDF5E6] border-t-4'
            }
          >
            <h2
              className={
                isDarkMode
                  ? 'text-sm font-semibold uppercase tracking-wider text-white pb-2 border-b border-gray-600'
                  : 'text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2 text-amber-900'
              }
            >
              {!isDarkMode && (
                <span
                  className="w-2 h-2 rounded-full bg-[#B87820] shrink-0"
                  aria-hidden
                />
              )}
              Card Flow
            </h2>
            <div
              className={`space-y-3 border-t pt-3 ${isDarkMode ? 'border-gray-600' : 'border-amber-200'
                }`}
            >
              {(data?.next_department_group || data?.next_department) && (
                <>
                  {data?.next_department_group && (
                    <div>
                      <p
                        className={
                          isDarkMode
                            ? 'block text-sm font-medium mb-1 text-gray-400'
                            : 'block text-sm font-semibold mb-1 text-amber-800'
                        }
                      >
                        Next Department Group
                      </p>
                      <p className={cardFlowValueClass}>
                        {(() => {
                          const deptGroupRoute = getEntityDetailRoute(
                            'department_group',
                            data.next_department_group
                          );
                          return deptGroupRoute ? (
                            <Link
                              to={deptGroupRoute}
                              className={
                                isDarkMode
                                  ? 'text-amber-400 hover:text-amber-300'
                                  : 'text-[#B87820] hover:text-[#B87820]/80'
                              }
                            >
                              {data.next_department_group}
                            </Link>
                          ) : (
                            <span>{data.next_department_group}</span>
                          );
                        })()}
                      </p>
                    </div>
                  )}
                  {data?.next_department && (
                    <div>
                      <p
                        className={
                          isDarkMode
                            ? 'block text-sm font-medium mb-1 text-gray-400'
                            : 'block text-sm font-semibold mb-1 text-amber-800'
                        }
                      >
                        Next Department
                      </p>
                      <p className={cardFlowValueClass}>
                        {(() => {
                          const deptRoute = getEntityDetailRoute(
                            'department',
                            data.next_department
                          );
                          return deptRoute ? (
                            <Link
                              to={deptRoute}
                              className={
                                isDarkMode
                                  ? 'text-amber-400 hover:text-amber-300'
                                  : 'text-[#B87820] hover:text-[#B87820]/80'
                              }
                            >
                              {data.next_department}
                            </Link>
                          ) : (
                            <span>{data.next_department}</span>
                          );
                        })()}
                      </p>
                    </div>
                  )}
                </>
              )}
              {data?.card_flow && data.card_flow.length > 0 ? (
                <div
                  className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-600' : 'border-amber-200'
                    }`}
                >
                  <p
                    className={
                      isDarkMode
                        ? 'block text-sm font-medium mb-3 text-gray-400'
                        : 'block text-sm font-semibold mb-3 text-amber-800'
                    }
                  >
                    Flow Steps
                  </p>
                  <div
                    className={`ml-1 pl-4 border-l-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'
                      } space-y-3`}
                  >
                    {data.card_flow.map((step, idx) => {
                      const deptRoute = step.department
                        ? getEntityDetailRoute('department', step.department)
                        : null;
                      const deptGroupRoute = step.department_group
                        ? getEntityDetailRoute('department_group', step.department_group)
                        : null;
                      const linkClassStep = isDarkMode
                        ? 'text-amber-400 hover:text-amber-300'
                        : 'text-amber-600 hover:text-amber-700';
                      return (
                        <div key={idx} className="flex items-start gap-2">
                          {step.completed ? (
                            <span
                              className={`shrink-0 mt-0.5 flex items-center justify-center rounded-lg ${isDarkMode ? 'text-green-500' : 'bg-teal-100 text-teal-600 p-0.5'
                                }`}
                              aria-hidden
                            >
                              <svg
                                className="w-5 h-5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                          ) : (
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${isDarkMode
                                ? 'bg-gray-600 text-gray-300'
                                : 'bg-gray-200 text-gray-700'
                                }`}
                            >
                              {idx + 1}
                            </span>
                          )}
                          <div>
                            <p
                              className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'
                                }`}
                            >
                              {step.label ?? step.department ?? 'Step'}
                            </p>
                            <p
                              className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}
                            >
                              {step.department != null && step.department_group != null && (
                                <>
                                  {deptRoute ? (
                                    <Link to={deptRoute} className={linkClassStep}>
                                      {step.department}
                                    </Link>
                                  ) : (
                                    step.department
                                  )}
                                  {' · '}
                                  {deptGroupRoute ? (
                                    <Link to={deptGroupRoute} className={linkClassStep}>
                                      {step.department_group}
                                    </Link>
                                  ) : (
                                    step.department_group
                                  )}
                                </>
                              )}
                              {step.department != null && !step.department_group &&
                                (deptRoute ? (
                                  <Link to={deptRoute} className={linkClassStep}>
                                    {step.department}
                                  </Link>
                                ) : (
                                  step.department
                                ))}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : !data?.next_department_group && !data?.next_department ? (
                <p
                  className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                >
                  Not assigned
                </p>
              ) : null}
            </div>
          </div>

          {/* Audit */}
          {/* <div
            className={
              isDarkMode
                ? 'p-6 rounded-xl border border-gray-700 bg-gray-800'
                : 'p-6 rounded-xl border border-gray-200 shadow-sm bg-white'
            }
          >
            <h2
              className={`text-lg font-semibold mb-4 pb-2 border-b ${isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-300'
                }`}
            >
              Audit
            </h2>
            <div
              className={`border-t pt-3 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'
                }`}
            >
              <div
                className={`flex justify-between items-baseline py-2 ${isDarkMode ? 'border-b border-gray-600' : 'border-b border-gray-200'
                  }`}
              >
                <span
                  className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}
                >
                  Created By
                </span>
                <span
                  className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'
                    }`}
                >
                  {data?.created_by ?? '–'}
                </span>
              </div>
              <div
                className={`flex justify-between items-baseline py-2 ${isDarkMode ? 'border-b border-gray-600' : 'border-b border-gray-200'
                  }`}
              >
                <span
                  className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}
                >
                  Created At
                </span>
                <span
                  className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'
                    }`}
                >
                  {data?.created_at ? formatDateTime(data.created_at) : '–'}
                </span>
              </div>
              <div
                className={`flex justify-between items-baseline py-2 ${isDarkMode ? 'border-b border-gray-600' : 'border-b border-gray-200'
                  }`}
              >
                <span
                  className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}
                >
                  Modified At
                </span>
                <span
                  className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'
                    }`}
                >
                  {data?.modified_at ? formatDateTime(data.modified_at) : '–'}
                </span>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
