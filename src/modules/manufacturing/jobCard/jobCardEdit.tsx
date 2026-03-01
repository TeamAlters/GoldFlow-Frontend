import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { getEntityConfig } from '../../../config/entity.config';
import {
  getEntity,
  updateEntity,
  getEntityReferenceOptions,
  getEntityListOptions,
} from '../../admin/admin.api';
import { showErrorToastUnlessAuth } from '../../../shared/utils/errorHandling';
import { toast } from '../../../stores/toast.store';
import { formatDateTime } from '../../../shared/utils/dateUtils';
import { getSectionHeaderClass } from '../../../shared/utils/viewPageStyles';
import { getEntityDetailRoute } from '../../../shared/utils/referenceLinks';
import { useUIStore } from '../../../stores/ui.store';
import Breadcrumbs from '../../../layout/Breadcrumbs';
import BackButton from '../../../shared/components/BackButton';
import JobCardForm, {
  type JobCardFormData,
} from './jobCardForm';
import EditableWeightTable from '../../../shared/components/EditableWeightTable';
import type { ColumnDef } from '../../../shared/components/EditableWeightTable';
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
}

type IssueRow = Record<string, string>;

interface CardFlowStep {
  label?: string;
  department?: string;
  purity?: string;
  completed?: boolean;
}

function formatBalance(val: number | string | undefined): string {
  if (val === undefined || val === null) return '–';
  const n = typeof val === 'number' ? val : parseFloat(String(val));
  return Number.isFinite(n) ? `${n.toFixed(4)} g` : '–';
}

function computeIssuedWeight(issues: Array<{ weight?: string | number }>): number {
  return (issues ?? []).reduce((sum, o) => sum + (parseFloat(String(o.weight ?? 0)) || 0), 0);
}

function toIssueRow(tx: JobCardTransaction): IssueRow {
  return {
    item: tx.item ?? '',
    weight: tx.weight ?? '',
    fine_weight: tx.fine_weight ?? '',
    karigar: tx.karigar ?? '',
    qty: tx.qty ?? '',
    design: tx.design ?? '',
    purity: tx.purity ?? '',
  };
}

export default function JobCardEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const entityConfig = getEntityConfig(ENTITY_NAME);
  const jobCardTransactionConfig = getEntityConfig(JOB_CARD_TRANSACTION_ENTITY);
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  

  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [initialData, setInitialData] = useState<Partial<JobCardFormData> | null>(null);
  const [entityName, setEntityName] = useState<string>('');
  const [productOptions, setProductOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [parentMeltingLotOptions, setParentMeltingLotOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [meltingLotOptions, setMeltingLotOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [purityOptions, setPurityOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [departmentOptions, setDepartmentOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [departmentGroupOptions, setDepartmentGroupOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [designOptions, setDesignOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [previousJobCardOptions, setPreviousJobCardOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [karigarOptions, setKarigarOptions] = useState<Array<{ value: string; label: string }>>([]);

  const [receiptTransactions, setReceiptTransactions] = useState<JobCardTransaction[]>([]);
  const [issueRows, setIssueRows] = useState<IssueRow[]>([]);
  const [balanceWeight, setBalanceWeight] = useState<number | string | undefined>(undefined);
  const [balanceFineWeight, setBalanceFineWeight] = useState<number | string | undefined>(undefined);
  const [issuedWeight, setIssuedWeight] = useState<number | string | undefined>(undefined);
  const [cardFlow, setCardFlow] = useState<CardFlowStep[] | undefined>(undefined);
  const [auditData, setAuditData] = useState<{
    created_by?: string;
    created_at?: string;
    modified_at?: string;
  }>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      setDataLoading(true);
      try {
        const decodedId = decodeURIComponent(id);
        const [
          entityRes,
          products,
          parentMeltingLots,
          meltingLots,
          purities,
          departments,
          departmentGroups,
          designs,
          jobCards,
          karigars,
        ] = await Promise.all([
          getEntity(ENTITY_NAME, decodedId),
          getEntityReferenceOptions('product', 'product_name', 'product_name'),
          getEntityListOptions('parent_melting_lot', 'name', 'name'),
          getEntityListOptions('melting_lot', 'name', 'name'),
          getEntityReferenceOptions('purity', 'purity', 'purity'),
          getEntityReferenceOptions('department', 'name', 'name'),
          getEntityListOptions('product_department_group', 'name', 'name'),
          getEntityReferenceOptions('design', 'design_name', 'design_name'),
          getEntityListOptions('job_card', 'name', 'name'),
          getEntityReferenceOptions('karigar', 'karigar', 'karigar'),
        ]);

        if (entityRes.data && typeof entityRes.data === 'object') {
          const entity = entityRes.data as Record<string, unknown>;
          const transactions = (entity.transactions as JobCardTransaction[]) ?? [];
          const receipts = (entity.receipts as JobCardTransaction[] | undefined) ?? transactions.filter((tx) => String(tx.transaction_type).trim() === RECEIPT_TYPE);
          const issues = (entity.issues as JobCardTransaction[] | undefined) ?? transactions.filter((tx) => String(tx.transaction_type).trim() === ISSUE_TYPE);
          setEntityName(String(entity.name ?? decodedId));
          setInitialData({
            name: String(entity.name ?? ''),
            product: String(entity.product ?? ''),
            parent_melting_lot: String(entity.parent_melting_lot ?? ''),
            melting_lot: String(entity.melting_lot ?? ''),
            purity: String(entity.purity ?? ''),
            department: String(entity.department ?? ''),
            department_group: String(entity.department_group ?? ''),
            design: String(entity.design ?? ''),
            previous_job_card: String(entity.previous_job_card ?? ''),
            qty: entity.qty != null ? String(entity.qty) : '',
          });
          setReceiptTransactions(receipts);
          setIssueRows(issues.map(toIssueRow));
          setBalanceWeight(entity.balance_weight as number | string | undefined);
          setBalanceFineWeight(entity.balance_fine_weight as number | string | undefined);
          setIssuedWeight(
            entity.issued_weight != null
              ? (entity.issued_weight as number | string)
              : computeIssuedWeight(issues)
          );
          setCardFlow(entity.card_flow as CardFlowStep[] | undefined);
          setAuditData({
            created_by: entity.created_by as string | undefined,
            created_at: entity.created_at as string | undefined,
            modified_at: entity.modified_at as string | undefined,
          });
        }

        setProductOptions(products);
        setParentMeltingLotOptions(parentMeltingLots);
        setMeltingLotOptions(meltingLots);
        setPurityOptions(purities);
        setDepartmentOptions(departments);
        setDepartmentGroupOptions(departmentGroups);
        setDesignOptions(designs);
        setPreviousJobCardOptions(jobCards);
        setKarigarOptions(karigars);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load data';
        showErrorToastUnlessAuth(msg);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = useCallback(
    async (data: JobCardFormData) => {
      if (!id) return;

      setIsLoading(true);
      try {
        const payload: Record<string, unknown> = {
          name: data.name,
          product: data.product,
          parent_melting_lot: data.parent_melting_lot || '',
          melting_lot: data.melting_lot,
          purity: data.purity,
          department: data.department,
          department_group: data.department_group,
          design: data.design,
          previous_job_card: data.previous_job_card || '',
          qty: data.qty.trim() ? parseInt(data.qty, 10) : 0,
        };

        const response = await updateEntity(ENTITY_NAME, decodeURIComponent(id), payload);

        if (response.success) {
          toast.success(response.message || 'Job card updated successfully');
          navigate(entityConfig.routes.detail.replace(':id', id));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to update job card';
        showErrorToastUnlessAuth(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [navigate, entityConfig, id]
  );

  const handleCancel = useCallback(() => {
    navigate(entityConfig.routes.list);
  }, [navigate, entityConfig.routes.list]);

  const handleAddIssueRow = useCallback(() => {
    setIssueRows((prev) => [
      ...prev,
      {
        item: '',
        weight: '',
        fine_weight: '',
        karigar: '',
        qty: '',
        design: '',
        purity: '',
      },
    ]);
  }, []);

  const handleDeleteIssueRow = useCallback((index: number) => {
    setIssueRows((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleDuplicateIssueRow = useCallback((index: number) => {
    setIssueRows((prev) => {
      const row = prev[index];
      if (!row) return prev;
      return [...prev.slice(0, index + 1), { ...row }, ...prev.slice(index + 1)];
    });
  }, []);

  const labelClass = `block text-sm font-semibold mb-1 ${
    isDarkMode ? 'text-gray-400' : 'text-gray-600'
  }`;

  const cardWrapperClass = `p-6 rounded-xl border ${
    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
  }`;

  const thClass = `px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${
    isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-[#F2EFE9] text-gray-800 border-gray-200'
  }`;
  const tdClass = `px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300 border-gray-600' : 'text-gray-900 border-gray-200'}`;

  const headerClass = getSectionHeaderClass(isDarkMode);

  const purityTagClass = isDarkMode
    ? 'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-900/40 text-blue-200'
    : 'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800';

  const issueColumns: ColumnDef<IssueRow>[] = [
    {
      key: 'item',
      header: 'Item',
      isDropdown: true,
      dropdownOptions: departmentOptions,
    },
    {
      key: 'weight',
      header: 'Weight (G)',
      isEditable: true,
    },
    {
      key: 'fine_weight',
      header: 'Fine WT (G)',
      isEditable: true,
    },
    {
      key: 'karigar',
      header: 'Karigar',
      isDropdown: true,
      dropdownOptions: karigarOptions,
    },
    {
      key: 'qty',
      header: 'Qty',
      isEditable: true,
    },
    {
      key: 'design',
      header: 'Design',
      isDropdown: true,
      dropdownOptions: designOptions,
    },
    {
      key: 'purity',
      header: 'Purity',
      isDropdown: true,
      dropdownOptions: purityOptions,
    },
  ];

  if (!id) {
    return <Navigate to={entityConfig.routes.list} replace />;
  }

  if (dataLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading data...
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
          { label: `Edit ${entityName || decodeURIComponent(id)}` },
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
            Edit {entityConfig.displayName}
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Update {entityConfig.displayName.toLowerCase()} details below.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <BackButton onClick={handleCancel} />
          <button
            type="button"
            onClick={handleCancel}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="job-card-form"
            disabled={isLoading}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            } disabled:opacity-60`}
          >
            {isLoading ? 'Saving...' : 'Update'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Card Details */}
          <div className={cardWrapperClass}>
            <h2 className={headerClass + ' pb-2 border-b'}>
              Job Card Details
            </h2>
            <JobCardForm
              initialData={initialData ?? undefined}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              isEdit={true}
              productOptions={productOptions}
              parentMeltingLotOptions={parentMeltingLotOptions}
              meltingLotOptions={meltingLotOptions}
              purityOptions={purityOptions}
              departmentOptions={departmentOptions}
              departmentGroupOptions={departmentGroupOptions}
              designOptions={designOptions}
              previousJobCardOptions={previousJobCardOptions}
            />
          </div>

          {/* Receipt Weights */}
          <div className={cardWrapperClass}>
            <h2 className={headerClass + ' pb-2 border-b'}>
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
                tagClass={purityTagClass}
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
            <h2 className={headerClass + ' pb-2 border-b'}>
              Issue Balance
            </h2>
            <EditableWeightTable<IssueRow>
              columns={issueColumns}
              data={issueRows}
              onDataChange={setIssueRows}
              readOnly={false}
              showAddButton={true}
              showTotals={false}
              showActions={true}
              onAddRow={handleAddIssueRow}
              onDeleteRow={handleDeleteIssueRow}
              onDuplicateRow={handleDuplicateIssueRow}
              getRowId={(_, index) => index}
            />
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
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                          isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
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
                  {auditData.created_by ?? '–'}
                </span>
              </div>
              <div className={`flex justify-between items-baseline py-2 ${isDarkMode ? 'border-b border-gray-600' : 'border-b border-gray-200'}`}>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Created At</span>
                <span className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                  {auditData.created_at ? formatDateTime(auditData.created_at) : '–'}
                </span>
              </div>
              <div className={`flex justify-between items-baseline py-2 ${isDarkMode ? 'border-b border-gray-600' : 'border-b border-gray-200'}`}>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Modified At</span>
                <span className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                  {auditData.modified_at ? formatDateTime(auditData.modified_at) : '–'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
